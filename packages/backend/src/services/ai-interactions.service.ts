import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere } from 'typeorm';
import {
  AIInteraction,
  AIInteractionStatus,
  AIInteractionType,
  UserFeedback,
} from '../entities/ai-interaction.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Prompt } from '../entities/prompt.entity';

export interface CreateAIInteractionDto {
  session?: Session;
  user?: User;
  prompt?: Prompt;
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
  estimatedCost?: number;
  modelUsed?: string;
  promptVersion?: string;
  metadata?: Record<string, any>;
  audienceId?: number;
  toneId?: number;
  category?: string;
  sessionType?: string;
  allVariablesPresent?: boolean;
  missingVariables?: string[];
}

export interface AIInteractionFilters {
  sessionId?: string;
  userId?: string;
  interactionType?: AIInteractionType | AIInteractionType[];
  status?: AIInteractionStatus | AIInteractionStatus[];
  userFeedback?: UserFeedback | UserFeedback[];
  startDate?: Date;
  endDate?: Date;
  category?: string;
  sessionType?: string;
  hasErrors?: boolean;
  minProcessingTime?: number;
  maxProcessingTime?: number;
  minQualityScore?: number;
  maxQualityScore?: number;
}

export interface AIInteractionMetrics {
  totalInteractions: number;
  successRate: number;
  failureRate: number;
  averageProcessingTime: number;
  totalTokensUsed: number;
  totalCost: number;
  byType: Record<AIInteractionType, number>;
  byStatus: Record<AIInteractionStatus, number>;
  byFeedback: Record<UserFeedback, number>;
  averageQualityScore: number;
  dataQualityRate: number; // % with all variables present
}

export interface UpdateFeedbackDto {
  userFeedback: UserFeedback;
  userFeedbackComment?: string;
  qualityScore?: number;
  editDistance?: number;
}

export interface AIInteractionComparison {
  id: string;
  createdAt: Date;
  status: AIInteractionStatus;
  interactionType: AIInteractionType;
  variantLabel?: string;
  variantDescription?: string;
  ragMode: string;
  ragWeight: number;
  durationTarget: number;
  durationActual: number;
  durationDelta: number;
  quickTweaks: Record<string, boolean>;
  configSnapshot: Record<string, any>;
  overridesSnapshot?: Record<string, any>;
  metadata: Record<string, any>;
  structuredOutput?: Record<string, any>;
  renderedPrompt?: string;
  userNotes?: Record<string, any>;
  isPinned?: boolean;
}

export interface SessionTunerOverview {
  totalRuns: number;
  successRate: number;
  ragHitRate: number;
  averageDurationDelta: number;
  averageDurationDeltaAbs: number;
  recentIssues: Array<{
    id: string;
    status: AIInteractionStatus;
    createdAt: Date;
    variantLabel?: string;
    errorMessage?: string | null;
  }>;
}

@Injectable()
export class AIInteractionsService {
  constructor(
    @InjectRepository(AIInteraction)
    private readonly interactionsRepository: Repository<AIInteraction>
  ) {}

  async create(data: CreateAIInteractionDto): Promise<AIInteraction> {
    const interaction = this.interactionsRepository.create(data);
    return this.interactionsRepository.save(interaction);
  }

  async findOne(id: string): Promise<AIInteraction | null> {
    return this.interactionsRepository.findOne({
      where: { id },
      relations: ['session', 'user', 'prompt'],
    });
  }

