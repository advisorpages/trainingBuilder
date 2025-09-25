import { Injectable, Logger } from '@nestjs/common';
import { AIService } from '../../ai/ai.service';
import { RAGIntegrationService } from '../../../services/rag-integration.service';
import { TopicsEnhancementService } from '../../topics/topics-enhancement.service';
import { SessionsService } from '../sessions.service';
import { SuggestSessionOutlineDto } from '../dto/session-builder.dto';
import { SessionOutline, SessionOutlineLegacy, FlexibleSessionOutline, SessionTemplate, FlexibleSessionSection } from '../interfaces/session-outline.interface';
import { SessionOutlineUtils } from '../utils/session-outline.utils';
import { Topic } from '../../../entities/topic.entity';

export interface SessionOutlineResult {
  outline: SessionOutline;
  relevantTopics: Topic[];
  ragAvailable: boolean;
  ragQueried: boolean;
  fallbackUsed: boolean;
  ragSuggestions?: any;
}

@Injectable()
export class SessionBuilderService {
  private readonly logger = new Logger(SessionBuilderService.name);

  constructor(
    private readonly aiService: AIService,
    private readonly ragIntegrationService: RAGIntegrationService,
    private readonly topicsEnhancementService: TopicsEnhancementService,
    private readonly sessionsService: SessionsService
  ) {}

  async generateSessionOutline(request: SuggestSessionOutlineDto, useTemplate?: string): Promise<SessionOutlineResult> {
    this.logger.log(`Generating session outline for category: ${request.category}, type: ${request.sessionType}`);

    // Step 1: Get template if specified
    let template: SessionTemplate | null = null;
    if (useTemplate) {
      template = await this.getTemplate(useTemplate);
    } else {
      // Use default template as starting point
      template = SessionOutlineUtils.getDefaultTemplate();
    }

    // Step 2: Attempt RAG query
    let ragSuggestions = null;
    let ragQueried = false;
    let ragAvailable = false;

    try {
      ragAvailable = await this.ragIntegrationService.isRAGAvailable();

      if (ragAvailable) {
        ragQueried = true;
        const keywords = await this.extractKeywordsFromRequest(request);
        ragSuggestions = await this.ragIntegrationService.queryRAGForSessionSuggestions(
          request.category,
          keywords,
          request.specificTopics || ''
        );

        if (ragSuggestions) {
          this.logger.log(`RAG query successful, found ${ragSuggestions.sources?.length || 0} sources`);
        }
      }
    } catch (error) {
      this.logger.warn('RAG query failed, falling back to database topics:', error.message);
    }

    // Step 3: Query relevant topics from database
    let relevantTopics: Topic[] = [];
    try {
      const keywords = await this.extractKeywordsFromRequest(request);
      relevantTopics = await this.topicsEnhancementService.findRelevantTopics(
        request.category,
        keywords,
        10
      );

      // If no topics found by category, try broader search
      if (relevantTopics.length === 0) {
        relevantTopics = await this.topicsEnhancementService.findTopicsByCategory(request.category);
      }

      this.logger.log(`Found ${relevantTopics.length} relevant topics from database`);
    } catch (error) {
      this.logger.warn('Failed to query database topics:', error.message);
    }

    // Step 4: Generate flexible session outline using AI and template
    let outline: SessionOutline;
    try {
      outline = await this.aiService.generateFlexibleSessionOutline(
        request,
        relevantTopics,
        ragSuggestions,
        template
      );

      this.logger.log('Flexible session outline generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate flexible session outline:', error.message);
      // Fallback to using the template as-is with minimal customization
      outline = this.createFallbackOutline(request, template);
    }

    return {
      outline,
      relevantTopics,
      ragAvailable,
      ragQueried,
      fallbackUsed: !ragSuggestions && relevantTopics.length === 0,
      ragSuggestions
    };
  }

