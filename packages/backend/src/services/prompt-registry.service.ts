import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt, PromptCategory } from '../entities/prompt.entity';

export interface PromptTemplate {
  id: string;
  name: string;
  category: PromptCategory;
  template: string;
  variables: string[];
  description?: string;
  version: number;
  isActive: boolean;
}

export interface PromptVariables {
  [key: string]: string | number | boolean;
}

@Injectable()
export class PromptRegistryService {
  private cache: Map<string, Prompt> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
  ) {}

  async getPrompt(name: string): Promise<Prompt> {
    await this.refreshCacheIfNeeded();

    const prompt = this.cache.get(name);
    if (!prompt) {
      throw new NotFoundException(`Prompt "${name}" not found`);
    }

    if (!prompt.isActive) {
      throw new NotFoundException(`Prompt "${name}" is not active`);
    }

    return prompt;
  }

  async getPromptsByCategory(category: PromptCategory): Promise<Prompt[]> {
    await this.refreshCacheIfNeeded();

    return Array.from(this.cache.values()).filter(
      prompt => prompt.category === category && prompt.isActive
    );
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return this.promptRepository.find({
      order: { category: 'ASC', name: 'ASC' }
    });
  }

  async renderPrompt(name: string, variables: PromptVariables): Promise<string> {
    const prompt = await this.getPrompt(name);
    return this.interpolateTemplate(prompt.template, variables);
  }

  async createPrompt(data: {
    name: string;
    category: PromptCategory;
    template: string;
    description?: string;
    variables?: string[];
    exampleInput?: string;
    expectedOutput?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Prompt> {
    const prompt = this.promptRepository.create({
      ...data,
      variables: data.variables || this.extractVariables(data.template),
      version: 1,
      isActive: true,
    });

    const saved = await this.promptRepository.save(prompt);
    this.invalidateCache();
    return saved;
  }

  async updatePrompt(id: string, data: {
    template?: string;
    description?: string;
    variables?: string[];
    isActive?: boolean;
    exampleInput?: string;
    expectedOutput?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException(`Prompt with id "${id}" not found`);
    }

    if (data.template && data.template !== prompt.template) {
      prompt.version += 1;
      prompt.variables = data.variables || this.extractVariables(data.template);
    }

    Object.assign(prompt, data);
    const saved = await this.promptRepository.save(prompt);
    this.invalidateCache();
    return saved;
  }

  async deletePrompt(id: string): Promise<void> {
    const result = await this.promptRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Prompt with id "${id}" not found`);
    }
    this.invalidateCache();
  }

  async seedDefaultPrompts(): Promise<void> {
    const defaultPrompts = [
      {
        name: 'session_outline_generation',
        category: PromptCategory.SESSION_GENERATION,
        template: `You are an expert training designer. Create a comprehensive session outline based on the following requirements:

Title: {{title}}
Category: {{category}}
Session Type: {{sessionType}}
Desired Outcome: {{desiredOutcome}}
Duration: {{duration}} minutes
Current Problem: {{currentProblem}}
Specific Topics: {{specificTopics}}
Audience Size: {{audienceSize}}

Return a JSON object with this structure:
{
  "suggestedTitle": "string",
  "summary": "string",
  "difficulty": "Beginner|Intermediate|Advanced",
  "recommendedAudienceSize": "string",
  "sections": [
    {
      "title": "string",
      "duration": number,
      "description": "string",
      "learningObjectives": ["string"],
      "suggestedActivities": ["string"]
    }
  ]
}`,
        description: 'Main prompt for generating session outlines via OpenAI',
        variables: ['title', 'category', 'sessionType', 'desiredOutcome', 'duration', 'currentProblem', 'specificTopics', 'audienceSize'],
      },
      {
        name: 'session_title_generation',
        category: PromptCategory.TITLE_CREATION,
        template: `Create an engaging, professional title for a training session with these details:

Category: {{category}}
Session Type: {{sessionType}}
Desired Outcome: {{desiredOutcome}}
Current Problem: {{currentProblem}}
Duration: {{duration}} minutes

The title should be:
- Clear and descriptive
- Professional but engaging
- 3-8 words long
- Focused on the learning outcome

Return only the title, no additional text.`,
        description: 'Generates compelling session titles',
        variables: ['category', 'sessionType', 'desiredOutcome', 'currentProblem', 'duration'],
      },
      {
        name: 'dynamic_session_prompt',
        category: PromptCategory.SESSION_GENERATION,
        template: `Design a {{sessionType}} session about {{category}}.

{{#if title}}
Working title: {{title}}.
{{/if}}

{{#if desiredOutcome}}
Desired outcome: {{desiredOutcome}}.
{{/if}}

{{#if currentProblem}}
Problem to solve: {{currentProblem}}.
{{/if}}

{{#if specificTopics}}
Specific topics: {{specificTopics}}.
{{/if}}

Session duration: {{duration}} minutes.`,
        description: 'Dynamic prompt built from session metadata for context building',
        variables: ['sessionType', 'category', 'title', 'desiredOutcome', 'currentProblem', 'specificTopics', 'duration'],
      },
      {
        name: 'topic_enhancement',
        category: PromptCategory.CONTENT_ENHANCEMENT,
        template: `Enhance this training topic for {{audienceName}} with {{toneName}} tone:

Topic: {{topicName}}
Learning Outcome: {{learningOutcome}}
Delivery Style: {{deliveryStyle}}
Session Context: {{sessionContext}}

Provide enhanced content including:
- Detailed description
- Learning objectives
- Trainer notes
- Materials needed
- Delivery guidance`,
        description: 'Enhances individual training topics with detailed content',
        variables: ['audienceName', 'toneName', 'topicName', 'learningOutcome', 'deliveryStyle', 'sessionContext'],
      },
      {
        name: 'training_kit_generation',
        category: PromptCategory.TRAINING_KIT,
        template: `Generate comprehensive training materials for:

Session: {{sessionTitle}}
Outline: {{sessionOutline}}
Target Audience: {{audience}}
Duration: {{duration}} minutes

Include:
1. Facilitator guide with timing and instructions
2. Participant handouts and worksheets
3. Activity instructions and materials
4. Assessment tools
5. Resource lists`,
        description: 'Creates complete training kit materials',
        variables: ['sessionTitle', 'sessionOutline', 'audience', 'duration'],
      },
      {
        name: 'marketing_kit_generation',
        category: PromptCategory.MARKETING_KIT,
        template: `Create marketing materials for this training session:

Title: {{sessionTitle}}
Description: {{sessionDescription}}
Benefits: {{keyBenefits}}
Target Audience: {{targetAudience}}
Duration: {{duration}} minutes

Generate:
1. Promotional headline
2. Course description
3. Key learning outcomes
4. Target audience description
5. Call-to-action copy`,
        description: 'Generates marketing and promotional content',
        variables: ['sessionTitle', 'sessionDescription', 'keyBenefits', 'targetAudience', 'duration'],
      }
    ];

    for (const promptData of defaultPrompts) {
      const existing = await this.promptRepository.findOne({
        where: { name: promptData.name }
      });

      if (!existing) {
        await this.createPrompt(promptData);
      }
    }
  }

  private async refreshCacheIfNeeded(): Promise<void> {
    if (Date.now() > this.cacheExpiry) {
      const prompts = await this.promptRepository.find({
        where: { isActive: true }
      });

      this.cache.clear();
      prompts.forEach(prompt => {
        this.cache.set(prompt.name, prompt);
      });

      this.cacheExpiry = Date.now() + this.CACHE_TTL;
    }
  }

  private invalidateCache(): void {
    this.cache.clear();
    this.cacheExpiry = 0;
  }

  private interpolateTemplate(template: string, variables: PromptVariables): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = variables[key.trim()];
      return value !== undefined ? String(value) : match;
    });
  }

  private extractVariables(template: string): string[] {
    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return [...new Set(matches.map(match => {
      return match.replace(/\{\{|\}\}/g, '').trim();
    }))];
  }
}