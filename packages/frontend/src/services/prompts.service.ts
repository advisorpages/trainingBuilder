import { api } from './api.service';

export interface Prompt {
  id: string;
  name: string;
  category: PromptCategory;
  template: string;
  description?: string;
  variables: string[];
  isActive: boolean;
  version: number;
  exampleInput?: string;
  expectedOutput?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export enum PromptCategory {
  SESSION_GENERATION = 'session_generation',
  TITLE_CREATION = 'title_creation',
  CONTENT_ENHANCEMENT = 'content_enhancement',
  MARKETING_KIT = 'marketing_kit',
  TRAINING_KIT = 'training_kit',
  VALIDATION = 'validation',
}

export interface CreatePromptRequest {
  name: string;
  category: PromptCategory;
  template: string;
  description?: string;
  variables?: string[];
  exampleInput?: string;
  expectedOutput?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdatePromptRequest {
  template?: string;
  description?: string;
  variables?: string[];
  isActive?: boolean;
  exampleInput?: string;
  expectedOutput?: string;
  metadata?: Record<string, unknown>;
}

export interface RenderPromptRequest {
  name: string;
  variables: Record<string, any>;
}

class PromptsService {
  async getAllPrompts(): Promise<Prompt[]> {
    try {
      const response = await api.get('/prompts');
      return response.data as Prompt[];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prompts');
    }
  }

  async getPromptsByCategory(category: PromptCategory): Promise<Prompt[]> {
    try {
      const response = await api.get(`/prompts/category/${category}`);
      return response.data as Prompt[];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prompts by category');
    }
  }

  async getPrompt(name: string): Promise<Prompt> {
    try {
      const response = await api.get(`/prompts/${name}`);
      return response.data as Prompt;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch prompt');
    }
  }

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    try {
      const response = await api.post('/prompts', data);
      return response.data as Prompt;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create prompt');
    }
  }

  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    try {
      const response = await api.put(`/prompts/${id}`, data);
      return response.data as Prompt;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update prompt');
    }
  }

  async deletePrompt(id: string): Promise<void> {
    try {
      await api.delete(`/prompts/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete prompt');
    }
  }

  async renderPrompt(data: RenderPromptRequest): Promise<string> {
    try {
      const response = await api.post('/prompts/render', data);
      return (response.data as any).rendered;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to render prompt');
    }
  }

  async seedDefaultPrompts(): Promise<void> {
    try {
      await api.post('/prompts/seed');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to seed default prompts');
    }
  }

  getCategoryDisplayName(category: PromptCategory): string {
    const names = {
      [PromptCategory.SESSION_GENERATION]: 'Session Generation',
      [PromptCategory.TITLE_CREATION]: 'Title Creation',
      [PromptCategory.CONTENT_ENHANCEMENT]: 'Content Enhancement',
      [PromptCategory.MARKETING_KIT]: 'Marketing Kit',
      [PromptCategory.TRAINING_KIT]: 'Training Kit',
      [PromptCategory.VALIDATION]: 'Validation',
    };
    return names[category] || category;
  }

  extractVariablesFromTemplate(template: string): string[] {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return [...new Set(matches.map(match => {
      return match.replace(/\{\{|\}\}/g, '').trim();
    }))];
  }

  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.trim()) {
      errors.push('Template cannot be empty');
    }

    // Check for unmatched braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push('Unmatched template braces - each {{ must have a corresponding }}');
    }

    // Check for empty variables
    const emptyVars = template.match(/\{\{\s*\}\}/g);
    if (emptyVars) {
      errors.push('Template contains empty variables: {{}}');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const promptsService = new PromptsService();