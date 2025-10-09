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
}

export const sessionAiTunerService = new SessionAiTunerService();
export default sessionAiTunerService;

