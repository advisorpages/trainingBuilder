import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIInteractionsService } from './ai-interactions.service';
import { AIInteractionType, AIInteractionStatus } from '../entities/ai-interaction.entity';
import { LocationType, MeetingPlatform } from '../entities/location.entity';

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
  // Location context
  locationId?: number;
  locationName?: string;
  locationType?: LocationType;
  meetingPlatform?: MeetingPlatform | null;
  locationCapacity?: number | null;
  locationTimezone?: string | null;
  locationNotes?: string | null;
  ragWeight?: number;
  variantIndex?: number;
  variantLabel?: string;
  variantInstruction?: string;
  variantDescription?: string;
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

    // Build system prompt for variant personality adaptation
    const systemPrompt = this.buildSystemPrompt();

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
                response_format: {
                  type: 'json_object',
                },
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
          let content = data.choices[0]?.message?.content;

          if (!content) {
            throw new Error('No content received from OpenAI');
          }

          // Sanitize Markdown fenced code blocks to allow JSON parsing
          if (typeof content === 'string') {
            content = content
              .replace(/```json/gi, '```')
              .replace(/```/g, '')
              .replace(/\u2028|\u2029/g, '\n')
              .trim();
          }

          // Parse the JSON response
          try {
            let parsedContent = content;

            const tryParse = (raw: string) => JSON.parse(raw) as OpenAISessionOutline;
            let outline: OpenAISessionOutline;

            try {
              outline = tryParse(parsedContent);
            } catch (initialError) {
              this.logger.warn('Attempted to parse OpenAI outline JSON but failed', {
                message: initialError instanceof Error ? initialError.message : String(initialError),
              });
              if (typeof parsedContent === 'string') {
                const firstBrace = parsedContent.indexOf('{');
                const lastBrace = parsedContent.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                  const sliced = parsedContent.slice(firstBrace, lastBrace + 1);
                  try {
                    outline = tryParse(sliced);
                    parsedContent = sliced;
                  } catch (secondaryError) {
                    this.logger.warn('Fallback slice JSON parse failed', {
                      message: secondaryError instanceof Error ? secondaryError.message : String(secondaryError),
                    });
                    throw initialError;
                  }
                } else {
                  throw initialError;
                }
              } else {
                throw initialError;
              }
            }

            try {
              this.validateOutline(outline, request.duration);
            } catch (validationError) {
              const validationMessage = validationError instanceof Error ? validationError.message : String(validationError);
              this.logger.error('OpenAI outline validation failed', { message: validationMessage });
              const wrappedError = new Error(`OpenAI outline validation failed: ${validationMessage}`);
              wrappedError.name = 'OpenAIOutlineValidationError';
              throw wrappedError;
            }

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
            if (parseError instanceof Error && parseError.name === 'OpenAIOutlineValidationError') {
              throw parseError;
            }
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
    const formatLabel = (value?: string | null) => {
      if (!value) return undefined;
      return value
        .toString()
        .split(/[_\s]/g)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    };

    const sections: string[] = [];

    // 1. VARIANT PERSONALITY - FIRST AND PROMINENT!
    if (request.variantLabel && request.variantInstruction) {
      const variantLines = [`# VARIANT PERSONALITY: ${request.variantLabel}`, '', request.variantInstruction];
      if (request.variantDescription) {
        variantLines.push('', `Variant Emphasis: ${request.variantDescription}`);
      }
      sections.push(variantLines.join('\n'));
    }

    // 2. SESSION CONTEXT - Concise and clear
    const sessionLines = [`# Session Context`];
    sessionLines.push(`- Category: ${request.category}`);
    sessionLines.push(`- Type: ${request.sessionType}`);
    if (request.title) {
      sessionLines.push(`- Title: "${request.title}"`);
    }
    sessionLines.push(`- Duration: ${request.duration} minutes`);
    sessionLines.push(`- Desired Outcome: ${request.desiredOutcome}`);
    if (request.currentProblem) {
      sessionLines.push(`- Current Problem: ${request.currentProblem}`);
    }
    if (request.specificTopics) {
      sessionLines.push(`- Must Cover: ${request.specificTopics}`);
    }
    if (request.audienceSize) {
      sessionLines.push(`- Audience Size: ${request.audienceSize}`);
    }
    sections.push(sessionLines.join('\n'));

    // 2b. LOCATION CONTEXT - Delivery details matter
    if (
      request.locationName ||
      request.locationType ||
      request.meetingPlatform ||
      request.locationCapacity ||
      request.locationTimezone ||
      request.locationNotes
    ) {
      const locationLines = [`# Location Details`];
      if (request.locationName) {
        locationLines.push(`- Name: ${request.locationName}`);
      }
      if (request.locationType) {
        locationLines.push(`- Format: ${formatLabel(request.locationType)}`);
      }
      if (request.meetingPlatform) {
        locationLines.push(`- Platform: ${formatLabel(request.meetingPlatform)}`);
      }
      if (request.locationCapacity) {
        locationLines.push(`- Capacity: ${request.locationCapacity} participants`);
      }
      if (request.locationTimezone) {
        locationLines.push(`- Time Zone: ${request.locationTimezone}`);
      }
      if (request.locationNotes) {
        locationLines.push(`- Special Considerations: ${request.locationNotes}`);
      }
      sections.push(locationLines.join('\n'));
    }

    // 3. AUDIENCE CONTEXT - Special instructions FIRST
    if (request.audienceName) {
      const audienceLines = [`# Audience Context`, `- Profile: ${request.audienceName}`];

      // PRIORITY: Special instructions at the top
      if (request.audienceInstructions) {
        audienceLines.push(`- **Key Guidance**: ${request.audienceInstructions}`);
      }

      if (request.audienceDescription) {
        audienceLines.push(`- Description: ${request.audienceDescription}`);
      }
      if (request.audienceExperienceLevel) {
        audienceLines.push(`- Experience Level: ${request.audienceExperienceLevel}`);
      }
      if (request.audienceTechnicalDepth) {
        audienceLines.push(`- Technical Depth: ${request.audienceTechnicalDepth}/5`);
      }
      if (request.audienceCommunicationStyle) {
        audienceLines.push(`- Communication Style: ${request.audienceCommunicationStyle}`);
      }
      if (request.audienceVocabularyLevel) {
        audienceLines.push(`- Vocabulary Level: ${request.audienceVocabularyLevel}`);
      }
      if (request.audienceLearningStyle) {
        audienceLines.push(`- Learning Preferences: ${request.audienceLearningStyle}`);
      }
      if (request.audienceExampleTypes && request.audienceExampleTypes.length > 0) {
        audienceLines.push(`- Use Examples From: ${request.audienceExampleTypes.join(', ')}`);
      }
      if (request.audienceAvoidTopics && request.audienceAvoidTopics.length > 0) {
        audienceLines.push(`- **Avoid Topics**: ${request.audienceAvoidTopics.join(', ')}`);
      }

      sections.push(audienceLines.join('\n'));
    }

    // 4. TONE GUIDELINES - Emotional resonance emphasized
    if (request.toneName) {
      const toneLines = [`# Tone Guidelines`, `- Profile: ${request.toneName}`];

      // PRIORITY: Special instructions first
      if (request.toneInstructions) {
        toneLines.push(`- **Key Guidance**: ${request.toneInstructions}`);
      }

      // PRIORITY: Emotional resonance and example phrases
      if (request.toneEmotionalResonance && request.toneEmotionalResonance.length > 0) {
        toneLines.push(`- **Emotional Qualities**: ${request.toneEmotionalResonance.join(', ')}`);
      }
      if (request.toneDescription) {
        toneLines.push(`- Description: ${request.toneDescription}`);
      }
      if (request.toneStyle) {
        toneLines.push(`- Style: ${request.toneStyle}`);
      }
      if (request.toneEnergyLevel) {
        toneLines.push(`- Energy: ${request.toneEnergyLevel}`);
      }
      if (request.toneFormality) {
        toneLines.push(`- Formality: ${request.toneFormality}/5`);
      }
      if (request.toneSentenceStructure) {
        toneLines.push(`- Sentence Structure: ${request.toneSentenceStructure}`);
      }
      if (request.toneLanguageCharacteristics && request.toneLanguageCharacteristics.length > 0) {
        toneLines.push(`- Language Traits: ${request.toneLanguageCharacteristics.join(', ')}`);
      }
      if (request.toneExamplePhrases && request.toneExamplePhrases.length > 0) {
        toneLines.push(`- Example Phrases:`);
        request.toneExamplePhrases.forEach(phrase => {
          toneLines.push(`  "${phrase}"`);
        });
      }

      sections.push(toneLines.join('\n'));
    }

    // 5. OUTPUT REQUIREMENTS - Minimal, non-prescriptive
    const requirements = [`# Output Requirements`];
    requirements.push(`- Return valid JSON with the specified structure`);
    requirements.push(`- Ensure totalDuration equals ${request.duration} minutes exactly`);
    requirements.push(`- Create 3-6 sections that flow logically`);
    requirements.push(`- Include opening/welcome and closing/commitments sections`);
    requirements.push(`- Make it practical, engaging, and immediately applicable`);

    // Note about conflicting instructions
    if (request.audienceInstructions && request.toneInstructions) {
      requirements.push(`\nNote: When audience and tone instructions conflict, prioritize audience needs.`);
    }

    sections.push(requirements.join('\n'));

    return sections.join('\n\n');
  }

  /**
   * Build system prompt that emphasizes variant personality adaptation
   */
  private buildSystemPrompt(): string {
    return `You are an expert training content designer specializing in creating engaging, outcome-focused training sessions for financial professionals.

You excel at adapting your content design to match different learning and delivery styles based on the VARIANT PERSONALITY provided in each request. Each variant represents a distinct approach to training design - you must follow the personality instructions precisely to create measurably different outputs.

CRITICAL: The VARIANT PERSONALITY instructions define HOW you should structure, describe, and present the content. Make each variant feel genuinely different in tone, pacing, structure, and activities.

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

When knowledge base materials are provided, use them as inspiration and reference points while maintaining the variant personality. Adapt proven frameworks to match the variant's unique style.

Make sessions practical, engaging, and outcome-focused. Adapt your section titles, descriptions, activities, and flow to embody the variant personality.`;
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

    return `${basePrompt}

## Knowledge Base Inspiration

${ragContext}

Use these materials as inspiration—blend useful insights without overriding the variant personality.`;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private validateOutline(outline: OpenAISessionOutline, expectedDuration: number): void {
    if (!outline || !Array.isArray(outline.sections) || outline.sections.length === 0) {
      throw new Error('Outline is missing sections');
    }

    outline.sections.forEach((section, index) => {
      if (!section || typeof section.title !== 'string' || section.title.trim().length === 0) {
        throw new Error(`Section ${index + 1} is missing a valid title`);
      }

      if (typeof section.duration !== 'number' || !Number.isFinite(section.duration) || section.duration <= 0) {
        throw new Error(`Section ${index + 1} has an invalid duration`);
      }

      if (typeof section.description !== 'string' || section.description.trim().length === 0) {
        throw new Error(`Section ${index + 1} is missing a description`);
      }
    });

    if (typeof outline.totalDuration !== 'number' || !Number.isFinite(outline.totalDuration) || outline.totalDuration <= 0) {
      throw new Error('Outline totalDuration is invalid');
    }

    const summedDuration = outline.sections.reduce((sum, section) => sum + section.duration, 0);
    let normalizedTotal = Number(summedDuration.toFixed(2));
    const originalTotalDuration = outline.totalDuration;
    const durationDifference = Math.abs(normalizedTotal - originalTotalDuration);
    const baseTolerance = Math.max(5, outline.sections.length, originalTotalDuration * 0.1);
    const hasExpectedDuration =
      typeof expectedDuration === 'number' &&
      Number.isFinite(expectedDuration) &&
      expectedDuration > 0;
    const expectedTolerance = hasExpectedDuration ? Math.max(5, expectedDuration * 0.1) : null;

    let totalDurationAdjusted = false;
    let sectionsRebalanced = false;
    const adjustTotalDuration = (message: string, level: 'warn' | 'debug' = 'warn') => {
      const details = {
        originalTotalDuration,
        normalizedTotalDuration: normalizedTotal,
        summedSectionDuration: normalizedTotal,
      };

      if (level === 'warn') {
        this.logger.warn(message, details);
      } else {
        this.logger.debug?.(message, details);
      }

      outline.totalDuration = normalizedTotal;
      totalDurationAdjusted = true;
    };

    if (durationDifference > baseTolerance) {
      const rebalanceCandidates: Array<{ target: number; tolerance: number }> = [];

      if (hasExpectedDuration && expectedTolerance !== null) {
        rebalanceCandidates.push({ target: expectedDuration, tolerance: expectedTolerance });
      }

      rebalanceCandidates.push({ target: originalTotalDuration, tolerance: baseTolerance });

      for (const candidate of rebalanceCandidates) {
        const { target, tolerance } = candidate;

        if (!Number.isFinite(target) || target <= 0) {
          continue;
        }

        const { sections: adjustedSections, total } = this.rebalanceSectionDurations(outline.sections, target);
        const adjustedDifference = Math.abs(total - target);

        if (adjustedSections.length > 0 && adjustedDifference <= tolerance) {
          outline.sections = adjustedSections;
          normalizedTotal = Number(total.toFixed(2));
          outline.totalDuration = normalizedTotal;
          totalDurationAdjusted = true;
          sectionsRebalanced = true;
          break;
        }
      }

      if (!sectionsRebalanced) {
        adjustTotalDuration(
          'Large mismatch between outline totalDuration and summed section durations; normalizing to section totals'
        );
      }
    } else if (durationDifference > 0.01) {
      adjustTotalDuration('Normalizing outline totalDuration to match summed section durations');
    } else if (durationDifference > 0) {
      adjustTotalDuration('Correcting minor floating point drift in outline totalDuration', 'debug');
    }

    if (!totalDurationAdjusted) {
      outline.totalDuration = normalizedTotal;
    }

    if (hasExpectedDuration && expectedTolerance !== null) {
      const differenceToExpected = Math.abs(outline.totalDuration - expectedDuration);
      if (differenceToExpected > expectedTolerance) {
        this.logger.warn(
          `Generated outline duration (${outline.totalDuration}) differs from requested duration (${expectedDuration})`,
          {
            expectedDuration,
            tolerance: expectedTolerance,
            summedSectionDuration: normalizedTotal,
          }
        );
      }
    }
  }

  private rebalanceSectionDurations(
    sections: OpenAISessionSection[],
    targetDuration: number,
  ): { sections: OpenAISessionSection[]; total: number } {
    if (!Array.isArray(sections) || sections.length === 0) {
      return { sections, total: 0 };
    }

    if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
      const total = sections.reduce(
        (sum, section) => sum + (Number.isFinite(section?.duration) ? section.duration : 0),
        0,
      );
      return { sections, total };
    }

    const sanitized = sections.map(section => ({
      ...section,
      duration:
        typeof section.duration === 'number' && Number.isFinite(section.duration) && section.duration > 0
          ? section.duration
          : 1,
    }));

    const currentTotal = sanitized.reduce((sum, section) => sum + section.duration, 0);

    let adjusted: OpenAISessionSection[];

    if (!Number.isFinite(currentTotal) || currentTotal <= 0) {
      const baseline = targetDuration / sanitized.length;
      adjusted = sanitized.map(section => ({
        ...section,
        duration: Math.max(1, Math.round(baseline)),
      }));
    } else {
      const ratio = targetDuration / currentTotal;
      adjusted = sanitized.map(section => {
        const scaled = section.duration * ratio;
        const duration = Number.isFinite(scaled) ? Math.max(1, Math.round(scaled)) : 1;
        return {
          ...section,
          duration,
        };
      });
    }

    let adjustedTotal = adjusted.reduce((sum, section) => sum + section.duration, 0);
    let delta = Math.round(targetDuration - adjustedTotal);

    if (delta !== 0 && adjusted.length > 0) {
      while (delta !== 0) {
        let changed = false;
        const direction = delta > 0 ? 1 : -1;

        for (let i = adjusted.length - 1; i >= 0 && delta !== 0; i--) {
          if (direction < 0 && adjusted[i].duration <= 1) {
            continue;
          }

          adjusted[i] = {
            ...adjusted[i],
            duration: adjusted[i].duration + direction,
          };
          delta -= direction;
          changed = true;
        }

        if (!changed) {
          break;
        }
      }

      adjustedTotal = adjusted.reduce((sum, section) => sum + section.duration, 0);
    }

    return {
      sections: adjusted,
      total: adjustedTotal,
    };
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
