import { api } from './api.service';
import { Trainer } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';

export interface CreateTrainerRequest {
  name: string;
  email?: string;
  bio?: string;
}

export interface UpdateTrainerRequest extends Partial<CreateTrainerRequest> {
  isActive?: boolean;
}

export interface TrainerQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedTrainersResponse {
  trainers: Trainer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AvailabilityCheckResponse {
  available: boolean;
}

class TrainerService {
  private readonly baseUrl = API_ENDPOINTS.TRAINERS;

  async getTrainers(params?: TrainerQueryParams): Promise<PaginatedTrainersResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedTrainersResponse>(url);
    return response.data;
  }

  async getActiveTrainers(): Promise<Trainer[]> {
    const response = await api.get<Trainer[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getTrainer(id: number): Promise<Trainer> {
    const response = await api.get<Trainer>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createTrainer(data: CreateTrainerRequest): Promise<Trainer> {
    const response = await api.post<Trainer>(this.baseUrl, data);
    return response.data;
  }

  async updateTrainer(id: number, data: UpdateTrainerRequest): Promise<Trainer> {
    const response = await api.patch<Trainer>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteTrainer(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkAvailability(id: number): Promise<AvailabilityCheckResponse> {
    const response = await api.get<AvailabilityCheckResponse>(
      `${this.baseUrl}/${id}/availability-check`
    );
    return response.data;
  }
}

export const trainerService = new TrainerService();