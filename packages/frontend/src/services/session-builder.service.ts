import { api } from './api.service';

export interface SessionBuilderInput {
  title?: string;
  category: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId?: number;
  audienceId?: number;
  toneId?: number;
}

export interface SessionOutlineSection {
  title: string;
  duration: number;
  description: string;
}

export interface TopicSection extends SessionOutlineSection {
  learningObjectives: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];
}

export interface ExerciseTopicSection extends TopicSection {
  exerciseDescription: string;
  engagementType: string;
}

export interface InspirationSection {
  title: string;
  duration: number;
  type: string;
  suggestions: string[];
  description?: string;
}

export interface ClosingSection extends SessionOutlineSection {
  keyTakeaways: string[];
  actionItems: string[];
  nextSteps?: string[];
}

// Legacy interface - kept for backward compatibility
export interface SessionOutlineLegacy {
  opener: SessionOutlineSection;
  topic1: TopicSection;
  topic2: ExerciseTopicSection;
  inspirationalContent: InspirationSection;
  closing: ClosingSection;
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: string;
  recommendedAudienceSize: string;
  ragSuggestions?: any;
  fallbackUsed: boolean;
  generatedAt: string;
}

// Flexible session outline structure - primary interface
export interface SessionOutline {
  sections: FlexibleSessionSection[];
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: string;
  recommendedAudienceSize: string;
  ragSuggestions?: any;
  fallbackUsed: boolean;
  generatedAt: string;
  convertedFromLegacy?: boolean;
  convertedAt?: string;
}

export interface FlexibleSessionSection {
  id: string;
  type: 'opener' | 'topic' | 'exercise' | 'inspiration' | 'closing' | 'video' | 'discussion' | 'presentation' | 'break' | 'assessment' | 'custom';
  position: number;
  title: string;
  duration: number;
  description: string;
  isRequired?: boolean;
  isCollapsible?: boolean;
  icon?: string;

  // Topic/Exercise specific properties
  isExercise?: boolean;
  exerciseType?: 'discussion' | 'activity' | 'workshop' | 'case-study' | 'role-play' | 'presentation' | 'reflection' | 'assessment' | 'group-work';
  exerciseInstructions?: string;
  learningObjectives?: string[];
  materialsNeeded?: string[];
  suggestedActivities?: string[];

  // Inspiration/Media section properties
  inspirationType?: 'video' | 'story' | 'quote' | 'case-study' | 'audio' | 'image' | 'external-link';
  mediaUrl?: string;
  mediaDuration?: number;
  suggestions?: string[];

  // Closing section properties
  keyTakeaways?: string[];
  actionItems?: string[];
  nextSteps?: string[];

  // Discussion/Interactive section properties
  discussionPrompts?: string[];
  engagementType?: 'individual' | 'pairs' | 'small-groups' | 'full-group';

  // Assessment properties
  assessmentType?: 'quiz' | 'reflection' | 'peer-review' | 'self-assessment';
  assessmentCriteria?: string[];

  // AI enhancement support
  aiGeneratedContent?: object;
  learningOutcomes?: string;
  trainerNotes?: string;
  deliveryGuidance?: string;

  // Topic association support
  associatedTopic?: {
    id: number;
    name: string;
    description?: string;
    learningOutcomes?: string;
    trainerNotes?: string;
    materialsNeeded?: string;
    deliveryGuidance?: string;
    matchScore?: number;
  };
  isTopicSuggestion?: boolean;

  // Speaker assignment (optional)
  trainerId?: number;
  trainerName?: string;
  speakerDuration?: number;

