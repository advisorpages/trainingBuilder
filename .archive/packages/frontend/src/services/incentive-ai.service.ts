import { api } from './api.service';

export interface IncentiveAIData {
  title: string;
  description?: string;
  rules?: string;
  startDate: Date;
  endDate: Date;
  audience?: { name: string };
  tone?: { name: string };
  category?: { name: string };
}

export interface IncentiveGeneratedContent {
  title: string;
  shortDescription: string;
  longDescription: string;
  rulesText: string;
  socialCopy: string;
  emailCopy: string;
}

export interface IncentiveAIContentResponse {
  content: IncentiveGeneratedContent;
  incentiveId?: string;
  generatedAt: Date;
  model?: string;
  totalTokensUsed?: number;
  version?: number;
}

class IncentiveAIService {
  async generateContent(incentiveData: IncentiveAIData): Promise<IncentiveAIContentResponse> {
    try {
      const response = await api.post<IncentiveAIContentResponse>('/ai/generate-incentive-content', {
        incentiveData,
        contentTypes: ['title', 'shortDescription', 'longDescription', 'rulesText', 'socialCopy', 'emailCopy']
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate incentive AI content:', error);

      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid incentive data for AI generation');
      }

      if (error.response?.status === 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }

      throw new Error('Failed to generate AI content. Please check your connection and try again.');
    }
  }

  async validateForAI(incentiveData: Partial<IncentiveAIData>): Promise<{ isValid: boolean; missingFields: string[] }> {
    const missingFields: string[] = [];

    if (!incentiveData.title?.trim()) {
      missingFields.push('title');
    }

    if (!incentiveData.startDate) {
      missingFields.push('startDate');
    }

    if (!incentiveData.endDate) {
      missingFields.push('endDate');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  formatFieldName(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'title': 'Incentive Title',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'description': 'Description',
      'rules': 'Rules & Conditions'
    };

    return fieldMap[fieldName] || fieldName;
  }
}

export const incentiveAIService = new IncentiveAIService();