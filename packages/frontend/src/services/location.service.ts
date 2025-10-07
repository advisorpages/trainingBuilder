import { api } from './api.service';
import { Location } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';

export interface CreateLocationRequest {
  name: string;
  description?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  isActive?: boolean;
}

export interface LocationQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedLocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

class LocationService {
  private readonly baseUrl = API_ENDPOINTS.LOCATIONS;

  async getLocations(params?: LocationQueryParams): Promise<PaginatedLocationsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedLocationsResponse>(url);
    return response.data;
  }

  async getActiveLocations(): Promise<Location[]> {
    const response = await api.get<Location[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getLocation(id: number): Promise<Location> {
    const response = await api.get<Location>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createLocation(data: CreateLocationRequest): Promise<Location> {
    const response = await api.post<Location>(this.baseUrl, data);
    return response.data;
  }

  async updateLocation(id: number, data: UpdateLocationRequest): Promise<Location> {
    const response = await api.patch<Location>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const response = await api.get<UsageCheckResponse>(`${this.baseUrl}/${id}/usage-check`);
    return response.data;
  }
}

export const locationService = new LocationService();