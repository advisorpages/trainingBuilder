import { Incentive } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';
import { api } from './api.service';

export interface CreateIncentiveRequest {
  title: string;
  description?: string;
  rules?: string;
  startDate: Date;
  endDate: Date;
  audienceId?: number;
  toneId?: number;
  categoryId?: number;
}

export interface UpdateIncentiveRequest extends Partial<CreateIncentiveRequest> {}

class IncentiveService {

  async createIncentive(data: CreateIncentiveRequest): Promise<Incentive> {
    const response = await api.post<Incentive>(API_ENDPOINTS.INCENTIVES, data);
    return response.data;
  }

  async updateIncentive(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await api.patch<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}`, data);
    return response.data;
  }

  async getIncentive(id: string): Promise<Incentive> {
    const response = await api.get<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}`);
    return response.data;
  }

  async getIncentives(): Promise<Incentive[]> {
    const response = await api.get<Incentive[]>(API_ENDPOINTS.INCENTIVES);
    return response.data;
  }

  async deleteIncentive(id: string): Promise<void> {
    await api.delete(`${API_ENDPOINTS.INCENTIVES}/${id}`);
  }

  async getIncentivesByAuthor(authorId: string): Promise<Incentive[]> {
    const response = await api.get<Incentive[]>(`${API_ENDPOINTS.INCENTIVES}/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 6.2
  async saveDraft(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await api.patch<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Incentive[]> {
    const response = await api.get<Incentive[]>(`${API_ENDPOINTS.INCENTIVES}/drafts/my`);
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateIncentiveRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await api.post<{ success: boolean; lastSaved: string }>(
      `${API_ENDPOINTS.INCENTIVES}/${id}/auto-save`,
      partialData
    );
    return {
      success: response.data.success,
      lastSaved: new Date(response.data.lastSaved)
    };
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await api.get<{ saveable: boolean }>(`${API_ENDPOINTS.INCENTIVES}/${id}/saveable`);
    return response.data.saveable;
  }

  // Publishing methods for Story 6.4
  async publish(id: string): Promise<Incentive> {
    const response = await api.post<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}/publish`);
    return response.data;
  }

  async unpublish(id: string): Promise<Incentive> {
    const response = await api.delete<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}/unpublish`);
    return response.data;
  }

  // Clone method for Story 6.5
  async cloneIncentive(id: string): Promise<Incentive> {
    const response = await api.post<Incentive>(`${API_ENDPOINTS.INCENTIVES}/${id}/clone`);
    return response.data;
  }

  // Public methods (no auth required)
  async getActiveIncentives(): Promise<Incentive[]> {
    const response = await api.get<Incentive[]>(`${API_ENDPOINTS.INCENTIVES}/public/active`);
    return response.data;
  }
}

export const incentiveService = new IncentiveService();