  // Metadata
  createdAt?: string;
  updatedAt?: string;
  isTemplate?: boolean;
  templateId?: string;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  sections: FlexibleSessionSection[];
  totalDuration: number;
  difficulty: string;
  recommendedAudienceSize: string;
  tags: string[];
  isDefault: boolean;
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type SectionType = FlexibleSessionSection['type'];

export interface SectionTypeConfig {
  type: SectionType;
  name: string;
  icon: string;
  description: string;
  defaultDuration: number;
  requiredFields: string[];
  availableFields: string[];
}

export interface SessionOutlineResponse {
  outline: SessionOutline;
  relevantTopics: any[];
  ragAvailable: boolean;
  ragSuggestions?: any;
  generationMetadata: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
}

export interface CreateSessionFromOutlineRequest {
  outline: SessionOutline;
  input: SessionBuilderInput;
  customizations?: {
    modifiedSections?: string[];
    addedTopics?: number[];
    removedSections?: string[];
  };
  readinessScore?: number;
}

export interface TopicSuggestion {
  id: number;
  name: string;
  description: string;
  category: string;
  isUsed: boolean;
  lastUsedDate?: string;
}

export interface BuilderAutosavePayload {
  metadata: SessionBuilderInput;
  outline: SessionOutline | null;
  aiPrompt: string;
  aiVersions: any[];
  acceptedVersionId?: string;
  readinessScore: number;
}

interface StoredBuilderDraft extends BuilderAutosavePayload {
  savedAt: string;
}

class SessionBuilderService {
  async generateSessionOutline(input: SessionBuilderInput, templateId?: string): Promise<SessionOutlineResponse> {
    try {
      const params = templateId ? `?template=${templateId}` : '';
      const { date, ...payload } = input;
      console.log('Sending request to backend:', { url: `/sessions/builder/suggest-outline${params}`, input: payload });
      const response = await api.post(`/sessions/builder/suggest-outline${params}`, payload);
      console.log('Backend response:', response.data);
      return response.data as SessionOutlineResponse;
    } catch (error: any) {
      console.error('API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        fullError: error
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to generate session outline');
    }
  }

  async generateLegacyOutline(input: SessionBuilderInput): Promise<SessionOutlineResponse> {
    try {
      const { date, ...payload } = input;
      const response = await api.post('/sessions/builder/suggest-legacy-outline', payload);
      return response.data as SessionOutlineResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate legacy session outline');
    }
  }

  async getSuggestionsForCategory(category: string): Promise<{ topics: any[], ragAvailable: boolean }> {
    try {
      const response = await api.get(`/sessions/builder/suggestions/${category}`);
      return response.data as { topics: any[], ragAvailable: boolean };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get category suggestions');
    }
  }

  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    try {
      const response = await api.post('/sessions/builder/test-rag');
      return response.data as { available: boolean, response?: any };
    } catch (error: any) {
      return { available: false, response: { error: error.message } };
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  }

  calculateSessionDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }

  async createSessionFromOutline(request: CreateSessionFromOutlineRequest): Promise<any> {
    try {
      // Transform outline into session creation format
      const topicId = await this.resolveTopicIdByName(request.input.category);
      const sessionData = this.transformOutlineToSession(
        request.outline,
        request.input,
        topicId,
        request.readinessScore,
      );

      const response = await api.post('/sessions', sessionData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create session from outline');
    }
  }

  async getPastTopics(categorySearch?: string, limit: number = 20): Promise<TopicSuggestion[]> {
    try {
      const params = new URLSearchParams();
      // Topics API is under /admin/topics and supports search, page, limit
      params.append('limit', String(limit));
      if (categorySearch) params.append('search', categorySearch);

      const response = await api.get(`/admin/topics?${params.toString()}`);

      const responseData = response.data as { topics: any[] };
      return (responseData.topics || []).map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
        category: topic.category?.name || 'Unknown',
        isUsed: Array.isArray(topic.sessions) && topic.sessions.length > 0,
        lastUsedDate: topic.sessions?.[0]?.createdAt
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load past topics');
    }
  }

  async getTopicDetails(topicId: number): Promise<any> {
    try {
      const response = await api.get(`/admin/topics/${topicId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load topic details');
    }
  }

  async getTrainers(search?: string, limit: number = 50): Promise<{ id: number; name: string }[]> {
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      const response = await api.get(`/admin/trainers?${params.toString()}`);
      const data = response.data as { trainers: any[] };
      return (data.trainers || []).map(t => ({ id: t.id, name: t.name }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load trainers');
    }
  }

  async saveOutlineDraft(outlineId: string, payload: BuilderAutosavePayload): Promise<void> {
    try {
      const draftData: StoredBuilderDraft = {
        ...payload,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem(`sessionBuilder_draft_${outlineId}`, JSON.stringify(draftData));
    } catch (error) {
      console.warn('Failed to save outline draft:', error);
    }
  }

  async loadOutlineDraft(outlineId: string): Promise<(StoredBuilderDraft & { outlineId: string }) | null> {
    try {
      const draftData = localStorage.getItem(`sessionBuilder_draft_${outlineId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        return {
          outlineId,
          outline: parsed.outline ?? null,
          metadata: parsed.metadata ?? parsed.input,
          aiPrompt: parsed.aiPrompt ?? '',
          aiVersions: parsed.aiVersions ?? [],
          acceptedVersionId: parsed.acceptedVersionId,
          readinessScore: parsed.readinessScore ?? 0,
          savedAt: parsed.savedAt,
        } as StoredBuilderDraft & { outlineId: string };
      }
      return null;
    } catch (error) {
      console.warn('Failed to load outline draft:', error);
      return null;
    }
  }

  async autosaveDraft(
    sessionId: string,
    payload: BuilderAutosavePayload
  ): Promise<{ savedAt: string; viaFallback?: boolean }> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/autosave`, payload);
      const savedAt = (response.data as any)?.savedAt ?? new Date().toISOString();
      await this.saveOutlineDraft(sessionId, payload);
      return { savedAt };
    } catch (error: any) {
      await this.saveOutlineDraft(sessionId, payload);
      const fallbackSavedAt = new Date().toISOString();
      if (error?.response) {
        throw new Error(error.response?.data?.message || 'Failed to autosave draft');
      }
      return { savedAt: fallbackSavedAt, viaFallback: true };
    }
  }

  private transformOutlineToSession(
    outline: SessionOutline,
    input: SessionBuilderInput,
    topicId?: string,
    readinessScore?: number,
  ): Record<string, unknown> {
    const fallbackTitle = input.title?.trim() || 'Untitled Session';
    const suggestedTitle = outline.suggestedSessionTitle?.trim();
    const title = suggestedTitle || fallbackTitle;

    const subtitleCandidate = input.title?.trim();
    const subtitle = subtitleCandidate && subtitleCandidate !== title ? subtitleCandidate : undefined;

    const objective = (outline.suggestedDescription || input.desiredOutcome || '').trim();
    const audience = (input.category || input.specificTopics || '').trim();

    const payload: Record<string, unknown> = {
      title,
      status: readinessScore && readinessScore >= 90 ? 'published' : 'draft',
      readinessScore: Math.max(0, Math.min(100, readinessScore ?? 100)),
      startTime: input.startTime,
      endTime: input.endTime,
    };

    if (subtitle) {
      payload.subtitle = subtitle;
    }

    if (audience) {
      payload.audience = audience;
    }

    if (objective) {
      payload.objective = objective;
    }

    if (topicId) {
      payload.topicId = topicId;
    }

    if (typeof input.locationId === 'number') {
      payload.locationId = input.locationId;
    }

    if (typeof input.audienceId === 'number') {
      payload.audienceId = input.audienceId;
    }

    if (typeof input.toneId === 'number') {
      payload.toneId = input.toneId;
    }

    return payload;
  }

  private generatePromptFromInput(input: SessionBuilderInput): string {
    return `Generate content for a ${input.sessionType} session about ${input.category}.
    Desired outcome: ${input.desiredOutcome}
    ${input.currentProblem ? `Problem to address: ${input.currentProblem}` : ''}
    ${input.specificTopics ? `Specific topics: ${input.specificTopics}` : ''}`;
  }

  private topicLookupCache: { map: Map<string, string>; fetchedAt: number } | null = null;

  private async resolveTopicIdByName(name?: string): Promise<string | undefined> {
    if (!name) {
      return undefined;
    }

    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return undefined;
    }

    const needsRefresh =
      !this.topicLookupCache || Date.now() - this.topicLookupCache.fetchedAt > 5 * 60 * 1000;

    if (needsRefresh) {
      try {
        const response = await api.get('/topics');
        const topics = Array.isArray(response.data) ? response.data : [];
        const map = new Map<string, string>();
        topics.forEach((topic: any) => {
          if (topic?.name && topic?.id) {
            map.set(String(topic.name).toLowerCase(), String(topic.id));
          }
        });
        this.topicLookupCache = { map, fetchedAt: Date.now() };
      } catch (error: any) {
        console.warn('Failed to refresh topic cache', error);
        this.topicLookupCache = null;
        return undefined;
      }
    }

    return this.topicLookupCache?.map.get(normalized);
  }

  // PHASE 5: Training Kit and Marketing Kit Methods

  async generateTrainingKit(sessionId: string): Promise<any> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/generate-training-kit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate training kit');
    }
  }

  async generateMarketingKit(sessionId: string): Promise<any> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/generate-marketing-kit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate marketing kit');
    }
  }

  async getTrainingKit(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`/sessions/builder/${sessionId}/training-kit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load training kit');
    }
  }

  async getMarketingKit(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`/sessions/builder/${sessionId}/marketing-kit`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load marketing kit');
    }
  }

