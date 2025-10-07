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

    const qualityScores = data.filter((i) => i.qualityScore !== null && i.qualityScore !== undefined);
    const averageQualityScore =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, i) => sum + i.qualityScore!, 0) / qualityScores.length
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
}
