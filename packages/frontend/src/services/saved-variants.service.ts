import { api } from './api.service';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

export interface CreateSavedVariantData {
  variantId: string;
  outline: any;
  title: string;
  description?: string;
  categoryId?: string;
  sessionType?: string;
  totalDuration?: number;
  ragWeight?: number;
  ragSourcesUsed?: number;
  ragSources?: any[];
  generationSource?: 'rag' | 'baseline' | 'ai';
  variantLabel: string;
  metadata?: any;
  tags?: string[];
  collectionName?: string;
}

export interface UpdateSavedVariantData {
  title?: string;
  description?: string;
  tags?: string[];
  collectionName?: string;
  isFavorite?: boolean;
  order?: number;
}

export interface SavedVariantsListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastUsedAt' | 'usageCount' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  categoryId?: string;
  collectionName?: string;
  isFavorite?: boolean;
  tags?: string[];
  search?: string;
}

export interface SavedVariantsListResult {
  savedVariants: SavedVariant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SavedVariant {
  id: string;
  userId: string;
  variantId: string;
  outline: any;
  title: string;
  description?: string;
  categoryId?: string;
  sessionType?: string;
  totalDuration: number;
  ragWeight: number;
  ragSourcesUsed: number;
  ragSources?: any[];
  generationSource: 'rag' | 'baseline' | 'ai';
  variantLabel: string;
  metadata?: any;
  isFavorite: boolean;
  tags: string[];
  collectionName?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  usageCount: number;
}

export interface SavedVariantStatistics {
  totalSaved: number;
  totalUsage: number;
  favoriteCount: number;
  collectionCount: number;
  recentlyUsed: number;
}

class SavedVariantsService {
  private readonly basePath = `${API_BASE_URL}/saved-variants`;

  /**
   * Create a new saved variant
   */
  async createSavedVariant(data: CreateSavedVariantData): Promise<SavedVariant> {
    const response = await api.post<SavedVariant>(this.basePath, data);
    return response.data;
  }

  /**
   * Get user's saved variants with filtering and pagination
   */
  async getSavedVariants(options: SavedVariantsListOptions = {}): Promise<SavedVariantsListResult> {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.categoryId) params.append('categoryId', options.categoryId);
    if (options.collectionName) params.append('collectionName', options.collectionName);
    if (typeof options.isFavorite === 'boolean') params.append('isFavorite', options.isFavorite.toString());
    if (options.tags?.length) params.append('tags', options.tags.join(','));
    if (options.search) params.append('search', options.search);

    const response = await api.get<SavedVariantsListResult>(`${this.basePath}?${params}`);
    return response.data;
  }

  /**
   * Get a saved variant by ID
   */
  async getSavedVariantById(id: string): Promise<SavedVariant> {
    const response = await api.get<SavedVariant>(`${this.basePath}/${id}`);
    return response.data;
  }

  /**
   * Update a saved variant
   */
  async updateSavedVariant(id: string, data: UpdateSavedVariantData): Promise<SavedVariant> {
    const response = await api.patch<SavedVariant>(`${this.basePath}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a saved variant
   */
  async deleteSavedVariant(id: string): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Record usage of a saved variant
   */
  async recordUsage(id: string): Promise<SavedVariant> {
    const response = await api.post<SavedVariant>(`${this.basePath}/${id}/usage`);
    return response.data;
  }

  /**
   * Reorder saved variants within a collection
   */
  async reorderVariants(variantIds: string[], collectionName?: string): Promise<void> {
    await api.post(`${this.basePath}/reorder`, { variantIds, collectionName });
  }

  /**
   * Get user's collections
   */
  async getCollections(): Promise<string[]> {
    const response = await api.get<string[]>(`${this.basePath}/collections`);
    return response.data;
  }

  /**
   * Get user's tags
   */
  async getTags(): Promise<string[]> {
    const response = await api.get<string[]>(`${this.basePath}/tags`);
    return response.data;
  }

  /**
   * Get saved variants statistics
   */
  async getStatistics(): Promise<SavedVariantStatistics> {
    const response = await api.get<SavedVariantStatistics>(`${this.basePath}/statistics`);
    return response.data;
  }
}

export const savedVariantsService = new SavedVariantsService();