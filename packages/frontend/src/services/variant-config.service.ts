import { api } from './api.service';

export interface VariantConfig {
  id: string;
  variantIndex: number;
  label: string;
  description: string;
  instruction: string;
  isActive: boolean;
  version: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateVariantConfigRequest {
  label?: string;
  description?: string;
  instruction?: string;
  isActive?: boolean;
}

class VariantConfigService {
  private readonly baseUrl = '/variant-configs';

  async getAllVariantConfigs(): Promise<VariantConfig[]> {
    const response = await api.get<VariantConfig[]>(this.baseUrl);
    return response.data;
  }

  async getVariantConfig(id: string): Promise<VariantConfig> {
    const response = await api.get<VariantConfig>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async updateVariantConfig(id: string, data: UpdateVariantConfigRequest): Promise<VariantConfig> {
    const response = await api.patch<VariantConfig>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }
}

export const variantConfigService = new VariantConfigService();
