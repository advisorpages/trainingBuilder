import axios from 'axios';
import { Incentive } from '@leadership-training/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
  private api = axios.create({
    baseURL: `${API_BASE_URL}/incentives`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async createIncentive(data: CreateIncentiveRequest): Promise<Incentive> {
    const response = await this.api.post('/', data);
    return response.data;
  }

  async updateIncentive(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await this.api.patch(`/${id}`, data);
    return response.data;
  }

  async getIncentive(id: string): Promise<Incentive> {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  async getIncentives(): Promise<Incentive[]> {
    const response = await this.api.get('/');
    return response.data;
  }

  async deleteIncentive(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  async getIncentivesByAuthor(authorId: string): Promise<Incentive[]> {
    const response = await this.api.get(`/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 6.2
  async saveDraft(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await this.api.patch(`/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Incentive[]> {
    const response = await this.api.get('/drafts/my');
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateIncentiveRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await this.api.post(`/${id}/auto-save`, partialData);
    return response.data;
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await this.api.get(`/${id}/saveable`);
    return response.data.saveable;
  }

  // Publishing methods for Story 6.4
  async publish(id: string): Promise<Incentive> {
    const response = await this.api.post(`/${id}/publish`);
    return response.data;
  }

  async unpublish(id: string): Promise<Incentive> {
    const response = await this.api.delete(`/${id}/unpublish`);
    return response.data;
  }

  // Public methods (no auth required)
  async getActiveIncentives(): Promise<Incentive[]> {
    const response = await axios.get(`${API_BASE_URL}/incentives/public/active`);
    return response.data;
  }
}

export const incentiveService = new IncentiveService();
