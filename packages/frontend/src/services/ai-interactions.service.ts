import { api } from './api.service';

export enum AIInteractionType {
  OUTLINE_GENERATION = 'outline_generation',
  TITLE_GENERATION = 'title_generation',
  CONTENT_ENHANCEMENT = 'content_enhancement',
  TRAINING_KIT = 'training_kit',
  MARKETING_KIT = 'marketing_kit',
}

export enum AIInteractionStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

export enum UserFeedback {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  MODIFIED = 'modified',
  NO_FEEDBACK = 'no_feedback',
}

export interface AIInteraction {
  id: string;
  sessionId?: string;
  userId?: string;
  promptId?: string;
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
  userFeedback: UserFeedback;
  userFeedbackComment?: string;
  feedbackAt?: string;
  qualityScore?: number;
  editDistance?: number;
  metadata?: Record<string, any>;
  audienceId?: number;
  toneId?: number;
  category?: string;
  sessionType?: string;
  allVariablesPresent: boolean;
  missingVariables?: string[];
  createdAt: string;
  updatedAt: string;
  session?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    email: string;
    displayName?: string;
  };
}

export interface AIInteractionFilters {
  page?: number;
  limit?: number;
  sessionId?: string;
  userId?: string;
  interactionType?: AIInteractionType;
  status?: AIInteractionStatus;
  userFeedback?: UserFeedback;
  startDate?: string;
  endDate?: string;
  category?: string;
  sessionType?: string;
  hasErrors?: boolean;
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
  dataQualityRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateFeedbackDto {
  userFeedback: UserFeedback;
  userFeedbackComment?: string;
  qualityScore?: number;
  editDistance?: number;
}

class AIInteractionsService {
  private baseUrl = '/ai-interactions';

  async getAll(filters: AIInteractionFilters = {}): Promise<PaginatedResponse<AIInteraction>> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.interactionType) params.append('interactionType', filters.interactionType);
    if (filters.status) params.append('status', filters.status);
    if (filters.userFeedback) params.append('userFeedback', filters.userFeedback);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.category) params.append('category', filters.category);
    if (filters.sessionType) params.append('sessionType', filters.sessionType);
    if (filters.hasErrors !== undefined) params.append('hasErrors', filters.hasErrors.toString());
    if (filters.minQualityScore) params.append('minQualityScore', filters.minQualityScore.toString());
    if (filters.maxQualityScore) params.append('maxQualityScore', filters.maxQualityScore.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await api.get<PaginatedResponse<AIInteraction>>(url);
    return response.data;
  }

  async getOne(id: string): Promise<AIInteraction> {
    const response = await api.get<AIInteraction>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async getMetrics(filters: {
    startDate?: string;
    endDate?: string;
    interactionType?: AIInteractionType;
    category?: string;
  } = {}): Promise<AIInteractionMetrics> {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.interactionType) params.append('interactionType', filters.interactionType);
    if (filters.category) params.append('category', filters.category);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/metrics?${queryString}` : `${this.baseUrl}/metrics`;

    const response = await api.get<AIInteractionMetrics>(url);
    return response.data;
  }

  async getRecentFailures(limit = 20): Promise<AIInteraction[]> {
    const response = await api.get<AIInteraction[]>(`${this.baseUrl}/failures?limit=${limit}`);
    return response.data;
  }

  async getDataQualityIssues(limit = 50): Promise<AIInteraction[]> {
    const response = await api.get<AIInteraction[]>(`${this.baseUrl}/data-quality-issues?limit=${limit}`);
    return response.data;
  }

  async exportInteractions(
    format: 'json' | 'csv' = 'json',
    filters: {
      startDate?: string;
      endDate?: string;
      interactionType?: AIInteractionType;
    } = {}
  ): Promise<{ format: string; data: string }> {
    const params = new URLSearchParams();

    params.append('format', format);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.interactionType) params.append('interactionType', filters.interactionType);

    const response = await api.get<{ format: string; data: string }>(`${this.baseUrl}/export?${params.toString()}`);
    return response.data;
  }

  async updateFeedback(id: string, feedback: UpdateFeedbackDto): Promise<AIInteraction> {
    const response = await api.post<AIInteraction>(`${this.baseUrl}/${id}/feedback`, feedback);
    return response.data;
  }

  // Helper methods for formatting
  formatCost(cost?: number): string {
    if (!cost) return '$0.00';
    return `$${cost.toFixed(4)}`;
  }

  formatProcessingTime(ms?: number): string {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  formatTokens(tokens?: number): string {
    if (!tokens) return '0';
    if (tokens < 1000) return tokens.toString();
    return `${(tokens / 1000).toFixed(1)}K`;
  }

  getStatusColor(status: AIInteractionStatus): string {
    switch (status) {
      case AIInteractionStatus.SUCCESS:
        return 'green';
      case AIInteractionStatus.FAILURE:
        return 'red';
      case AIInteractionStatus.PARTIAL:
        return 'yellow';
      default:
        return 'gray';
    }
  }

  getFeedbackColor(feedback: UserFeedback): string {
    switch (feedback) {
      case UserFeedback.ACCEPTED:
        return 'green';
      case UserFeedback.REJECTED:
        return 'red';
      case UserFeedback.MODIFIED:
        return 'yellow';
      case UserFeedback.NO_FEEDBACK:
        return 'gray';
      default:
        return 'gray';
    }
  }

  getTypeLabel(type: AIInteractionType): string {
    switch (type) {
      case AIInteractionType.OUTLINE_GENERATION:
        return 'Outline Generation';
      case AIInteractionType.TITLE_GENERATION:
        return 'Title Generation';
      case AIInteractionType.CONTENT_ENHANCEMENT:
        return 'Content Enhancement';
      case AIInteractionType.TRAINING_KIT:
        return 'Training Kit';
      case AIInteractionType.MARKETING_KIT:
        return 'Marketing Kit';
      default:
        return type;
    }
  }
}

export const aiInteractionsService = new AIInteractionsService();
export default aiInteractionsService;
