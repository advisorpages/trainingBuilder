import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Session } from '../../entities/session.entity';
import { Incentive } from '../../entities/incentive.entity';
import { SessionOutline, SessionOutlineLegacy, FlexibleSessionOutline, SessionTemplate, FlexibleSessionSection, SessionOutlineSection, TopicSection, ExerciseTopicSection, InspirationSection, ClosingSection } from '../sessions/interfaces/session-outline.interface';
import { SessionOutlineUtils } from '../sessions/utils/session-outline.utils';
import { SuggestSessionOutlineDto } from '../sessions/dto/session-builder.dto';
import { Topic } from '../../entities/topic.entity';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface AIPromptRequest {
  templateId: string;
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
  customVariables?: Record<string, string>;
}

export interface AIPromptResponse {
  prompt: string;
  templateId: string;
  estimatedTokens?: number;
  model?: string;
}

export interface AIContentGenerationRequest {
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

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
}

export interface LoadedTemplate {
  metadata: TemplateMetadata;
  template: string;
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

export interface AIIncentiveContentRequest {
  incentiveData: {
    title: string;
    description?: string;
    rules?: string;
    startDate: Date;
    endDate: Date;
    audience?: { name: string };
    tone?: { name: string };
    category?: { name: string };
  };
  contentTypes?: string[];
}

export interface IncentiveGeneratedContent {
  title: string;
  shortDescription: string;
  longDescription: string;
  rulesText: string;
  socialCopy: string;
  emailCopy: string;
}

export interface AIIncentiveContentResponse {
  content: IncentiveGeneratedContent;
  incentiveId?: string;
  generatedAt: Date;
  model?: string;
  totalTokensUsed?: number;
  version?: number;
}

@Injectable()
export class AIService {
  private templatesCache: Map<string, LoadedTemplate> = new Map();
  private readonly templatesPath = path.join(process.cwd(), '..', '..', 'config', 'ai-prompts');


