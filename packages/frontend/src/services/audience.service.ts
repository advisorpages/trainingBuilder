import { api } from './api.service';
import { Audience } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';

export interface CreateAudienceRequest {
  name: string;
  description?: string;
}

export interface UpdateAudienceRequest extends Partial<CreateAudienceRequest> {
  isActive?: boolean;
}

export interface AudienceQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedAudiencesResponse {
  audiences: Audience[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

class AudienceService {
  private readonly baseUrl = API_ENDPOINTS.AUDIENCES;

  async getAudiences(params?: AudienceQueryParams): Promise<PaginatedAudiencesResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedAudiencesResponse>(url);
    return response.data;
  }

  async getActiveAudiences(): Promise<Audience[]> {
    const response = await api.get<Audience[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getAudience(id: number): Promise<Audience> {
    const response = await api.get<Audience>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createAudience(data: CreateAudienceRequest): Promise<Audience> {
    const response = await api.post<Audience>(this.baseUrl, data);
    return response.data;
  }

  async updateAudience(id: number, data: UpdateAudienceRequest): Promise<Audience> {
    const response = await api.patch<Audience>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteAudience(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const response = await api.get<UsageCheckResponse>(`${this.baseUrl}/${id}/usage-check`);
    return response.data;
  }
}

export const audienceService = new AudienceService();