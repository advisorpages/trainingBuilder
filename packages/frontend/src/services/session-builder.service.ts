
import { api } from './api.service';
import type { LocationType, MeetingPlatform, Session } from '@leadership-training/shared';

export interface SessionBuilderInput {
  title?: string;
  category: string;
  categoryId?: number;
  categoryName?: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  topics?: Array<{
    title: string;
    description?: string;
    durationMinutes: number;
  }>;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  locationId?: number;
  locationName?: string;
  locationType?: LocationType;
  meetingPlatform?: MeetingPlatform;
  locationCapacity?: number;
  locationTimezone?: string;
  locationNotes?: string;
  audienceId?: number;
  audienceName?: string;
  toneId?: number;
  toneName?: string;
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

export interface MultiVariantResponse {
  variants: Array<{
    id: string;
    outline: SessionOutline;
    generationSource: 'rag' | 'baseline';
    ragWeight: number;
    ragSourcesUsed: number;
    label: string;
    description: string;
  }>;
  metadata: {
    processingTime: number;
    ragAvailable: boolean;
    ragSourcesFound: number;
    totalVariants: number;
    averageSimilarity?: number;
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
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  defaultDurationMinutes?: number;
}

export interface BuilderAutosavePayload {
  metadata: SessionBuilderInput;
  outline: SessionOutline | null;
  aiPrompt: string;
  aiVersions: any[];
  acceptedVersionId?: string;
  readinessScore: number;
}

const sanitizeSessionBuilderInput = (input: SessionBuilderInput) => {
  const {
    date: _date,
    categoryId: _categoryId,
    categoryName: _categoryName,
    toneName: _toneName,
    ...cleanInput
  } = input;

  return cleanInput;
};

type TopicPersistencePayload = {
  name: string;
  description?: string;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  aiGeneratedContent?: Record<string, unknown>;
};

export class SessionBuilderService {
  async generateSessionOutline(input: SessionBuilderInput, templateId?: string): Promise<SessionOutlineResponse> {
    try {
      const params = templateId ? `?template=${templateId}` : '';
      const payload = sanitizeSessionBuilderInput(input);
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
      const payload = sanitizeSessionBuilderInput(input);
      const response = await api.post('/sessions/builder/suggest-legacy-outline', payload);
      return response.data as SessionOutlineResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate legacy session outline');
    }
  }

  async generateMultipleOutlines(input: SessionBuilderInput): Promise<MultiVariantResponse> {
    try {
      const payload = sanitizeSessionBuilderInput(input);
      const response = await api.post('/sessions/builder/suggest-outline-v2', payload);
      return response.data as MultiVariantResponse;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate session variants');
    }
  }

  async logVariantSelection(
    sessionId: string,
    variantDetails: {
      variantId: string;
      generationSource: 'rag' | 'baseline';
      ragWeight: number;
      ragSourcesUsed: number;
      category: string;
    }
  ): Promise<void> {
    try {
      await api.post(`/sessions/builder/${sessionId}/log-variant-selection`, variantDetails);
    } catch (error: any) {
      console.error('Failed to log variant selection', error);
    }
  }

  async createDraft(payload: Partial<BuilderAutosavePayload> = {}): Promise<{ draftId: string; savedAt: string }> {
    try {
      const response = await api.post('/sessions/builder/drafts', payload);
      return response.data as { draftId: string; savedAt: string };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create builder draft');
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
      const topicIds = await this.ensureTopicsFromOutline(
        request.outline,
        request.input.categoryName ?? request.input.category,
      );

      const sessionData = this.transformOutlineToSession(
        request.outline,
        request.input,
        topicIds,
        request.readinessScore,
      );

      console.log('Session data being sent to backend:', sessionData);
      const response = await api.post<Session>('/sessions', sessionData);
      const createdSession = response.data;

      return createdSession;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create session from outline');
    }
  }

