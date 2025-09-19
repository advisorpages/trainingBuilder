import { api } from './api.service';
import { Category } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  isActive?: boolean;
}

export interface CategoryQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedCategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

class CategoryService {
  private readonly baseUrl = API_ENDPOINTS.CATEGORIES;

  async getCategories(params?: CategoryQueryParams): Promise<PaginatedCategoriesResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedCategoriesResponse>(url);
    return response.data;
  }

  async getActiveCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<Category>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await api.post<Category>(this.baseUrl, data);
    return response.data;
  }

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    const response = await api.patch<Category>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const response = await api.get<UsageCheckResponse>(`${this.baseUrl}/${id}/usage-check`);
    return response.data;
  }
}

export const categoryService = new CategoryService();