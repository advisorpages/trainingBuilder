import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RagResult {
  text: string;
  metadata: {
    filename?: string;
    category?: string;
    created_at?: string;
  };
  similarity: number;
  finalScore: number;
}

@Injectable()
export class RagIntegrationService {
  private readonly logger = new Logger(RagIntegrationService.name);
  private readonly ragBaseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly similarityWeight: number;
  private readonly recencyWeight: number;
  private readonly categoryWeight: number;
  private readonly similarityThreshold: number;

  constructor(private configService: ConfigService) {
    const configuredUrl = configService.get<string>('RAG_API_URL');
    this.ragBaseUrl = configuredUrl ? configuredUrl.trim() : '';
    const configuredTimeout = configService.get<number>('RAG_TIMEOUT_MS', 10000);
    const configuredRetries = configService.get<number>('RAG_RETRY_ATTEMPTS', 1);

    this.timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 10000;
    this.retryAttempts = Math.max(0, Number.isFinite(configuredRetries) ? configuredRetries : 1);
    this.similarityWeight = configService.get('RAG_SIMILARITY_WEIGHT') || 0.5;
    this.recencyWeight = configService.get('RAG_RECENCY_WEIGHT') || 0.2;
    this.categoryWeight = configService.get('RAG_CATEGORY_WEIGHT') || 0.2;
    this.similarityThreshold = configService.get('RAG_SIMILARITY_THRESHOLD') || 0.65;
  }