  /**
   * Load template from external file with YAML frontmatter
   */
  private async loadTemplateFromFile(templateId: string): Promise<LoadedTemplate | null> {
    try {
      const filePath = path.join(this.templatesPath, `${templateId}.md`);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse YAML frontmatter
      const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
      const match = fileContent.match(frontmatterRegex);

      if (!match) {
        console.warn(`Template file ${templateId}.md does not have valid YAML frontmatter`);
        return null;
      }

      const [, frontmatter, template] = match;
      const metadata = yaml.load(frontmatter) as TemplateMetadata;

      return {
        metadata,
        template: template.trim()
      };
    } catch (error) {
      console.error(`Error loading template ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Get template with caching - loads from external file only
   */
  private async getTemplate(templateId: string): Promise<{ name: string; description: string; template: string } | null> {
    // Check cache first
    if (this.templatesCache.has(templateId)) {
      const cached = this.templatesCache.get(templateId)!;
      return {
        name: cached.metadata.name,
        description: cached.metadata.description,
        template: cached.template
      };
    }

    // Try to load from external file
    const loadedTemplate = await this.loadTemplateFromFile(templateId);
    if (loadedTemplate) {
      this.templatesCache.set(templateId, loadedTemplate);
      return {
        name: loadedTemplate.metadata.name,
        description: loadedTemplate.metadata.description,
        template: loadedTemplate.template
      };
    }

    return null;
  }

  /**
   * Clear the templates cache to force reload from file system
   */
  async clearTemplatesCache(): Promise<{ message: string; clearedCount: number }> {
    const clearedCount = this.templatesCache.size;
    this.templatesCache.clear();
    return {
      message: 'Templates cache cleared successfully',
      clearedCount
    };
  }

  async generatePrompt(request: AIPromptRequest): Promise<AIPromptResponse> {
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new BadRequestException(
        `Template not found: ${request.templateId}. ` +
        `Please ensure the template file exists at: ${this.templatesPath}/${request.templateId}.md`
      );
    }

    try {
      // Calculate duration
      const duration = this.calculateDuration(request.sessionData.startTime, request.sessionData.endTime);

      // Prepare variables for substitution
      const variables = {
        title: request.sessionData.title || 'Untitled Session',
        description: request.sessionData.description || 'No description provided',
        duration: duration,
        audience: request.sessionData.audience?.name || 'General audience',
        tone: request.sessionData.tone?.name || 'Professional',
        category: request.sessionData.category?.name || 'Leadership',
        topics: request.sessionData.topics?.map(t => t.name).join(', ') || 'General leadership topics',
        maxRegistrations: request.sessionData.maxRegistrations.toString(),
        ...request.customVariables
      };

      // Replace variables in template
      let prompt = template.template;
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        prompt = prompt.replace(regex, value);
      });

      // For now, return the structured prompt
      // In a real implementation, this would call OpenAI API
      const enhancedPrompt = prompt;

      return {
        prompt: enhancedPrompt,
        templateId: request.templateId,
        estimatedTokens: this.estimateTokens(enhancedPrompt),
        model: 'gpt-4' // Simulated for now
      };

    } catch (error) {
      console.error('Error generating prompt:', error);
      throw new InternalServerErrorException('Failed to generate AI prompt');
    }
  }

  async getAvailableTemplates() {
    const templateList = [];

    try {
      if (fs.existsSync(this.templatesPath)) {
        const files = fs.readdirSync(this.templatesPath).filter(f => f.endsWith('.md'));
        for (const file of files) {
          const templateId = file.replace('.md', '');
          const template = await this.getTemplate(templateId);
          if (template) {
            templateList.push({
              id: templateId,
              name: template.name,
              description: template.description
            });
          }
        }
      } else {
        console.warn(`Templates directory not found: ${this.templatesPath}`);
      }
    } catch (error) {
      console.error('Error loading templates list:', error);
      throw new InternalServerErrorException(
        `Failed to load AI templates from ${this.templatesPath}. Please ensure the templates directory exists and contains valid .md files.`
      );
    }

    return templateList;
  }

  private calculateDuration(startTime: Date | string, endTime: Date | string): string {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Generate content using AI prompt
  async generateContent(request: AIContentGenerationRequest): Promise<AIContentResponse> {
    try {
      const contentTypes = request.contentTypes || this.getDefaultContentTypes();
      const generatedContents: GeneratedContent[] = [];

      // For now, simulate AI content generation
      // In a real implementation, this would call OpenAI API
      for (const contentType of contentTypes) {
        const content = this.generateContentForType(contentType, request);
        generatedContents.push({
          type: contentType,
          content,
          metadata: {
            length: content.length,
            timestamp: new Date(),
            model: 'gpt-4'
          }
        });
      }

      return {
        contents: generatedContents,
        prompt: request.prompt,
        generatedAt: new Date(),
        model: 'gpt-4',
        totalTokensUsed: this.estimateTokensUsed(request.prompt, generatedContents),
        version: 1
      };

    } catch (error) {
      console.error('Error generating AI content:', error);
      throw new InternalServerErrorException('Failed to generate AI content');
    }
  }

  private getDefaultContentTypes(): string[] {
    return ['headline', 'description', 'social_media', 'email_copy', 'key_benefits', 'call_to_action'];
  }

  private generateContentForType(contentType: string, request: AIContentGenerationRequest): string {
    const { sessionData } = request;
    const duration = this.calculateDuration(sessionData.startTime, sessionData.endTime);

    switch (contentType) {
      case 'headline':
        return this.generateHeadline(sessionData);
      case 'description':
        return this.generateDescription(sessionData, duration);
      case 'social_media':
        return this.generateSocialMedia(sessionData, duration);
      case 'email_copy':
        return this.generateEmailCopy(sessionData, duration);
      case 'key_benefits':
        return this.generateKeyBenefits(sessionData);
      case 'call_to_action':
        return this.generateCallToAction(sessionData);
      default:
        return `Generated ${contentType} content for ${sessionData.title}`;
    }
  }

  private generateHeadline(sessionData: any): string {
    const audience = sessionData.audience?.name || 'professionals';
    const topics = sessionData.topics?.map(t => t.name).join(' & ') || 'leadership';

    return `Master ${topics}: Essential Skills for ${audience.charAt(0).toUpperCase() + audience.slice(1)}`;
  }

  private generateDescription(sessionData: any, duration: string): string {
    const tone = sessionData.tone?.name || 'professional';
    const category = sessionData.category?.name || 'leadership';
    const topics = sessionData.topics?.map(t => t.name).join(', ') || 'leadership fundamentals';

    return `Join us for this comprehensive ${duration} ${category} training session focused on ${topics}.

This ${tone.toLowerCase()} development opportunity is designed specifically for ${sessionData.audience?.name || 'professionals'} looking to enhance their skills and advance their careers.

Our expert-led session will provide practical strategies, real-world applications, and actionable insights that you can immediately implement in your work environment.

${sessionData.description || 'This engaging session combines interactive learning with proven methodologies to ensure maximum impact and retention.'}

Limited to ${sessionData.maxRegistrations} participants to ensure personalized attention and meaningful networking opportunities.`;
  }

  private generateSocialMedia(sessionData: any, duration: string): string {
    const topics = sessionData.topics?.map(t => t.name).join(' #') || 'Leadership';

    return `🚀 Ready to level up your career? Join our ${duration} ${sessionData.title} session!

✅ Expert-led training
✅ Practical strategies
✅ Immediate impact
✅ Limited to ${sessionData.maxRegistrations} seats

#${topics.replace(/\s+/g, '')} #ProfessionalDevelopment #Training #CareerGrowth

Register now: [Link]`;
  }

  private generateEmailCopy(sessionData: any, duration: string): string {
    return `Subject: Transform Your Career with ${sessionData.title}

Dear Professional,

Are you ready to take your ${sessionData.category?.name || 'leadership'} skills to the next level?

We're excited to invite you to our upcoming ${duration} training session: "${sessionData.title}"

🎯 What You'll Gain:
• Practical strategies you can implement immediately
• Expert insights from industry leaders
• Networking with like-minded professionals
• Resources for continued growth

📅 Session Details:
• Duration: ${duration}
• Format: ${sessionData.audience?.name || 'Professional'} focused
• Limited to ${sessionData.maxRegistrations} participants

This intensive session is designed for professionals who are serious about their development and ready to invest in their future success.

Secure your spot today - seats are filling fast!

Best regards,
The Training Team`;
  }

  private generateKeyBenefits(sessionData: any): string {
    const category = sessionData.category?.name || 'leadership';

    return `• Master essential ${category} techniques that drive real results
• Gain practical tools you can apply immediately in your role
• Build confidence through proven methodologies and frameworks
• Network with other motivated professionals in your field
• Receive expert guidance from experienced industry practitioners
• Access exclusive resources and continued learning materials`;
  }

  private generateCallToAction(sessionData: any): string {
    return `Don't miss this opportunity to transform your ${sessionData.category?.name || 'leadership'} capabilities! Register now and secure your seat in this exclusive ${sessionData.maxRegistrations}-person session. Space is limited and filling quickly.`;
  }

  private estimateTokensUsed(prompt: string, contents: GeneratedContent[]): number {
    const promptTokens = this.estimateTokens(prompt);
    const contentTokens = contents.reduce((total, content) =>
      total + this.estimateTokens(content.content), 0);

    return promptTokens + contentTokens;
  }

  // Regenerate specific content types with user feedback
  async regenerateContent(request: ContentRegenerationRequest): Promise<AIContentResponse> {
    try {
      const generatedContents: GeneratedContent[] = [];

      // For now, simulate AI content regeneration with improvements
      // In a real implementation, this would call OpenAI API with feedback
      for (const contentType of request.contentTypes) {
        const content = this.regenerateContentForType(contentType, request);
        generatedContents.push({
          type: contentType,
          content,
          metadata: {
            length: content.length,
            timestamp: new Date(),
            model: 'gpt-4'
          }
        });
      }

      return {
        contents: generatedContents,
        prompt: request.prompt,
        generatedAt: new Date(),
        model: 'gpt-4',
        totalTokensUsed: this.estimateTokensUsed(request.prompt, generatedContents),
        version: 2 // Incremented version for regeneration
      };

    } catch (error) {
      console.error('Error regenerating AI content:', error);
      throw new InternalServerErrorException('Failed to regenerate AI content');
    }
  }

  private regenerateContentForType(contentType: string, request: ContentRegenerationRequest): string {
    const { sessionData, userFeedback, regenerationParameters } = request;
    const duration = this.calculateDuration(sessionData.startTime, sessionData.endTime);

    // Find previous content for this type
    const _previousContent = request.previousContent?.find(c => c.type === contentType);

    // Apply regeneration parameters and feedback
    let modifier = '';
    if (userFeedback) {
      modifier += ` (User feedback: ${userFeedback})`;
    }
    if (regenerationParameters?.tone) {
      modifier += ` (Tone: ${regenerationParameters.tone})`;
    }
    if (regenerationParameters?.length) {
      modifier += ` (Length: ${regenerationParameters.length})`;
    }
    if (regenerationParameters?.focus) {
      modifier += ` (Focus: ${regenerationParameters.focus})`;
    }

    switch (contentType) {
      case 'headline':
        return this.regenerateHeadline(sessionData, modifier);
      case 'description':
        return this.regenerateDescription(sessionData, duration, modifier);
      case 'social_media':
        return this.regenerateSocialMedia(sessionData, duration, modifier);
      case 'email_copy':
        return this.regenerateEmailCopy(sessionData, duration, modifier);
      case 'key_benefits':
        return this.regenerateKeyBenefits(sessionData, modifier);
      case 'call_to_action':
        return this.regenerateCallToAction(sessionData, modifier);
      default:
        return `Regenerated ${contentType} content for ${sessionData.title}${modifier}`;
    }
  }

  private regenerateHeadline(sessionData: any, modifier: string): string {
    const audience = sessionData.audience?.name || 'professionals';
    const topics = sessionData.topics?.map(t => t.name).join(' & ') || 'leadership';

    // Generate alternative headline options
    const options = [
      `Transform Your ${topics} Skills: Advanced Training for ${audience.charAt(0).toUpperCase() + audience.slice(1)}`,
      `Unlock ${topics} Excellence: Proven Strategies for ${audience.charAt(0).toUpperCase() + audience.slice(1)}`,
      `Elevate Your ${topics} Impact: Essential Workshop for ${audience.charAt(0).toUpperCase() + audience.slice(1)}`
    ];

    return options[Math.floor(Math.random() * options.length)] + (modifier ? ` ${modifier}` : '');
  }

  private regenerateDescription(sessionData: any, duration: string, modifier: string): string {
    const tone = sessionData.tone?.name || 'professional';
    const category = sessionData.category?.name || 'leadership';
    const topics = sessionData.topics?.map(t => t.name).join(', ') || 'leadership fundamentals';

    return `Experience this transformative ${duration} ${category} development session focused on ${topics}.

Designed specifically for ${sessionData.audience?.name || 'professionals'} who are ready to take their careers to the next level, this ${tone.toLowerCase()} training delivers results.

You'll gain practical frameworks, proven strategies, and actionable tools that create immediate impact in your professional environment.

${sessionData.description || 'This dynamic session combines expert instruction with hands-on application to ensure lasting skill development.'}

With only ${sessionData.maxRegistrations} seats available, you'll receive personalized attention and build valuable professional connections.${modifier ? ` ${modifier}` : ''}`;
  }

  private regenerateSocialMedia(sessionData: any, duration: string, modifier: string): string {
    const topics = sessionData.topics?.map(t => t.name).join(' #') || 'Leadership';

    return `💼 Accelerate your professional growth! Don't miss our ${duration} ${sessionData.title} session!

🎯 What awaits you:
• Expert-led instruction
• Actionable strategies
• Real-world applications
• Only ${sessionData.maxRegistrations} spots available

Transform your career today! 📈

#${topics.replace(/\s+/g, '')} #CareerDevelopment #SkillBuilding #ProfessionalGrowth

Secure your seat: [Registration Link]${modifier ? ` ${modifier}` : ''}`;
  }

  private regenerateEmailCopy(sessionData: any, duration: string, modifier: string): string {
    return `Subject: Last Chance: ${sessionData.title} - Transform Your Career

Hello Future Leader,

Your journey to ${sessionData.category?.name || 'leadership'} excellence starts here.

Join us for "${sessionData.title}" - a comprehensive ${duration} training experience designed to accelerate your professional growth.

🚀 Why This Session Matters:
• Cutting-edge strategies from industry experts
• Practical tools for immediate implementation
• Exclusive networking with high-achievers
• Comprehensive resource library included

📋 Session Overview:
• Duration: ${duration}
• Audience: ${sessionData.audience?.name || 'Professional'} focused
• Capacity: Limited to ${sessionData.maxRegistrations} participants

This isn't just training - it's an investment in your professional future. Our intensive format ensures maximum learning and application.

Registration closes soon. Don't let this opportunity pass you by.

Reserve your seat now!

To your success,
The Development Team${modifier ? ` ${modifier}` : ''}`;
  }

  private regenerateKeyBenefits(sessionData: any, modifier: string): string {
    const category = sessionData.category?.name || 'leadership';

    return `• Develop advanced ${category} competencies that distinguish top performers
• Apply cutting-edge methodologies proven in high-stakes environments
• Build unshakeable confidence through systematic skill development
• Connect with ambitious professionals who share your commitment to excellence
• Learn from seasoned experts with real-world success stories
• Gain lifetime access to exclusive tools and ongoing support resources${modifier ? ` ${modifier}` : ''}`;
  }

  private regenerateCallToAction(sessionData: any, modifier: string): string {
    return `Ready to accelerate your ${sessionData.category?.name || 'leadership'} journey? Join the select group of ${sessionData.maxRegistrations} professionals committed to excellence. Enrollment closes soon - claim your spot today!${modifier ? ` ${modifier}` : ''}`;
  }

  // Method to validate session data completeness for AI generation
  validateSessionDataForAI(session: Session): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!session.title?.trim()) missingFields.push('title');
    if (!session.description?.trim()) missingFields.push('description');
    if (!session.startTime) missingFields.push('startTime');
    if (!session.endTime) missingFields.push('endTime');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // One-step AI content generation for incentives
  async generateIncentiveContent(request: AIIncentiveContentRequest): Promise<AIIncentiveContentResponse> {
    try {
      const { incentiveData } = request;

      // Validate required fields
      if (!incentiveData.title?.trim()) {
        throw new BadRequestException('Incentive title is required for content generation');
      }

      if (!incentiveData.startDate || !incentiveData.endDate) {
        throw new BadRequestException('Start and end dates are required for content generation');
      }

      // Calculate duration and urgency
      const duration = this.calculateIncentiveDuration(incentiveData.startDate, incentiveData.endDate);
      const urgency = this.calculateUrgency(incentiveData.endDate);

      // Generate content using simplified templates optimized for incentives
      const content: IncentiveGeneratedContent = {
        title: this.generateIncentiveTitle(incentiveData),
        shortDescription: this.generateIncentiveShortDescription(incentiveData, duration, urgency),
        longDescription: this.generateIncentiveLongDescription(incentiveData, duration, urgency),
        rulesText: this.generateIncentiveRulesText(incentiveData),
        socialCopy: this.generateIncentiveSocialCopy(incentiveData, duration, urgency),
        emailCopy: this.generateIncentiveEmailCopy(incentiveData, duration, urgency)
      };

      // Estimate tokens used
      const totalTokensUsed = this.estimateIncentiveTokensUsed(content);

      return {
        content,
        generatedAt: new Date(),
        model: 'gpt-4',
        totalTokensUsed,
        version: 1
      };

    } catch (error) {
      console.error('Error generating incentive AI content:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to generate AI content for incentive');
    }
  }

  // Helper methods for incentive content generation
  private calculateIncentiveDuration(startDate: Date, endDate: Date): string {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours > 1 ? `${diffHours} hours` : 'Limited time';
    } else if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 7) {
      return `${diffDays} days`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week' : `${weeks} weeks`;
    } else {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month' : `${months} months`;
    }
  }

