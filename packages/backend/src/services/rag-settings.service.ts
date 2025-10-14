import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RagSettings } from '../entities/rag-settings.entity';
import { RagIntegrationService } from './rag-integration.service';

export interface UpdateRagSettingsDto {
  apiUrl?: string;
  timeoutMs?: number;
  retryAttempts?: number;
  maxResults?: number;
  similarityWeight?: number;
  recencyWeight?: number;
  categoryWeight?: number;
  baseScore?: number;
  similarityThreshold?: number;
  variant1Weight?: number;
  variant2Weight?: number;
  variant3Weight?: number;
  variant4Weight?: number;
  queryTemplate?: string;
  enabled?: boolean;
  useCategoryFilter?: boolean;
  useRecencyScoring?: boolean;
}

export interface TestRagConnectionDto {
  category: string;
  desiredOutcome: string;
  sessionType?: string;
  audienceName?: string;
}

export interface TestRagConnectionResponse {
  success: boolean;
  message: string;
  resultsCount?: number;
  averageSimilarity?: number;
  responseTime?: number;
  sampleResults?: Array<{
    filename: string;
    similarity: number;
    excerpt: string;
  }>;
  error?: string;
}

@Injectable()
export class RagSettingsService {
  private readonly logger = new Logger(RagSettingsService.name);

  constructor(
    @InjectRepository(RagSettings)
    private readonly ragSettingsRepository: Repository<RagSettings>,
    private readonly ragIntegrationService: RagIntegrationService,
  ) {}

