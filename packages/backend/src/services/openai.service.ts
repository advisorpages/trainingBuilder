import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OpenAISessionOutlineRequest {
  title?: string;
  category: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  duration: number; // in minutes
  audienceSize?: string;
}

export interface OpenAISessionSection {
  title: string;
  duration: number;
  description: string;
  learningObjectives?: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];
}

export interface OpenAISessionOutline {
  suggestedTitle: string;
  summary: string;
  sections: OpenAISessionSection[];
  totalDuration: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedAudienceSize: string;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(private configService: ConfigService) {
    // API Configuration
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.baseURL = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';

    // Model Configuration
    this.model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    this.maxTokens = parseInt(this.configService.get<string>('OPENAI_MAX_TOKENS') || '2500');
    this.temperature = parseFloat(this.configService.get<string>('OPENAI_TEMPERATURE') || '0.7');

    // Request Configuration
    this.timeout = parseInt(this.configService.get<string>('OPENAI_TIMEOUT_MS') || '30000');
    this.maxRetries = parseInt(this.configService.get<string>('OPENAI_MAX_RETRIES') || '3');

    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in environment variables. OpenAI features will be disabled.');
    } else {
      this.logger.log(`OpenAI configured: model=${this.model}, maxTokens=${this.maxTokens}, temperature=${this.temperature}`);
    }
  }

  async generateSessionOutline(request: OpenAISessionOutlineRequest): Promise<OpenAISessionOutline> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(request);

    try {
      this.logger.log(`Generating session outline for: ${request.title || request.category}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      let lastError: Error;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              model: this.model,
              messages: [
                {
                  role: 'system',
                  content: `You are an expert training designer who creates engaging, practical session outlines.

                  Respond ONLY with valid JSON matching this exact structure:
                  {
                    "suggestedTitle": "string",
                    "summary": "string (2-3 sentences)",
                    "sections": [
                      {
                        "title": "string",
                        "duration": number,
                        "description": "string (2-3 sentences)",
                        "learningObjectives": ["string", "string"],
                        "suggestedActivities": ["string", "string"]
                      }
                    ],
                    "totalDuration": number,
                    "difficulty": "Beginner|Intermediate|Advanced",
                    "recommendedAudienceSize": "string"
                  }

                  Make sessions practical, engaging, and outcome-focused. Include interactive elements.`
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: this.temperature,
              max_tokens: this.maxTokens,
            }),
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.text();
            const error = new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorData}`);

            // Retry on server errors, not client errors
            if (response.status >= 500 && attempt < this.maxRetries) {
              this.logger.warn(`Attempt ${attempt} failed with server error, retrying...`, error);
              lastError = error;
              continue;
            }

            this.logger.error(`OpenAI API error on attempt ${attempt}:`, error);
            throw error;
          }

          const data = await response.json();
          const content = data.choices[0]?.message?.content;

          if (!content) {
            throw new Error('No content received from OpenAI');
          }

          // Parse the JSON response
          try {
            const outline = JSON.parse(content) as OpenAISessionOutline;
            this.logger.log(`Successfully generated outline with ${outline.sections.length} sections on attempt ${attempt}`);
            return outline;
          } catch (parseError) {
            this.logger.error('Failed to parse OpenAI response as JSON:', content);
            throw new Error('Invalid JSON response from OpenAI');
          }

        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error(`OpenAI request timed out after ${this.timeout}ms`);
          }

          if (attempt === this.maxRetries) {
            this.logger.error(`All ${this.maxRetries} attempts failed:`, error);
            throw error;
          }

          this.logger.warn(`Attempt ${attempt} failed, retrying...`, error);
          lastError = error;
        }
      }

    } catch (error) {
      this.logger.error('OpenAI API request failed:', error);
      throw error;
    }
  }

  private buildPrompt(request: OpenAISessionOutlineRequest): string {
    const parts = [
      `Create a ${request.sessionType} session outline for "${request.category}"`,
    ];

    if (request.title) {
      parts.push(`Working title: "${request.title}"`);
    }

    parts.push(`Desired outcome: ${request.desiredOutcome}`);

    if (request.currentProblem) {
      parts.push(`Current problem to solve: ${request.currentProblem}`);
    }

    if (request.specificTopics) {
      parts.push(`Must cover these topics: ${request.specificTopics}`);
    }

    parts.push(`Session duration: ${request.duration} minutes`);

    if (request.audienceSize) {
      parts.push(`Audience size: ${request.audienceSize}`);
    }

    const requirements = [
      'Create 3-6 sections that flow logically',
      'Include an opening/welcome section',
      'Include interactive elements and practice opportunities',
      'Include a closing section with next steps',
      'Make it practical and immediately applicable',
      'Ensure total duration matches the requested time',
      'Focus on engagement and participation'
    ];

    parts.push(`\\n\\nRequirements:\\n- ${requirements.join('\\n- ')}`);

    return parts.join('\\n\\n');
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: `API returned ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}