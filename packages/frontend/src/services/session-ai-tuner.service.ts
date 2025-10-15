import { api } from './api.service';

export interface QuickTweaksConfig {
  increaseDataEmphasis: boolean;
  speedUpPace: boolean;
  raiseRagPriority: boolean;
}

export interface PromptVariantPersona {
  id: string;
  label: string;
  summary?: string;
  prompt: string;
}

export interface PromptSandboxSettings {
  version: string;
  variantPersonas: PromptVariantPersona[];
  globalTone: {
    toneGuidelines: string;
    systemGuidelines: string;
  };
  durationFlow: {
    pacingGuidelines: string;
    structuralNotes: string;
  };
  quickTweaks: QuickTweaksConfig;
}

export interface AiPromptSetting {
  id: string;
  label: string;
  slug: string;
  description?: string;
  notes?: string;
  settings: PromptSandboxSettings;
  isCurrent: boolean;
  isPinned: boolean;
  isArchived?: boolean;
  category?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptSettingsResponse {
  setting: AiPromptSetting;
  settings: PromptSandboxSettings;
}

export interface SessionTunerOverviewResponse {
  metrics: {
    totalRuns: number;
    successRate: number;
    ragHitRate: number;
    averageDurationDelta: number;
    averageDurationDeltaAbs: number;
    recentIssues: Array<{
      id: string;
      status: string;
      createdAt: string;
      variantLabel?: string;
      errorMessage?: string | null;
    }>;
  };
  activeSettings: {
    id: string;
    label: string;
    updatedAt: string;
    quickTweaks: QuickTweaksConfig;
    variantCount: number;
    version?: string;
  };
  promptSettings: PromptSettingsResponse;
}

export interface AIInteractionComparison {
  id: string;
  createdAt: string;
  status: string;
  interactionType: string;
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

export interface ComparisonQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  variantLabel?: string;
  status?: string;
}

export interface UpdatePromptSettingsPayload {
  settings?: PromptSandboxSettings;
  label?: string;
  notes?: string;
  sourceOverrideId?: string;
}

export interface CreateSavedSettingPayload {
  label: string;
  settings: PromptSandboxSettings;
  description?: string;
  notes?: string;
}

class SessionAiTunerService {
  async getOverview(): Promise<SessionTunerOverviewResponse> {
    const response = await api.get<SessionTunerOverviewResponse>('/ai-interactions/tuner/overview');
    return response.data;
  }

  async getComparisons(params: ComparisonQueryParams = {}): Promise<{ runs: AIInteractionComparison[]; total: number }> {
    const searchParams = new URLSearchParams();

    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.offset) searchParams.append('offset', String(params.offset));
    if (params.search) searchParams.append('search', params.search);
    if (params.variantLabel) searchParams.append('variantLabel', params.variantLabel);
    if (params.status) searchParams.append('status', params.status);

    const query = searchParams.toString();
    const url = query ? `/ai-interactions/comparisons?${query}` : '/ai-interactions/comparisons';
    const response = await api.get<{ runs: AIInteractionComparison[]; total: number }>(url);
    return response.data;
  }

  async updateRunMetadata(id: string, metadataPatch: Record<string, any>): Promise<void> {
    await api.patch(`/ai-interactions/${id}/metadata`, { metadata: metadataPatch });
  }

  async getCurrentSettings(): Promise<PromptSettingsResponse> {
    const response = await api.get<PromptSettingsResponse>('/ai-prompts/current');
    return response.data;
  }

  async updateCurrentSettings(payload: UpdatePromptSettingsPayload): Promise<PromptSettingsResponse> {
    const response = await api.put<PromptSettingsResponse>('/ai-prompts/current', payload);
    return response.data;
  }

  async listSavedSettings(): Promise<AiPromptSetting[]> {
    const response = await api.get<AiPromptSetting[]>('/ai-prompts/override');
    return response.data;
  }

  async createSavedSetting(payload: CreateSavedSettingPayload): Promise<AiPromptSetting> {
    const response = await api.post<AiPromptSetting>('/ai-prompts/override', payload);
    return response.data;
  }