  async findAll(
    filters: AIInteractionFilters = {},
    page = 1,
    limit = 50
  ): Promise<{ data: AIInteraction[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<AIInteraction> = {};

    if (filters.sessionId) {
      where.session = { id: filters.sessionId };
    }

    if (filters.userId) {
      where.user = { id: filters.userId };
    }

    if (filters.interactionType) {
      where.interactionType = Array.isArray(filters.interactionType)
        ? In(filters.interactionType)
        : filters.interactionType;
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? In(filters.status)
        : filters.status;
    }

    if (filters.userFeedback) {
      where.userFeedback = Array.isArray(filters.userFeedback)
        ? In(filters.userFeedback)
        : filters.userFeedback;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.sessionType) {
      where.sessionType = filters.sessionType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = Between(
        filters.startDate || new Date('2000-01-01'),
        filters.endDate || new Date()
      );
    }

    const queryBuilder = this.interactionsRepository
      .createQueryBuilder('interaction')
      .leftJoinAndSelect('interaction.session', 'session')
      .leftJoinAndSelect('interaction.user', 'user')
      .leftJoinAndSelect('interaction.prompt', 'prompt');

    // Apply where conditions
    Object.entries(where).forEach(([key, value]) => {
      if (key === 'createdAt') {
        queryBuilder.andWhere('interaction.createdAt BETWEEN :startDate AND :endDate', {
          startDate: (value as any).from,
          endDate: (value as any).to,
        });
      } else if (key === 'session' || key === 'user') {
        queryBuilder.andWhere(`${key}.id = :${key}Id`, { [`${key}Id`]: (value as any).id });
      } else if (value && typeof value === 'object' && '_type' in value) {
        // Handle In() operator
        queryBuilder.andWhere(`interaction.${key} IN (:...${key}Values)`, {
          [`${key}Values`]: (value as any)._value,
        });
      } else {
        queryBuilder.andWhere(`interaction.${key} = :${key}`, { [key]: value });
      }
    });

    // Additional filters
    if (filters.hasErrors !== undefined) {
      if (filters.hasErrors) {
        queryBuilder.andWhere('interaction.errorMessage IS NOT NULL');
      } else {
        queryBuilder.andWhere('interaction.errorMessage IS NULL');
      }
    }

    if (filters.minProcessingTime !== undefined) {
      queryBuilder.andWhere('interaction.processingTimeMs >= :minTime', {
        minTime: filters.minProcessingTime,
      });
    }

    if (filters.maxProcessingTime !== undefined) {
      queryBuilder.andWhere('interaction.processingTimeMs <= :maxTime', {
        maxTime: filters.maxProcessingTime,
      });
    }

    if (filters.minQualityScore !== undefined) {
      queryBuilder.andWhere('interaction.qualityScore >= :minScore', {
        minScore: filters.minQualityScore,
      });
    }

    if (filters.maxQualityScore !== undefined) {
      queryBuilder.andWhere('interaction.qualityScore <= :maxScore', {
        maxScore: filters.maxQualityScore,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('interaction.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async updateFeedback(id: string, feedbackData: UpdateFeedbackDto): Promise<AIInteraction> {
    const interaction = await this.findOne(id);
    if (!interaction) {
      throw new Error(`AI Interaction ${id} not found`);
    }

    interaction.userFeedback = feedbackData.userFeedback;
    interaction.userFeedbackComment = feedbackData.userFeedbackComment;
    interaction.feedbackAt = new Date();

    if (feedbackData.qualityScore !== undefined) {
      interaction.qualityScore = feedbackData.qualityScore;
    }

    if (feedbackData.editDistance !== undefined) {
      interaction.editDistance = feedbackData.editDistance;
    }

    return this.interactionsRepository.save(interaction);
  }

  async getMetrics(filters: AIInteractionFilters = {}): Promise<AIInteractionMetrics> {
    const { data } = await this.findAll(filters, 1, 999999); // Get all for metrics

    const totalInteractions = data.length;

    if (totalInteractions === 0) {
      return {
        totalInteractions: 0,
        successRate: 0,
        failureRate: 0,
        averageProcessingTime: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        byType: {} as Record<AIInteractionType, number>,
        byStatus: {} as Record<AIInteractionStatus, number>,
        byFeedback: {} as Record<UserFeedback, number>,
        averageQualityScore: 0,
        dataQualityRate: 0,
      };
    }

    const successCount = data.filter((i) => i.status === AIInteractionStatus.SUCCESS).length;
    const failureCount = data.filter((i) => i.status === AIInteractionStatus.FAILURE).length;

    const totalProcessingTime = data.reduce((sum, i) => sum + (i.processingTimeMs || 0), 0);
    const totalTokensUsed = data.reduce((sum, i) => sum + (i.tokensUsed || 0), 0);
    const totalCost = data.reduce((sum, i) => sum + Number(i.estimatedCost || 0), 0);

    const byType = data.reduce((acc, i) => {
      acc[i.interactionType] = (acc[i.interactionType] || 0) + 1;
      return acc;
    }, {} as Record<AIInteractionType, number>);

    const byStatus = data.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {} as Record<AIInteractionStatus, number>);

    const byFeedback = data.reduce((acc, i) => {
      acc[i.userFeedback] = (acc[i.userFeedback] || 0) + 1;
      return acc;
    }, {} as Record<UserFeedback, number>);

    const qualityScores = data
      .map((i) => i.qualityScore)
      .filter((score): score is number => score !== null && score !== undefined);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
        : 0;

    const withAllVariables = data.filter((i) => i.allVariablesPresent).length;
    const dataQualityRate = (withAllVariables / totalInteractions) * 100;

    return {
      totalInteractions,
      successRate: (successCount / totalInteractions) * 100,
      failureRate: (failureCount / totalInteractions) * 100,
      averageProcessingTime: totalProcessingTime / totalInteractions,
      totalTokensUsed,
      totalCost,
      byType,
      byStatus,
      byFeedback,
      averageQualityScore,
      dataQualityRate,
    };
  }

  async exportInteractions(
    filters: AIInteractionFilters = {},
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { data } = await this.findAll(filters, 1, 999999);

    if (format === 'csv') {
      const headers = [
        'ID',
        'Created At',
        'Type',
        'Status',
        'Session ID',
        'Processing Time (ms)',
        'Tokens Used',
        'Cost',
        'Model',
        'User Feedback',
        'Quality Score',
        'All Variables Present',
        'Error Message',
      ];

      const rows = data.map((interaction) => [
        interaction.id,
        interaction.createdAt.toISOString(),
        interaction.interactionType,
        interaction.status,
        interaction.session?.id || '',
        interaction.processingTimeMs || '',
        interaction.tokensUsed || '',
        interaction.estimatedCost || '',
        interaction.modelUsed || '',
        interaction.userFeedback,
        interaction.qualityScore || '',
        interaction.allVariablesPresent,
        interaction.errorMessage || '',
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  async getRecentFailures(limit = 20): Promise<AIInteraction[]> {
    return this.interactionsRepository.find({
      where: { status: AIInteractionStatus.FAILURE },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['session', 'user'],
    });
  }

  async getDataQualityIssues(limit = 50): Promise<AIInteraction[]> {
    return this.interactionsRepository.find({
      where: { allVariablesPresent: false },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['session'],
    });
  }

  /**
   * Get variant selection analytics metrics
   */
  async getVariantSelectionMetrics(filters: AIInteractionFilters = {}): Promise<{
    totalSelections: number;
    selectionsByVariant: Record<string, number>;
    selectionRateByVariant: Record<string, number>;
    ragVsBaselineRate: {
      ragSelections: number;
      baselineSelections: number;
      ragPercentage: number;
      baselinePercentage: number;
    };
    averageRagWeight: number;
    categoryBreakdown: Record<string, {
      total: number;
      ragCount: number;
      baselineCount: number;
      ragPercentage: number;
    }>;
    averageRagSourcesUsed: number;
    selectionsByLabel: Record<string, number>;
  }> {
    const { data } = await this.findAll({
      ...filters,
      interactionType: AIInteractionType.VARIANT_SELECTION,
    }, 1, 999999);

    const totalSelections = data.length;

    if (totalSelections === 0) {
      return {
        totalSelections: 0,
        selectionsByVariant: {},
        selectionRateByVariant: {},
        ragVsBaselineRate: {
          ragSelections: 0,
          baselineSelections: 0,
          ragPercentage: 0,
          baselinePercentage: 0,
        },
        averageRagWeight: 0,
        categoryBreakdown: {},
        averageRagSourcesUsed: 0,
        selectionsByLabel: {},
      };
    }

    // Count selections by variant ID
    const selectionsByVariant: Record<string, number> = {};
    const selectionsByLabel: Record<string, number> = {};
    let ragSelections = 0;
    let baselineSelections = 0;
    let totalRagWeight = 0;
    let totalRagSources = 0;
    const categoryBreakdown: Record<string, {
      total: number;
      ragCount: number;
      baselineCount: number;
      ragPercentage: number;
    }> = {};

    data.forEach(interaction => {
      const { variantId, generationSource, ragWeight, ragSourcesUsed, category } =
        interaction.inputVariables as any;
      const variantLabel = interaction.metadata?.variantLabel || variantId;

      // Count by variant ID
      selectionsByVariant[variantId] = (selectionsByVariant[variantId] || 0) + 1;
      selectionsByLabel[variantLabel] = (selectionsByLabel[variantLabel] || 0) + 1;

      // RAG vs baseline
      if (generationSource === 'rag') {
        ragSelections++;
        totalRagWeight += ragWeight || 0;
        totalRagSources += ragSourcesUsed || 0;
      } else {
        baselineSelections++;
      }

      // Category breakdown
      if (category) {
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = {
            total: 0,
            ragCount: 0,
            baselineCount: 0,
            ragPercentage: 0,
          };
        }
        categoryBreakdown[category].total++;
        if (generationSource === 'rag') {
          categoryBreakdown[category].ragCount++;
        } else {
          categoryBreakdown[category].baselineCount++;
        }
      }
    });

    // Calculate selection rates by variant
    const selectionRateByVariant: Record<string, number> = {};
    Object.entries(selectionsByVariant).forEach(([variantId, count]) => {
      selectionRateByVariant[variantId] = (count / totalSelections) * 100;
    });

    // Calculate category percentages
    Object.values(categoryBreakdown).forEach(cat => {
      cat.ragPercentage = cat.total > 0 ? (cat.ragCount / cat.total) * 100 : 0;
    });

    return {
      totalSelections,
      selectionsByVariant,
      selectionRateByVariant,
      ragVsBaselineRate: {
        ragSelections,
        baselineSelections,
        ragPercentage: (ragSelections / totalSelections) * 100,
        baselinePercentage: (baselineSelections / totalSelections) * 100,
      },
      averageRagWeight: ragSelections > 0 ? totalRagWeight / ragSelections : 0,
      categoryBreakdown,
      averageRagSourcesUsed: ragSelections > 0 ? totalRagSources / ragSelections : 0,
      selectionsByLabel,
    };
  }

  async updateMetadata(id: string, metadataPatch: Record<string, any>): Promise<AIInteraction> {
    const interaction = await this.findOne(id);
    if (!interaction) {
      throw new Error(`AI Interaction ${id} not found`);
    }

    const currentMetadata = (interaction.metadata || {}) as Record<string, any>;
    interaction.metadata = this.deepMerge(currentMetadata, metadataPatch);
    return this.interactionsRepository.save(interaction);
  }

  async getComparisonSnapshots(params: {
    limit?: number;
    offset?: number;
    search?: string;
    variantLabel?: string;
    status?: AIInteractionStatus;
  } = {}): Promise<{ runs: AIInteractionComparison[]; total: number }> {
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const offset = Math.max(params.offset ?? 0, 0);

    const queryBuilder = this.interactionsRepository
      .createQueryBuilder('interaction')
      .where('interaction.interactionType = :type', {
        type: AIInteractionType.OUTLINE_GENERATION,
      })
      .orderBy('interaction.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (params.status) {
      queryBuilder.andWhere('interaction.status = :status', { status: params.status });
    }

    if (params.variantLabel) {
      queryBuilder.andWhere(
        "(interaction.metadata -> 'configSnapshot' ->> 'variantLabel') ILIKE :variantLabel",
        { variantLabel: `%${params.variantLabel}%` },
      );
    }

    if (params.search) {
      queryBuilder.andWhere(
        "((interaction.metadata -> 'configSnapshot' ->> 'variantLabel') ILIKE :search " +
          'OR interaction.renderedPrompt ILIKE :search)',
        { search: `%${params.search}%` },
      );
    }

    const [records, total] = await queryBuilder.getManyAndCount();
    const runs = records.map((interaction) => this.toComparisonSnapshot(interaction));

    return { runs, total };
  }

  async getSessionTunerOverview(limit = 200): Promise<SessionTunerOverview> {
    const cappedLimit = Math.min(Math.max(limit, 50), 500);
    const interactions = await this.interactionsRepository
      .createQueryBuilder('interaction')
      .where('interaction.interactionType = :type', {
        type: AIInteractionType.OUTLINE_GENERATION,
      })
      .orderBy('interaction.createdAt', 'DESC')
      .take(cappedLimit)
      .getMany();

    if (interactions.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        ragHitRate: 0,
        averageDurationDelta: 0,
        averageDurationDeltaAbs: 0,
        recentIssues: [],
      };
    }

    const snapshots = interactions.map((interaction) => this.toComparisonSnapshot(interaction));
    const successCount = snapshots.filter((snapshot) => snapshot.status === AIInteractionStatus.SUCCESS).length;
    const ragRuns = snapshots.filter((snapshot) => snapshot.ragMode !== 'baseline' || snapshot.ragWeight > 0);

    const durationDeltaSum = snapshots.reduce((sum, snapshot) => sum + snapshot.durationDelta, 0);
    const durationDeltaAbsSum = snapshots.reduce((sum, snapshot) => sum + Math.abs(snapshot.durationDelta), 0);

    const errorLookup = new Map(interactions.map((interaction) => [interaction.id, interaction.errorMessage || null]));

    const recentIssues = snapshots
      .filter((snapshot) => snapshot.status !== AIInteractionStatus.SUCCESS)
      .slice(0, 3)
      .map((snapshot) => ({
        id: snapshot.id,
        status: snapshot.status,
        createdAt: snapshot.createdAt,
        variantLabel: snapshot.variantLabel,
        errorMessage: errorLookup.get(snapshot.id),
      }));

    return {
      totalRuns: snapshots.length,
      successRate: (successCount / snapshots.length) * 100,
      ragHitRate: snapshots.length > 0 ? (ragRuns.length / snapshots.length) * 100 : 0,
      averageDurationDelta: snapshots.length > 0 ? durationDeltaSum / snapshots.length : 0,
      averageDurationDeltaAbs: snapshots.length > 0 ? durationDeltaAbsSum / snapshots.length : 0,
      recentIssues,
    };
  }

  private toComparisonSnapshot(interaction: AIInteraction): AIInteractionComparison {
    const metadata = (interaction.metadata || {}) as Record<string, any>;
    const configSnapshot = this.extractConfigSnapshot(metadata);
    const overridesSnapshot = (configSnapshot.overrides || {}) as Record<string, any>;
    const quickTweaks = (overridesSnapshot.quickTweaks || {}) as Record<string, boolean>;
    const ragWeight = this.safeNumber(
      configSnapshot.ragWeight ?? metadata.ragWeight ?? interaction.inputVariables?.ragWeight,
      0,
    );
    const durationTarget = this.safeNumber(
      configSnapshot.durationTarget ?? interaction.inputVariables?.duration,
      0,
    );
    const durationActual = this.safeNumber(
      metadata?.metrics?.durationActual ??
        interaction.structuredOutput?.totalDuration ??
        configSnapshot.durationActual,
      durationTarget,
    );
    const variantLabel = this.getVariantLabel(metadata, interaction);
    const variantDescription = configSnapshot.variantDescription ?? metadata.variantDescription;

    const comparisonTags = Array.isArray(metadata.comparisonTags) ? metadata.comparisonTags : [];
    const isPinned = comparisonTags.includes('benchmark') || metadata.isPinned === true;

    return {
      id: interaction.id,
      createdAt: interaction.createdAt,
      status: interaction.status,
      interactionType: interaction.interactionType,
      variantLabel: variantLabel ?? undefined,
      variantDescription: variantDescription ?? undefined,
      ragMode: this.computeRagMode(configSnapshot, ragWeight, metadata),
      ragWeight,
      durationTarget,
      durationActual,
      durationDelta: durationActual - durationTarget,
      quickTweaks,
      configSnapshot,
      overridesSnapshot,
      metadata,
      structuredOutput: interaction.structuredOutput ?? undefined,
      renderedPrompt: interaction.renderedPrompt,
      userNotes: metadata.userNotes ?? undefined,
      isPinned,
    };
  }

  private extractConfigSnapshot(metadata: Record<string, any>): Record<string, any> {
    const snapshot = (metadata?.configSnapshot ?? {}) as Record<string, any>;
    return { ...snapshot };
  }

  private computeRagMode(
    configSnapshot: Record<string, any>,
    ragWeight: number,
    metadata: Record<string, any>,
  ): string {
    if (configSnapshot?.ragMode) {
      return configSnapshot.ragMode;
    }
    if (metadata?.ragSummary?.mode) {
      return metadata.ragSummary.mode;
    }
    return ragWeight > 0 ? 'rag' : 'baseline';
  }

  private getVariantLabel(metadata: Record<string, any>, interaction: AIInteraction): string | undefined {
    const snapshotLabel = metadata?.configSnapshot?.variantLabel ?? metadata?.variantLabel;
    if (snapshotLabel) {
      return snapshotLabel;
    }
    const input = (interaction.inputVariables || {}) as Record<string, any>;
    if (input?.variantLabel) {
      return input.variantLabel;
    }
    return undefined;
  }

  private safeNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }

  private deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    if (!this.isObject(target)) {
      return { ...source };
    }

    const result: Record<string, any> = { ...target };

    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (Array.isArray(value)) {
        result[key] = value.slice();
      } else if (this.isObject(value)) {
        result[key] = this.deepMerge(
          this.isObject(result[key]) ? (result[key] as Record<string, any>) : {},
          value as Record<string, any>,
        );
      } else if (value === undefined) {
        // Skip undefined to prevent erasing existing values unintentionally
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  private isObject(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
