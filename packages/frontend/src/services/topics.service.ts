import { api } from './api.service';

export interface Topic {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  sessionCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicRequest {
  name: string;
  description?: string;
  tags?: string[];
}

export interface UpdateTopicRequest extends Partial<CreateTopicRequest> {}

class TopicsService {
  private readonly base = '/topics';

  async getTopics(): Promise<Topic[]> {
    const response = await api.get<Topic[]>(this.base);
    return response.data;
  }

  async getTopic(id: string): Promise<Topic> {
    const response = await api.get<Topic>(`${this.base}/${id}`);
    return response.data;
  }

  async createTopic(data: CreateTopicRequest): Promise<Topic> {
    const response = await api.post<Topic>(this.base, data);
    return response.data;
  }

  async updateTopic(id: string, data: UpdateTopicRequest): Promise<Topic> {
    const response = await api.patch<Topic>(`${this.base}/${id}`, data);
    return response.data;
  }

  async deleteTopic(id: string): Promise<{ deleted: boolean; message?: string }> {
    const response = await api.delete<{ deleted: boolean; message?: string }>(`${this.base}/${id}`);
    return response.data;
  }
}

export const topicsService = new TopicsService();
