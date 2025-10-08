import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIInteractionsService } from './ai-interactions.service';
import { AIInteractionType, AIInteractionStatus } from '../entities/ai-interaction.entity';

export interface OpenAISessionOutlineRequest {
  title?: string;
  category: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  duration: number; // in minutes
  audienceSize?: string;
  // Rich audience profile fields
  audienceName?: string;
  audienceDescription?: string;
  audienceExperienceLevel?: string;
  audienceTechnicalDepth?: number;
  audienceCommunicationStyle?: string;
  audienceVocabularyLevel?: string;
  audienceLearningStyle?: string;
  audienceExampleTypes?: string[];
  audienceAvoidTopics?: string[];
  audienceInstructions?: string;
  audienceId?: number;
  // Rich tone profile fields
  toneName?: string;
  toneDescription?: string;
  toneStyle?: string;
  toneFormality?: number;
  toneEnergyLevel?: string;
  toneSentenceStructure?: string;
  toneLanguageCharacteristics?: string[];
  toneEmotionalResonance?: string[];
  toneExamplePhrases?: string[];
  toneInstructions?: string;
  toneId?: number;
  ragWeight?: number;
  variantIndex?: number;
  variantLabel?: string;
  variantInstruction?: string;
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

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => AIInteractionsService))
    private aiInteractionsService: AIInteractionsService
  ) {
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

  async generateSessionOutline(
    request: OpenAISessionOutlineRequest,
    ragResults?: any[],
    ragWeight?: number
  ): Promise<OpenAISessionOutline> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build base prompt
    let prompt = this.buildPrompt(request);

    // Inject RAG context if provided
    if (ragResults && ragWeight > 0) {
      prompt = this.injectRAGContext(prompt, ragResults, ragWeight);
    }

    // Build dynamic system prompt based on RAG weight
    const systemPrompt = this.buildSystemPrompt(ragWeight || 0);

    const startTime = Date.now();

    // Track missing variables
    const inputVariables = { ...request };
    const requiredVariables = ['category', 'sessionType', 'desiredOutcome', 'duration'];
    const missingVariables = requiredVariables.filter(key => !inputVariables[key as keyof typeof inputVariables]);
    const allVariablesPresent = missingVariables.length === 0;

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
                  content: systemPrompt
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

            // Log successful interaction
            const processingTime = Date.now() - startTime;
            await this.logInteraction({
              interactionType: AIInteractionType.OUTLINE_GENERATION,
              status: AIInteractionStatus.SUCCESS,
              renderedPrompt: prompt,
              inputVariables,
              aiResponse: content,
              structuredOutput: outline,
              processingTimeMs: processingTime,
              tokensUsed: data.usage?.total_tokens,
              modelUsed: this.model,
              category: request.category,
              sessionType: request.sessionType,
              audienceId: request.audienceId,
              toneId: request.toneId,
              allVariablesPresent,
              missingVariables: missingVariables.length > 0 ? missingVariables : undefined,
            });

            return outline;
          } catch (parseError) {
            this.logger.error('Failed to parse OpenAI response as JSON:', content);

            // Log parsing failure
            const processingTime = Date.now() - startTime;
            await this.logInteraction({
              interactionType: AIInteractionType.OUTLINE_GENERATION,
              status: AIInteractionStatus.FAILURE,
              renderedPrompt: prompt,
              inputVariables,
              aiResponse: content,
              errorMessage: 'Invalid JSON response from OpenAI',
              errorDetails: { parseError: parseError.message },
              processingTimeMs: processingTime,
              modelUsed: this.model,
              category: request.category,
              sessionType: request.sessionType,
              allVariablesPresent,
              missingVariables: missingVariables.length > 0 ? missingVariables : undefined,
            });

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

      // Log the failure
      const processingTime = Date.now() - startTime;
      await this.logInteraction({
        interactionType: AIInteractionType.OUTLINE_GENERATION,
        status: AIInteractionStatus.FAILURE,
        renderedPrompt: prompt,
        inputVariables,
        errorMessage: error.message,
        errorDetails: { stack: error.stack, name: error.name },
        processingTimeMs: processingTime,
        modelUsed: this.model,
        category: request.category,
        sessionType: request.sessionType,
        audienceId: request.audienceId,
        toneId: request.toneId,
        allVariablesPresent,
        missingVariables: missingVariables.length > 0 ? missingVariables : undefined,
      });

      throw error;
    }
  }

  private async logInteraction(data: {
    interactionType: AIInteractionType;
    status: AIInteractionStatus;
    renderedPrompt: string;
    inputVariables: Record<string, any>;
    aiResponse?: string;
    structuredOutput?: Record<string, any>;
    errorMessage?: string;
    errorDetails?: Record<string, any>;
    processingTimeMs?: number;
    tokensUsed?: number;
    modelUsed?: string;
    category?: string;
    sessionType?: string;
    audienceId?: number;
    toneId?: number;
    allVariablesPresent?: boolean;
    missingVariables?: string[];
  }): Promise<void> {
    try {
      // Calculate estimated cost (rough estimate based on gpt-4o-mini pricing)
      let estimatedCost = 0;
      if (data.tokensUsed) {
        // gpt-4o-mini: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
        // For simplicity, using average of $0.375 per 1M tokens
        estimatedCost = (data.tokensUsed / 1_000_000) * 0.375;
      }

      await this.aiInteractionsService.create({
        ...data,
        estimatedCost,
      });
    } catch (error) {
      // Don't let logging errors break the main flow
      this.logger.error('Failed to log AI interaction:', error);
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

    // Rich audience profile
    if (request.audienceName) {
      const audienceParts = [`\\n\\nAudience Profile:\\n- Profile: ${request.audienceName}`];

      if (request.audienceDescription) {
        audienceParts.push(`- Description: ${request.audienceDescription}`);
      }
      if (request.audienceExperienceLevel) {
        audienceParts.push(`- Experience Level: ${request.audienceExperienceLevel}`);
      }
      if (request.audienceTechnicalDepth) {
        audienceParts.push(`- Technical Depth: ${request.audienceTechnicalDepth}/5`);
      }
      if (request.audienceCommunicationStyle) {
        audienceParts.push(`- Communication Style: ${request.audienceCommunicationStyle}`);
      }
      if (request.audienceVocabularyLevel) {
        audienceParts.push(`- Vocabulary Level: ${request.audienceVocabularyLevel}`);
      }
      if (request.audienceLearningStyle) {
        audienceParts.push(`- Preferred Learning Style: ${request.audienceLearningStyle}`);
      }
      if (request.audienceExampleTypes && request.audienceExampleTypes.length > 0) {
        audienceParts.push(`- Use Examples From: ${request.audienceExampleTypes.join(', ')}`);
      }
      if (request.audienceAvoidTopics && request.audienceAvoidTopics.length > 0) {
        audienceParts.push(`- Avoid Topics: ${request.audienceAvoidTopics.join(', ')}`);
      }
      if (request.audienceInstructions) {
        audienceParts.push(`- Special Instructions: ${request.audienceInstructions}`);
      }

      parts.push(audienceParts.join('\\n'));
    } else if (request.audienceSize) {
      parts.push(`Audience size: ${request.audienceSize}`);
    }

    // Rich tone profile
    if (request.toneName) {
      const toneParts = [`\\n\\nTone Profile:\\n- Profile: ${request.toneName}`];

      if (request.toneDescription) {
        toneParts.push(`- Description: ${request.toneDescription}`);
      }
      if (request.toneStyle) {
        toneParts.push(`- Style: ${request.toneStyle}`);
      }
      if (request.toneFormality) {
        toneParts.push(`- Formality Level: ${request.toneFormality}/5`);
      }
      if (request.toneEnergyLevel) {
        toneParts.push(`- Energy: ${request.toneEnergyLevel}`);
      }
      if (request.toneSentenceStructure) {
        toneParts.push(`- Sentence Structure: ${request.toneSentenceStructure}`);
      }
      if (request.toneLanguageCharacteristics && request.toneLanguageCharacteristics.length > 0) {
        toneParts.push(`- Language Traits: ${request.toneLanguageCharacteristics.join(', ')}`);
      }
      if (request.toneEmotionalResonance && request.toneEmotionalResonance.length > 0) {
        toneParts.push(`- Emotional Qualities: ${request.toneEmotionalResonance.join(', ')}`);
      }
      if (request.toneExamplePhrases && request.toneExamplePhrases.length > 0) {
        toneParts.push(`- Example Phrasing: "${request.toneExamplePhrases[0]}"`);
      }
      if (request.toneInstructions) {
        toneParts.push(`- Special Instructions: ${request.toneInstructions}`);
      }

      parts.push(toneParts.join('\\n'));
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

    // Add audience-specific requirements if rich profile is available
    if (request.audienceName) {
      if (request.audienceExperienceLevel && request.audienceTechnicalDepth) {
        requirements.push(`Tailor complexity to ${request.audienceExperienceLevel} experience level and ${request.audienceTechnicalDepth}/5 technical depth`);
      }
      if (request.audienceVocabularyLevel) {
        requirements.push(`Use ${request.audienceVocabularyLevel} vocabulary level`);
      }
      if (request.audienceLearningStyle) {
        requirements.push(`Include activities matching ${request.audienceLearningStyle} learning preferences`);
      }
      if (request.audienceExampleTypes && request.audienceExampleTypes.length > 0) {
        requirements.push(`Use examples from relevant contexts: ${request.audienceExampleTypes.join(', ')}`);
      }
    }

    // Add tone-specific requirements if rich profile is available
    if (request.toneName) {
      if (request.toneFormality) {
        requirements.push(`Match writing style to ${request.toneFormality}/5 formality level`);
      }
      if (request.toneSentenceStructure) {
        requirements.push(`Use ${request.toneSentenceStructure} sentence structure in descriptions`);
      }
      if (request.toneStyle) {
        requirements.push(`Incorporate ${request.toneStyle} tone style throughout`);
      }
      if (request.toneEmotionalResonance && request.toneEmotionalResonance.length > 0) {
        requirements.push(`Convey ${request.toneEmotionalResonance.join(', ')} emotional qualities in activity descriptions`);
      }
    }

    if (typeof request.ragWeight === 'number') {
      requirements.push(`Match the reliance on existing knowledge materials to approximately ${Math.round(request.ragWeight * 100)}% emphasis`);
    }

    if (request.variantInstruction) {
      requirements.push(request.variantInstruction);
    }

    if (request.variantLabel) {
      parts.push(`Variant goal: ${request.variantLabel}`);
    }

    parts.push(`\\n\\nRequirements:\\n- ${requirements.join('\\n- ')}`);

    return parts.join('\\n\\n');
  }

  /**
   * Build dynamic system prompt based on RAG weight
   */
  private buildSystemPrompt(ragWeight: number): string {
    const basePrompt = `You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

You excel at creating practical, immediately applicable session structures that drive measurable results.

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

IMPORTANT: Create sections that flow logically:
- Section 1: Opening/Welcome (10-15% of time)
- Sections 2-3: Core Content Topics (60-70% of time)
- Section 4: Closing/Commitments (10-15% of time)

Make sessions practical, engaging, and outcome-focused. Include interactive elements.`;

    if (ragWeight >= 0.5) {
      // Heavy RAG: emphasize fidelity to source materials
      return `${basePrompt}

Your task is to create a session outline that draws heavily from the provided training materials. Stay faithful to the frameworks, examples, and terminology found in the knowledge base. Adapt the structure to fit the desired outcome while preserving the proven approaches documented in the sources.`;
    } else if (ragWeight > 0) {
      // Light RAG: use as inspiration
      return `${basePrompt}

Use the provided training materials as inspiration and reference points, but feel free to combine them creatively with your expertise to create a fresh, engaging session structure.`;
    } else {
      // No RAG: pure creativity
      return `${basePrompt}

Create an innovative session outline using your expertise and industry best practices. Focus on practical, immediately applicable content that drives the desired outcome.`;
    }
  }

  /**
   * Inject RAG context into prompt
   */
  private injectRAGContext(basePrompt: string, ragResults: any[], weight: number): string {
    if (!ragResults?.length) return basePrompt;

    const contextLimit = Math.floor(3000 * weight);
    let totalChars = 0;
    const selectedResults = [];

    for (const result of ragResults) {
      if (totalChars + result.text.length > contextLimit * 4) break;
      selectedResults.push(result);
      totalChars += result.text.length;
    }

    if (selectedResults.length === 0) return basePrompt;

    const ragContext = selectedResults.map((r, idx) =>
      `## Source ${idx + 1}: ${r.metadata?.filename || 'Unknown'}
${r.text.substring(0, 500)}...
---`
    ).join('\n\n');

    return `# Retrieved Training Materials from Knowledge Base

${ragContext}

# Your Task

Using the above materials as reference and inspiration, ${basePrompt}`;
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
