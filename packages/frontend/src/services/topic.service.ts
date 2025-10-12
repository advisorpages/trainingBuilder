import { api } from './api.service';
import { Topic, TopicAIContent } from '@leadership-training/shared';

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
  private readonly baseUrl = '/topics';

  async getTopics(params?: TopicQueryParams): Promise<PaginatedTopicsResponse> {
    const response = await api.get<Topic[]>(this.baseUrl);
    let topics = response.data.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    if (params?.isActive !== undefined) {
      topics = topics.filter(topic => topic.isActive === params.isActive);
    }

    if (params?.search) {
      const search = params.search.toLowerCase();
      topics = topics.filter(topic =>
        topic.name.toLowerCase().includes(search) ||
        (topic.description ? topic.description.toLowerCase().includes(search) : false)
      );
    }

    const total = topics.length;
    const limit = Math.max(params?.limit && params.limit > 0 ? params.limit : 20, 1);
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
    const requestedPage = params?.page && params.page > 0 ? params.page : 1;
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * limit;
    const paginatedTopics = topics.slice(start, start + limit);

    return {
      topics: paginatedTopics,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getActiveTopics(): Promise<Topic[]> {
    const response = await api.get<Topic[]>(this.baseUrl);
    return response.data.filter(topic => topic.isActive);
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
