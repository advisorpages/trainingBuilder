import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, Topic } from '../../entities';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';

export interface GenerateContentPayload {
  sessionId: string;
  prompt: string;
  variables?: Record<string, unknown>;
  kind: string;
}

export interface AIQualityCheck {
  passed: boolean;
  issues: string[];
  score: number;
}

export interface ContextualSuggestion {
  id: string;
  text: string;
  category: string;
  relevanceScore: number;
}

export interface AIGenerationResult {
  sessionId: string;
  kind: string;
  prompt: string;
  content: any;
  source: string;
  qualityCheck: AIQualityCheck;
  metadata: {
    generatedAt: string;
    processingTime: number;
    contextUsed: boolean;
  };
}

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    private readonly telemetryService: AnalyticsTelemetryService,
  ) {}

  async generateContent(payload: GenerateContentPayload, userId?: string): Promise<AIGenerationResult> {
    const startTime = Date.now();

    // Record prompt submission
    this.telemetryService.recordEvent('ai_prompt_submitted', {
      sessionId: payload.sessionId,
      userId,
      metadata: {
        kind: payload.kind,
        promptLength: payload.prompt.length,
        hasVariables: !!payload.variables && Object.keys(payload.variables).length > 0,
      },
    });

    try {
      // Get contextual information
      const context = await this.getSessionContext(payload.sessionId);

      // Generate contextual suggestions
      const suggestions = await this.generateContextualSuggestions(context, payload.kind);

      // Enhanced prompt with context
      const enhancedPrompt = await this.enhancePromptWithContext(payload.prompt, context, suggestions);

      // Generate content (placeholder for now)
      const content = this.generatePlaceholderContent(payload, context);

      // Quality check
      const qualityCheck = await this.performQualityCheck(content, payload);

      const processingTime = Date.now() - startTime;

      if (!qualityCheck.passed) {
        // Record failed generation
        this.telemetryService.recordEvent('ai_content_rejected', {
          sessionId: payload.sessionId,
          userId,
          metadata: {
            kind: payload.kind,
            processingTime,
            qualityScore: qualityCheck.score,
            issues: qualityCheck.issues,
            reason: 'quality_check_failed',
          },
        });

        throw new BadRequestException(`AI content failed quality checks: ${qualityCheck.issues.join(', ')}`);
      }

      // Record successful generation
      this.telemetryService.recordEvent('ai_content_generated', {
        sessionId: payload.sessionId,
        userId,
        metadata: {
          kind: payload.kind,
          processingTime,
          qualityScore: qualityCheck.score,
          contextUsed: context !== null,
          suggestionsCount: suggestions.length,
          contentLength: JSON.stringify(content).length,
        },
      });

      return {
        sessionId: payload.sessionId,
        kind: payload.kind,
        prompt: enhancedPrompt,
        content,
        source: 'ai-enhanced',
        qualityCheck,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime,
          contextUsed: context !== null,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // Record generation error
      this.telemetryService.recordEvent('ai_content_rejected', {
        sessionId: payload.sessionId,
        userId,
        metadata: {
          kind: payload.kind,
          processingTime,
          error: error.message,
          reason: 'generation_error',
        },
      });

      throw error;
    }
  }

  recordContentAcceptance(sessionId: string, contentId: string, userId?: string) {
    this.telemetryService.recordEvent('ai_content_accepted', {
      sessionId,
      userId,
      metadata: {
        contentId,
        acceptedAt: new Date().toISOString(),
      },
    });
  }

  recordContentRejection(sessionId: string, contentId: string, reason: string, userId?: string) {
    this.telemetryService.recordEvent('ai_content_rejected', {
      sessionId,
      userId,
      metadata: {
        contentId,
        reason,
        rejectedAt: new Date().toISOString(),
      },
    });
  }

  async getContextualSuggestions(sessionId: string, kind: string): Promise<ContextualSuggestion[]> {
    const context = await this.getSessionContext(sessionId);
    return this.generateContextualSuggestions(context, kind);
  }

  private async getSessionContext(sessionId: string) {
    if (sessionId === 'new') return null;

    try {
      const session = await this.sessionsRepository.findOne({
        where: { id: sessionId },
        relations: ['topic', 'incentives', 'trainerAssignments'],
      });

      return session;
    } catch (error) {
      return null;
    }
  }

  private async generateContextualSuggestions(context: Session | null, kind: string): Promise<ContextualSuggestion[]> {
    const suggestions: ContextualSuggestion[] = [];

    // Topic-based suggestions
    if (context?.topic) {
      suggestions.push({
        id: 'topic-context',
        text: `Focus on ${context.topic.name} fundamentals and practical applications`,
        category: 'topic',
        relevanceScore: 0.9,
      });
    }

    // Audience-based suggestions
    if (context?.audience) {
      suggestions.push({
        id: 'audience-context',
        text: `Tailor language and examples for ${context.audience}`,
        category: 'audience',
        relevanceScore: 0.8,
      });
    }

    // Kind-specific suggestions
    const kindSuggestions = this.getKindSpecificSuggestions(kind);
    suggestions.push(...kindSuggestions);

    // Sort by relevance
    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private getKindSpecificSuggestions(kind: string): ContextualSuggestion[] {
    const suggestions = {
      'outline': [
        { id: 'outline-structure', text: 'Include opening, core content, activities, and closing segments', category: 'structure', relevanceScore: 0.7 },
        { id: 'outline-timing', text: 'Balance theory (30%) with practical application (70%)', category: 'timing', relevanceScore: 0.6 },
      ],
      'opener': [
        { id: 'opener-hook', text: 'Start with a relevant question or scenario to engage immediately', category: 'engagement', relevanceScore: 0.8 },
        { id: 'opener-context', text: 'Connect to current business challenges or opportunities', category: 'relevance', relevanceScore: 0.7 },
      ],
      'activity': [
        { id: 'activity-interactive', text: 'Design for pairs or small groups to maximize participation', category: 'interaction', relevanceScore: 0.8 },
        { id: 'activity-practical', text: 'Use real scenarios participants can relate to', category: 'application', relevanceScore: 0.9 },
      ],
    };

    return suggestions[kind] || [];
  }

  private async enhancePromptWithContext(
    originalPrompt: string,
    context: Session | null,
    suggestions: ContextualSuggestion[]
  ): Promise<string> {
    let enhancedPrompt = originalPrompt;

    if (context) {
      const contextInfo = [
        context.topic ? `Topic: ${context.topic.name}` : null,
        context.audience ? `Audience: ${context.audience}` : null,
        context.objective ? `Objective: ${context.objective}` : null,
      ].filter(Boolean).join('\n');

      if (contextInfo) {
        enhancedPrompt = `Context:\n${contextInfo}\n\nRequest: ${originalPrompt}`;
      }
    }

    // Add top suggestions as guidance
    const topSuggestions = suggestions.slice(0, 3);
    if (topSuggestions.length > 0) {
      const suggestionText = topSuggestions.map(s => `- ${s.text}`).join('\n');
      enhancedPrompt += `\n\nGuidance:\n${suggestionText}`;
    }

    return enhancedPrompt;
  }

  private generatePlaceholderContent(payload: GenerateContentPayload, context: Session | null) {
    const topicName = context?.topic?.name || 'Professional Development';
    const audience = context?.audience || 'professionals';

    switch (payload.kind) {
      case 'outline':
        return {
          sections: [
            {
              id: 'intro-' + Date.now(),
              type: 'opener',
              title: `Welcome & ${topicName} Context`,
              duration: 10,
              description: `Set the stage for learning about ${topicName.toLowerCase()} and establish psychological safety.`,
            },
            {
              id: 'core-' + Date.now(),
              type: 'content',
              title: `Core ${topicName} Concepts`,
              duration: 25,
              description: `Introduce key frameworks and principles relevant to ${audience}.`,
            },
            {
              id: 'practice-' + Date.now(),
              type: 'activity',
              title: 'Practice & Application',
              duration: 20,
              description: `Hands-on exercises to apply ${topicName.toLowerCase()} concepts.`,
            },
          ],
          totalDuration: 55,
        };

      case 'opener':
        return {
          heading: `Welcome to ${topicName}`,
          body: `Let's explore how ${topicName.toLowerCase()} can transform your approach to [specific challenge]. Think about a recent situation where this knowledge would have been valuable.`,
          suggestedQuestions: [
            `What's your current experience with ${topicName.toLowerCase()}?`,
            'What specific challenge brought you here today?',
          ],
        };

      case 'activity':
        return {
          heading: `${topicName} in Action`,
          body: `Work in pairs to apply today's concepts to a real scenario. You'll have 15 minutes to discuss and prepare a brief share-back.`,
          instructions: [
            'Form pairs or triads',
            'Choose a current workplace challenge',
            `Apply ${topicName.toLowerCase()} principles to address it`,
            'Prepare 2-minute summary for group',
          ],
        };

      default:
        return {
          heading: `${topicName} Content`,
          body: `Enhanced content about ${topicName.toLowerCase()} tailored for ${audience}, incorporating contextual insights and best practices.`,
        };
    }
  }

  private async performQualityCheck(content: any, payload: GenerateContentPayload): Promise<AIQualityCheck> {
    const issues: string[] = [];
    let score = 100;

    // Check content structure
    if (!content || typeof content !== 'object') {
      issues.push('Content must be a structured object');
      score -= 50;
    }

    // Check for required fields based on kind
    if (payload.kind === 'outline' && (!content.sections || !Array.isArray(content.sections))) {
      issues.push('Outline must include sections array');
      score -= 30;
    }

    // Check text length and quality
    const textContent = this.extractTextContent(content);
    if (textContent.length < 10) {
      issues.push('Content too short - minimum 10 characters required');
      score -= 20;
    }

    if (textContent.length > 5000) {
      issues.push('Content too long - maximum 5000 characters allowed');
      score -= 10;
    }

    // Check for banned phrases/content
    const bannedPhrases = ['placeholder', 'lorem ipsum', 'todo', 'fix me'];
    const lowerText = textContent.toLowerCase();
    bannedPhrases.forEach(phrase => {
      if (lowerText.includes(phrase)) {
        issues.push(`Content contains banned phrase: "${phrase}"`);
        score -= 15;
      }
    });

    // Check tone appropriateness
    if (this.hasInappropriateTone(textContent)) {
      issues.push('Content tone may be inappropriate for professional context');
      score -= 25;
    }

    return {
      passed: issues.length === 0 && score >= 70,
      issues,
      score: Math.max(0, score),
    };
  }

  private extractTextContent(content: any): string {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return JSON.stringify(content);
    }
    return String(content);
  }

  private hasInappropriateTone(text: string): boolean {
    const inappropriateMarkers = ['very', 'extremely', 'absolutely', '!!!', 'amazing', 'incredible', 'unbelievable'];
    const lowerText = text.toLowerCase();
    const markerCount = inappropriateMarkers.filter(marker => lowerText.includes(marker)).length;
    return markerCount > 2; // Allow some enthusiasm, but flag excessive language
  }
}