  async getPastTopics(categorySearch?: string, limit = 20): Promise<TopicSuggestion[]> {
    try {
      console.log('🔍 getPastTopics called with:', { categorySearch, limit });
      console.log('🌐 API base URL:', (import.meta as any).env?.VITE_API_URL || '/api');
      const response = await api.get<Array<any>>('/topics');
      console.log('📡 API response received:', response.data);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      const topics = Array.isArray(response.data) ? response.data : [];
      console.log('📊 Topics array length:', topics.length);
      console.log('📋 First topic (if any):', topics[0]);

      const filtered = topics.filter((topic: any) => {
        if (!categorySearch) return true;
        const haystack = `${topic.name} ${topic.description ?? ''} ${topic.category?.name ?? ''} ${topic.aiGeneratedContent?.categoryName ?? ''}`.toLowerCase();
        return haystack.includes(categorySearch.toLowerCase());
      });

      console.log('🔍 Filtered topics length:', filtered.length);

      const transformed = filtered
        .slice(0, limit)
        .map((topic: any) => {
          const aiMeta = topic.aiGeneratedContent ?? {};
          const categoryName = topic.category?.name ?? aiMeta.categoryName ?? 'Unknown';
          return {
            id: topic.id,
            name: topic.name,
            description: topic.description || '',
            category: categoryName,
            isUsed: Array.isArray(topic.sessions) && topic.sessions.length > 0,
            lastUsedDate: topic.sessions?.[0]?.createdAt,
            learningOutcomes: topic.learningOutcomes || aiMeta.learningOutcomes || '',
            trainerNotes: topic.trainerNotes || aiMeta.trainerNotes || '',
            materialsNeeded: topic.materialsNeeded || aiMeta.materialsNeeded || '',
            deliveryGuidance: topic.deliveryGuidance || aiMeta.deliveryGuidance || '',
            defaultDurationMinutes: aiMeta.defaultDurationMinutes,
          };
        });

      console.log('✅ Transformed topics:', transformed);
      return transformed;
    } catch (error: any) {
      console.error('❌ Error in getPastTopics:', error);
      console.error('❌ Error response:', error.response);
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

  async getTrainers(search?: string, limit = 50): Promise<{ id: number; name: string }[]> {
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

  async autosaveDraft(
    sessionId: string,
    payload: BuilderAutosavePayload
  ): Promise<{ savedAt: string }> {
    try {
      const response = await api.post(`/sessions/builder/${sessionId}/autosave`, payload);
      const savedAt = (response.data as any)?.savedAt ?? new Date().toISOString();
      return { savedAt };
    } catch (error: any) {
      if (error?.response) {
        throw new Error(error.response?.data?.message || 'Failed to autosave draft');
      }
      throw error;
    }
  }

  private transformOutlineToSession(
    outline: SessionOutline,
    input: SessionBuilderInput,
    topicIds?: number[],
    readinessScore?: number,
  ): Record<string, unknown> {
    const fallbackTitle = input.title?.trim() || 'Untitled Session';
    const suggestedTitle = outline.suggestedSessionTitle?.trim();
    const title = suggestedTitle || fallbackTitle;

    const subtitleCandidate = input.title?.trim();
    const subtitle = subtitleCandidate && subtitleCandidate !== title ? subtitleCandidate : undefined;

    const objective = (outline.suggestedDescription || input.desiredOutcome || '').trim();
    const audience = (input.category || input.specificTopics || '').trim();
    const normalizedReadiness = Math.max(0, Math.min(100, readinessScore ?? 0));
    const shouldPublish = normalizedReadiness >= 90;

    const payload: Record<string, unknown> = {
      title,
      status: shouldPublish ? 'published' : 'draft',
      readinessScore: normalizedReadiness,
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

    if (typeof input.categoryId === 'number' && !Number.isNaN(input.categoryId)) {
      payload.categoryId = input.categoryId;
    }

    if (Array.isArray(topicIds) && topicIds.length > 0) {
      const uniqueIds = Array.from(
        new Set(
          topicIds
            .map((value) => Number(value))
            .filter((value) => typeof value === 'number' && !Number.isNaN(value)),
        ),
      );

      if (uniqueIds.length > 0) {
        payload.topicIds = uniqueIds;
        if (uniqueIds.length === 1) {
          payload.topicId = uniqueIds[0];
        }
      }
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

  private topicLookupCache: { map: Map<string, number>; fetchedAt: number } | null = null;

  private async getTopicLookup(forceRefresh = false): Promise<Map<string, number>> {
    const isStale =
      forceRefresh ||
      !this.topicLookupCache ||
      Date.now() - this.topicLookupCache.fetchedAt > 5 * 60 * 1000;

    if (isStale) {
      try {
        const response = await api.get('/topics');
        const topics = Array.isArray(response.data) ? response.data : [];
        const map = new Map<string, number>();
        topics.forEach((topic: any) => {
          if (topic?.name && topic?.id) {
            const normalized = String(topic.name).trim().toLowerCase();
            if (normalized) {
              map.set(normalized, Number(topic.id));
            }
          }
        });
        this.topicLookupCache = { map, fetchedAt: Date.now() };
      } catch (error: any) {
        console.warn('Failed to refresh topic cache', error);
        this.topicLookupCache = null;
        return new Map();
      }
    }

    return this.topicLookupCache?.map ?? new Map<string, number>();
  }

  private buildTopicPayload(
    section: FlexibleSessionSection,
    categoryName?: string,
  ): TopicPersistencePayload | null {
    const rawName = section.associatedTopic?.name ?? section.title;
    const name = typeof rawName === 'string' ? rawName.trim() : '';

    if (!name) {
      return null;
    }

    const payload: TopicPersistencePayload = { name };

    if (typeof section.description === 'string' && section.description.trim()) {
      payload.description = section.description.trim();
    }

    if (Array.isArray(section.learningObjectives) && section.learningObjectives.length > 0) {
      payload.learningOutcomes = section.learningObjectives.join('\n');
    }

    if (typeof section.trainerNotes === 'string' && section.trainerNotes.trim()) {
      payload.trainerNotes = section.trainerNotes.trim();
    }

    if (Array.isArray(section.materialsNeeded) && section.materialsNeeded.length > 0) {
      payload.materialsNeeded = section.materialsNeeded.join('\n');
    }

    if (typeof section.deliveryGuidance === 'string' && section.deliveryGuidance.trim()) {
      payload.deliveryGuidance = section.deliveryGuidance.trim();
    }

    if (!payload.description && typeof section.associatedTopic?.description === 'string') {
      const trimmed = section.associatedTopic.description.trim();
      if (trimmed) {
        payload.description = trimmed;
      }
    }

    if (!payload.learningOutcomes && typeof section.associatedTopic?.learningOutcomes === 'string') {
      const trimmed = section.associatedTopic.learningOutcomes.trim();
      if (trimmed) {
        payload.learningOutcomes = trimmed;
      }
    }

    if (!payload.trainerNotes && typeof section.associatedTopic?.trainerNotes === 'string') {
      const trimmed = section.associatedTopic.trainerNotes.trim();
      if (trimmed) {
        payload.trainerNotes = trimmed;
      }
    }

    if (!payload.materialsNeeded && typeof section.associatedTopic?.materialsNeeded === 'string') {
      const trimmed = section.associatedTopic.materialsNeeded.trim();
      if (trimmed) {
        payload.materialsNeeded = trimmed;
      }
    }

    if (!payload.deliveryGuidance && typeof section.associatedTopic?.deliveryGuidance === 'string') {
      const trimmed = section.associatedTopic.deliveryGuidance.trim();
      if (trimmed) {
        payload.deliveryGuidance = trimmed;
      }
    }

    const aiGeneratedContent: Record<string, unknown> = {
      source: 'session-builder',
      capturedAt: new Date().toISOString(),
      sectionId: section.id,
      sectionType: section.type,
      sectionTitle: section.title,
    };

    if (categoryName) {
      aiGeneratedContent.categoryName = categoryName;
    }

    if (typeof section.duration === 'number' && !Number.isNaN(section.duration)) {
      aiGeneratedContent.defaultDurationMinutes = section.duration;
    }

    if (Array.isArray(section.learningObjectives) && section.learningObjectives.length > 0) {
      aiGeneratedContent.learningObjectives = section.learningObjectives;
    }

    if (section.trainerNotes) {
      aiGeneratedContent.trainerNotes = section.trainerNotes;
    }

    if (section.materialsNeeded) {
      aiGeneratedContent.materialsNeeded = section.materialsNeeded;
    }

    if (section.deliveryGuidance) {
      aiGeneratedContent.deliveryGuidance = section.deliveryGuidance;
    }

    if (Array.isArray(section.suggestedActivities) && section.suggestedActivities.length > 0) {
      aiGeneratedContent.suggestedActivities = section.suggestedActivities;
    }

    payload.aiGeneratedContent = aiGeneratedContent;

    return payload;
  }

  private async ensureTopicsFromOutline(
    outline: SessionOutline,
    categoryName?: string,
  ): Promise<number[]> {
    if (!outline?.sections?.length) {
      return [];
    }

    const lookup = await this.getTopicLookup();
    const topicIds: number[] = [];
    const seenTopicIds = new Set<number>();

    const topicSections = outline.sections.filter((section) => section.type === 'topic');

    for (const section of topicSections) {
      const payload = this.buildTopicPayload(section, categoryName);
      if (!payload) {
        continue;
      }

      const normalizedNames = new Set<string>();
      if (typeof payload.name === 'string') {
        const normalized = payload.name.toLowerCase();
        if (normalized) {
          normalizedNames.add(normalized);
        }
      }

      if (section.title) {
        const normalized = section.title.trim().toLowerCase();
        if (normalized) {
          normalizedNames.add(normalized);
        }
      }

      if (section.associatedTopic?.name) {
        const normalized = section.associatedTopic.name.trim().toLowerCase();
        if (normalized) {
          normalizedNames.add(normalized);
        }
      }

      let topicId: number | undefined;
      const associatedId = (section.associatedTopic?.id ??
        (section.associatedTopic as any)?.topicId ??
        (section as any).topicId) as number | string | undefined;

      if (associatedId !== undefined && associatedId !== null) {
        const parsed = Number(associatedId);
        if (!Number.isNaN(parsed)) {
          topicId = parsed;
        }
      }

      if (!topicId) {
        for (const key of normalizedNames) {
          const existing = lookup.get(key);
          if (typeof existing === 'number' && !Number.isNaN(existing)) {
            topicId = existing;
            break;
          }
        }
      }

      if (!topicId) {
        try {
          const response = await api.post('/topics', payload);
          const topic = response.data as { id?: number | string } | undefined;
          if (topic?.id !== undefined && topic?.id !== null) {
            const parsed = Number(topic.id);
            if (!Number.isNaN(parsed)) {
              topicId = parsed;
            }
          }
        } catch (error) {
          console.warn(`Failed to create topic "${String(payload.name)}" from outline`, error);
          continue;
        }
      } else {
        try {
          await api.patch(`/topics/${topicId}`, payload);
        } catch (error) {
          console.warn(`Failed to update topic "${String(payload.name)}" (ID: ${topicId})`, error);
        }
      }

      if (!topicId || Number.isNaN(topicId)) {
        continue;
      }

      for (const key of normalizedNames) {
        if (key) {
          lookup.set(key, topicId);
        }
      }

      if (!seenTopicIds.has(topicId)) {
        seenTopicIds.add(topicId);
        topicIds.push(topicId);
      }
    }

    if (topicIds.length > 0) {
      this.topicLookupCache = { map: lookup, fetchedAt: Date.now() };
    }

    return topicIds;
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
  async addSection(sessionId: string, sectionType: SectionType, position?: number): Promise<SessionOutline> {
    try {
      const response = await api.put(`/sessions/builder/${sessionId}/outlines/sections/add`, {
        sectionType,
        position
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add section');
    }
  }

  async removeSection(sessionId: string, sectionId: string): Promise<SessionOutline> {
    try {
      const response = await api.put(`/sessions/builder/${sessionId}/outlines/sections/remove`, {
        sectionId
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove section');
    }
  }

  async updateSection(sessionId: string, sectionId: string, updates: Partial<FlexibleSessionSection>): Promise<SessionOutline> {
    try {
      const response = await api.put(`/sessions/builder/${sessionId}/outlines/sections/update`, {
        sectionId,
        updates
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update section');
    }
  }

  async reorderSections(sessionId: string, sectionIds: string[]): Promise<SessionOutline> {
    try {
      const response = await api.put(`/sessions/builder/${sessionId}/outlines/sections/reorder`, {
        sectionIds
      });
      return response.data as SessionOutline;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to reorder sections');
    }
  }

  async duplicateSection(sessionId: string, sectionId: string): Promise<SessionOutline> {
    try {
      const response = await api.put(`/sessions/builder/${sessionId}/outlines/sections/duplicate`, {
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
