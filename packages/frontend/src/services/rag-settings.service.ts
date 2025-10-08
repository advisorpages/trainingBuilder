import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface RagSettings {
  id: number;
  apiUrl?: string;
  timeoutMs: number;
  retryAttempts: number;
  maxResults: number;
  similarityWeight: number;
  recencyWeight: number;
  categoryWeight: number;
  baseScore: number;
  similarityThreshold: number;
  variant1Weight: number;
  variant2Weight: number;
  variant3Weight: number;
  variant4Weight: number;
  queryTemplate?: string;
  enabled: boolean;
  useCategoryFilter: boolean;
  useRecencyScoring: boolean;
  lastTestedBy?: string;
  lastTestedAt?: string;
  lastTestStatus: string;
  lastTestMessage?: string;
  createdAt: string;
  updatedAt: string;
}

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

export const ragSettingsService = {
  async getSettings(): Promise<RagSettings> {
    const response = await axios.get(`${API_URL}/rag-settings`);
    return response.data;
  },

  async updateSettings(dto: UpdateRagSettingsDto): Promise<RagSettings> {
    const response = await axios.put(`${API_URL}/rag-settings`, dto);
    return response.data;
  },

  async testConnection(dto: TestRagConnectionDto): Promise<TestRagConnectionResponse> {
    const response = await axios.post(`${API_URL}/rag-settings/test-connection`, dto);
    return response.data;
  },

  async resetToDefaults(): Promise<RagSettings> {
    const response = await axios.post(`${API_URL}/rag-settings/reset-defaults`);
    return response.data;
  },

  async getDefaultTemplate(): Promise<{ template: string }> {
    const response = await axios.get(`${API_URL}/rag-settings/default-template`);
    return response.data;
  },

  async getVariantWeights(): Promise<{ weights: number[] }> {
    const response = await axios.get(`${API_URL}/rag-settings/variant-weights`);
    return response.data;
  },
};