  async generateLegacySessionOutline(request: SuggestSessionOutlineDto): Promise<SessionOutlineResult> {
    // For backward compatibility - generates old fixed structure
    this.logger.log(`Generating legacy session outline for category: ${request.category}, type: ${request.sessionType}`);

    let ragSuggestions = null;
    let ragQueried = false;
    let ragAvailable = false;

    try {
      ragAvailable = await this.ragIntegrationService.isRAGAvailable();

      if (ragAvailable) {
        ragQueried = true;
        const keywords = await this.extractKeywordsFromRequest(request);
        ragSuggestions = await this.ragIntegrationService.queryRAGForSessionSuggestions(
          request.category,
          keywords,
          request.specificTopics || ''
        );

        if (ragSuggestions) {
          this.logger.log(`RAG query successful, found ${ragSuggestions.sources?.length || 0} sources`);
        }
      }
    } catch (error) {
      this.logger.warn('RAG query failed, falling back to database topics:', error.message);
    }

    let relevantTopics: Topic[] = [];
    try {
      const keywords = await this.extractKeywordsFromRequest(request);
      relevantTopics = await this.topicsEnhancementService.findRelevantTopics(
        request.category,
        keywords,
        10
      );

      if (relevantTopics.length === 0) {
        relevantTopics = await this.topicsEnhancementService.findTopicsByCategory(request.category);
      }

      this.logger.log(`Found ${relevantTopics.length} relevant topics from database`);
    } catch (error) {
      this.logger.warn('Failed to query database topics:', error.message);
    }

    // Generate legacy outline and convert to flexible format
    let legacyOutline: SessionOutlineLegacy;
    try {
      legacyOutline = await this.aiService.generateSessionOutline(
        request,
        relevantTopics,
        ragSuggestions
      );

      this.logger.log('Legacy session outline generated successfully');
    } catch (error) {
      this.logger.error('Failed to generate legacy session outline:', error.message);
      throw error;
    }

    // Convert legacy to flexible format
    const outline = SessionOutlineUtils.convertLegacyToFlexible(legacyOutline);

    return {
      outline,
      relevantTopics,
      ragAvailable,
      ragQueried,
      fallbackUsed: !ragSuggestions && relevantTopics.length === 0,
      ragSuggestions
    };
  }

