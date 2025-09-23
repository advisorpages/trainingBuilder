import { api } from './api.service';
import { Topic, TopicAIContent } from '@leadership-training/shared';
import { API_ENDPOINTS } from '@leadership-training/shared';

export interface CreateTopicRequest {
  name: string;
  description?: string;
  // AI Enhancement Fields
  aiGeneratedContent?: TopicAIContent;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
}

export interface UpdateTopicRequest extends Partial<CreateTopicRequest> {
  isActive?: boolean;
}

export interface TopicQueryParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedTopicsResponse {
  topics: Topic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
}

class TopicService {
  private readonly baseUrl = API_ENDPOINTS.TOPICS;

  async getTopics(params?: TopicQueryParams): Promise<PaginatedTopicsResponse> {
    const queryString = params ? new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString() : '';

    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    const response = await api.get<PaginatedTopicsResponse>(url);
    return response.data;
  }

  async getActiveTopics(): Promise<Topic[]> {
    const response = await api.get<Topic[]>(`${this.baseUrl}/active`);
    return response.data;
  }

  async getTopic(id: number): Promise<Topic> {
    const response = await api.get<Topic>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async createTopic(data: CreateTopicRequest): Promise<Topic> {
    const response = await api.post<Topic>(this.baseUrl, data);
    return response.data;
  }

  async updateTopic(id: number, data: UpdateTopicRequest): Promise<Topic> {
    const response = await api.patch<Topic>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async deleteTopic(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const response = await api.get<UsageCheckResponse>(`${this.baseUrl}/${id}/usage-check`);
    return response.data;
  }

  // AI Enhancement Methods
  async createTopicWithAI(data: CreateTopicRequest): Promise<Topic> {
    const response = await api.post<Topic>(`${this.baseUrl}/with-ai`, data);
    return response.data;
  }

  async getTopicAIContent(id: number): Promise<TopicAIContent | null> {
    try {
      const response = await api.get<{ aiContent: TopicAIContent }>(`${this.baseUrl}/${id}/ai-content`);
      return response.data.aiContent;
    } catch (error) {
      return null;
    }
  }

  async updateTopicAI(id: number, aiContent: TopicAIContent): Promise<Topic> {
    const response = await api.put<Topic>(`${this.baseUrl}/${id}/ai-content`, { aiContent });
    return response.data;
  }
}

export const topicService = new TopicService();