  /**
   * Query RAG system with smart weighting and error handling
   */
  async queryRAG(sessionMetadata: {
    category: string;
    audienceName?: string;
    desiredOutcome: string;
    currentProblem?: string;
  }): Promise<RagResult[]> {
    if (!this.isRagAvailable()) {
      this.logger.log('RAG disabled via configuration, skipping query');
      return [];
    }

    try {
      return await this.performRagQuery(sessionMetadata, 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RAG query failed: ${message}`);
      return [];
    }
  }

  /**
   * Retry RAG query based on configured attempts
   */
  async queryRAGWithRetry(sessionMetadata: any): Promise<RagResult[]> {
    if (!this.isRagAvailable()) {
      this.logger.log('RAG disabled via configuration, skipping query');
      return [];
    }

    const totalAttempts = Math.max(1, this.retryAttempts + 1);

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
      try {
        return await this.performRagQuery(sessionMetadata, attempt);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const remaining = totalAttempts - attempt;

        if (remaining > 0) {
          this.logger.warn(`RAG query attempt ${attempt} failed (${message}). Retries left: ${remaining}`);
        } else {
          this.logger.error(`RAG query failed after ${totalAttempts} attempt(s): ${message}`);
        }
      }
    }

    return [];
  }

  private async performRagQuery(sessionMetadata: {
    category: string;
    audienceName?: string;
    desiredOutcome: string;
    currentProblem?: string;
  }, attempt: number): Promise<RagResult[]> {
    const query = this.buildQueryPrompt(sessionMetadata);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    const attemptStart = Date.now();

    try {
      this.logger.log('RAG query attempt started', {
        attempt,
        category: sessionMetadata.category,
        audienceName: sessionMetadata.audienceName,
        desiredOutcome: sessionMetadata.desiredOutcome,
      });

      const response = await fetch(`${this.ragBaseUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: {
            category: sessionMetadata.category,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`RAG API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const hits = Array.isArray(data.hits) ? data.hits : [];

      this.logger.log('RAG query attempt completed', {
        attempt,
        resultsFound: hits.length,
        duration: Date.now() - attemptStart,
      });

      const results = hits.map((hit: any) => ({
        text: hit.snippet || '',
        metadata: {
          filename: hit.doc_id,
          category: sessionMetadata.category,
          created_at: hit.created_at,
        },
        similarity: hit.score || 0,
        finalScore: hit.score || 0,
      }));

      return this.scoreAndFilterResults(results, sessionMetadata);
    } catch (error) {
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      const message = isAbortError
        ? `Timeout after ${this.timeout}ms`
        : error instanceof Error
        ? error.message
        : String(error);

      if (isAbortError) {
        this.logger.warn(`RAG query attempt ${attempt} timed out after ${this.timeout}ms`);
      }

      throw new Error(message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Score and filter RAG results by multiple factors
   */
  private scoreAndFilterResults(sources: RagResult[], metadata: any): RagResult[] {
    return sources
      .map(source => ({
        ...source,
        finalScore: this.calculateWeightedScore(source, metadata)
      }))
      .filter(s => s.finalScore > this.similarityThreshold)
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 8); // Top 8 chunks
  }

  /**
   * Calculate weighted score: similarity + recency + category match
   */
  private calculateWeightedScore(source: RagResult, metadata: any): number {
    const similarity = source.similarity || 0;
    const recency = this.getRecencyScore(source.metadata?.created_at);
    const categoryMatch = source.metadata?.category === metadata.category ? 1.0 : 0.5;

    return (
      similarity * this.similarityWeight +
      recency * this.recencyWeight +
      categoryMatch * this.categoryWeight +
      0.1 // Base score (10%)
    );
  }

  /**
   * Calculate recency score (newer = higher)
   */
  private getRecencyScore(createdAt?: string): number {
    if (!createdAt) return 0.5; // Default for unknown age

    const age = Date.now() - new Date(createdAt).getTime();
    const daysOld = age / (1000 * 60 * 60 * 24);

    // Decay over 365 days
    return Math.max(0, 1 - (daysOld / 365));
  }

  /**
    * Build enriched natural language query for RAG
    */
   private buildQueryPrompt(metadata: any): string {
     const parts: string[] = [];

     // Main session description
     parts.push(`Find training materials for a ${metadata.sessionType || 'training'} session on ${metadata.category}`);

     if (metadata.specificTopics) {
       parts.push(` for specific topics: ${metadata.specificTopics}`);
     }

     // Include structured topics if available
     if (metadata.topics && metadata.topics.length > 0) {
       const topicTitles = metadata.topics.map((t: any) => t.title).join(', ');
       parts.push(` covering these specific topics: ${topicTitles}`);
     }

     parts.push('.');

     // Target audience
     if (metadata.audienceName) {
       const audienceDetails: string[] = [metadata.audienceName];

       if (metadata.experienceLevel) {
         audienceDetails.push(`${metadata.experienceLevel} level`);
       }

       if (metadata.preferredLearningStyle) {
         audienceDetails.push(`${metadata.preferredLearningStyle} learners`);
       }

       if (metadata.communicationStyle) {
         audienceDetails.push(`prefers ${metadata.communicationStyle} communication`);
       }

       parts.push(`\n\nTarget Audience: ${audienceDetails.join(', ')}`);

       if (metadata.audienceDescription) {
         parts.push(`\nAudience Profile: ${metadata.audienceDescription}`);
       }

       if (metadata.avoidTopics && metadata.avoidTopics.length > 0) {
         parts.push(`\nTopics to Avoid: ${metadata.avoidTopics.join(', ')}`);
       }
     }

     // Goals and challenges
     parts.push(`\n\nSession Goal: ${metadata.desiredOutcome}`);

     if (metadata.currentProblem) {
       parts.push(`\nCurrent Challenge: ${metadata.currentProblem}`);
     }

    // Session details
    const sessionDetails: string[] = [];

    if (metadata.duration) {
      sessionDetails.push(`Duration: ${metadata.duration} minutes`);
    }

    if (metadata.audienceSize) {
      sessionDetails.push(`Audience Size: ${metadata.audienceSize} participants`);
    }

    // Location context
    if (metadata.locationType) {
      sessionDetails.push(`Format: ${metadata.locationType}`);

      if (metadata.locationType === 'virtual' && metadata.meetingPlatform) {
        sessionDetails.push(`Platform: ${metadata.meetingPlatform}`);
      }

      if (metadata.locationType === 'physical' && metadata.locationCity) {
        const locationParts = [metadata.locationCity];
        if (metadata.locationState) locationParts.push(metadata.locationState);
        if (metadata.locationCountry) locationParts.push(metadata.locationCountry);
        sessionDetails.push(`Location: ${locationParts.join(', ')}`);
      }
    }

    if (metadata.timezone) {
      sessionDetails.push(`Timezone: ${metadata.timezone}`);
    }

    // Tone and delivery style
    if (metadata.toneStyle || metadata.energyLevel) {
      const toneDetails: string[] = [];

      if (metadata.toneStyle) {
        toneDetails.push(metadata.toneStyle);
      }

      if (metadata.energyLevel) {
        toneDetails.push(`${metadata.energyLevel} energy`);
      }

      if (metadata.formality) {
        toneDetails.push(`formality level ${metadata.formality}/5`);
      }

      sessionDetails.push(`Delivery Style: ${toneDetails.join(', ')}`);

      if (metadata.toneDescription) {
        sessionDetails.push(`Tone: ${metadata.toneDescription}`);
      }
    }

    if (metadata.technicalDepth) {
      sessionDetails.push(`Technical Depth: ${metadata.technicalDepth}/5`);
    }

    if (sessionDetails.length > 0) {
      parts.push(`\n\nSession Details:\n- ${sessionDetails.join('\n- ')}`);
    }

    // Looking for specific types of materials
    const lookingFor: string[] = [];

    if (metadata.vocabularyLevel) {
      lookingFor.push(`Match ${metadata.vocabularyLevel} vocabulary`);
    }

    if (metadata.exampleTypes && metadata.exampleTypes.length > 0) {
      lookingFor.push(`Include ${metadata.exampleTypes.join(', ')} examples`);
    }

    if (metadata.preferredLearningStyle) {
      lookingFor.push(`Support ${metadata.preferredLearningStyle} learning approaches`);
    }

    if (metadata.sentenceStructure) {
      lookingFor.push(`Use ${metadata.sentenceStructure} sentence structure`);
    }

    if (metadata.languageCharacteristics && metadata.languageCharacteristics.length > 0) {
      lookingFor.push(`Incorporate ${metadata.languageCharacteristics.join(', ')} language characteristics`);
    }

    if (metadata.emotionalResonance && metadata.emotionalResonance.length > 0) {
      lookingFor.push(`Evoke ${metadata.emotionalResonance.join(', ')} emotions`);
    }

    if (lookingFor.length > 0) {
      parts.push(`\n\nLooking for materials that:\n- ${lookingFor.join('\n- ')}`);
    }

    return parts.join('');
  }

  /**
   * Inject RAG context into OpenAI prompt with weight control
   */
  injectContextIntoPrompt(basePrompt: string, ragResults: RagResult[], weight: number): string {
    if (!ragResults?.length || weight === 0) {
      return basePrompt;
    }

    // Limit context based on weight (0.0-1.0)
    const contextLimit = Math.floor(3000 * weight); // Max 3000 tokens at weight=1.0
    const selectedResults = this.selectContextByTokenLimit(ragResults, contextLimit);

    if (selectedResults.length === 0) {
      return basePrompt;
    }

    // Build RAG context section
    const ragContext = selectedResults.map((r, idx) =>
      `## Source ${idx + 1}: ${r.metadata?.filename || 'Unknown'} (${r.metadata?.category || 'General'})
${r.text.substring(0, 500)}...
---`
    ).join('\n\n');

    return `# Retrieved Training Materials from Knowledge Base

${ragContext}

# Your Task

Using the above materials as reference and inspiration, ${basePrompt}`;
  }

  /**
   * Select RAG results within token limit
   */
  private selectContextByTokenLimit(results: RagResult[], limit: number): RagResult[] {
    // Rough estimation: ~4 chars per token
    const estimatedTokensPerChar = 0.25;
    let totalTokens = 0;
    const selected: RagResult[] = [];

    for (const result of results) {
      const estimatedTokens = result.text.length * estimatedTokensPerChar;
      if (totalTokens + estimatedTokens > limit) {
        break;
      }
      selected.push(result);
      totalTokens += estimatedTokens;
    }

    return selected;
  }

  /**
   * Check if RAG is available and configured
   */
  isRagAvailable(): boolean {
    return !!this.ragBaseUrl;
  }
}