  private calculateUrgency(endDate: Date): 'high' | 'medium' | 'low' {
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    return 'low';
  }

  private generateIncentiveTitle(incentiveData: any): string {
    const baseTitle = incentiveData.title;
    const audience = incentiveData.audience?.name || 'professionals';
    const tone = incentiveData.tone?.name?.toLowerCase() || 'professional';

    // Generate enhanced promotional titles
    const variations = [
      `🎯 ${baseTitle} - Exclusive Offer for ${audience}`,
      `⚡ Limited Time: ${baseTitle}`,
      `🚀 Don't Miss Out: ${baseTitle}`,
      `🎁 Special Opportunity: ${baseTitle}`,
      `💫 ${baseTitle} - Act Now!`
    ];

    // Choose variation based on tone
    if (tone.includes('urgent') || tone.includes('exciting')) {
      return variations[Math.floor(Math.random() * 2)]; // More urgent options
    } else if (tone.includes('professional') || tone.includes('formal')) {
      return variations[3]; // More professional option
    } else {
      return variations[Math.floor(Math.random() * variations.length)];
    }
  }

  private generateIncentiveShortDescription(incentiveData: any, duration: string, urgency: string): string {
    const category = incentiveData.category?.name || 'opportunity';
    const audience = incentiveData.audience?.name || 'professionals';

    const urgencyText = urgency === 'high' ? 'Don\'t wait - ' : urgency === 'medium' ? 'Limited time - ' : '';

    return `${urgencyText}An exclusive ${category.toLowerCase()} designed for ${audience}. ${incentiveData.description || 'This special promotion offers exceptional value and immediate benefits.'}

Available for ${duration} only. ${urgency === 'high' ? 'Act fast!' : 'Secure your spot today.'}`;
  }

  private generateIncentiveLongDescription(incentiveData: any, duration: string, urgency: string): string {
    const category = incentiveData.category?.name || 'opportunity';
    const audience = incentiveData.audience?.name || 'professionals';
    const tone = incentiveData.tone?.name || 'professional';

    return `We're excited to present this exclusive ${category.toLowerCase()} specifically created for ${audience}.

${incentiveData.description || 'This limited-time promotion has been carefully designed to provide exceptional value and immediate benefits to participants.'}

**What Makes This Special:**
• Exclusive access for a select group
• ${duration} availability window
• Immediate benefits and value
• Designed specifically for ${audience}
• ${tone} approach tailored to your needs

${urgency === 'high' ?
  'This opportunity ends soon - don\'t let it slip away!' :
  urgency === 'medium' ?
    'Time is limited, but there\'s still opportunity to participate.' :
    'Take advantage of this special offer while it\'s available.'
}

Join others who have already discovered the value in this exclusive opportunity.`;
  }

