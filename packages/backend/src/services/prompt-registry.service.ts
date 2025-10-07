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
        template: `# Role
You are an expert training designer specializing in creating comprehensive, engaging training sessions.

# Task
Create a detailed session outline based on the provided requirements.

# Input Details
- Title: {{title}}
- Category: {{category}}
- Session Type: {{sessionType}}
- Desired Outcome: {{desiredOutcome}}
- Duration: {{duration}} minutes
- Current Problem: {{currentProblem}}
- Specific Topics: {{specificTopics}}
- Audience Size: {{audienceSize}}

# Output Format
Return a JSON object with this exact structure:

{
  "suggestedTitle": "string - engaging and descriptive title",
  "summary": "string - 2-3 sentence overview",
  "difficulty": "Beginner|Intermediate|Advanced",
  "recommendedAudienceSize": "string - optimal group size",
  "sections": [
    {
      "title": "string - section name",
      "duration": number,
      "description": "string - what happens in this section",
      "learningObjectives": ["string - specific measurable outcomes"],
      "suggestedActivities": ["string - practical exercises or discussions"]
    }
  ]
}

# Requirements
- Ensure sections add up to the total duration
- Make learning objectives specific and measurable
- Include interactive elements appropriate for the audience size
- Balance theory with practical application`,
        description: 'Main prompt for generating session outlines via OpenAI',
        variables: ['title', 'category', 'sessionType', 'desiredOutcome', 'duration', 'currentProblem', 'specificTopics', 'audienceSize'],
      },
      {
        name: 'session_title_generation',
        category: PromptCategory.TITLE_CREATION,
        template: `# Role
You are a professional training content writer specializing in creating compelling session titles.

# Task
Generate an engaging, professional title for a training session.

# Input Details
- Category: {{category}}
- Session Type: {{sessionType}}
- Desired Outcome: {{desiredOutcome}}
- Current Problem: {{currentProblem}}
- Duration: {{duration}} minutes

# Title Requirements
- Clear and descriptive of the content
- Professional yet engaging tone
- Length: 3-8 words
- Focus on the learning outcome or benefit
- Avoid jargon unless industry-specific
- Action-oriented when possible

# Output
Return ONLY the title text, with no quotes, punctuation, or additional commentary.`,
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
        template: `# Role
You are an expert instructional designer specializing in audience-tailored training content.

# Task
Enhance the training topic below with audience-appropriate content and tone.

# Topic Information
- Topic: {{topicName}}
- Learning Outcome: {{learningOutcome}}
- Delivery Style: {{deliveryStyle}}
- Session Context: {{sessionContext}}

# Audience Profile: {{audienceName}}
- Experience Level: {{audienceExperienceLevel}}
- Technical Depth: {{audienceTechnicalDepth}}/5
- Communication Style: {{audienceCommunicationStyle}}
- Vocabulary Level: {{audienceVocabularyLevel}}
{{#if audienceLearningStyle}}- Preferred Learning Style: {{audienceLearningStyle}}{{/if}}
{{#if audienceExampleTypes}}- Relevant Examples: {{audienceExampleTypes}}{{/if}}
{{#if audienceAvoidTopics}}- Topics to Avoid: {{audienceAvoidTopics}}{{/if}}
{{#if audienceInstructions}}- Special Instructions: {{audienceInstructions}}{{/if}}

# Tone Profile: {{toneName}}
- Style: {{toneStyle}}
- Formality: {{toneFormality}}/5
- Energy Level: {{toneEnergyLevel}}/5
- Sentence Structure: {{toneSentenceStructure}}
{{#if toneLanguageTraits}}- Language Traits: {{toneLanguageTraits}}{{/if}}
{{#if toneEmotionalQualities}}- Emotional Qualities: {{toneEmotionalQualities}}{{/if}}
{{#if toneExamplePhrase}}- Example Phrasing: "{{toneExamplePhrase}}"{{/if}}
{{#if toneInstructions}}- Special Instructions: {{toneInstructions}}{{/if}}

# Required Output
Provide enhanced content with:

1. **Description**
   - Tailored to audience experience level
   - Uses appropriate vocabulary
   - Incorporates relevant examples

2. **Learning Objectives**
   - Specific and measurable
   - Written at appropriate technical depth
   - Aligned with learning outcome

3. **Trainer Notes**
   - Delivery guidance matching the tone
   - Tips for engaging this audience
   - Timing recommendations

4. **Materials Needed**
   - Appropriate for technical depth
   - Supports preferred learning style
   - Practical and accessible

5. **Delivery Guidance**
   - Incorporates learning style preferences
   - Maintains desired tone
   - Engagement strategies`,
        description: 'Enhances individual training topics with detailed audience and tone context',
        variables: [
          'topicName', 'learningOutcome', 'deliveryStyle', 'sessionContext',
          'audienceName', 'audienceExperienceLevel', 'audienceTechnicalDepth', 'audienceCommunicationStyle', 'audienceVocabularyLevel',
          'audienceLearningStyle', 'audienceExampleTypes', 'audienceAvoidTopics', 'audienceInstructions',
          'toneName', 'toneStyle', 'toneFormality', 'toneEnergyLevel', 'toneSentenceStructure',
          'toneLanguageTraits', 'toneEmotionalQualities', 'toneExamplePhrase', 'toneInstructions'
        ],
      },
      {
        name: 'training_kit_generation',
        category: PromptCategory.TRAINING_KIT,
        template: `# Role
You are a professional training materials developer.

# Task
Create a comprehensive training kit with all necessary materials.

# Session Information
- Session: {{sessionTitle}}
- Outline: {{sessionOutline}}
- Target Audience: {{audience}}
- Duration: {{duration}} minutes

# Required Components

## 1. Facilitator Guide
- Detailed timing for each section
- Step-by-step instructions
- Talking points and key messages
- Transition guidance between sections
- Tips for handling questions

## 2. Participant Materials
- Handouts summarizing key concepts
- Worksheets for activities
- Reference materials
- Take-home resources

## 3. Activity Instructions
- Clear, actionable directions
- Materials lists
- Setup requirements
- Expected outcomes
- Facilitation tips

## 4. Assessment Tools
- Pre-assessment (if applicable)
- Knowledge checks
- Post-session evaluation
- Reflection prompts

## 5. Resource Lists
- Additional reading
- Online resources
- Tools and templates
- Follow-up support

# Format
Organize all materials clearly with headers and be ready-to-use.`,
        description: 'Creates complete training kit materials',
        variables: ['sessionTitle', 'sessionOutline', 'audience', 'duration'],
      },
      {
        name: 'marketing_kit_generation',
        category: PromptCategory.MARKETING_KIT,
        template: `# Role
You are a marketing copywriter specializing in training and professional development programs.

# Task
Create compelling marketing materials for this training session.

# Session Details
- Title: {{sessionTitle}}
- Description: {{sessionDescription}}
- Key Benefits: {{keyBenefits}}
- Target Audience: {{targetAudience}}
- Duration: {{duration}} minutes

# Required Marketing Components

## 1. Promotional Headline
- Attention-grabbing (under 10 words)
- Benefit-focused
- Action-oriented

## 2. Course Description
- 2-3 paragraphs
- Explain what participants will learn
- Highlight practical value
- Professional yet engaging tone

## 3. Key Learning Outcomes
- 3-5 bullet points
- Specific and measurable
- Focus on "What will I be able to do?"
- Use action verbs

## 4. Target Audience Description
- Who should attend
- Prerequisites (if any)
- Roles/positions that benefit most
- Experience level

## 5. Call-to-Action Copy
- Urgency without being pushy
- Clear next steps
- Multiple CTA options (e.g., "Register Now", "Learn More")

# Tone
Professional, persuasive, and benefit-focused. Emphasize transformation and practical application.`,
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