  /**
   * Get current RAG settings (singleton pattern - always returns ID 1)
   */
  async getSettings(): Promise<RagSettings> {
    let settings = await this.ragSettingsRepository.findOne({ where: { id: 1 } });

    if (!settings) {
      // Create default settings if none exist
      settings = this.ragSettingsRepository.create({
        id: 1,
        timeoutMs: 10000,
        retryAttempts: 1,
        maxResults: 8,
        similarityWeight: 0.5,
        recencyWeight: 0.2,
        categoryWeight: 0.2,
        baseScore: 0.1,
        similarityThreshold: 0.65,
        variant1Weight: 0.8,
        variant2Weight: 0.5,
        variant3Weight: 0.2,
        variant4Weight: 0.0,
        enabled: true,
        useCategoryFilter: true,
        useRecencyScoring: true,
        lastTestStatus: 'never',
      });
      settings = await this.ragSettingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * Update RAG settings
   */
  async updateSettings(dto: UpdateRagSettingsDto): Promise<RagSettings> {
    const settings = await this.getSettings();

    // Validate scoring weights sum
    const totalWeight =
      (dto.similarityWeight ?? settings.similarityWeight) +
      (dto.recencyWeight ?? settings.recencyWeight) +
      (dto.categoryWeight ?? settings.categoryWeight) +
      (dto.baseScore ?? settings.baseScore);

    if (totalWeight > 1.0) {
      throw new Error(
        `Scoring weights must sum to <= 1.0. Current sum: ${totalWeight.toFixed(2)}`,
      );
    }

    // Validate variant weights (0.0 - 1.0)
    const variantWeights = [
      dto.variant1Weight ?? settings.variant1Weight,
      dto.variant2Weight ?? settings.variant2Weight,
      dto.variant3Weight ?? settings.variant3Weight,
      dto.variant4Weight ?? settings.variant4Weight,
    ];

    for (const weight of variantWeights) {
      if (weight < 0 || weight > 1) {
        throw new Error(`Variant weights must be between 0.0 and 1.0. Got: ${weight}`);
      }
    }

    // Update settings
    Object.assign(settings, dto);

    return this.ragSettingsRepository.save(settings);
  }

  /**
   * Test RAG connection with sample query
   */
  async testConnection(
    dto: TestRagConnectionDto,
    testedBy: string,
  ): Promise<TestRagConnectionResponse> {
    const startTime = Date.now();

    try {
      this.logger.log('Testing RAG connection', {
        category: dto.category,
        testedBy,
      });

      // Perform a real RAG query
      const results = await this.ragIntegrationService.queryRAGWithRetry({
        category: dto.category,
        desiredOutcome: dto.desiredOutcome,
        sessionType: dto.sessionType || null,
        audienceName: dto.audienceName || 'General Audience',
      });

      const responseTime = Date.now() - startTime;

      const averageSimilarity =
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.similarity || 0), 0) / results.length
          : 0;

      const sampleResults = results.slice(0, 3).map((r) => ({
        filename: r.metadata?.filename || 'Unknown',
        similarity: r.similarity || 0,
        excerpt: r.text?.substring(0, 150) || '',
      }));

      // Update test status
      const settings = await this.getSettings();
      settings.lastTestedBy = testedBy;
      settings.lastTestedAt = new Date();
      settings.lastTestStatus = 'success';
      settings.lastTestMessage = `Found ${results.length} results in ${responseTime}ms`;
      await this.ragSettingsRepository.save(settings);

      this.logger.log('RAG connection test successful', {
        resultsCount: results.length,
        responseTime,
        averageSimilarity,
      });

      return {
        success: true,
        message: `Successfully connected to RAG API. Found ${results.length} results in ${responseTime}ms.`,
        resultsCount: results.length,
        averageSimilarity,
        responseTime,
        sampleResults,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      this.logger.error('RAG connection test failed', {
        error: message,
        responseTime,
      });

      // Update test status
      const settings = await this.getSettings();
      settings.lastTestedBy = testedBy;
      settings.lastTestedAt = new Date();
      settings.lastTestStatus = 'failed';
      settings.lastTestMessage = message;
      await this.ragSettingsRepository.save(settings);

      return {
        success: false,
        message: `Failed to connect to RAG API: ${message}`,
        responseTime,
        error: message,
      };
    }
  }

  /**
   * Get variant weights as array
   */
  async getVariantWeights(): Promise<number[]> {
    const settings = await this.getSettings();
    return [
      settings.variant1Weight,
      settings.variant2Weight,
      settings.variant3Weight,
      settings.variant4Weight,
    ];
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(): Promise<RagSettings> {
    const settings = await this.getSettings();

    settings.timeoutMs = 10000;
    settings.retryAttempts = 1;
    settings.maxResults = 8;
    settings.similarityWeight = 0.5;
    settings.recencyWeight = 0.2;
    settings.categoryWeight = 0.2;
    settings.baseScore = 0.1;
    settings.similarityThreshold = 0.65;
    settings.variant1Weight = 0.8;
    settings.variant2Weight = 0.5;
    settings.variant3Weight = 0.2;
    settings.variant4Weight = 0.0;
    settings.enabled = true;
    settings.useCategoryFilter = true;
    settings.useRecencyScoring = true;
    settings.queryTemplate = null;

    return this.ragSettingsRepository.save(settings);
  }

  /**
   * Get default query template with placeholders
   */
  getDefaultQueryTemplate(): string {
    return `Find training materials for a {{sessionType}} session on {{category}}{{#if specificTopics}} covering: {{specificTopics}}{{/if}}.

{{#if audienceName}}TARGET AUDIENCE
Audience: {{audienceName}}{{#if experienceLevel}} ({{experienceLevel}} level){{/if}}
{{#if audienceDescription}}Profile: {{audienceDescription}}{{/if}}
{{#if communicationStyle}}Communication Preference: {{communicationStyle}}{{/if}}
{{#if preferredLearningStyle}}Learning Style: {{preferredLearningStyle}}{{/if}}
{{#if technicalDepth}}Technical Depth: {{technicalDepth}}/5{{/if}}
{{#if avoidTopics}}⚠️ Avoid Topics: {{avoidTopics}}{{/if}}

{{/if}}LEARNING OBJECTIVES
Goal: {{desiredOutcome}}
{{#if currentProblem}}Current Challenge: {{currentProblem}}{{/if}}

{{#if duration}}SESSION DETAILS
Duration: {{duration}} minutes
{{/if}}{{#if toneStyle}}Delivery Style: {{toneStyle}}{{#if energyLevel}} with {{energyLevel}} energy{{/if}}{{#if formality}}, formality {{formality}}/5{{/if}}
{{/if}}{{#if toneDescription}}Tone: {{toneDescription}}
{{/if}}
CONTENT REQUIREMENTS
{{#if vocabularyLevel}}- Vocabulary: {{vocabularyLevel}} level{{/if}}
{{#if exampleTypes}}- Example Types: {{exampleTypes}}{{/if}}
{{#if preferredLearningStyle}}- Learning Approach: {{preferredLearningStyle}}{{/if}}
{{#if sentenceStructure}}- Sentence Structure: {{sentenceStructure}}{{/if}}
{{#if languageCharacteristics}}- Language Style: {{languageCharacteristics}}{{/if}}
{{#if emotionalResonance}}- Emotional Impact: {{emotionalResonance}}{{/if}}

Please find relevant training materials, case studies, exercises, and best practices that match these criteria.`;
  }
}