  private generateIncentiveRulesText(incentiveData: any): string {
    const baseRules = incentiveData.rules || '';
    const startDate = new Date(incentiveData.startDate).toLocaleDateString();
    const endDate = new Date(incentiveData.endDate).toLocaleDateString();

    let rulesText = `**Promotion Period:** ${startDate} - ${endDate}

**Eligibility:** Open to all qualified participants

**How to Participate:**
1. Meet the basic eligibility requirements
2. Complete any required actions during the promotion period
3. Follow all terms and conditions outlined below

`;

    if (baseRules.trim()) {
      rulesText += `**Additional Terms:**
${baseRules}

`;
    }

    rulesText += `**Important Notes:**
• This offer is valid for the specified dates only
• Subject to availability and terms
• Cannot be combined with other offers unless specified
• Management reserves the right to modify terms if necessary

*For questions about eligibility or terms, please contact support.*`;

    return rulesText;
  }

  private generateIncentiveSocialCopy(incentiveData: any, duration: string, urgency: string): string {
    const audience = incentiveData.audience?.name || 'professionals';

    const urgencyEmoji = urgency === 'high' ? '🔥' : urgency === 'medium' ? '⚡' : '✨';
    const hashtags = this.generateIncentiveHashtags(incentiveData);

    return `${urgencyEmoji} EXCLUSIVE OPPORTUNITY ${urgencyEmoji}

${incentiveData.title} is here for ${audience}!

🎯 Limited availability: ${duration}
🚀 Immediate benefits
💫 Designed for ${audience}
${urgency === 'high' ? '⏰ Ending soon!' : '📅 Don\'t miss out!'}

${hashtags}

Link in bio 👆`;
  }

  private generateIncentiveEmailCopy(incentiveData: any, duration: string, urgency: string): string {
    const audience = incentiveData.audience?.name || 'professionals';
    const category = incentiveData.category?.name || 'opportunity';

    const subject = urgency === 'high' ?
      `⚡ Final Hours: ${incentiveData.title}` :
      `🎯 Exclusive for ${audience}: ${incentiveData.title}`;

    return `Subject: ${subject}

Dear Valued ${audience.charAt(0).toUpperCase() + audience.slice(1)},

We have something special just for you.

**${incentiveData.title}**

${incentiveData.description || `This exclusive ${category.toLowerCase()} has been created specifically with ${audience} like you in mind.`}

🎯 **Why This Matters:**
• Exclusive access for ${audience}
• Available for ${duration} only
• Immediate benefits and value
• Carefully curated for your needs

${urgency === 'high' ?
  `⏰ **Time is Running Out**
This opportunity ends very soon. Don't let it pass you by.` :
  `📅 **Limited Time Opportunity**
Take advantage while this exclusive offer is still available.`
}

**Ready to get started?**
[Claim Your Spot Now - Button/Link]

Questions? Simply reply to this email and we'll help you right away.

Best regards,
The Team

P.S. ${urgency === 'high' ? 'This truly is your final chance - act now!' : 'Remember, this exclusive opportunity won\'t last forever.'}`;
  }

  private generateIncentiveHashtags(incentiveData: any): string {
    const category = incentiveData.category?.name || 'opportunity';
    const audience = incentiveData.audience?.name || 'professionals';

    const baseHashtags = ['#ExclusiveOffer', '#LimitedTime'];
    const categoryHash = `#${category.replace(/\s+/g, '')}`;
    const audienceHash = `#${audience.replace(/\s+/g, '')}`;

