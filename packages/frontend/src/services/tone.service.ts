import { api } from './api.service';
import { Tone, ToneStyle, ToneEnergyLevel, ToneSentenceStructure } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';

export interface CreateToneRequest {
  name: string;
  description?: string;
  style?: ToneStyle;
  formality?: number;
  energyLevel?: ToneEnergyLevel;
  languageCharacteristics?: string[];
  sentenceStructure?: ToneSentenceStructure;
  emotionalResonance?: string[];
  examplePhrases?: string[];
  promptInstructions?: string;
}

export interface UpdateToneRequest extends Partial<CreateToneRequest> {
  isActive?: boolean;
}

export interface ToneQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedTonesResponse {
  tones: Tone[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

class ToneService {
  private readonly baseUrl = API_ENDPOINTS.TONES;

  async getTones(params?: ToneQueryParams): Promise<PaginatedTonesResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedTonesResponse>(url);
    return response.data;
  }

  async getActiveTones(): Promise<Tone[]> {
    const response = await api.get<Tone[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getTone(id: number): Promise<Tone> {
    const response = await api.get<Tone>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createTone(data: CreateToneRequest): Promise<Tone> {
    const response = await api.post<Tone>(this.baseUrl, data);
    return response.data;
  }

  async updateTone(id: number, data: UpdateToneRequest): Promise<Tone> {
    const response = await api.patch<Tone>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteTone(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const response = await api.get<UsageCheckResponse>(`${this.baseUrl}/${id}/usage-check`);
    return response.data;
  }
}

export const toneService = new ToneService();
