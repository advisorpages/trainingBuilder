import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface RAGSuggestion {
  content: string;
  score: number;
  source: string;
}

export interface RAGResponse {
  answer: string;
  sources: RAGSuggestion[];
  success: boolean;
}

@Injectable()
export class RAGIntegrationService {
  private readonly logger = new Logger(RAGIntegrationService.name);
  private readonly ragBaseUrl = 'http://100.103.129.72:3000';

  constructor(private readonly httpService: HttpService) {}

  async queryRAGForSessionSuggestions(
    category: string,
    keywords: string[] = [],
    specificTopics = ''
  ): Promise<RAGResponse | null> {
    try {
      const isAvailable = await this.isRAGAvailable();
      if (!isAvailable) {
        this.logger.warn('RAG service is not available, will fallback to database topics');
        return null;
      }

      // Construct query for session building context
      const query = this.buildSessionQuery(category, keywords, specificTopics);

      const response = await firstValueFrom(
        this.httpService.post(`${this.ragBaseUrl}/api/chat`,
          new URLSearchParams({ query }),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000, // 10 second timeout
          }
        )
      );

      return {
        answer: response.data.answer || '',
        sources: response.data.sources || [],
        success: true
      };
    } catch (error) {
      this.logger.error('RAG query failed:', error.message);
      return null;
    }
  }

  async isRAGAvailable(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ragBaseUrl}/api/health`, {
          timeout: 3000, // 3 second timeout for health check
        })
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn('RAG health check failed:', error.message);
      return false;
    }
  }

  private buildSessionQuery(category: string, keywords: string[], specificTopics: string): string {
    const parts = [
      `Category: ${category}`,
      keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : '',
      specificTopics ? `Specific topics to cover: ${specificTopics}` : '',
      'Please suggest relevant training content, topics, and ideas for a financial services training session.'
    ].filter(Boolean);

    return parts.join('. ');
  }
}