  async deleteSavedSetting(id: string): Promise<void> {
    await api.delete(`/ai-prompts/override/${id}`);
  }

  async setCurrentFromSaved(id: string): Promise<PromptSettingsResponse> {
    const response = await api.put<PromptSettingsResponse>('/ai-prompts/current', { sourceOverrideId: id });
    return response.data;
  }

  async getVariantLogs(params: {
    limit?: number;
    offset?: number;
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    logs: VariantLogEntry[];
    total: number;
    summary: {
      totalRuns: number;
      successRate: number;
      avgProcessingTime: number;
      totalCost: number;
    };
  }> {
    // Use the existing ai-interactions endpoint with filters
    const filters: any = {
      interactionType: 'outline_generation', // Filter for variant generations only
    };

    if (params.search) filters.search = params.search;
    if (params.status) filters.status = params.status;
    if (params.startDate) filters.startDate = params.startDate;
    if (params.endDate) filters.endDate = params.endDate;

    // Calculate page from offset/limit for the existing API
    const page = params.offset && params.limit
      ? Math.floor(params.offset / params.limit) + 1
      : 1;

    const response = await api.get<{
      data: any[];
      total: number;
      page: number;
      limit: number;
    }>('/ai-interactions', {
      params: {
        ...filters,
        page: page.toString(),
        limit: (params.limit || 20).toString(),
      }
    });

    // Transform the response to match our expected format
    const logs: VariantLogEntry[] = response.data.data.map((interaction: any) => ({
      id: interaction.id,
      createdAt: interaction.createdAt,
      status: interaction.status,
      sessionTitle: interaction.session?.title || 'Untitled',
      category: interaction.category,
      sessionType: interaction.sessionType,
      processingTimeMs: interaction.processingTimeMs,
      tokensUsed: interaction.tokensUsed,
      estimatedCost: interaction.estimatedCost,
      modelUsed: interaction.modelUsed,
      userName: interaction.user?.name || 'Unknown',
      variantLabel: interaction.metadata?.variantLabel,
      ragWeight: interaction.metadata?.ragWeight,
      errorMessage: interaction.errorMessage,
      qualityScore: interaction.qualityScore,
      userFeedback: interaction.userFeedback,
    }));

    // Calculate summary metrics from the logs
    const totalRuns = logs.length;
    const successfulRuns = logs.filter(log => log.status === 'success').length;
    const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
    const avgProcessingTime = logs.reduce((sum, log) => sum + (log.processingTimeMs || 0), 0) / Math.max(totalRuns, 1);
    const totalCost = logs.reduce((sum, log) => sum + (Number(log.estimatedCost) || 0), 0);

    return {
      logs,
      total: response.data.total,
      summary: {
        totalRuns,
        successRate,
        avgProcessingTime,
        totalCost,
      },
    };
  }

  async getVariantLogDetails(id: string): Promise<VariantLogDetail> {
    const response = await api.get<VariantLogDetail>(`/ai-interactions/${id}`);
    return response.data;
  }
}

export interface VariantLogEntry {
  id: string;
  createdAt: string;
  status: 'success' | 'failure' | 'partial';
  sessionTitle?: string;
  category?: string;
  sessionType?: string;
  processingTimeMs?: number;
  tokensUsed?: number;
  estimatedCost?: number;
  modelUsed?: string;
  userName?: string;
  variantLabel?: string;
  ragWeight?: number;
  errorMessage?: string;
  qualityScore?: number;
  userFeedback?: 'accepted' | 'rejected' | 'modified' | 'no_feedback';
}

export interface VariantLogDetail extends VariantLogEntry {
  renderedPrompt: string;
  inputVariables: Record<string, any>;
  aiResponse?: string;
  structuredOutput?: Record<string, any>;
  metadata?: Record<string, any>;
  errorDetails?: Record<string, any>;
}

export const sessionAiTunerService = new SessionAiTunerService();
export default sessionAiTunerService;

