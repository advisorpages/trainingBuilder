import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Session } from '../../entities/session.entity';
import { Incentive } from '../../entities/incentive.entity';
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
}