    return [
      ...baseHashtags,
      categoryHash,
      audienceHash,
      '#DontMissOut'
    ].join(' ');
  }

  private estimateIncentiveTokensUsed(content: IncentiveGeneratedContent): number {
    const allContent = Object.values(content).join(' ');
    return this.estimateTokens(allContent);
  }

  // Method to validate incentive data completeness for AI generation
  validateIncentiveDataForAI(incentive: Incentive): { isValid: boolean; missingFields: string[] } {
    const missingFields: string[] = [];

    if (!incentive.title?.trim()) missingFields.push('title');
    if (!incentive.startDate) missingFields.push('startDate');
    if (!incentive.endDate) missingFields.push('endDate');

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  // NEW SESSION BUILDER METHODS

  async generateSessionOutline(
    request: SuggestSessionOutlineDto,
    relevantTopics: Topic[] = [],
    ragSuggestions?: any
  ): Promise<SessionOutlineLegacy> {
    try {
      // Calculate session duration
      const startTime = new Date(request.startTime);
      const endTime = new Date(request.endTime);
      const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Prepare context for AI prompt
      const promptContext = {
        category: request.category,
        sessionType: request.sessionType,
        desiredOutcome: request.desiredOutcome,
        currentProblem: request.currentProblem || '',
        specificTopics: request.specificTopics || '',
        duration: totalDuration,
        relevantTopics: relevantTopics.map(t => `${t.name}: ${t.description || ''}`).join('; '),
        ragSuggestions: ragSuggestions ? this.formatRAGSuggestions(ragSuggestions) : ''
      };

      // Get the session outline template
      const template = await this.getTemplate('session-outline-generator');
      if (!template) {
        throw new BadRequestException('Session outline template not found');
      }

      // Generate AI prompt
      const prompt = this.populateTemplate(template.template, promptContext);

      // For now, generate a structured outline based on the requirements
      // In production, this would call OpenAI API
      const outline = this.generateStructuredOutline(request, totalDuration, relevantTopics, ragSuggestions);

      return outline;
    } catch (error) {
      console.error('Error generating session outline:', error);
      throw new InternalServerErrorException('Failed to generate session outline');
    }
  }

  private formatRAGSuggestions(ragSuggestions: any): string {
    if (!ragSuggestions || !ragSuggestions.sources) {
      return '';
    }

    return ragSuggestions.sources
      .slice(0, 5) // Top 5 suggestions
      .map((source: any, index: number) => `${index + 1}. ${source.text || source.content || ''}`)
      .join('\n');
  }

  private populateTemplate(template: string, context: any): string {
    let populatedTemplate = template;

    Object.entries(context).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      populatedTemplate = populatedTemplate.replace(regex, String(value || ''));
    });

    return populatedTemplate;
  }

  private generateStructuredOutline(
    request: SuggestSessionOutlineDto,
    totalDuration: number,
    relevantTopics: Topic[],
    ragSuggestions?: any
  ): SessionOutlineLegacy {
    // Generate opener section
    const opener: SessionOutlineSection = {
      title: `Welcome & ${request.category} Session Introduction`,
      duration: 15,
      description: `Welcome participants and establish the session's objectives. Brief icebreaker activity to engage the group and set expectations for the ${request.sessionType}.`
    };

    // Generate main topic 1
    const topic1: TopicSection = {
      title: this.generateTopicTitle(request.category, request.specificTopics, relevantTopics, 1),
      duration: 30,
      description: this.generateTopicDescription(request.category, request.desiredOutcome, relevantTopics, ragSuggestions),
      learningObjectives: this.generateLearningObjectives(request.category, request.desiredOutcome),
      suggestedActivities: ['Group discussion', 'Case study review', 'Q&A session'],
      materialsNeeded: ['Presentation slides', 'Handouts', 'Flip chart paper'],

      // Enhanced properties for exercise capability
      isExercise: false,
      estimatedDuration: 30,
      learningOutcomes: this.generateLearningOutcomes(request.category, request.desiredOutcome),
      trainerNotes: this.generateTrainerNotes(request.category, false),
      deliveryGuidance: this.generateDeliveryGuidance(request.category, false)
    };

    // Generate exercise topic 2
    const topic2: ExerciseTopicSection = {
      title: this.generateTopicTitle(request.category, request.specificTopics, relevantTopics, 2),
      duration: 30,
      description: `Interactive exercise designed to reinforce ${request.category} concepts through hands-on practice and group engagement.`,
      learningObjectives: [`Apply ${request.category} principles in practical scenarios`, 'Develop confidence through practice', 'Learn from peer interactions'],
      exerciseDescription: this.generateExerciseDescription(request.category, request.sessionType),
      engagementType: this.selectEngagementType(request.sessionType),
      suggestedActivities: ['Role-playing exercise', 'Small group breakouts', 'Peer feedback sessions'],
      materialsNeeded: ['Exercise worksheets', 'Timer', 'Name tags for roles'],

      // Enhanced properties for exercise capability
      isExercise: true,
      exerciseType: this.selectExerciseType(request.sessionType),
      exerciseInstructions: this.generateDetailedExerciseInstructions(request.category, request.sessionType),
      estimatedDuration: 30,
      learningOutcomes: this.generateLearningOutcomes(request.category, request.desiredOutcome, true),
      trainerNotes: this.generateTrainerNotes(request.category, true),
      deliveryGuidance: this.generateDeliveryGuidance(request.category, true)
    };

    // Generate inspirational content
    const inspirationalContent: InspirationSection = {
      title: 'Inspiration & Motivation',
      duration: 10,
      type: 'video',
      suggestions: this.generateInspirationSuggestions(request.category),
      description: `Motivational content to inspire participants and reinforce the importance of ${request.category} in their professional development.`
    };

    // Generate closing section
    const closing: ClosingSection = {
      title: 'Wrap-up & Action Planning',
      duration: 20,
      description: 'Summarize key learnings, establish action items, and ensure participants leave with clear next steps.',
      keyTakeaways: this.generateKeyTakeaways(request.category, request.desiredOutcome),
      actionItems: this.generateActionItems(request.category, request.desiredOutcome),
      nextSteps: ['Schedule follow-up check-ins', 'Access additional resources', 'Apply learnings in daily work']
    };

    return {
      opener,
      topic1,
      topic2,
      inspirationalContent,
      closing,
      totalDuration,
      suggestedSessionTitle: this.generateSessionTitle(request.category, request.sessionType, request.desiredOutcome),
      suggestedDescription: this.generateSessionDescription(request.category, request.sessionType, request.desiredOutcome),
      difficulty: this.determineDifficulty(request.sessionType, relevantTopics.length),
      recommendedAudienceSize: this.getRecommendedAudienceSize(request.sessionType),
      ragSuggestions: ragSuggestions || null,
      fallbackUsed: !ragSuggestions,
      generatedAt: new Date()
    };
  }

  async generateFlexibleSessionOutline(
    request: SuggestSessionOutlineDto,
    relevantTopics: Topic[] = [],
    ragSuggestions?: any,
    template?: SessionTemplate
  ): Promise<SessionOutline> {
    try {
      // Calculate session duration
      const startTime = new Date(request.startTime);
      const endTime = new Date(request.endTime);
      const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Use provided template or get default
      const sessionTemplate = template || SessionOutlineUtils.getDefaultTemplate();

      // Generate flexible sections based on template
      const sections: FlexibleSessionSection[] = sessionTemplate.sections.map((section, index) => ({
        ...section,
        id: section.id || `section-${index + 1}`,
        position: index + 1,
        title: this.customizeForRequest(section.title, request.category, request.specificTopics),
        description: this.customizeForRequest(section.description, request.category, request.desiredOutcome),
        duration: Math.max(5, Math.floor(section.duration * (totalDuration / sessionTemplate.totalDuration))),
        // Enhance with AI-generated content
        trainerNotes: section.trainerNotes || this.generateTrainerNotes(request.category, section.isExercise || false),
        learningOutcomes: section.learningOutcomes || this.generateLearningOutcomes(request.category, request.desiredOutcome, section.isExercise || false),
        deliveryGuidance: section.deliveryGuidance || this.generateDeliveryGuidance(request.category, section.isExercise || false),
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      // Adjust durations to match total
      const totalSectionDuration = sections.reduce((sum, s) => sum + s.duration, 0);
      if (totalSectionDuration !== totalDuration) {
        this.adjustSectionDurations(sections, totalDuration);
      }

      return {
        sections,
        totalDuration,
        suggestedSessionTitle: this.generateSessionTitle(request.category, request.sessionType, request.desiredOutcome),
        suggestedDescription: this.generateSessionDescription(request.category, request.sessionType, request.desiredOutcome),
        difficulty: this.determineDifficulty(request.sessionType, relevantTopics.length),
        recommendedAudienceSize: this.getRecommendedAudienceSize(request.sessionType),
        ragSuggestions: ragSuggestions || null,
        fallbackUsed: !ragSuggestions && relevantTopics.length === 0,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error generating flexible session outline:', error);
      throw new InternalServerErrorException('Failed to generate flexible session outline');
    }
  }

  private customizeForRequest(text: string, category: string, specificInfo?: string): string {
    if (!text) return '';

    let customized = text.replace(/\{category\}/gi, category);
    if (specificInfo) {
      customized = customized.replace(/\{specific\}/gi, specificInfo);
    }

    // Replace generic placeholders with category-specific content
    if (text.includes('Core Learning Topic')) {
      return `${category} Fundamentals and Best Practices`;
    }
    if (text.includes('Interactive Practice Exercise')) {
      return `${category} Skills Application Exercise`;
    }

    return customized;
  }

  private adjustSectionDurations(sections: FlexibleSessionSection[], targetTotal: number): void {
    const currentTotal = sections.reduce((sum, s) => sum + s.duration, 0);
    const adjustment = targetTotal - currentTotal;

    if (Math.abs(adjustment) <= 5) return; // Small differences are acceptable

    // Distribute adjustment proportionally across non-required sections
    const adjustableSections = sections.filter(s => !s.isRequired);
    if (adjustableSections.length === 0) return;

    const adjustmentPerSection = Math.floor(adjustment / adjustableSections.length);
    let remainingAdjustment = adjustment - (adjustmentPerSection * adjustableSections.length);

    adjustableSections.forEach((section, index) => {
      section.duration += adjustmentPerSection;
      if (index < remainingAdjustment) {
        section.duration += 1;
      }
      // Ensure minimum duration of 5 minutes
      section.duration = Math.max(5, section.duration);
    });
  }

  private generateTopicTitle(category: string, specificTopics: string = '', relevantTopics: Topic[], topicNumber: number): string {
    if (specificTopics && topicNumber === 1) {
      return `Core ${category}: ${specificTopics.split(',')[0]?.trim() || 'Fundamentals'}`;
    }

    if (relevantTopics.length > 0 && topicNumber <= relevantTopics.length) {
      return relevantTopics[topicNumber - 1].name;
    }

    const defaultTopics = {
      1: `${category} Foundations`,
      2: `${category} Application & Practice`
    };

    return defaultTopics[topicNumber as keyof typeof defaultTopics] || `${category} Topic ${topicNumber}`;
  }

  private generateTopicDescription(category: string, desiredOutcome: string, relevantTopics: Topic[], ragSuggestions?: any): string {
    let description = `Comprehensive exploration of ${category} principles and practices. `;

    if (desiredOutcome) {
      description += `This topic directly supports the goal of ${desiredOutcome.toLowerCase()}. `;
    }

    if (relevantTopics.length > 0) {
      description += `Drawing from proven methodologies including ${relevantTopics.slice(0, 2).map(t => t.name).join(' and ')}. `;
    }

    description += 'Participants will engage in interactive discussions and practical applications.';

    return description;
  }

  private generateLearningObjectives(category: string, desiredOutcome: string): string[] {
    return [
      `Understand core ${category} principles and their practical applications`,
      `Identify key strategies for ${desiredOutcome.toLowerCase() || 'professional success'}`,
      `Develop confidence in applying ${category} skills in real-world scenarios`,
      'Build a personal action plan for continued growth'
    ];
  }

  private generateExerciseDescription(category: string, sessionType: string): string {
    const exerciseTypes = {
      workshop: `Hands-on ${category} simulation with real-world scenarios`,
      training: `Structured practice session with guided ${category} application`,
      webinar: `Interactive breakout sessions focusing on ${category} implementation`,
      event: `Collaborative ${category} challenge with peer learning opportunities`
    };

    return exerciseTypes[sessionType as keyof typeof exerciseTypes] || `Interactive ${category} exercise`;
  }

  private selectEngagementType(sessionType: string): 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' {
    const engagementMap = {
      workshop: 'workshop' as const,
      training: 'activity' as const,
      webinar: 'discussion' as const,
      event: 'case-study' as const
    };

    return engagementMap[sessionType as keyof typeof engagementMap] || 'activity';
  }

  private generateInspirationSuggestions(category: string): string[] {
    return [
      `"The Power of ${category}" - Industry success stories`,
      `"Transforming Teams Through ${category}" - Leadership insights`,
      `"Real-World ${category} Champions" - Client testimonials`,
      `"Future of ${category}" - Innovation and trends`,
      `"Personal ${category} Journey" - Motivational speaker`
    ];
  }

  private generateKeyTakeaways(category: string, desiredOutcome: string): string[] {
    return [
      `${category} is essential for ${desiredOutcome.toLowerCase() || 'professional success'}`,
      'Practical tools and strategies can be implemented immediately',
      'Continuous learning and practice drive mastery',
      'Peer collaboration enhances individual growth',
      'Personal commitment is key to achieving lasting change'
    ];
  }

  private generateActionItems(category: string, desiredOutcome: string): string[] {
    return [
      `Identify one ${category} skill to practice this week`,
      `Schedule time for daily ${category} application`,
      'Find an accountability partner for ongoing support',
      `Set specific goals related to ${desiredOutcome.toLowerCase() || 'skill development'}`,
      'Plan follow-up learning activities and resources'
    ];
  }

  private generateSessionTitle(category: string, sessionType: string, desiredOutcome: string): string {
    const typeModifiers = {
      workshop: 'Interactive',
      training: 'Comprehensive',
      webinar: 'Virtual',
      event: 'Special'
    };

    const modifier = typeModifiers[sessionType as keyof typeof typeModifiers] || 'Professional';
    return `${modifier} ${category} ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}: ${desiredOutcome}`;
  }

  private generateSessionDescription(category: string, sessionType: string, desiredOutcome: string): string {
    return `Join us for this engaging ${sessionType} focused on ${category} development. Designed to help participants ${desiredOutcome.toLowerCase()}, this session combines expert instruction with practical application. Participants will leave with actionable strategies and increased confidence in their ${category.toLowerCase()} capabilities.`;
  }

  private determineDifficulty(sessionType: string, topicCount: number): 'beginner' | 'intermediate' | 'advanced' {
    if (sessionType === 'event' || topicCount <= 2) return 'beginner';
    if (sessionType === 'workshop' || topicCount > 5) return 'advanced';
    return 'intermediate';
  }

  private getRecommendedAudienceSize(sessionType: string): string {
    const sizeRecommendations = {
      workshop: '8-12 participants for optimal interaction',
      training: '12-20 participants for effective learning',
      webinar: '20-50 participants for broad reach',
      event: '15-30 participants for networking opportunities'
    };

    return sizeRecommendations[sessionType as keyof typeof sizeRecommendations] || '10-25 participants';
  }

  // PHASE 5: Training Kit and Marketing Kit Generation

  async generateTrainingKitForSession(session: Session): Promise<{
    trainerPreparation: string;
    deliveryTips: string[];
    materialsList: string[];
    timingGuidance: string;
    troubleshooting: string[];
    resourceLinks: string[];
  }> {
    try {
      // Extract session outline data if available
      let sessionStructure = 'Standard session format';
      if (session.sessionOutlineData) {
        sessionStructure = this.formatOutlineForTrainingKit(session.sessionOutlineData);
      }

      const context = {
        title: session.title,
        description: session.description || '',
        category: session.category?.name || 'General',
        audience: session.audience?.name || 'General audience',
        tone: session.tone?.name || 'Professional',
        topics: session.topics?.map(t => t.name).join(', ') || '',
        sessionStructure,
        duration: this.calculateSessionDuration(session.startTime, session.endTime)
      };

      // Use enhanced training kit template
      const template = await this.getTemplate('training-kit-generator');
      if (!template) {
        throw new BadRequestException('Training kit template not found');
      }

      const prompt = this.populateTemplate(template.template, context);

      // For now, generate structured training kit based on session data
      // In production, this would call OpenAI API
      return this.generateStructuredTrainingKit(session, context);

    } catch (error) {
      console.error('Error generating training kit:', error);
      throw new InternalServerErrorException('Failed to generate training kit');
    }
  }

  async generateMarketingKitForSession(session: Session): Promise<{
    socialMediaPosts: string[];
    emailTemplates: string[];
    landingPageContent: string;
    promotionalFlyers: string;
    partnerOutreach: string;
    followUpSequence: string[];
  }> {
    try {
      const context = {
        title: session.title,
        description: session.description || '',
        category: session.category?.name || 'General',
        audience: session.audience?.name || 'General audience',
        tone: session.tone?.name || 'Professional',
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location?.name || 'TBD',
        maxRegistrations: session.maxRegistrations,
        keyBenefits: session.keyBenefits || '',
        callToAction: session.callToAction || ''
      };

      const template = await this.getTemplate('marketing-kit-generator');
      if (!template) {
        throw new BadRequestException('Marketing kit template not found');
      }

      const prompt = this.populateTemplate(template.template, context);

      // Generate structured marketing kit
      return this.generateStructuredMarketingKit(session, context);

    } catch (error) {
      console.error('Error generating marketing kit:', error);
      throw new InternalServerErrorException('Failed to generate marketing kit');
    }
  }

  private formatOutlineForTrainingKit(outlineData: any): string {
    if (!outlineData || typeof outlineData !== 'object') {
      return 'Standard session format';
    }

    const sections = [];

    if (outlineData.opener) {
      sections.push(`Opener (${outlineData.opener.duration}min): ${outlineData.opener.title}`);
    }
    if (outlineData.topic1) {
      sections.push(`Topic 1 (${outlineData.topic1.duration}min): ${outlineData.topic1.title}`);
    }
    if (outlineData.topic2) {
      sections.push(`Topic 2 (${outlineData.topic2.duration}min): ${outlineData.topic2.title} - ${outlineData.topic2.exerciseDescription || 'Interactive exercise'}`);
    }
    if (outlineData.inspirationalContent) {
      sections.push(`Inspiration (${outlineData.inspirationalContent.duration}min): ${outlineData.inspirationalContent.title}`);
    }
    if (outlineData.closing) {
      sections.push(`Closing (${outlineData.closing.duration}min): ${outlineData.closing.title}`);
    }

    return sections.join('\n');
  }

  private calculateSessionDuration(startTime: Date, endTime: Date): string {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return `${diffMins}`;
  }

  private generateStructuredTrainingKit(session: Session, context: any): any {
    const category = context.category.toLowerCase();
    const duration = context.duration;

    return {
      trainerPreparation: `Complete preparation guide for delivering "${session.title}". This ${duration}-minute ${category} session requires thorough preparation to ensure maximum impact. Review all materials 24 hours before delivery, prepare backup activities, and ensure all technology is tested. Familiarize yourself with the session flow and key learning objectives.`,

      deliveryTips: [
        `Start with energy - the opening sets the tone for the entire ${duration}-minute session`,
        `Maintain engagement through interactive elements throughout`,
        `Use real-world examples relevant to ${context.audience}`,
        `Monitor time carefully - each section has specific duration targets`,
        `Encourage questions and participation to enhance learning`,
        `Be prepared to adapt content based on group dynamics`,
        `Close with clear action items and next steps`
      ],

      materialsList: [
        'Presentation slides (backup copies ready)',
        'Handouts and worksheets for all participants',
        'Name tags and markers',
        'Flip chart paper and markers',
        'Timer or stopwatch',
        'Audio/visual equipment (tested)',
        'Participant feedback forms',
        'Resource links and follow-up materials'
      ],

      timingGuidance: `Session Duration: ${duration} minutes\n\nRecommended flow:\n- Opening and introductions: 10-15% of total time\n- Main content delivery: 60-70% of total time\n- Interactive exercises: 15-20% of total time\n- Wrap-up and action planning: 10-15% of total time\n\nAlways have 5-10 minutes buffer for questions and overruns.`,

      troubleshooting: [
        'Technology fails: Have printed backup materials ready',
        'Low participation: Use smaller group activities to build confidence',
        'Running over time: Identify optional content that can be shortened',
        'Difficult participants: Acknowledge concerns and redirect to learning objectives',
        'Room too small/large: Adapt seating arrangement and interaction style',
        'Last-minute cancellations: Have contingency activities for smaller groups'
      ],

      resourceLinks: [
        `Additional ${category} resources and reading materials`,
        'Follow-up training opportunities',
        'Online tools and assessment resources',
        'Industry best practices and case studies',
        'Professional development resources',
        'Feedback and evaluation tools'
      ]
    };
  }

  private generateStructuredMarketingKit(session: Session, context: any): any {
    const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return {
      socialMediaPosts: [
        `🚀 Ready to transform your ${context.category.toLowerCase()} skills? Join "${session.title}" on ${formatDate(new Date(context.startTime))}! Limited to ${context.maxRegistrations} participants. Register now: [LINK] #ProfessionalDevelopment #${context.category.replace(/\s+/g, '')}`,

        `💡 What if you could master ${context.category.toLowerCase()} in just one session? "${session.title}" delivers practical strategies you can implement immediately. ${formatDate(new Date(context.startTime))} at ${formatTime(new Date(context.startTime))}. Don't miss out! [LINK]`,

        `🎯 Calling all ${context.audience}! Transform your approach to ${context.category.toLowerCase()} with expert-led training. "${session.title}" - ${formatDate(new Date(context.startTime))}. Only ${context.maxRegistrations} spots available. [LINK] #Training #CareerGrowth`,

        `⏰ Final reminder: "${session.title}" starts tomorrow at ${formatTime(new Date(context.startTime))}! Join ${context.audience} from across the industry for this game-changing session. Last chance to register: [LINK]`
      ],

      emailTemplates: [
        `Subject: Transform Your ${context.category} Skills - "${session.title}"\n\nDear Professional,\n\nAre you ready to take your ${context.category.toLowerCase()} capabilities to the next level?\n\nJoin us for "${session.title}" - an intensive training designed specifically for ${context.audience}.\n\n📅 When: ${formatDate(new Date(context.startTime))} at ${formatTime(new Date(context.startTime))}\n📍 Where: ${context.location}\n👥 Limited to: ${context.maxRegistrations} participants\n\nWhat You'll Gain:\n${context.keyBenefits || '• Practical strategies for immediate implementation\n• Expert insights from industry leaders\n• Networking with like-minded professionals\n• Resources for continued growth'}\n\n${context.callToAction || 'Don\'t miss this opportunity to advance your career!'}\n\nRegister now: [REGISTRATION LINK]\n\nBest regards,\nThe Training Team`,

        `Subject: Last Chance - "${session.title}" Registration Closes Soon\n\nHi [Name],\n\nThis is your final reminder that registration for "${session.title}" closes in 24 hours.\n\nWe've designed this session specifically for professionals like you who are serious about improving their ${context.category.toLowerCase()} skills.\n\n⚡ Quick Details:\n• Date: ${formatDate(new Date(context.startTime))}\n• Time: ${formatTime(new Date(context.startTime))} - ${formatTime(new Date(context.endTime))}\n• Format: Interactive ${context.audience} training\n• Investment: Your time + commitment to growth\n\nOnly ${context.maxRegistrations} spots available, and we're filling fast.\n\nSecure your seat: [REGISTRATION LINK]\n\nQuestions? Reply to this email.\n\nSee you there!\n[Your Name]`
      ],

      landingPageContent: `# ${session.title}\n\n## Transform Your ${context.category} Skills in One Intensive Session\n\n**${formatDate(new Date(context.startTime))} | ${formatTime(new Date(context.startTime))} - ${formatTime(new Date(context.endTime))} | ${context.location}**\n\n### Why This Session?\n\n${session.description}\n\nDesigned specifically for ${context.audience}, this intensive training combines expert instruction with hands-on application to deliver real results.\n\n### What You'll Achieve\n\n${context.keyBenefits || '• Master essential techniques that drive results\n• Gain practical tools for immediate implementation\n• Build confidence through proven methodologies\n• Network with motivated professionals\n• Access exclusive resources and continued support'}\n\n### Session Format\n\nOur proven methodology ensures maximum learning in minimum time:\n- **Interactive Learning**: Engaging activities and real-world applications\n- **Expert Instruction**: Led by industry practitioners\n- **Practical Focus**: Tools and strategies you can use immediately\n- **Personalized Attention**: Limited to ${context.maxRegistrations} participants\n\n### Who Should Attend\n\nThis session is perfect for ${context.audience} who are:\n- Ready to take their ${context.category.toLowerCase()} skills to the next level\n- Looking for practical, actionable strategies\n- Committed to implementing what they learn\n- Interested in networking with like-minded professionals\n\n### ${context.callToAction || 'Ready to Transform Your Career?'}\n\n**Limited to ${context.maxRegistrations} participants to ensure personalized attention.**\n\n[REGISTER NOW - BUTTON]`,

      promotionalFlyers: `**${session.title.toUpperCase()}**\n\n🎯 ${context.category} Training for ${context.audience}\n\n📅 ${formatDate(new Date(context.startTime))}\n🕐 ${formatTime(new Date(context.startTime))} - ${formatTime(new Date(context.endTime))}\n📍 ${context.location}\n\n✨ WHAT YOU'LL GAIN:\n${context.keyBenefits || '• Practical strategies for immediate results\n• Expert insights from industry leaders\n• Networking opportunities\n• Exclusive resources and tools'}\n\n🚀 LIMITED TO ${context.maxRegistrations} PARTICIPANTS\n\n${context.callToAction || 'Register now to secure your spot!'}\n\n[QR CODE] | [WEBSITE] | [PHONE]\n\n"Invest in your future - the results speak for themselves!"`,

      partnerOutreach: `Subject: Partnership Opportunity - "${session.title}"\n\nDear [Partner Name],\n\nI hope this email finds you well. I'm reaching out to share an exciting training opportunity that would be perfect for your ${context.audience}.\n\nWe're hosting "${session.title}" on ${formatDate(new Date(context.startTime))}, and I believe your team/members would benefit tremendously from this specialized training.\n\n**Why This Matters for Your Team:**\n• Directly applicable ${context.category.toLowerCase()} skills\n• Proven methodologies for immediate implementation\n• Professional development that delivers ROI\n• Networking with industry leaders\n\n**Partnership Benefits:**\n• Group registration discounts available\n• Co-marketing opportunities\n• Customization options for your specific needs\n• Follow-up resources and support\n\nI'd love to discuss how we can work together to provide maximum value for your team. Are you available for a brief call this week?\n\nBest regards,\n[Your Name]\n[Contact Information]`,

      followUpSequence: [
        `Day +1: Thank you for attending "${session.title}"! Your session materials and resources are attached. What's your first step?`,

        `Day +3: How are you implementing what you learned? Remember, small consistent actions lead to big results. Need any clarification on the strategies we covered?`,

        `Week +1: Quick check-in: Have you had a chance to apply any of the ${context.category.toLowerCase()} techniques from our session? I'd love to hear about your progress!`,

        `Week +2: Midpoint momentum check! You're halfway through the optimal implementation window. What's working well? What challenges can we help you overcome?`,

        `Month +1: It's been a month since "${session.title}" - time for a success celebration! Please share your wins, big or small. Your progress inspires others!`
      ]
    };
  }

  // ADD new prompt templates creation methods
  async createTrainingKitTemplate(): Promise<void> {
    const templateContent = `---
id: training-kit-generator
name: Training Kit Generator
description: Generate comprehensive training kits for session delivery
category: trainer-support
variables: [title, description, category, audience, tone, topics, sessionStructure, duration]
---

Generate a comprehensive training kit for the session: "{title}"

Session Details:
- Category: {category}
- Target Audience: {audience}
- Tone: {tone}
- Duration: {duration}
- Topics: {topics}

Session Structure:
{sessionStructure}

Description: {description}

Create a detailed training kit that includes:

1. **Trainer Preparation Guide**: Step-by-step preparation instructions
2. **Delivery Tips**: Best practices for effective session delivery
3. **Materials List**: All required materials and resources
4. **Timing Guidance**: Detailed timing recommendations for each section
5. **Troubleshooting Guide**: Common issues and solutions
6. **Resource Links**: Additional resources and follow-up materials

The training kit should be practical, actionable, and specifically tailored to help trainers deliver this {category} session effectively to {audience}.

Focus on:
- Clear, step-by-step instructions
- Practical tips that improve delivery quality
- Contingency planning for common challenges
- Resources that enhance learning outcomes
- Professional presentation and delivery techniques`;

    // Save template to file system (would be implemented based on your template system)
  }

  async createMarketingKitTemplate(): Promise<void> {
    const templateContent = `---
id: marketing-kit-generator
name: Marketing Kit Generator
description: Generate comprehensive marketing materials for session promotion
category: marketing-support
variables: [title, description, category, audience, tone, startTime, endTime, location, maxRegistrations, keyBenefits, callToAction]
---

Create a comprehensive marketing kit for: "{title}"

Session Details:
- Category: {category}
- Target Audience: {audience}
- Tone: {tone}
- Schedule: {startTime} to {endTime}
- Location: {location}
- Capacity: {maxRegistrations} participants
- Key Benefits: {keyBenefits}
- Call to Action: {callToAction}

Description: {description}

Generate marketing materials including:

1. **Social Media Posts**: 4-5 engaging posts for different stages of promotion
2. **Email Templates**: Registration and reminder email templates
3. **Landing Page Content**: Complete landing page copy with structure
4. **Promotional Flyers**: Print-ready promotional content
5. **Partner Outreach**: Template for reaching out to potential partners
6. **Follow-up Sequence**: Post-session follow-up communication templates

All content should:
- Be compelling and action-oriented
- Highlight the value proposition for {audience}
- Use appropriate {tone} for the target audience
- Include clear calls to action
- Be adaptable for different marketing channels
- Drive registrations and engagement`;

    // Save template to file system
  }

  // Enhanced AI generation helper methods for exercise-capable topics

  private generateLearningOutcomes(category: string, desiredOutcome: string, isExercise: boolean = false): string {
    const baseOutcomes = `Participants will be able to:
- Apply ${category} principles in their daily work
- Identify opportunities for ${desiredOutcome.toLowerCase() || 'improvement'}
- Develop confidence in ${category} skills`;

    if (isExercise) {
      return baseOutcomes + `
- Practice ${category} techniques in a safe environment
- Learn through hands-on experience and peer feedback
- Build muscle memory for key ${category} behaviors`;
    }

    return baseOutcomes + `
- Understand theoretical foundations of ${category}
- Recognize best practices and proven methodologies`;
  }

  private generateTrainerNotes(category: string, isExercise: boolean): string {
    const baseNotes = `Key facilitation points:
- Encourage active participation and questions
- Use real-world examples relevant to the audience
- Check for understanding regularly`;

    if (isExercise) {
      return baseNotes + `
- Provide clear instructions before starting the exercise
- Monitor group dynamics and provide guidance as needed
- Ensure all participants are engaged in the activity
- Debrief thoroughly to capture key learnings
- Be prepared to adapt based on group energy and engagement`;
    }

    return baseNotes + `
- Present information in digestible chunks
- Use visual aids and interactive elements
- Allow time for reflection and note-taking`;
  }

  private generateDeliveryGuidance(category: string, isExercise: boolean): string {
    if (isExercise) {
      return `Exercise facilitation guidance:
1. Set clear expectations and ground rules
2. Form groups strategically (mix of experience levels)
3. Provide written instructions for reference
4. Circulate actively to provide support and feedback
5. Keep track of time and provide regular updates
6. Use the debrief to reinforce key ${category} concepts
7. Connect the exercise back to real-world applications`;
    }

    return `Content delivery guidance:
1. Start with a compelling hook or real-world scenario
2. Break complex ${category} concepts into manageable pieces
3. Use the "tell them what you'll tell them" approach
4. Incorporate interactive elements every 10-15 minutes
5. Use stories and examples to make concepts memorable
6. Check for understanding through questions and discussion
7. Summarize key points before transitioning`;
  }

  private selectExerciseType(sessionType: string): 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation' {
    const exerciseTypeMap = {
      workshop: 'workshop' as const,
      training: 'activity' as const,
      webinar: 'case-study' as const,
      event: 'role-play' as const
    };

    return exerciseTypeMap[sessionType as keyof typeof exerciseTypeMap] || 'activity';
  }

  private generateDetailedExerciseInstructions(category: string, sessionType: string): string {
    const exerciseType = this.selectExerciseType(sessionType);

    const instructionTemplates = {
      workshop: `Interactive ${category} Workshop Exercise:
1. Divide into small groups of 4-5 participants
2. Each group receives a real-world ${category} scenario
3. Groups have 15 minutes to develop their approach
4. Present solutions to the larger group (5 minutes each)
5. Facilitate group discussion on different approaches
6. Trainer provides expert feedback and guidance`,

      activity: `${category} Practice Activity:
1. Individual reflection phase (5 minutes)
2. Partner sharing and feedback (10 minutes)
3. Small group synthesis (10 minutes)
4. Large group debrief and key takeaways (5 minutes)
5. Action planning for implementation`,

      'case-study': `${category} Case Study Analysis:
1. Present detailed case study scenario
2. Individual analysis phase (10 minutes)
3. Small group discussion and solution development (15 minutes)
4. Group presentations and peer feedback (5 minutes)
5. Expert analysis and best practice discussion`,

      'role-play': `${category} Role-Playing Exercise:
1. Assign roles and provide character backgrounds
2. Brief preparation time for role understanding (5 minutes)
3. Conduct role-play scenarios (15 minutes)
4. Step out of character for debrief discussion (10 minutes)
5. Identify key learnings and real-world applications`,

      discussion: `Guided ${category} Discussion:
1. Present thought-provoking questions or scenarios
2. Individual reflection time (3 minutes)
3. Pair-share discussions (7 minutes)
4. Small group synthesis (15 minutes)
5. Large group sharing and expert insights (5 minutes)`,

      presentation: `${category} Presentation Exercise:
1. Teams prepare mini-presentations on assigned topics (15 minutes)
2. Each team presents for 5 minutes
3. Q&A and peer feedback (5 minutes per team)
4. Group discussion on key insights and takeaways`
    };

    return instructionTemplates[exerciseType] || instructionTemplates.activity;
  }
}