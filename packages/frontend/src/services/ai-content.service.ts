import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface GeneratedContent {
  type: string;
  content: string;
  metadata?: {
    length: number;
    timestamp: Date;
    model?: string;
  };
}

export interface AIContentResponse {
  contents: GeneratedContent[];
  prompt: string;
  sessionId?: string;
  generatedAt: Date;
  model?: string;
  totalTokensUsed?: number;
  version?: number;
  previousVersions?: AIContentResponse[];
}

export interface ContentGenerationRequest {
  prompt: string;
  sessionData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    audience?: { name: string };
    tone?: { name: string };
    category?: { name: string };
    topics?: { name: string }[];
    maxRegistrations: number;
  };
  contentTypes?: string[];
}

export interface ContentRegenerationRequest {
  prompt: string;
  sessionData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    audience?: { name: string };
    tone?: { name: string };
    category?: { name: string };
    topics?: { name: string }[];
    maxRegistrations: number;
  };
  contentTypes: string[];
  userFeedback?: string;
  regenerationParameters?: {
    tone?: string;
    length?: 'shorter' | 'longer' | 'same';
    focus?: string;
    style?: string;
  };
  previousContent?: GeneratedContent[];
}

class AIContentService {
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
        const token = localStorage.getItem('accessToken');
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
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generate AI content from prompt and session data
  async generateContent(request: ContentGenerationRequest): Promise<AIContentResponse> {
    try {
      const response = await this.api.post('/ai/generate-content', request);
      return response.data;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // Regenerate specific content types with user feedback
  async regenerateContent(request: ContentRegenerationRequest): Promise<AIContentResponse> {
    try {
      const response = await this.api.post('/ai/regenerate-content', request);
      return response.data;
    } catch (error) {
      console.error('Error regenerating AI content:', error);
      throw new Error('Failed to regenerate AI content');
    }
  }

  // Save generated content to session
  async saveContentToSession(sessionId: string, content: AIContentResponse): Promise<void> {
    try {
      const contentString = JSON.stringify(content);
      await this.api.post(`/sessions/${sessionId}/content`, { content: contentString });
    } catch (error) {
      console.error('Error saving content to session:', error);
      throw new Error('Failed to save content to session');
    }
  }

  // Get saved content from session
  async getSessionContent(sessionId: string): Promise<{ content: string | null; hasContent: boolean }> {
    try {
      const response = await this.api.get(`/sessions/${sessionId}/content`);
      return response.data;
    } catch (error) {
      console.error('Error getting session content:', error);
      throw new Error('Failed to get session content');
    }
  }

  // Parse saved content string back to AIContentResponse
  parseSavedContent(contentString: string): AIContentResponse | null {
    try {
      return JSON.parse(contentString);
    } catch (error) {
      console.error('Error parsing saved content:', error);
      return null;
    }
  }

  // Clear generated content from session
  async clearSessionContent(sessionId: string): Promise<void> {
    try {
      await this.api.delete(`/sessions/${sessionId}/content`);
    } catch (error) {
      console.error('Error clearing session content:', error);
      throw new Error('Failed to clear session content');
    }
  }

  // Get sessions with generated content
  async getSessionsWithContent(): Promise<any[]> {
    try {
      const response = await this.api.get('/sessions/content/ready');
      return response.data;
    } catch (error) {
      console.error('Error getting sessions with content:', error);
      throw new Error('Failed to get sessions with content');
    }
  }

  // Get content versions for comparison and restoration
  async getContentVersions(sessionId: string): Promise<{ versions: any[]; hasVersions: boolean }> {
    try {
      const response = await this.api.get(`/sessions/${sessionId}/content/versions`);
      return response.data;
    } catch (error) {
      console.error('Error getting content versions:', error);
      throw new Error('Failed to get content versions');
    }
  }

  // Restore a specific content version
  async restoreContentVersion(sessionId: string, versionIndex: number): Promise<void> {
    try {
      await this.api.post(`/sessions/${sessionId}/content/restore/${versionIndex}`);
    } catch (error) {
      console.error('Error restoring content version:', error);
      throw new Error('Failed to restore content version');
    }
  }

  // Get available content types
  getAvailableContentTypes(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'headline', label: 'Headlines', icon: '📰' },
      { value: 'description', label: 'Description', icon: '📝' },
      { value: 'social_media', label: 'Social Media', icon: '📱' },
      { value: 'email_copy', label: 'Email Copy', icon: '📧' },
      { value: 'key_benefits', label: 'Key Benefits', icon: '⭐' },
      { value: 'call_to_action', label: 'Call to Action', icon: '🎯' }
    ];
  }
}

export const aiContentService = new AIContentService();