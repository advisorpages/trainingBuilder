import axios from 'axios';
import { Audience, Tone, Category, Topic } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
  category: 'session_content' | 'marketing_copy' | 'trainer_guide';
}

export interface GeneratedPrompt {
  id: string;
  sessionId: string;
  templateId: string;
  prompt: string;
  variables: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptGenerationRequest {
  templateId: string;
  sessionData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    audience?: Audience;
    tone?: Tone;
    category?: Category;
    topics?: Topic[];
    maxRegistrations: number;
  };
  customVariables?: Record<string, any>;
}

// Built-in prompt templates
// Templates are now loaded from backend - this is kept for fallback only
const FALLBACK_TEMPLATES: PromptTemplate[] = [
  {
    id: 'session-marketing-copy',
    name: 'Complete Marketing Campaign',
    description: 'Generate comprehensive promotional content for session marketing and landing pages',
    category: 'marketing_copy',
    template: 'Fallback template - please check backend connection',
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'category', 'topics', 'maxRegistrations']
  },
  {
    id: 'trainer-preparation-guide',
    name: 'Trainer Preparation Guide',
    description: 'Generate a comprehensive preparation guide for trainers',
    category: 'trainer_guide',
    template: 'Fallback template - please check backend connection',
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'topics', 'maxRegistrations']
  },
  {
    id: 'session-content-outline',
    name: 'Session Content Outline',
    description: 'Generate a detailed content outline and structure',
    category: 'session_content',
    template: 'Fallback template - please check backend connection',
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'topics', 'maxRegistrations']
  }
];

class AIPromptService {
  private api = api;

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

  // Generate a prompt using the backend AI service
  async generatePrompt(request: PromptGenerationRequest): Promise<string> {
    try {
      const response = await this.api.post(`${API_ENDPOINTS.AI}/generate-prompt`, request);
      return response.data.prompt;
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Fallback to local generation
      return this.generatePromptLocally(request);
    }
  }

  // Local fallback prompt generation
  private generatePromptLocally(request: PromptGenerationRequest): string {
    const template = FALLBACK_TEMPLATES.find(t => t.id === request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    let prompt = template.template;
    const { sessionData } = request;

    // Calculate duration
    const duration = this.calculateDuration(sessionData.startTime, sessionData.endTime);

    // Prepare variables for substitution
    const variables = {
      title: sessionData.title || 'Untitled Session',
      description: sessionData.description || 'No description provided',
      duration: duration,
      audience: sessionData.audience?.name || 'General audience',
      tone: sessionData.tone?.name || 'Professional',
      category: sessionData.category?.name || 'Leadership',
      topics: sessionData.topics?.map(t => t.name).join(', ') || 'General leadership topics',
      maxRegistrations: sessionData.maxRegistrations.toString(),
      ...request.customVariables
    };

    // Replace variables in template
    template.variables.forEach(variable => {
      const value = (variables as any)[variable] || `[${variable}]`;
      const regex = new RegExp(`\\{${variable}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  // Get all available templates from backend
  async getTemplates(): Promise<PromptTemplate[]> {
    try {
      const response = await this.api.get(`${API_ENDPOINTS.AI}/templates`);
      return response.data.map((template: any) => ({
        ...template,
        template: '', // Template content not needed on frontend
        variables: template.variables || this.getTemplateVariables(template.id),
        category: template.category || this.getTemplateCategory(template.id)
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to local templates
      return FALLBACK_TEMPLATES;
    }
  }

  // Get local templates (synchronous fallback)
  getLocalTemplates(): PromptTemplate[] {
    return FALLBACK_TEMPLATES;
  }

  // Helper method to get template variables (fallback)
  private getTemplateVariables(templateId: string): string[] {
    const fallbackTemplate = FALLBACK_TEMPLATES.find(t => t.id === templateId);
    return fallbackTemplate?.variables || [];
  }

  // Helper method to get template category (fallback)
  private getTemplateCategory(templateId: string): PromptTemplate['category'] {
    const fallbackTemplate = FALLBACK_TEMPLATES.find(t => t.id === templateId);
    return fallbackTemplate?.category || 'session_content';
  }

  // Get templates by category
  async getTemplatesByCategory(category: PromptTemplate['category']): Promise<PromptTemplate[]> {
    const templates = await this.getAvailableTemplates();
    return templates.filter(t => t.category === category);
  }

  // Get a specific template
  async getTemplate(id: string): Promise<PromptTemplate | undefined> {
    const templates = await this.getAvailableTemplates();
    return templates.find(t => t.id === id);
  }

  // Validate prompt variables
  async validatePromptVariables(templateId: string, variables: Record<string, any>): Promise<string[]> {
    const template = await this.getTemplate(templateId);
    if (!template) {
      return ['Template not found'];
    }

    const errors: string[] = [];
    template.variables.forEach(variable => {
      if (!variables[variable] || variables[variable].toString().trim() === '') {
        errors.push(`Missing required variable: ${variable}`);
      }
    });

    return errors;
  }

  // Helper method to calculate session duration
  private calculateDuration(startTime: Date, endTime: Date): string {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      return `${diffMinutes} minutes`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.round((diffHours - hours) * 60);
      return minutes > 0 ? `${hours} hours ${minutes} minutes` : `${hours} hours`;
    } else {
      const days = Math.floor(diffHours / 24);
      const remainingHours = Math.floor(diffHours % 24);
      return remainingHours > 0 ? `${days} days ${remainingHours} hours` : `${days} days`;
    }
  }

  // Preview prompt with current data (for UI preview)
  previewPrompt(templateId: string, sessionData: any): string {
    try {
      return this.generatePromptLocally({
        templateId,
        sessionData,
        customVariables: {}
      });
    } catch (error) {
      return `Error generating preview: ${(error as Error).message}`;
    }
  }
}

export const aiPromptService = new AIPromptService();