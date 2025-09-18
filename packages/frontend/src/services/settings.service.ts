import { api } from './api.service';
import { SystemSetting, SettingDataType } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

export interface CreateSettingRequest {
  key: string;
  value: string;
  description?: string;
  category?: string;
  dataType: SettingDataType;
  defaultValue?: string;
}

export interface UpdateSettingRequest {
  value?: string;
  description?: string;
  category?: string;
  dataType?: SettingDataType;
  defaultValue?: string;
}

export interface SettingQueryParams {
  search?: string;
  category?: string;
  dataType?: SettingDataType;
  page?: number;
  limit?: number;
}

export interface PaginatedSettingsResponse {
  settings: SystemSetting[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class SettingsService {
  private readonly baseUrl = API_ENDPOINTS.SETTINGS;

  async getSettings(params?: SettingQueryParams): Promise<PaginatedSettingsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedSettingsResponse>(url);
    return response.data;
  }

  async getSetting(key: string): Promise<SystemSetting> {
    const response = await api.get<SystemSetting>(`${this.baseUrl}/${key}`);
    return response.data;
  }

  async getSettingValue(key: string): Promise<any> {
    const response = await api.get<{ key: string; value: any }>(`${this.baseUrl}/${key}/value`);
    return response.data.value;
  }

  async getCategories(): Promise<string[]> {
    const response = await api.get<{ categories: string[] }>(`${this.baseUrl}/categories`);
    return response.data.categories;
  }

  async getSettingsByCategory(category: string): Promise<SystemSetting[]> {
    const response = await api.get<SystemSetting[]>(`${this.baseUrl}/category/${category}`);
    return response.data;
  }

  async createSetting(data: CreateSettingRequest): Promise<SystemSetting> {
    const response = await api.post<SystemSetting>(this.baseUrl, data);
    return response.data;
  }

  async updateSetting(key: string, data: UpdateSettingRequest): Promise<SystemSetting> {
    const response = await api.patch<SystemSetting>(`${this.baseUrl}/${key}`, data);
    return response.data;
  }

  async deleteSetting(key: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${key}`);
  }

  async resetToDefault(key: string): Promise<SystemSetting> {
    const response = await api.patch<SystemSetting>(`${this.baseUrl}/${key}/reset`);
    return response.data;
  }

  async bulkUpdate(updates: Record<string, string>): Promise<SystemSetting[]> {
    const response = await api.post<SystemSetting[]>(`${this.baseUrl}/bulk-update`, updates);
    return response.data;
  }

  // Helper method to parse value based on data type
  parseSettingValue(setting: SystemSetting): any {
    switch (setting.dataType) {
      case SettingDataType.NUMBER:
        return parseFloat(setting.value);
      case SettingDataType.BOOLEAN:
        return setting.value.toLowerCase() === 'true';
      case SettingDataType.JSON:
        try {
          return JSON.parse(setting.value);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  }

  // Helper method to format value for display
  formatSettingValue(setting: SystemSetting): string {
    switch (setting.dataType) {
      case SettingDataType.JSON:
        try {
          return JSON.stringify(JSON.parse(setting.value), null, 2);
        } catch {
          return setting.value;
        }
      default:
        return setting.value;
    }
  }
}

export const settingsService = new SettingsService();