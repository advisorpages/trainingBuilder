import axios from 'axios';
import { Incentive } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  private api = api;

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
    const response = await this.api.post(API_ENDPOINTS.INCENTIVES, data);
    return response.data;
  }

  async updateIncentive(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await this.api.patch(`${API_ENDPOINTS.INCENTIVES}/${id}`, data);
    return response.data;
  }

  async getIncentive(id: string): Promise<Incentive> {
    const response = await this.api.get(`${API_ENDPOINTS.INCENTIVES}/${id}`);
    return response.data;
  }

  async getIncentives(): Promise<Incentive[]> {
    const response = await this.api.get(API_ENDPOINTS.INCENTIVES);
    return response.data;
  }

  async deleteIncentive(id: string): Promise<void> {
    await this.api.delete(`${API_ENDPOINTS.INCENTIVES}/${id}`);
  }

  async getIncentivesByAuthor(authorId: string): Promise<Incentive[]> {
    const response = await this.api.get(`${API_ENDPOINTS.INCENTIVES}/author/${authorId}`);
    return response.data;
  }

  // Draft-specific methods for Story 6.2
  async saveDraft(id: string, data: UpdateIncentiveRequest): Promise<Incentive> {
    const response = await this.api.patch(`${API_ENDPOINTS.INCENTIVES}/${id}/draft`, data);
    return response.data;
  }

  async getMyDrafts(): Promise<Incentive[]> {
    const response = await this.api.get(`${API_ENDPOINTS.INCENTIVES}/drafts/my`);
    return response.data;
  }

  async autoSaveDraft(id: string, partialData: Partial<UpdateIncentiveRequest>): Promise<{ success: boolean; lastSaved: Date }> {
    const response = await this.api.post(`${API_ENDPOINTS.INCENTIVES}/${id}/auto-save`, partialData);
    return response.data;
  }

  async isDraftSaveable(id: string): Promise<boolean> {
    const response = await this.api.get(`${API_ENDPOINTS.INCENTIVES}/${id}/saveable`);
    return response.data.saveable;
  }

  // Publishing methods for Story 6.4
  async publish(id: string): Promise<Incentive> {
    const response = await this.api.post(`${API_ENDPOINTS.INCENTIVES}/${id}/publish`);
    return response.data;
  }

  async unpublish(id: string): Promise<Incentive> {
    const response = await this.api.delete(`${API_ENDPOINTS.INCENTIVES}/${id}/unpublish`);
    return response.data;
  }

  // Public methods (no auth required)
  async getActiveIncentives(): Promise<Incentive[]> {
    const response = await api.get(`${API_ENDPOINTS.INCENTIVES}/public/active`);
    return response.data;
  }
}

export const incentiveService = new IncentiveService();