import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface AIContentIntegrationRequest {
  selectedHeadline?: string;
  selectedDescription?: string;
  selectedKeyBenefits?: string;
  selectedCallToAction?: string;
  selectedSocialMedia?: string;
  selectedEmailCopy?: string;
  overrideExistingTitle?: boolean;
  overrideExistingDescription?: boolean;
  preserveAIContent?: boolean;
}

export interface SessionPreviewData {
  title: string;
  description: string;
  promotionalHeadline?: string;
  promotionalSummary?: string;
  keyBenefits?: string;
  callToAction?: string;
  socialMediaContent?: string;
  emailMarketingContent?: string;
}

export interface SessionPreviewResponse {
  session: any;
  aiContent: any;
  previewData: SessionPreviewData;
}

class AIIntegrationService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Integrate AI content with session fields
  async integrateAIContentToDraft(sessionId: string, request: AIContentIntegrationRequest): Promise<any> {
    try {
      const response = await this.api.post(`/sessions/${sessionId}/integrate-ai-content`, request);
      return response.data;
    } catch (error) {
      console.error('Error integrating AI content to draft:', error);
      throw new Error('Failed to integrate AI content to draft');
    }
  }

  // Get session preview with AI content
  async getSessionPreview(sessionId: string): Promise<SessionPreviewResponse> {
    try {
      const response = await this.api.get(`/sessions/${sessionId}/preview-with-ai`);
      return response.data;
    } catch (error) {
      console.error('Error getting session preview:', error);
      throw new Error('Failed to get session preview');
    }
  }

  // Finalize session draft
  async finalizeSessionDraft(sessionId: string): Promise<any> {
    try {
      const response = await this.api.post(`/sessions/${sessionId}/finalize-draft`);
      return response.data;
    } catch (error) {
      console.error('Error finalizing session draft:', error);
      throw new Error('Failed to finalize session draft');
    }
  }
}

export const aiIntegrationService = new AIIntegrationService();