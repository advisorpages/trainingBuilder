import { api } from './api.service';
import { Topic, TopicAIContent } from '@leadership-training/shared';

export interface CreateTopicRequest {
  name: string;
  description?: string;
  categoryId?: number;
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

  async bulkDeleteTopics(ids: number[]): Promise<{ success: number[]; failed: number[] }> {
    const results = { success: [] as number[], failed: [] as number[] };

    // Delete topics one by one to handle individual failures gracefully
    for (const id of ids) {
      try {
        await api.delete(`${this.baseUrl}/${id}`);
        results.success.push(id);
      } catch (error) {
        console.error(`Failed to delete topic ${id}:`, error);
        results.failed.push(id);
      }
    }

    return results;
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

  // New methods for improved topics page layout
  async getRecentTopics(
    limit: number = 5,
    options?: { includeInactive?: boolean }
  ): Promise<Topic[]> {
    const response = await api.get<Topic[]>(this.baseUrl);
    let topics = response.data;

    if (!options?.includeInactive) {
      topics = topics.filter(topic => topic.isActive);
    }

    // Sort by createdAt descending (most recent first)
    topics.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return topics.slice(0, limit);
  }

  async getTopicsGroupedByCategory(
    options?: { includeInactive?: boolean }
  ): Promise<Record<string, Topic[]>> {
    const response = await api.get<Topic[]>(this.baseUrl);
    let topics = response.data;

    if (!options?.includeInactive) {
      topics = topics.filter(topic => topic.isActive);
    }

    // Group by category
    const groupedTopics: Record<string, Topic[]> = {};

    topics.forEach(topic => {
      const categoryName = topic.category?.name || 'Uncategorized';
      if (!groupedTopics[categoryName]) {
        groupedTopics[categoryName] = [];
      }
      groupedTopics[categoryName].push(topic);
    });

    // Sort topics within each category by createdAt descending
    Object.keys(groupedTopics).forEach(categoryName => {
      groupedTopics[categoryName].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    const sortedEntries = Object.entries(groupedTopics).sort(([, topicsA], [, topicsB]) => {
      const latestA = topicsA.length > 0 ? new Date(topicsA[0].createdAt).getTime() : 0;
      const latestB = topicsB.length > 0 ? new Date(topicsB[0].createdAt).getTime() : 0;
      return latestB - latestA;
    });

    return sortedEntries.reduce<Record<string, Topic[]>>((acc, [categoryName, grouped]) => {
      acc[categoryName] = grouped;
      return acc;
    }, {});
  }
}

export const topicService = new TopicService();