  async saveTrainingKit(sessionId: string, trainingKitData: any): Promise<any> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/save-training-kit`, trainingKitData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save training kit');
    }
  }

  async saveMarketingKit(sessionId: string, marketingKitData: any): Promise<any> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/save-marketing-kit`, marketingKitData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to save marketing kit');
    }
  }

  async getCompleteSessionData(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`/sessions/builder/${sessionId}/complete-data`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load complete session data');
    }
  }

  // Performance optimization methods
  async preloadSessionData(sessionIds: string[]): Promise<void> {
    // Preload session data for better UX
    const promises = sessionIds.slice(0, 5).map(id => // Limit to 5 to avoid overwhelming
      this.getCompleteSessionData(id).catch(() => null) // Ignore errors for preloading
    );

    await Promise.all(promises);
  }

  // Analytics and completion tracking
  trackSessionBuilderEvent(event: string, sessionId?: string, metadata?: any): void {
    // Analytics tracking for session builder usage
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, {
          event_category: 'Session Builder',
          event_label: sessionId,
          custom_parameter_1: metadata
        });
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  calculateTimeToComplete(startTime: Date, endTime: Date = new Date()): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes
  }

  // Template Management Methods
  async getTemplates(): Promise<SessionTemplate[]> {
    try {
      const response = await api.get('/sessions/builder/templates');
      return response.data as SessionTemplate[];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load templates');
    }
  }

  async getTemplate(templateId: string): Promise<SessionTemplate> {
    try {
      const response = await api.get(`/sessions/builder/templates/${templateId}`);
      return response.data as SessionTemplate;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load template');
    }
  }

  async createTemplate(templateData: {
    name: string;
    description: string;
    sections: FlexibleSessionSection[];
    category?: string;
  }): Promise<SessionTemplate> {
    try {
      const response = await api.post('/sessions/builder/templates', templateData);
      return response.data as SessionTemplate;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create template');
    }
  }

  async getSectionTypes(): Promise<Record<string, SectionTypeConfig>> {
    try {
      const response = await api.get('/sessions/builder/section-types');
      return response.data as Record<string, SectionTypeConfig>;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to load section types');
    }
  }

  // Section Management Methods
  async addSection(outline: SessionOutline, sectionType: string, position?: number): Promise<SessionOutline> {
    try {
      const response = await api.put('/sessions/builder/outlines/sections/add', {
        outline,
        sectionType,
        position
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add section');
    }
  }

  async removeSection(outline: SessionOutline, sectionId: string): Promise<SessionOutline> {
    try {
      const response = await api.put('/sessions/builder/outlines/sections/remove', {
        outline,
        sectionId
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove section');
    }
  }

  async updateSection(outline: SessionOutline, sectionId: string, updates: Partial<FlexibleSessionSection>): Promise<SessionOutline> {
    try {
      const response = await api.put('/sessions/builder/outlines/sections/update', {
        outline,
        sectionId,
        updates
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update section');
    }
  }

  async reorderSections(outline: SessionOutline, sectionIds: string[]): Promise<SessionOutline> {
    try {
      const response = await api.put('/sessions/builder/outlines/sections/reorder', {
        outline,
        sectionIds
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reorder sections');
    }
  }

  async duplicateSection(outline: SessionOutline, sectionId: string): Promise<SessionOutline> {
    try {
      const response = await api.put('/sessions/builder/outlines/sections/duplicate', {
        outline,
        sectionId
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to duplicate section');
    }
  }

  async validateOutline(outline: SessionOutline): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      const response = await api.post('/sessions/builder/outlines/validate', outline);
      return response.data as { isValid: boolean; errors: string[] };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to validate outline');
    }
  }

  // Utility Methods for Flexible Sessions
  createDefaultSection(type: SectionType, position: number): FlexibleSessionSection {
    const id = `${type}-${Date.now()}-${position}`;
    const baseSection: FlexibleSessionSection = {
      id,
      type,
      position,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      duration: 15,
      description: `Add description for this ${type}`,
      isCollapsible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add type-specific defaults
    switch (type) {
      case 'opener':
        return {
          ...baseSection,
          icon: '🎯',
          isRequired: true,
          isCollapsible: false,
          duration: 10
        };
      case 'closing':
        return {
          ...baseSection,
          icon: '🏁',
          isRequired: true,
          isCollapsible: false,
          keyTakeaways: [],
          actionItems: [],
          nextSteps: []
        };
      case 'exercise':
        return {
          ...baseSection,
          icon: '🎮',
          isExercise: true,
          exerciseType: 'activity',
          duration: 20
        };
      case 'video':
        return {
          ...baseSection,
          icon: '🎥',
          inspirationType: 'video'
        };
      case 'discussion':
        return {
          ...baseSection,
          icon: '💬',
          engagementType: 'full-group'
        };
      default:
        return {
          ...baseSection,
          icon: '📚'
        };
    }
  }

  sortSectionsByPosition(sections: FlexibleSessionSection[]): FlexibleSessionSection[] {
    return [...sections].sort((a, b) => a.position - b.position);
  }

  calculateTotalDuration(sections: FlexibleSessionSection[]): number {
    return sections.reduce((total, section) => total + section.duration, 0);
  }

  isLegacyOutline(outline: any): outline is SessionOutlineLegacy {
    return outline && typeof outline === 'object' && 'opener' in outline && 'topic1' in outline;
  }

  isFlexibleOutline(outline: any): outline is SessionOutline {
    return outline && typeof outline === 'object' && 'sections' in outline && Array.isArray(outline.sections);
  }
}

export const sessionBuilderService = new SessionBuilderService();
