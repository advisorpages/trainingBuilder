import { api } from './api.service';
import { Audience, Tone, Category, Topic } from '@leadership-training/shared';

class AttributesService {
  async getAudiences(): Promise<Audience[]> {
    const response = await api.get<Audience[]>('/audiences');
    return response.data;
  }

  async getTones(): Promise<Tone[]> {
    const response = await api.get<Tone[]>('/tones');
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  }

  async getTopics(): Promise<Topic[]> {
    const response = await api.get<Topic[]>('/topics');
    return response.data;
  }

  async getAudience(id: number): Promise<Audience> {
    const response = await api.get<Audience>(`/audiences/${id}`);
    return response.data;
  }

  async getTone(id: number): Promise<Tone> {
    const response = await api.get<Tone>(`/tones/${id}`);
    return response.data;
  }

  async getCategory(id: number): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  }

  async getTopic(id: number): Promise<Topic> {
    const response = await api.get<Topic>(`/topics/${id}`);
    return response.data;
  }
}

export const attributesService = new AttributesService();