  async getSuggestionsForCategory(category: string): Promise<{ topics: Topic[], ragAvailable: boolean }> {
    const ragAvailable = await this.ragIntegrationService.isRAGAvailable();
    const topics = await this.topicsEnhancementService.findTopicsByCategory(category);

    return {
      topics,
      ragAvailable
    };
  }

  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    try {
      const available = await this.ragIntegrationService.isRAGAvailable();

      if (available) {
        const testResponse = await this.ragIntegrationService.queryRAGForSessionSuggestions(
          'Leadership',
          ['motivation', 'team'],
          'team building and motivation'
        );

        return {
          available: true,
          response: testResponse
        };
      }

      return { available: false };
    } catch (error) {
      return {
        available: false,
        response: { error: error.message }
      };
    }
  }

  private async extractKeywordsFromRequest(request: SuggestSessionOutlineDto): Promise<string[]> {
    const textToAnalyze = [
      request.desiredOutcome,
      request.currentProblem || '',
      request.specificTopics || ''
    ].filter(Boolean).join(' ');

    return this.topicsEnhancementService.extractKeywordsFromText(textToAnalyze);
  }

  // PHASE 5: Training Kit and Marketing Kit Methods

  async generateTrainingKit(sessionId: string): Promise<any> {
    try {
      const session = await this.sessionsService.findOne(sessionId);
      const trainingKit = await this.aiService.generateTrainingKitForSession(session);

      // Save to session
      await this.sessionsService.internalUpdate(sessionId, {
        trainingKitContent: JSON.stringify(trainingKit)
      });

      return {
        success: true,
        trainingKit,
        generatedAt: new Date(),
        sessionId
      };
    } catch (error) {
      this.logger.error(`Failed to generate training kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async generateMarketingKit(sessionId: string): Promise<any> {
    try {
      const session = await this.sessionsService.findOne(sessionId);
      const marketingKit = await this.aiService.generateMarketingKitForSession(session);

      // Save to session
      await this.sessionsService.internalUpdate(sessionId, {
        marketingKitContent: JSON.stringify(marketingKit)
      });

      return {
        success: true,
        marketingKit,
        generatedAt: new Date(),
        sessionId
      };
    } catch (error) {
      this.logger.error(`Failed to generate marketing kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async getTrainingKit(sessionId: string): Promise<any> {
    try {
      const session = await this.sessionsService.findOne(sessionId);

      if (session.trainingKitContent) {
        return {
          trainingKit: JSON.parse(session.trainingKitContent),
          hasTrainingKit: true,
          generatedAt: session.updatedAt // Approximate
        };
      }

      return {
        hasTrainingKit: false,
        trainingKit: null
      };
    } catch (error) {
      this.logger.error(`Failed to get training kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async getMarketingKit(sessionId: string): Promise<any> {
    try {
      const session = await this.sessionsService.findOne(sessionId);

      if (session.marketingKitContent) {
        return {
          marketingKit: JSON.parse(session.marketingKitContent),
          hasMarketingKit: true,
          generatedAt: session.updatedAt // Approximate
        };
      }

      return {
        hasMarketingKit: false,
        marketingKit: null
      };
    } catch (error) {
      this.logger.error(`Failed to get marketing kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async saveTrainingKit(sessionId: string, trainingKitData: any): Promise<any> {
    try {
      await this.sessionsService.internalUpdate(sessionId, {
        trainingKitContent: JSON.stringify(trainingKitData)
      });

      return {
        success: true,
        message: 'Training kit saved successfully',
        savedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to save training kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async saveMarketingKit(sessionId: string, marketingKitData: any): Promise<any> {
    try {
      await this.sessionsService.internalUpdate(sessionId, {
        marketingKitContent: JSON.stringify(marketingKitData)
      });

      return {
        success: true,
        message: 'Marketing kit saved successfully',
        savedAt: new Date()
      };
    } catch (error) {
      this.logger.error(`Failed to save marketing kit for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  async getCompleteSessionData(sessionId: string): Promise<any> {
    try {
      const session = await this.sessionsService.findOne(sessionId);
      const trainingKit = await this.getTrainingKit(sessionId);
      const marketingKit = await this.getMarketingKit(sessionId);

      return {
        session,
        outline: session.sessionOutlineData || null,
        trainingKit: trainingKit.trainingKit || null,
        marketingKit: marketingKit.marketingKit || null,
        isBuilderGenerated: session.builderGenerated || false,
        completionStatus: {
          hasOutline: !!session.sessionOutlineData,
          hasTrainingKit: trainingKit.hasTrainingKit,
          hasMarketingKit: marketingKit.hasMarketingKit,
          completionPercentage: this.calculateCompletionPercentage(session, trainingKit.hasTrainingKit, marketingKit.hasMarketingKit)
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get complete session data for ${sessionId}:`, error.message);
      throw error;
    }
  }

  private calculateCompletionPercentage(session: any, hasTrainingKit: boolean, hasMarketingKit: boolean): number {
    let completed = 0;
    const total = 5; // Session, Outline, Topics, Training Kit, Marketing Kit

    if (session.title && session.description) completed++; // Basic session data
    if (session.sessionOutlineData) completed++; // Outline
    if (session.topics && session.topics.length > 0) completed++; // Topics
    if (hasTrainingKit) completed++; // Training kit
    if (hasMarketingKit) completed++; // Marketing kit

    return Math.round((completed / total) * 100);
  }

  // Template Management Methods
  async getTemplates(): Promise<SessionTemplate[]> {
    // For now, return the default template. In future, this could be database-driven
    return [SessionOutlineUtils.getDefaultTemplate()];
  }

  async getTemplate(templateId: string): Promise<SessionTemplate> {
    const templates = await this.getTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      this.logger.warn(`Template ${templateId} not found, returning default template`);
      return SessionOutlineUtils.getDefaultTemplate();
    }

    return template;
  }

  async createCustomTemplate(name: string, description: string, sections: FlexibleSessionSection[], category = 'Custom'): Promise<SessionTemplate> {
    const template: SessionTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category,
      sections: SessionOutlineUtils.updateSectionPositions(sections),
      totalDuration: SessionOutlineUtils.calculateTotalDuration(sections),
      difficulty: 'intermediate', // Default
      recommendedAudienceSize: '10-25 participants', // Default
      tags: ['custom'],
      isDefault: false,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In future versions, save to database
    this.logger.log(`Created custom template: ${template.name}`);
    return template;
  }

  // Section Management Methods
  async addSectionToOutline(outline: FlexibleSessionOutline, sectionType: string, position?: number): Promise<FlexibleSessionOutline> {
    const newPosition = position || outline.sections.length + 1;
    const newSection = SessionOutlineUtils.createDefaultSection(sectionType as any, newPosition);

    // Insert at position and update all positions
    const updatedSections = [...outline.sections];
    if (position && position <= outline.sections.length) {
      updatedSections.splice(position - 1, 0, newSection);
    } else {
      updatedSections.push(newSection);
    }

    return {
      ...outline,
      sections: SessionOutlineUtils.updateSectionPositions(updatedSections),
      totalDuration: SessionOutlineUtils.calculateTotalDuration(updatedSections)
    };
  }

  async removeSectionFromOutline(outline: FlexibleSessionOutline, sectionId: string): Promise<FlexibleSessionOutline> {
    const updatedSections = outline.sections.filter(section => section.id !== sectionId);

    return {
      ...outline,
      sections: SessionOutlineUtils.updateSectionPositions(updatedSections),
      totalDuration: SessionOutlineUtils.calculateTotalDuration(updatedSections)
    };
  }

  async updateSectionInOutline(outline: FlexibleSessionOutline, sectionId: string, updates: Partial<FlexibleSessionSection>): Promise<FlexibleSessionOutline> {
    const updatedSections = outline.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          ...updates,
          updatedAt: new Date()
        };
      }
      return section;
    });

    return {
      ...outline,
      sections: updatedSections,
      totalDuration: SessionOutlineUtils.calculateTotalDuration(updatedSections)
    };
  }

  async reorderSections(outline: FlexibleSessionOutline, sectionIds: string[]): Promise<FlexibleSessionOutline> {
    const orderedSections = sectionIds.map((id, index) => {
      const section = outline.sections.find(s => s.id === id);
      if (!section) throw new Error(`Section ${id} not found`);

      return {
        ...section,
        position: index + 1,
        updatedAt: new Date()
      };
    });

    return {
      ...outline,
      sections: orderedSections,
      totalDuration: SessionOutlineUtils.calculateTotalDuration(orderedSections)
    };
  }

  async duplicateSection(outline: FlexibleSessionOutline, sectionId: string): Promise<FlexibleSessionOutline> {
    const sectionToDuplicate = outline.sections.find(s => s.id === sectionId);
    if (!sectionToDuplicate) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const duplicatedSection = {
      ...sectionToDuplicate,
      id: `${sectionToDuplicate.id}-copy-${Date.now()}`,
      title: `${sectionToDuplicate.title} (Copy)`,
      position: sectionToDuplicate.position + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSections = [...outline.sections];
    updatedSections.splice(sectionToDuplicate.position, 0, duplicatedSection);

    return {
      ...outline,
      sections: SessionOutlineUtils.updateSectionPositions(updatedSections),
      totalDuration: SessionOutlineUtils.calculateTotalDuration(updatedSections)
    };
  }

  // Utility Methods
  async validateOutline(outline: FlexibleSessionOutline): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate each section
    for (const section of outline.sections) {
      const sectionValidation = SessionOutlineUtils.validateSection(section);
      if (!sectionValidation.isValid) {
        errors.push(...sectionValidation.errors.map(error => `Section "${section.title}": ${error}`));
      }
    }

    // Check for required sections (opener and closing)
    const hasOpener = outline.sections.some(s => s.type === 'opener');
    const hasClosing = outline.sections.some(s => s.type === 'closing');

    if (!hasOpener) {
      errors.push('Session must have an opening section');
    }

    if (!hasClosing) {
      errors.push('Session must have a closing section');
    }

    // Check total duration
    if (outline.totalDuration < 30 || outline.totalDuration > 480) {
      errors.push('Total session duration should be between 30 and 480 minutes');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private createFallbackOutline(request: SuggestSessionOutlineDto, template: SessionTemplate): FlexibleSessionOutline {
    return {
      sections: template.sections.map(section => ({
        ...section,
        title: section.title.replace(/New |Add /, `${request.category} `),
        description: section.description || `Content for ${request.category} session`,
      })),
      totalDuration: template.totalDuration,
      suggestedSessionTitle: `${request.category} ${request.sessionType.charAt(0).toUpperCase() + request.sessionType.slice(1)}`,
      suggestedDescription: request.desiredOutcome || `A comprehensive ${request.category} session`,
      difficulty: template.difficulty,
      recommendedAudienceSize: template.recommendedAudienceSize,
      fallbackUsed: true,
      generatedAt: new Date()
    };
  }

  async getSectionTypes(): Promise<Record<string, any>> {
    return SessionOutlineUtils.getSectionTypeConfigs();
  }
}