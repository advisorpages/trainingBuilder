import axios from 'axios';
import { Audience, Tone, Category, Topic } from '../../../shared/src/types';
import { API_ENDPOINTS } from '../../../shared/src/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
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
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'session-marketing-copy',
    name: 'Session Marketing Copy',
    description: 'Generate compelling marketing copy for session promotion',
    category: 'marketing_copy',
    template: `You are an expert marketing copywriter specializing in leadership training and professional development. Create compelling marketing copy for the following training session:

**Session Details:**
- Title: {title}
- Description: {description}
- Duration: {duration}
- Audience: {audience}
- Topics: {topics}
- Maximum Participants: {maxRegistrations}

**Tone & Style:**
- Target Tone: {tone}
- Category: {category}

**Requirements:**
1. Create an engaging session title (if the current one needs improvement)
2. Write a compelling 2-3 paragraph description that:
   - Highlights key benefits and learning outcomes
   - Appeals to the target audience
   - Uses the specified tone
   - Creates urgency and desire to attend
3. Generate 3-5 key bullet points of what attendees will learn
4. Create a clear call-to-action
5. Suggest relevant hashtags for social media promotion

**Output Format:**
Please structure your response as:
- **Enhanced Title:** [title]
- **Description:** [2-3 paragraphs]
- **Key Learning Outcomes:** [bullet points]
- **Call to Action:** [single compelling sentence]
- **Hashtags:** [3-5 relevant hashtags]

Focus on benefits over features, use active voice, and make it irresistible to the target audience.`,
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'category', 'topics', 'maxRegistrations']
  },
  {
    id: 'trainer-preparation-guide',
    name: 'Trainer Preparation Guide',
    description: 'Generate a comprehensive preparation guide for trainers',
    category: 'trainer_guide',
    template: `You are an expert trainer development specialist. Create a comprehensive preparation guide for a trainer delivering the following leadership training session:

**Session Information:**
- Title: {title}
- Description: {description}
- Duration: {duration}
- Audience: {audience}
- Topics: {topics}
- Maximum Participants: {maxRegistrations}
- Tone: {tone}

**Create a trainer preparation guide that includes:**

1. **Session Overview & Objectives**
   - Clear learning objectives
   - Success metrics for the session

2. **Audience Analysis**
   - Key characteristics of {audience}
   - Common challenges they face
   - Motivations and goals
   - Preferred learning styles

3. **Content Preparation**
   - Key concepts to emphasize for each topic: {topics}
   - Real-world examples and case studies relevant to {audience}
   - Interactive elements and engagement strategies
   - Potential discussion questions

4. **Facilitation Tips**
   - How to maintain {tone} throughout the session
   - Techniques for managing group dynamics with {maxRegistrations} participants
   - Handling difficult questions or resistant participants
   - Energy management for {duration} session

5. **Materials & Setup**
   - Required materials and handouts
   - Room setup recommendations
   - Technology requirements
   - Backup plans for technical issues

6. **Timing & Flow**
   - Suggested agenda breakdown
   - Key transition points
   - Time buffers for discussions

Provide practical, actionable advice that will help the trainer deliver an exceptional experience.`,
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'topics', 'maxRegistrations']
  },
  {
    id: 'session-content-outline',
    name: 'Session Content Outline',
    description: 'Generate a detailed content outline and structure',
    category: 'session_content',
    template: `You are an expert instructional designer specializing in leadership development. Create a comprehensive content outline for the following training session:

**Session Parameters:**
- Title: {title}
- Description: {description}
- Duration: {duration}
- Target Audience: {audience}
- Focus Areas: {topics}
- Tone: {tone}
- Participant Limit: {maxRegistrations}

**Deliverables Needed:**

1. **Learning Objectives** (3-5 SMART objectives)
   - What participants will be able to DO after the session
   - Measurable outcomes aligned with {topics}

2. **Session Structure** (detailed timeline)
   - Opening (engagement hook, introductions)
   - Main content blocks for each topic
   - Interactive elements and activities
   - Breaks and transitions
   - Closing and next steps

3. **Content Modules** for each topic in {topics}:
   - Key concepts and frameworks
   - Real-world applications
   - Interactive exercises or discussions
   - Assessment or reflection opportunities

4. **Engagement Strategies**
   - Activities suitable for {maxRegistrations} participants
   - Methods to maintain {tone}
   - Techniques to address {audience} needs
   - Technology integration opportunities

5. **Materials & Resources**
   - Handouts and worksheets
   - Visual aids and presentations
   - Reference materials for follow-up

6. **Assessment & Follow-up**
   - Methods to measure learning achievement
   - Action planning templates
   - Resources for continued development

Design this as a complete facilitation guide that any qualified trainer could use to deliver an impactful {duration} session.`,
    variables: ['title', 'description', 'duration', 'audience', 'tone', 'topics', 'maxRegistrations']
  }
];

class AIPromptService {
  private api = api;

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
    const template = PROMPT_TEMPLATES.find(t => t.id === request.templateId);
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
        variables: this.getTemplateVariables(template.id),
        category: this.getTemplateCategory(template.id)
      }));
    } catch (error) {
      console.error('Error fetching templates:', error);
      // Fallback to local templates
      return PROMPT_TEMPLATES;
    }
  }

  // Get local templates (synchronous fallback)
  getLocalTemplates(): PromptTemplate[] {
    return PROMPT_TEMPLATES;
  }

  // Get templates by category
  getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return PROMPT_TEMPLATES.filter(t => t.category === category);
  }

  // Get a specific template
  getTemplate(id: string): PromptTemplate | undefined {
    return PROMPT_TEMPLATES.find(t => t.id === id);
  }

  // Validate prompt variables
  validatePromptVariables(templateId: string, variables: Record<string, any>): string[] {
    const template = this.getTemplate(templateId);
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

  // Helper methods for template metadata
  private getTemplateVariables(templateId: string): string[] {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    return template?.variables || [];
  }

  private getTemplateCategory(templateId: string): PromptTemplate['category'] {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    return template?.category || 'session_content';
  }
}

export const aiPromptService = new AIPromptService();