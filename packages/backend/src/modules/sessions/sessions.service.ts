import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import {
  Incentive,
  Session,
  SessionBuilderDraft,
  SessionContentVersion,
  SessionStatus,
  SessionStatusLog,
  Topic,
  Location,
  Audience,
  Tone,
  LocationType,
  MeetingPlatform,
} from '../../entities';
import { ReadinessScore, ReadinessScoringService } from './services/readiness-scoring.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateContentVersionDto } from './dto/create-content-version.dto';
import { BuilderAutosaveDto } from './dto/builder-autosave.dto';
import {
  SuggestOutlineDto,
  SuggestOutlineResponse,
  SuggestedSessionSection,
  TopicReference,
} from './dto/suggest-outline.dto';
import { CreateBuilderDraftDto } from './dto/create-builder-draft.dto';
import {
  AddOutlineSectionDto,
  UpdateOutlineSectionDto,
  RemoveOutlineSectionDto,
  ReorderOutlineSectionsDto,
  DuplicateOutlineSectionDto,
} from './dto/outline-section.dto';
import { OpenAIService, OpenAISessionOutlineRequest, OutlineGenerationContext } from '../../services/openai.service';
import { PromptRegistryService } from '../../services/prompt-registry.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AIInteractionType, AIInteractionStatus } from '../../entities/ai-interaction.entity';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';
import { VariantConfigService } from '../../services/variant-config.service';
import {
  AiPromptSettingsService,
  PromptSandboxSettings,
  PromptVariantPersona,
} from '../../services/ai-prompt-settings.service';

export interface RagSource {
  filename: string;
  category: string;
  similarity: number;
  excerpt: string;
  createdAt?: string;
}

export interface Variant {
  id: string;
  outline: any;
  generationSource: 'rag' | 'baseline';
  ragWeight: number;
  ragSourcesUsed: number;
  ragSources?: RagSource[]; // NEW: Include RAG sources per variant
  label: string;
  description: string;
}

export interface MultiVariantResponse {
  variants: Variant[];
  metadata: {
    processingTime: number;
    ragAvailable: boolean;
    ragSourcesFound: number;
    totalVariants: number;
    averageSimilarity?: number;
  };
}

type SectionType =
  | 'opener'
  | 'topic'
  | 'exercise'
  | 'inspiration'
  | 'closing'
  | 'video'
  | 'discussion'
  | 'presentation'
  | 'break'
  | 'assessment'
  | 'custom';

interface FlexibleSessionSection {
  id: string;
  type: SectionType;
  position: number;
  title: string;
  duration: number;
  description?: string;
  isRequired?: boolean;
  isCollapsible?: boolean;
  icon?: string;
  isExercise?: boolean;
  exerciseType?: string;
  engagementType?: string;
  inspirationType?: string;
  learningObjectives?: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];
  keyTakeaways?: string[];
  actionItems?: string[];
  nextSteps?: string[];
  trainerId?: number;
  trainerName?: string;
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
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface SessionOutlinePayload {
  sections: FlexibleSessionSection[];
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: string;
  recommendedAudienceSize: string;
  ragSuggestions?: unknown;
  ragSources?: RagSource[]; // NEW: Store RAG sources with outline
  fallbackUsed: boolean;
  generatedAt: string;
  convertedFromLegacy?: boolean;
  convertedAt?: string;
}

interface LocationPromptContext {
  id?: number;
  name?: string;
  locationType?: LocationType;
  meetingPlatform?: MeetingPlatform | null;
  capacity?: number | null;
  timezone?: string | null;
  notes?: string | null;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(Incentive)
    private readonly incentivesRepository: Repository<Incentive>,
    @InjectRepository(SessionContentVersion)
    private readonly contentRepository: Repository<SessionContentVersion>,
    @InjectRepository(SessionStatusLog)
    private readonly statusLogsRepository: Repository<SessionStatusLog>,
    @InjectRepository(SessionBuilderDraft)
    private readonly draftsRepository: Repository<SessionBuilderDraft>,
    @InjectRepository(Location)
    private readonly locationsRepository: Repository<Location>,
    private readonly readinessScoringService: ReadinessScoringService,
    private readonly openAIService: OpenAIService,
    private readonly promptRegistry: PromptRegistryService,
    private readonly ragService: RagIntegrationService,
    private readonly aiInteractionsService: AIInteractionsService,
    private readonly configService: ConfigService,
    private readonly analyticsTelemetry: AnalyticsTelemetryService,
    private readonly promptSettingsService: AiPromptSettingsService,
    private readonly variantConfigService: VariantConfigService,
  ) {
    this.enableVariantGenerationV2 = this.configService.get<boolean>('ENABLE_VARIANT_GENERATION_V2', false);
    this.variantRolloutPercentage = this.configService.get<number>('VARIANT_GENERATION_ROLLOUT_PERCENTAGE', 0);
    this.logVariantSelections = this.configService.get<boolean>('LOG_VARIANT_SELECTIONS', true);
  }

  private applyPublishTimestamp(session: Session, previousStatus: SessionStatus) {
    if (session.status === SessionStatus.PUBLISHED && previousStatus !== SessionStatus.PUBLISHED) {
      session.publishedAt = session.publishedAt ?? new Date();
    }

    if (session.status !== SessionStatus.PUBLISHED && previousStatus === SessionStatus.PUBLISHED) {
      session.publishedAt = null;
    }
  }

  private async recordStatusTransition(
    session: Session,
    previousStatus: SessionStatus,
    readiness: ReadinessScore,
    remark?: string,
  ) {
    if (previousStatus === session.status) {
      return;
    }

    // Ensure session.status is valid before creating log
    if (!session.status) {
      console.error(`Cannot record status transition: session ${session.id} has invalid status: ${session.status}`);
      return;
    }

    const log = this.statusLogsRepository.create({
      session,
      fromStatus: previousStatus,
      toStatus: session.status,
      readinessScore: readiness.percentage,
      checklistSnapshot: {
        checks: readiness.checks,
        recommendedActions: readiness.recommendedActions,
      },
      remark,
    });

    await this.statusLogsRepository.save(log);
  }

  async findAll(filters?: {
    status?: SessionStatus;
    topicId?: number;
    trainerId?: string;
  }): Promise<Session[]> {
    const queryBuilder = this.sessionsRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.topic', 'topic')
      .leftJoinAndSelect('session.landingPage', 'landingPage')
      .leftJoinAndSelect('session.incentives', 'incentives')
      .leftJoinAndSelect('session.trainerAssignments', 'trainerAssignments')
      .leftJoinAndSelect('trainerAssignments.trainer', 'trainer')
      .orderBy('session.updatedAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('session.status = :status', { status: filters.status });
    }

    if (filters?.topicId !== undefined) {
      queryBuilder.andWhere('session.topicId = :topicId', { topicId: filters.topicId });
    }

    if (filters?.trainerId) {
      queryBuilder.andWhere('trainerAssignments.trainerId = :trainerId', { trainerId: filters.trainerId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Session> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['topic', 'landingPage', 'incentives', 'trainerAssignments', 'contentVersions', 'agendaItems'],
    });

    if (!session) {
      throw new NotFoundException(`Session ${id} not found`);
    }

    return session;
  }

  async create(dto: CreateSessionDto): Promise<Session> {
    const topic = dto.topicId ? await this.findTopic(dto.topicId) : undefined;
    const incentives = dto.incentiveIds?.length
      ? await this.incentivesRepository.find({ where: { id: In(dto.incentiveIds) } })
      : [];

    const session = this.sessionsRepository.create({
      title: dto.title,
      subtitle: dto.subtitle,
      objective: dto.objective,
      status: dto.status ?? SessionStatus.DRAFT,
      readinessScore: dto.readinessScore ?? 0,
      topic,
      incentives,
    });

    if (dto.startTime) {
      session.scheduledAt = new Date(dto.startTime);
    }

    if (dto.endTime && dto.startTime) {
      const start = new Date(dto.startTime).getTime();
      const end = new Date(dto.endTime).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
        session.durationMinutes = Math.floor((end - start) / (60 * 1000));
      }
    }

    if (dto.locationId !== undefined) {
      session.locationId = dto.locationId;
    }

    if (dto.audienceId !== undefined) {
      session.audienceId = dto.audienceId;
    }

    if (dto.toneId !== undefined) {
      session.toneId = dto.toneId;
    }

    if (session.status === SessionStatus.PUBLISHED) {
      session.publishedAt = session.publishedAt ?? new Date();
    }

    return this.sessionsRepository.save(session);
  }

  async update(id: string, dto: UpdateSessionDto): Promise<Session> {
    const session = await this.findOne(id);
    const previousStatus = session.status;

    if (dto.topicId) {
      session.topic = await this.findTopic(dto.topicId);
    }

    if (dto.incentiveIds) {
      session.incentives = await this.incentivesRepository.find({ where: { id: In(dto.incentiveIds) } });
    }

    if (dto.title !== undefined) session.title = dto.title;
    if (dto.subtitle !== undefined) session.subtitle = dto.subtitle;
    if (dto.objective !== undefined) session.objective = dto.objective;
    if (dto.locationId !== undefined) session.locationId = dto.locationId;
    if (dto.audienceId !== undefined) session.audienceId = dto.audienceId;
    if (dto.toneId !== undefined) session.toneId = dto.toneId;

    if (dto.startTime !== undefined) {
      session.scheduledAt = dto.startTime ? new Date(dto.startTime) : undefined;
    }

    if (dto.endTime !== undefined || dto.startTime !== undefined) {
      const startTimestamp = session.scheduledAt?.getTime();
      const endTimestamp = dto.endTime ? new Date(dto.endTime).getTime() : undefined;

      if (
        startTimestamp !== undefined &&
        !Number.isNaN(startTimestamp) &&
        endTimestamp !== undefined &&
        !Number.isNaN(endTimestamp) &&
        endTimestamp > startTimestamp
      ) {
        session.durationMinutes = Math.floor((endTimestamp - startTimestamp) / (60 * 1000));
      } else if (dto.endTime !== undefined && !endTimestamp) {
        session.durationMinutes = undefined;
      }
    }

    if (dto.status !== undefined) session.status = dto.status;
    if (dto.readinessScore !== undefined) session.readinessScore = dto.readinessScore;

    let readiness: ReadinessScore | null = null;
    if (dto.status !== undefined && dto.status !== previousStatus) {
      this.applyPublishTimestamp(session, previousStatus);
      readiness = await this.readinessScoringService.calculateReadinessScore(session);
      if (dto.readinessScore === undefined) {
        session.readinessScore = readiness.percentage;
      }
    }

    const saved = await this.sessionsRepository.save(session);

    if (readiness) {
      await this.recordStatusTransition(saved, previousStatus, readiness);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.sessionsRepository.remove(session);
  }

  async bulkDelete(sessionIds: string[]): Promise<{ deleted: number }> {
    if (!sessionIds || sessionIds.length === 0) {
      return { deleted: 0 };
    }

    const sessions = await this.sessionsRepository.find({
      where: { id: In(sessionIds) },
    });

    if (sessions.length === 0) {
      return { deleted: 0 };
    }

    await this.sessionsRepository.remove(sessions);
    return { deleted: sessions.length };
  }

  async createContentVersion(sessionId: string, payload: CreateContentVersionDto) {
    const session = await this.findOne(sessionId);
    const version = this.contentRepository.create({ ...payload, session });
    return this.contentRepository.save(version);
  }

  private readonly logger = new Logger(SessionsService.name);
  private readonly enableVariantGenerationV2: boolean;
  private readonly variantRolloutPercentage: number;
  private readonly logVariantSelections: boolean;

  private async findMatchingTopics(sections: SuggestedSessionSection[]): Promise<TopicReference[]> {
    try {
      // Get all active topics from the database
      const allTopics = await this.topicsRepository.find({
        where: { isActive: true },
      });

      const matchingTopics: TopicReference[] = [];

      // Simple keyword-based matching for now
      // In a more advanced implementation, you might use semantic similarity
      for (const section of sections) {
        if (section.type === 'topic') {
          const sectionText = `${section.title} ${section.description} ${section.learningObjectives?.join(' ') || ''}`.toLowerCase();

          for (const topic of allTopics) {
            const topicText = `${topic.name} ${topic.description || ''} ${topic.learningOutcomes || ''}`.toLowerCase();

            // Calculate simple text similarity score
            const matchScore = this.calculateTextSimilarity(sectionText, topicText);

            if (matchScore > 0.3) { // Threshold for considering it a match
              const topicRef: TopicReference = {
                id: topic.id,
                name: topic.name,
                description: topic.description,
                learningOutcomes: topic.learningOutcomes,
                trainerNotes: topic.trainerNotes,
                materialsNeeded: topic.materialsNeeded,
                deliveryGuidance: topic.deliveryGuidance,
                matchScore,
              };

              // Check if we already have this topic (avoid duplicates)
              if (!matchingTopics.find(t => t.id === topic.id)) {
                matchingTopics.push(topicRef);
              }
            }
          }
        }
      }

      // Sort by match score descending and limit to top 10
      return matchingTopics
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
        .slice(0, 10);

    } catch (error) {
      this.logger.error('Error finding matching topics:', error);
      return [];
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple keyword overlap calculation
    const words1 = new Set(text1.split(' ').filter(word => word.length > 3));
    const words2 = new Set(text2.split(' ').filter(word => word.length > 3));

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async associateTopicsWithSections(sections: SuggestedSessionSection[], matchingTopics: TopicReference[]): Promise<SuggestedSessionSection[]> {
    const enhancedSections = [...sections];

    for (let i = 0; i < enhancedSections.length; i++) {
      const section = enhancedSections[i];

      if (section.type === 'topic') {
        const sectionText = `${section.title} ${section.description}`.toLowerCase();

        // Find the best matching topic for this section
        let bestMatch: TopicReference | undefined;
        let bestScore = 0;

        for (const topic of matchingTopics) {
          const topicText = `${topic.name} ${topic.description || ''}`.toLowerCase();
          const score = this.calculateTextSimilarity(sectionText, topicText);

          if (score > bestScore && score > 0.2) { // Lower threshold for association
            bestMatch = topic;
            bestScore = score;
          }
        }

        if (bestMatch) {
          enhancedSections[i] = {
            ...section,
            associatedTopic: bestMatch,
            isTopicSuggestion: false,
          };
        } else {
          // Mark as a topic suggestion if no good match found
          enhancedSections[i] = {
            ...section,
            isTopicSuggestion: true,
          };
        }
      }
    }

    return enhancedSections;
  }

  async suggestOutline(payload: SuggestOutlineDto): Promise<SuggestOutlineResponse> {
    const startTime = Date.now();
    const now = new Date();

    // Calculate session duration from start/end times
    const duration = payload.startTime && payload.endTime
      ? Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000)
      : 60; // Default to 60 minutes

    // Fetch audience data if audienceId is provided
    let audience = null;
    if (payload.audienceId) {
      try {
        audience = await this.sessionsRepository.manager.findOne('audiences', {
          where: { id: payload.audienceId }
        });
      } catch (error) {
        this.logger.warn(`Failed to fetch audience ${payload.audienceId}:`, error.message);
      }
    }

    // Fetch tone data if toneId is provided
    let tone = null;
    if (payload.toneId) {
      try {
        tone = await this.sessionsRepository.manager.findOne('tones', {
          where: { id: payload.toneId }
        });
      } catch (error) {
        this.logger.warn(`Failed to fetch tone ${payload.toneId}:`, error.message);
      }
    }

    // Fetch location data if provided (useful for prompt enrichment)
    let location: Location | null = null;
    if (payload.locationId) {
      try {
        location = await this.locationsRepository.findOne({ where: { id: payload.locationId } });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch location ${payload.locationId}: ${message}`);
      }
    }

    const promptSettings = await this.promptSettingsService.getCurrentSettings();
    const sandboxSettings = promptSettings.settings;
    const baselinePersona = sandboxSettings.variantPersonas?.[0] ?? null;
    const quickTweaks = sandboxSettings.quickTweaks;
    const quickDirectives = this.buildQuickTweakDirectives(quickTweaks);
    const baselineContext = this.buildOutlineGenerationContext({
      sandboxSettings,
      duration,
      variant: baselinePersona
        ? {
            index: 0,
            label: baselinePersona.label,
            description: baselinePersona.summary,
            instruction: baselinePersona.prompt,
            persona: baselinePersona,
          }
        : undefined,
      ragWeight: 0,
      ragSources: 0,
      quickDirectives,
    });

    let useOpenAI = false;
    let aiOutline: any = null;
    let fallbackUsed = false;

    // Try OpenAI first if configured
    if (this.openAIService.isConfigured()) {
      try {
        this.logger.log(`Attempting OpenAI generation for session: ${payload.title || payload.category}`);

        const openAIRequest: OpenAISessionOutlineRequest = {
          title: payload.title,
          category: payload.category,
          sessionType: payload.sessionType,
          desiredOutcome: payload.desiredOutcome,
          currentProblem: payload.currentProblem,
          specificTopics: payload.specificTopics,
          duration,
          audienceSize: payload.audienceSize || '8-20',
          audienceId: payload.audienceId,
          toneId: payload.toneId,
          locationId: location?.id ?? payload.locationId,
          locationName: location?.name ?? payload.locationName,
          locationType: location?.locationType ?? payload.locationType,
          meetingPlatform: location?.meetingPlatform ?? payload.meetingPlatform,
          locationCapacity: location?.capacity ?? payload.locationCapacity,
          locationTimezone: location?.timezone ?? payload.locationTimezone,
          locationNotes: (location?.notes ?? location?.accessInstructions) ?? payload.locationNotes,
          variantIndex: baselinePersona ? 0 : undefined,
          variantLabel: baselinePersona?.label,
          variantInstruction: baselinePersona?.prompt ?? undefined,
          variantDescription: baselinePersona?.summary ?? undefined,
          overrideDirectives: quickDirectives.length ? quickDirectives : undefined,
        };

        // Add rich audience profile if available
        if (audience) {
          openAIRequest.audienceName = audience.name;
          openAIRequest.audienceDescription = audience.description;
          openAIRequest.audienceExperienceLevel = audience.experienceLevel;
          openAIRequest.audienceTechnicalDepth = audience.technicalDepth;
          openAIRequest.audienceCommunicationStyle = audience.communicationStyle;
          openAIRequest.audienceVocabularyLevel = audience.vocabularyLevel;
          openAIRequest.audienceLearningStyle = audience.preferredLearningStyle;
          openAIRequest.audienceExampleTypes = audience.exampleTypes;
          openAIRequest.audienceAvoidTopics = audience.avoidTopics;
          openAIRequest.audienceInstructions = audience.promptInstructions;
        }

        // Add rich tone profile if available
        if (tone) {
          openAIRequest.toneName = tone.name;
          openAIRequest.toneDescription = tone.description;
          openAIRequest.toneStyle = tone.style;
          openAIRequest.toneFormality = tone.formality;
          openAIRequest.toneEnergyLevel = tone.energyLevel;
          openAIRequest.toneSentenceStructure = tone.sentenceStructure;
          openAIRequest.toneLanguageCharacteristics = tone.languageCharacteristics;
          openAIRequest.toneEmotionalResonance = tone.emotionalResonance;
          openAIRequest.toneExamplePhrases = tone.examplePhrases;
          openAIRequest.toneInstructions = tone.promptInstructions;
        }

        aiOutline = await this.openAIService.generateSessionOutline(openAIRequest, undefined, undefined, baselineContext);
        useOpenAI = true;
        this.logger.log('Successfully generated outline using OpenAI');
      } catch (error) {
        this.logger.error('OpenAI generation failed, falling back to template', error.message);
        fallbackUsed = true;
      }
    } else {
      this.logger.warn('OpenAI not configured, using template fallback');
      fallbackUsed = true;
    }

    let sections: SuggestedSessionSection[];
    let sessionTitle: string;
    let description: string;
    let difficulty: string;
    let recommendedAudienceSize: string;

    if (useOpenAI && aiOutline) {
      // Convert OpenAI response to our format
      sections = aiOutline.sections.map((section: any, index: number) => ({
        id: `ai-${now.getTime()}-${index}`,
        type: this.mapSectionType(section.title, index),
        position: index,
        title: section.title,
        duration: section.duration,
        description: section.description,
        learningObjectives: section.learningObjectives || [],
        suggestedActivities: section.suggestedActivities || [],
      }));

      sessionTitle = aiOutline.suggestedTitle;
      description = aiOutline.summary;
      difficulty = aiOutline.difficulty || 'Intermediate';
      recommendedAudienceSize = aiOutline.recommendedAudienceSize || '8-20';
    } else {
      // Fallback to template-based generation
      sections = [
        {
          id: `intro-${now.getTime()}`,
          type: 'opener',
          position: 0,
          title: 'Welcome & Context Setting',
          duration: Math.round(duration * 0.15), // ~15% of total time
          description: `Open the ${payload.sessionType} with a quick framing that highlights why ${payload.category.toLowerCase()} matters right now.`,
          learningObjectives: ['Establish psychological safety', 'Align on session outcomes'],
        },
        {
          id: `core-${now.getTime() + 1}`,
          type: 'topic',
          position: 1,
          title: 'Core Concepts & Stories',
          duration: Math.round(duration * 0.4), // ~40% of total time
          description: `Introduce the primary frameworks and reference recent examples that map to the desired outcome: ${payload.desiredOutcome}.`,
          learningObjectives: payload.specificTopics
            ? payload.specificTopics.split(',').map((topic) => topic.trim()).filter(Boolean)
            : undefined,
        },
        {
          id: `apply-${now.getTime() + 2}`,
          type: 'exercise',
          position: 2,
          title: 'Application Lab',
          duration: Math.round(duration * 0.3), // ~30% of total time
          description: 'Move the group into pairs or triads to translate the ideas into their current challenges.',
          suggestedActivities: ['Role-play scenarios', 'Case study walk-through', 'Peer feedback loops'],
        },
        {
          id: `close-${now.getTime() + 3}`,
          type: 'closing',
          position: 3,
          title: 'Commitments & Next Actions',
          duration: Math.round(duration * 0.15), // ~15% of total time
          description: 'Capture top takeaways and individual commitments; reference support assets available post-session.',
        },
      ];

      sessionTitle = `${payload.category} ${payload.sessionType === 'workshop' ? 'Workshop' : 'Session'}`;
      description = payload.currentProblem
        ? `Equip participants to address ${payload.currentProblem.toLowerCase()} while progressing toward ${payload.desiredOutcome}.`
        : `Guide participants toward ${payload.desiredOutcome} with practical tools they can deploy immediately.`;
      difficulty = 'Intermediate';
      recommendedAudienceSize = '8-20';
    }

    // Find matching topics and associate them with sections
    const matchingTopics = await this.findMatchingTopics(sections);
    const enhancedSections = await this.associateTopicsWithSections(sections, matchingTopics);

    const totalDuration = enhancedSections.reduce((acc, section) => acc + section.duration, 0);
    const processingTime = Date.now() - startTime;

    return {
      outline: {
        sections: enhancedSections,
        totalDuration,
        suggestedSessionTitle: sessionTitle,
        suggestedDescription: description,
        difficulty,
        recommendedAudienceSize,
        fallbackUsed,
        generatedAt: now.toISOString(),
      },
      relevantTopics: matchingTopics.map(topic => ({
        id: topic.id.toString(),
        name: topic.name
      })),
      ragAvailable: false,
      generationMetadata: {
        processingTime,
        ragQueried: false,
        fallbackUsed,
        topicsFound: matchingTopics.length,
      },
    };
  }

  private mapSectionType(title: string, index: number): SectionType {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('welcome') || titleLower.includes('intro') || titleLower.includes('opening') || index === 0) {
      return 'opener';
    }

    if (titleLower.includes('closing') || titleLower.includes('wrap') || titleLower.includes('conclusion') || titleLower.includes('commitment')) {
      return 'closing';
    }

    if (titleLower.includes('practice') || titleLower.includes('exercise') || titleLower.includes('activity') || titleLower.includes('lab')) {
      return 'exercise';
    }

    return 'topic';
  }

  async getBuilderCompleteData(sessionId: string) {
    let session: Session | null = null;
    try {
      session = await this.findOne(sessionId);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
      session = null;
    }

    const draft = await this.draftsRepository.findOne({ where: { draftKey: sessionId } });
    const payload = draft?.payload ?? null;
    const metadata = (payload?.metadata as Record<string, any>) ?? {};
    const outline = payload?.outline ? this.ensureOutline(payload.outline as SessionOutlinePayload) : null;

    if (payload && outline) {
      payload.outline = outline;
    }

    if (!session && !draft) {
      throw new NotFoundException(`Session or draft ${sessionId} not found`);
    }

    const sessionStart = metadata.startTime ?? session?.scheduledAt?.toISOString() ?? null;
    let sessionEnd: string | null = metadata.endTime ?? null;
    if (!sessionEnd && session?.scheduledAt && session.durationMinutes) {
      sessionEnd = new Date(
        session.scheduledAt.getTime() + session.durationMinutes * 60 * 1000,
      ).toISOString();
    }

    return {
      id: session?.id ?? sessionId,
      draftId: sessionId,
      title: session?.title ?? metadata.title ?? '',
      subtitle: session?.subtitle ?? metadata.subtitle ?? '',
      readinessScore: session?.readinessScore ?? (payload?.readinessScore ?? 0),
      status: session?.status ?? SessionStatus.DRAFT,
      sessionType: metadata.sessionType ?? 'workshop',
      category: session?.topic
        ? {
            id: session.topic.id,
            name: session.topic.name,
          }
        : metadata.category
        ? { name: metadata.category }
        : null,
      desiredOutcome: metadata.desiredOutcome ?? session?.objective ?? '',
      currentProblem: metadata.currentProblem ?? '',
      specificTopics: metadata.specificTopics ?? '',
      startTime: sessionStart,
      endTime: sessionEnd,
      timezone: metadata.timezone ?? null,
      locationId: metadata.locationId ?? null,
      locationName: metadata.location ?? null,
      audienceId: metadata.audienceId ?? null,
      audienceName: metadata.audienceName ?? null,
      toneId: metadata.toneId ?? null,
      toneName: metadata.toneName ?? null,
      aiGeneratedContent: outline
        ? {
            outline,
            prompt: payload?.aiPrompt ?? '',
            versions: payload?.aiVersions ?? [],
            acceptedVersionId: payload?.acceptedVersionId,
          }
        : null,
      builderDraft: payload,
      lastAutosaveAt: draft?.savedAt ? draft.savedAt.toISOString() : null,
    };
  }

  async createBuilderDraft(
    payload: CreateBuilderDraftDto,
  ): Promise<{ draftId: string; savedAt: string }> {
    const draftId = randomUUID();
    const savedAt = new Date();

    const normalizedPayload = this.ensureDraftPayload(payload);

    const draftEntity = this.draftsRepository.create({
      draftKey: draftId,
      session: null,
      payload: normalizedPayload,
      savedAt,
    });

    await this.draftsRepository.save(draftEntity);

    return {
      draftId,
      savedAt: savedAt.toISOString(),
    };
  }

  async autosaveBuilderDraft(
    sessionId: string,
    payload: BuilderAutosaveDto,
  ): Promise<{ savedAt: string }> {
    const savedAt = new Date();
    let session: Session | undefined;

    if (sessionId !== 'new') {
      session = await this.sessionsRepository.findOne({ where: { id: sessionId } }) ?? undefined;
    }

    const normalizedPayload = this.ensureDraftPayload(payload);

    await this.draftsRepository.upsert(
      {
        draftKey: sessionId,
        session: session ?? null,
        payload: normalizedPayload,
        savedAt,
      },
      {
        conflictPaths: ['draftKey'],
      },
    );

    return { savedAt: savedAt.toISOString() };
  }

  async addOutlineSection(sessionId: string, dto: AddOutlineSectionDto): Promise<SessionOutlinePayload> {
    const { draft, payload, outline } = await this.getDraftWithPayload(sessionId);

    const insertPosition = dto.position && dto.position > 0
      ? Math.min(Math.floor(dto.position), outline.sections.length + 1)
      : outline.sections.length + 1;

    const newSection = this.createDefaultSection(this.normalizeSectionType(dto.sectionType), insertPosition);
    const sections = [...outline.sections];
    sections.splice(insertPosition - 1, 0, newSection);

    const renumbered = this.renumberSections(sections);
    const updatedOutline: SessionOutlinePayload = {
      ...outline,
      sections: renumbered,
      totalDuration: this.calculateTotalDuration(renumbered),
      generatedAt: new Date().toISOString(),
    };

    return this.persistDraftOutline(draft, payload, updatedOutline);
  }

  async updateOutlineSection(sessionId: string, dto: UpdateOutlineSectionDto): Promise<SessionOutlinePayload> {
    const { draft, payload, outline } = await this.getDraftWithPayload(sessionId);
    let sectionFound = false;

    const nextSections = outline.sections.map((section) => {
      if (section.id !== dto.sectionId) {
        return section;
      }

      sectionFound = true;
      const updates = { ...dto.updates } as Record<string, unknown>;

      if (updates.duration !== undefined) {
        const parsed = Number(updates.duration);
        updates.duration = Number.isFinite(parsed) && parsed >= 0 ? parsed : section.duration;
      }

      if (updates.type !== undefined) {
        updates.type = this.normalizeSectionType(updates.type);
      }

      return {
        ...section,
        ...updates,
        updatedAt: new Date().toISOString(),
      } as FlexibleSessionSection;
    });

    if (!sectionFound) {
      throw new NotFoundException(`Section ${dto.sectionId} not found`);
    }

    const renumbered = this.renumberSections(nextSections);
    const updatedOutline: SessionOutlinePayload = {
      ...outline,
      sections: renumbered,
      totalDuration: this.calculateTotalDuration(renumbered),
      generatedAt: new Date().toISOString(),
    };

    return this.persistDraftOutline(draft, payload, updatedOutline);
  }

  async removeOutlineSection(sessionId: string, dto: RemoveOutlineSectionDto): Promise<SessionOutlinePayload> {
    const { draft, payload, outline } = await this.getDraftWithPayload(sessionId);
    const sections = outline.sections.filter((section) => section.id !== dto.sectionId);

    if (sections.length === outline.sections.length) {
      throw new NotFoundException(`Section ${dto.sectionId} not found`);
    }

    const renumbered = this.renumberSections(sections);
    const updatedOutline: SessionOutlinePayload = {
      ...outline,
      sections: renumbered,
      totalDuration: this.calculateTotalDuration(renumbered),
      generatedAt: new Date().toISOString(),
    };

    return this.persistDraftOutline(draft, payload, updatedOutline);
  }

  async reorderOutlineSections(sessionId: string, dto: ReorderOutlineSectionsDto): Promise<SessionOutlinePayload> {
    const { draft, payload, outline } = await this.getDraftWithPayload(sessionId);

    const sectionMap = new Map(outline.sections.map((section) => [section.id, section]));
    const ordered: FlexibleSessionSection[] = [];

    dto.sectionIds.forEach((id) => {
      const section = sectionMap.get(id);
      if (section) {
        ordered.push(section);
        sectionMap.delete(id);
      }
    });

    // Append any sections not included in the payload to preserve data integrity
    sectionMap.forEach((section) => ordered.push(section));

    const renumbered = this.renumberSections(ordered);
    const updatedOutline: SessionOutlinePayload = {
      ...outline,
      sections: renumbered,
      totalDuration: this.calculateTotalDuration(renumbered),
      generatedAt: new Date().toISOString(),
    };

    return this.persistDraftOutline(draft, payload, updatedOutline);
  }

  async duplicateOutlineSection(sessionId: string, dto: DuplicateOutlineSectionDto): Promise<SessionOutlinePayload> {
    const { draft, payload, outline } = await this.getDraftWithPayload(sessionId);
    const index = outline.sections.findIndex((section) => section.id === dto.sectionId);

    if (index < 0) {
      throw new NotFoundException(`Section ${dto.sectionId} not found`);
    }

    const original = outline.sections[index];
    const copy: FlexibleSessionSection = {
      ...original,
      id: randomUUID(),
      title: `${original.title} (Copy)`,
      position: original.position + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const sections = [...outline.sections];
    sections.splice(index + 1, 0, copy);

    const renumbered = this.renumberSections(sections);
    const updatedOutline: SessionOutlinePayload = {
      ...outline,
      sections: renumbered,
      totalDuration: this.calculateTotalDuration(renumbered),
      generatedAt: new Date().toISOString(),
    };

    return this.persistDraftOutline(draft, payload, updatedOutline);
  }

  private async getDraftWithPayload(sessionId: string): Promise<{
    draft: SessionBuilderDraft;
    payload: (BuilderAutosaveDto & Record<string, any>);
    outline: SessionOutlinePayload;
  }> {
    const draft = await this.draftsRepository.findOne({ where: { draftKey: sessionId } });
    if (!draft) {
      throw new NotFoundException(`Draft ${sessionId} not found`);
    }

    const payload = this.ensureDraftPayload(draft.payload as unknown as BuilderAutosaveDto | null | undefined);
    const outline = this.ensureOutline(payload.outline as unknown as SessionOutlinePayload | undefined);
    payload.outline = outline as any;

    return { draft, payload, outline };
  }

  private ensureDraftPayload(payload?: Partial<BuilderAutosaveDto> | null): BuilderAutosaveDto & Record<string, any> {
    const normalizedOutline = this.ensureOutline(payload?.outline as unknown as SessionOutlinePayload | undefined);

    return {
      ...(payload ?? {}),
      metadata: (payload?.metadata as Record<string, unknown>) ?? {},
      outline: normalizedOutline as any,
      aiPrompt: typeof payload?.aiPrompt === 'string' ? payload.aiPrompt : '',
      aiVersions: Array.isArray(payload?.aiVersions) ? payload.aiVersions : [],
      acceptedVersionId: payload?.acceptedVersionId,
      readinessScore: typeof payload?.readinessScore === 'number' ? payload.readinessScore : 0,
    };
  }

  private ensureOutline(rawOutline?: SessionOutlinePayload | null): SessionOutlinePayload {
    if (!rawOutline) {
      return this.createEmptyOutline();
    }

    const rawSections = Array.isArray(rawOutline.sections) ? rawOutline.sections : [];
    const normalizedSections = rawSections.map((section, index) => this.normalizeSection(section, index));
    const renumbered = this.renumberSections(normalizedSections);

    return {
      sections: renumbered,
      totalDuration: typeof rawOutline.totalDuration === 'number'
        ? rawOutline.totalDuration
        : this.calculateTotalDuration(renumbered),
      suggestedSessionTitle: typeof rawOutline.suggestedSessionTitle === 'string'
        ? rawOutline.suggestedSessionTitle
        : 'Draft Session',
      suggestedDescription: typeof rawOutline.suggestedDescription === 'string'
        ? rawOutline.suggestedDescription
        : '',
      difficulty: typeof rawOutline.difficulty === 'string' ? rawOutline.difficulty : 'Intermediate',
      recommendedAudienceSize: typeof rawOutline.recommendedAudienceSize === 'string'
        ? rawOutline.recommendedAudienceSize
        : '10-25',
      ragSuggestions: rawOutline.ragSuggestions,
      fallbackUsed: Boolean(rawOutline.fallbackUsed),
      generatedAt: typeof rawOutline.generatedAt === 'string' ? rawOutline.generatedAt : new Date().toISOString(),
      convertedFromLegacy: rawOutline.convertedFromLegacy,
      convertedAt: rawOutline.convertedAt,
    };
  }

  private normalizeSection(input: any, index: number): FlexibleSessionSection {
    const base: Record<string, unknown> = input && typeof input === 'object' ? { ...input } : {};
    const position = typeof base.position === 'number' ? (base.position as number) : index + 1;
    const durationValue = Number(base.duration ?? 0);
    const duration = Number.isFinite(durationValue) && durationValue >= 0 ? durationValue : 0;

    const normalized: FlexibleSessionSection = {
      ...(base as Record<string, unknown>),
      id: typeof base.id === 'string' ? (base.id as string) : randomUUID(),
      type: this.normalizeSectionType(base.type),
      position,
      title:
        typeof base.title === 'string' && base.title.trim()
          ? (base.title as string)
          : `Section ${position}`,
      duration,
      description: typeof base.description === 'string' ? (base.description as string) : '',
      createdAt: typeof base.createdAt === 'string' ? (base.createdAt as string) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return normalized;
  }

  private normalizeSectionType(value: unknown): SectionType {
    const allowed: SectionType[] = [
      'opener',
      'topic',
      'exercise',
      'inspiration',
      'closing',
      'video',
      'discussion',
      'presentation',
      'break',
      'assessment',
      'custom',
    ];

    if (typeof value === 'string') {
      const lowered = value.toLowerCase() as SectionType;
      if (allowed.includes(lowered)) {
        return lowered;
      }
    }

    return 'custom';
  }

  private renumberSections(sections: FlexibleSessionSection[]): FlexibleSessionSection[] {
    return sections.map((section, index) => ({
      ...section,
      position: index + 1,
      updatedAt: new Date().toISOString(),
    }));
  }

  private calculateTotalDuration(sections: FlexibleSessionSection[]): number {
    return sections.reduce((sum, section) => sum + (Number.isFinite(section.duration) ? section.duration : 0), 0);
  }

  private createDefaultSection(type: SectionType, position: number): FlexibleSessionSection {
    const base: FlexibleSessionSection = {
      id: randomUUID(),
      type,
      position,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      duration: 15,
      description: `Add description for this ${type}`,
      isCollapsible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: '📚',
    };

    switch (type) {
      case 'opener':
        return { ...base, icon: '🎯', isRequired: true, isCollapsible: false, duration: 10 };
      case 'closing':
        return {
          ...base,
          icon: '🏁',
          isRequired: true,
          isCollapsible: false,
          keyTakeaways: [],
          actionItems: [],
          nextSteps: [],
        };
      case 'exercise':
        return { ...base, icon: '🎮', isExercise: true, exerciseType: 'activity', duration: 20 };
      case 'video':
        return { ...base, icon: '🎥', inspirationType: 'video' };
      case 'discussion':
        return { ...base, icon: '💬', engagementType: 'full-group' };
      default:
        return base;
    }
  }

  private async persistDraftOutline(
    draft: SessionBuilderDraft,
    payload: BuilderAutosaveDto & Record<string, any>,
    outline: SessionOutlinePayload,
  ): Promise<SessionOutlinePayload> {
    const normalizedOutline = this.cloneOutline({
      ...outline,
      sections: this.renumberSections(outline.sections),
      totalDuration: this.calculateTotalDuration(outline.sections),
      generatedAt: outline.generatedAt ?? new Date().toISOString(),
    });

    payload.outline = normalizedOutline as any;
    draft.payload = payload;
    draft.savedAt = new Date();
    await this.draftsRepository.save(draft);

    return this.cloneOutline(normalizedOutline);
  }

  private cloneOutline(outline: SessionOutlinePayload): SessionOutlinePayload {
    return {
      ...outline,
      sections: outline.sections.map((section) => ({ ...section })),
    };
  }

  private createEmptyOutline(): SessionOutlinePayload {
    return {
      sections: [],
      totalDuration: 0,
      suggestedSessionTitle: '',
      suggestedDescription: '',
      difficulty: 'Intermediate',
      recommendedAudienceSize: '10-25',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };
  }

  async bulkUpdateStatus(sessionIds: string[], status: SessionStatus): Promise<{ updated: number }> {
    console.log('Backend service - bulkUpdateStatus called with:', { sessionIds, status });
    if (sessionIds.length === 0) {
      return { updated: 0 };
    }

    const sessions = await this.sessionsRepository.find({
      where: { id: In(sessionIds) },
      relations: ['contentVersions', 'agendaItems', 'trainerAssignments', 'landingPage', 'incentives'],
    });
    console.log('Backend service - found sessions:', sessions.map(s => ({ id: s.id, currentStatus: s.status })));

    const previousStatusMap = new Map<string, SessionStatus>();
    const readinessMap = new Map<string, ReadinessScore>();
    const updates: Session[] = [];

    for (const session of sessions) {
      if (session.status === status) {
        console.log(`Session ${session.id} already has status ${status}, skipping`);
        continue;
      }

      const previousStatus = session.status;
      console.log(`Session ${session.id}: changing status from ${previousStatus} to ${status}`);
      session.status = status;
      this.applyPublishTimestamp(session, previousStatus);

      const readiness = await this.readinessScoringService.calculateReadinessScore(session);
      session.readinessScore = readiness.percentage;

      previousStatusMap.set(session.id, previousStatus);
      readinessMap.set(session.id, readiness);
      updates.push(session);
    }

    if (updates.length === 0) {
      console.log('No sessions to update');
      return { updated: 0 };
    }

    console.log('Backend service - saving sessions with new statuses:', updates.map(s => ({ id: s.id, newStatus: s.status })));
    await this.sessionsRepository.save(updates);

    for (const session of updates) {
      const previousStatus = previousStatusMap.get(session.id);
      const readiness = readinessMap.get(session.id);
      if (previousStatus && readiness) {
        await this.recordStatusTransition(session, previousStatus, readiness);
      }
    }

    console.log(`Backend service - successfully updated ${updates.length} sessions`);
    return { updated: updates.length };
  }

  async bulkArchive(sessionIds: string[]): Promise<{ archived: number }> {
    const result = await this.bulkUpdateStatus(sessionIds, SessionStatus.RETIRED);
    return { archived: result.updated };
  }

  async bulkPublish(sessionIds: string[]): Promise<{ published: number; failed: string[] }> {
    console.log('Backend service - bulkPublish called with:', { sessionIds });
    if (sessionIds.length === 0) {
      return { published: 0, failed: [] };
    }

    const sessions = await this.sessionsRepository.find({
      where: { id: In(sessionIds) },
      relations: ['contentVersions', 'agendaItems', 'trainerAssignments', 'landingPage', 'incentives'],
    });
    console.log('Backend service - found sessions for publish:', sessions.map(s => ({ id: s.id, status: s.status, readinessScore: s.readinessScore })));

    const foundIds = new Set(sessions.map((session) => session.id));
    const missingIds = sessionIds.filter((id) => !foundIds.has(id));
    console.log('Backend service - missing session IDs:', missingIds);

    const publishable: Session[] = [];
    const readinessMap = new Map<string, ReadinessScore>();
    const previousStatusMap = new Map<string, SessionStatus>();
    const failed: string[] = [...missingIds];

    for (const session of sessions) {
      console.log(`Backend service - checking readiness for session ${session.id}`);
      const readiness = await this.readinessScoringService.calculateReadinessScore(session);
      console.log(`Backend service - session ${session.id} readiness: ${readiness.percentage}%, canPublish: ${readiness.canPublish}`);

      if (readiness.canPublish) {
        const previousStatus = session.status;
        previousStatusMap.set(session.id, previousStatus);
        session.status = SessionStatus.PUBLISHED;
        this.applyPublishTimestamp(session, previousStatus);
        session.readinessScore = readiness.percentage;
        readinessMap.set(session.id, readiness);
        publishable.push(session);
        console.log(`Backend service - session ${session.id} marked as publishable`);
      } else {
        failed.push(session.id);
        console.log(`Backend service - session ${session.id} failed readiness check`);
      }
    }

    if (publishable.length === 0) {
      console.log('Backend service - no sessions ready for publishing');
      return { published: 0, failed };
    }

    console.log('Backend service - saving publishable sessions:', publishable.map(s => ({ id: s.id, newStatus: s.status })));
    await this.sessionsRepository.save(publishable);

    for (const session of publishable) {
      const previousStatus = previousStatusMap.get(session.id);
      const readiness = readinessMap.get(session.id);
      if (previousStatus && readiness) {
        await this.recordStatusTransition(session, previousStatus, readiness);
      }
    }

    console.log(`Backend service - successfully published ${publishable.length} sessions, ${failed.length} failed`);
    return { published: publishable.length, failed };
  }

  async publishSession(id: string): Promise<Session> {
    try {
      this.logger.log(`Attempting to publish session: ${id}`);

      // Step 1: Find the session
      this.logger.log(`Fetching session details for: ${id}`);
      const session = await this.findOne(id);
      this.logger.log(`Session found: ${session.title} (status: ${session.status})`);

      // Step 2: Calculate readiness score
      this.logger.log(`Calculating readiness score for session: ${id}`);
      const readiness = await this.readinessScoringService.calculateReadinessScore(session);
      this.logger.log(`Readiness calculated: ${readiness.percentage}% (can publish: ${readiness.canPublish})`);

      if (!readiness.canPublish) {
        this.logger.warn(`Session ${id} is not ready for publishing - ${readiness.percentage}% complete`);
        this.logger.warn(`Required actions: ${readiness.recommendedActions.join('; ')}`);

        throw new ForbiddenException(
          `Session is not ready for publishing (${readiness.percentage}% complete, ${this.readinessScoringService.getReadinessThreshold()}% required). ` +
            `Required actions: ${readiness.recommendedActions.join('; ')}`
        );
      }

      // Step 3: Update session status
      this.logger.log(`Updating session status to PUBLISHED for session: ${id}`);
      const previousStatus = session.status;
      session.status = SessionStatus.PUBLISHED;
      session.readinessScore = readiness.percentage;
      this.applyPublishTimestamp(session, previousStatus);

      // Step 4: Save the session
      this.logger.log(`Saving session changes for: ${id}`);
      const saved = await this.sessionsRepository.save(session);
      this.logger.log(`Session saved successfully: ${id}`);

      // Step 5: Record status transition
      this.logger.log(`Recording status transition from ${previousStatus} to PUBLISHED for session: ${id}`);
      await this.recordStatusTransition(saved, previousStatus, readiness);
      this.logger.log(`Status transition recorded successfully for session: ${id}`);

      this.logger.log(`Session ${id} published successfully`);
      return saved;
    } catch (error) {
      this.logger.error(`Failed to publish session ${id}:`, error.message);
      this.logger.error(`Error stack:`, error.stack);

      // Log additional context if it's a database error
      if (error.code) {
        this.logger.error(`Database error code: ${error.code}`);
      }
      if (error.detail) {
        this.logger.error(`Database error detail: ${error.detail}`);
      }

      throw error; // Re-throw the original error
    }
  }

  async getReadinessScore(id: string) {
    const session = await this.findOne(id);
    return this.readinessScoringService.calculateReadinessScore(session);
  }

  async getReadinessChecklist(category?: string) {
    if (category) {
      return this.readinessScoringService.getChecklistForCategory(category);
    }

    return {
      metadata: this.readinessScoringService.getChecklistForCategory('metadata'),
      content: this.readinessScoringService.getChecklistForCategory('content'),
      assignment: this.readinessScoringService.getChecklistForCategory('assignment'),
      integration: this.readinessScoringService.getChecklistForCategory('integration'),
    };
  }

  private getRolloutSample(payload: SuggestOutlineDto): number {
    const basis = `${payload.category}|${payload.desiredOutcome}|${payload.audienceId ?? 'none'}|${payload.toneId ?? 'none'}|${payload.sessionType}`;
    let hash = 0;

    for (let index = 0; index < basis.length; index += 1) {
      hash = (hash * 31 + basis.charCodeAt(index)) % 100000;
    }

    return hash % 100;
  }

  private getVariantRolloutDecision(payload: SuggestOutlineDto): { enabled: boolean; reason: string; rolloutSample: number } {
    if (!this.enableVariantGenerationV2) {
      return { enabled: false, reason: 'flag_disabled', rolloutSample: 0 };
    }

    const rolloutSample = this.getRolloutSample(payload);

    if (this.variantRolloutPercentage >= 100) {
      return { enabled: true, reason: 'full_rollout', rolloutSample };
    }

    if (this.variantRolloutPercentage <= 0) {
      return { enabled: false, reason: 'rollout_zero', rolloutSample };
    }

    const enabled = rolloutSample < this.variantRolloutPercentage;
    return {
      enabled,
      reason: enabled ? 'rollout_opt_in' : 'rollout_filtered',
      rolloutSample,
    };
  }

  private async buildLegacyVariantResponse(payload: SuggestOutlineDto): Promise<MultiVariantResponse> {
    const legacyResponse = await this.suggestOutline(payload);
    const processingTime = legacyResponse.generationMetadata?.processingTime ?? 0;
    const ragSourcesFound = legacyResponse.generationMetadata?.topicsFound ?? 0;

    return {
      variants: [
        {
          id: 'legacy-variant',
          outline: legacyResponse.outline,
          generationSource: legacyResponse.ragAvailable ? 'rag' : 'baseline',
          ragWeight: legacyResponse.ragAvailable ? 0.5 : 0,
          ragSourcesUsed: legacyResponse.ragAvailable ? ragSourcesFound : 0,
          label: 'Standard Outline',
          description: 'Generated via legacy single-outline workflow',
        },
      ],
      metadata: {
        processingTime,
        ragAvailable: legacyResponse.ragAvailable,
        ragSourcesFound,
        totalVariants: 1,
        averageSimilarity: undefined,
      },
    };
  }

  private async findTopic(topicId: number): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException(`Topic ${topicId} not found`);
    }
    return topic;
  }

  /**
   * Generate 4 variants with different RAG weights
   */
  async suggestMultipleOutlines(payload: SuggestOutlineDto): Promise<MultiVariantResponse> {
    const startTime = Date.now();
    const decision = this.getVariantRolloutDecision(payload);

    this.logger.log('Variant generation v2 request received', {
      category: payload.category,
      sessionType: payload.sessionType,
      rolloutPercentage: this.variantRolloutPercentage,
      rolloutSample: decision.rolloutSample,
      decisionReason: decision.reason,
    });

    this.analyticsTelemetry.recordEvent('ai_prompt_submitted', {
      sessionId: 'session-builder',
      metadata: {
        category: payload.category,
        sessionType: payload.sessionType,
        rolloutPercentage: this.variantRolloutPercentage,
        rolloutSample: decision.rolloutSample,
        decisionReason: decision.reason,
        variantMode: decision.enabled ? 'multi_variant' : 'legacy',
      },
    });

    if (!decision.enabled) {
      this.logger.warn('Variant generation v2 disabled for request, falling back to legacy workflow', {
        category: payload.category,
        sessionType: payload.sessionType,
        rolloutPercentage: this.variantRolloutPercentage,
        rolloutSample: decision.rolloutSample,
        decisionReason: decision.reason,
      });

      const legacyResponse = await this.buildLegacyVariantResponse(payload);

      this.analyticsTelemetry.recordEvent('ai_content_generated', {
        sessionId: 'session-builder',
        metadata: {
          variantMode: 'legacy',
          processingTime: legacyResponse.metadata.processingTime,
          totalVariants: legacyResponse.metadata.totalVariants,
          ragAvailable: legacyResponse.metadata.ragAvailable,
          rolloutPercentage: this.variantRolloutPercentage,
          rolloutSample: decision.rolloutSample,
        },
      });

      return legacyResponse;
    }

    this.logger.log('Starting multi-variant generation', {
      category: payload.category,
      audience: payload.audienceName,
      sessionType: payload.sessionType,
      timestamp: new Date().toISOString()
    });

    // Calculate session duration
    const duration = payload.startTime && payload.endTime
      ? Math.round((new Date(payload.endTime).getTime() - new Date(payload.startTime).getTime()) / 60000)
      : 90; // Default 90 minutes

    // Fetch audience, tone, and location profiles for enriched prompts
    let audience: Audience | null = null;
    let tone: Tone | null = null;
    let location: Location | null = null;

    if (payload.audienceId) {
      try {
        audience = await this.sessionsRepository.manager.findOne(Audience, {
          where: { id: payload.audienceId }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch audience ${payload.audienceId}: ${message}`);
      }
    }

    if (payload.toneId) {
      try {
        tone = await this.sessionsRepository.manager.findOne(Tone, {
          where: { id: payload.toneId }
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch tone ${payload.toneId}: ${message}`);
      }
    }

    if (payload.locationId) {
      try {
        location = await this.locationsRepository.findOne({ where: { id: payload.locationId } });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch location ${payload.locationId}: ${message}`);
      }
    }

    const locationContext: LocationPromptContext | undefined = location
      ? {
          id: location.id,
          name: location.name,
          locationType: location.locationType,
          meetingPlatform: location.meetingPlatform ?? null,
          capacity: location.capacity ?? null,
          timezone: location.timezone ?? null,
          notes: location.notes ?? location.accessInstructions ?? null,
        }
      : (payload.locationName || payload.locationType || payload.meetingPlatform || payload.locationCapacity || payload.locationTimezone || payload.locationNotes)
        ? {
            id: payload.locationId,
            name: payload.locationName,
            locationType: payload.locationType,
            meetingPlatform: payload.meetingPlatform ?? null,
            capacity: payload.locationCapacity ?? null,
            timezone: payload.locationTimezone ?? null,
            notes: payload.locationNotes ?? null,
          }
        : undefined;

    const promptSettings = await this.promptSettingsService.getCurrentSettings();
    const sandboxSettings = promptSettings.settings;
    const quickTweaks = sandboxSettings.quickTweaks;
    const quickDirectives = this.buildQuickTweakDirectives(quickTweaks);

    // Step 1: Query RAG once with retry (reuse for all variants)
    let ragResults: any[] = [];
    let ragAvailable = false;

    try {
      ragResults = await this.ragService.queryRAGWithRetry({
        category: payload.category,
        audienceName: payload.audienceName,
        desiredOutcome: payload.desiredOutcome,
        currentProblem: payload.currentProblem,
        sessionType: payload.sessionType,
        specificTopics: payload.specificTopics,
        duration,
        audienceSize: payload.audienceSize,
        // Audience details
        experienceLevel: audience?.experienceLevel,
        preferredLearningStyle: audience?.preferredLearningStyle,
        communicationStyle: audience?.communicationStyle,
        vocabularyLevel: audience?.vocabularyLevel,
        exampleTypes: audience?.exampleTypes,
        technicalDepth: audience?.technicalDepth,
        audienceDescription: audience?.description,
        avoidTopics: audience?.avoidTopics,
        // Tone details
        toneStyle: tone?.style,
        energyLevel: tone?.energyLevel,
        formality: tone?.formality,
        toneDescription: tone?.description,
        sentenceStructure: tone?.sentenceStructure,
        languageCharacteristics: tone?.languageCharacteristics,
        emotionalResonance: tone?.emotionalResonance,
        // Location details
        locationType: locationContext?.locationType,
        meetingPlatform: locationContext?.meetingPlatform,
        locationCapacity: locationContext?.capacity,
        locationTimezone: locationContext?.timezone,
      });
      ragAvailable = ragResults.length > 0;

      const avgSimilarity = ragResults.length > 0
        ? ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length
        : 0;

      this.logger.log('RAG query completed', {
        resultsFound: ragResults.length,
        ragAvailable,
        averageSimilarity: avgSimilarity.toFixed(3),
        queryTime: Date.now() - startTime
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`RAG query failed completely, proceeding with baseline only: ${message}`);
    }

    const ragWeight = ragResults.length > 0
      ? quickTweaks?.raiseRagPriority
        ? 0.7
        : 0.35
      : 0.0;

    const variantMeta = await Promise.all(
      [0, 1, 2, 3].map(async index => ({
        index,
        label: await this.getVariantLabel(index),
        instruction: await this.getVariantInstruction(index, payload.category, duration),
        description: await this.getVariantDescription(index, payload.category),
      }))
    );

    // Step 2: Generate 4 variants in parallel with shared RAG weight
    const variantPromises = variantMeta.map(meta => {
      const persona = sandboxSettings.variantPersonas?.[meta.index] ?? null;
      return this.generateSingleVariant(
        payload,
        duration,
        audience,
        tone,
        locationContext,
        ragResults,
        ragWeight,
        meta,
        sandboxSettings,
        quickDirectives,
        persona
      )
        .then(result => {
          this.logger.log(`Variant ${meta.index + 1} generated`, {
            variantLabel: meta.label,
            ragWeight,
            sectionsCount: result.outline.sections.length,
            totalDuration: result.outline.totalDuration,
          });
          return result;
        })
        .catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Variant ${meta.index + 1} generation failed: ${message}`);
          return null;
        })
    });

    const variantResults = await Promise.all(variantPromises);

    const ragSourcesSummary = ragWeight > 0 && ragResults.length > 0
      ? this.convertRagResultsToSources(ragResults)
      : undefined;

    const variants = variantResults
      .filter((result): result is { outline: any; meta: { index: number; label: string; description: string; ragWeight: number } } => result !== null)
      .map(result => ({
        id: `variant-${result.meta.index + 1}`,
        outline: result.outline,
        generationSource: ragWeight > 0 && ragResults.length > 0 ? 'rag' as const : 'baseline' as const,
        ragWeight: result.meta.ragWeight,
        ragSourcesUsed: ragWeight > 0 ? ragResults.length : 0,
        ragSources: ragSourcesSummary,
        label: result.meta.label,
        description: result.meta.description,
      }));

    if (variants.length === 0) {
      this.logger.warn('All variant generation attempts failed, falling back to legacy outline', {
        category: payload.category,
        sessionType: payload.sessionType,
        ragAvailable,
      });

      const legacyFallback = await this.buildLegacyVariantResponse(payload);
      const fallbackProcessingTime = Date.now() - startTime;

      this.analyticsTelemetry.recordEvent('ai_content_generated', {
        sessionId: 'session-builder',
        metadata: {
          variantMode: 'legacy_fallback',
          processingTime: fallbackProcessingTime,
          totalVariants: legacyFallback.metadata.totalVariants,
          ragAvailable: legacyFallback.metadata.ragAvailable,
          rolloutPercentage: this.variantRolloutPercentage,
          rolloutSample: decision.rolloutSample,
          locationType: locationContext?.locationType ?? null,
          meetingPlatform: locationContext?.meetingPlatform ?? null,
        },
      });

      return legacyFallback;
    }

    const avgSimilarity = ragResults.length > 0
      ? ragResults.reduce((sum, r) => sum + r.similarity, 0) / ragResults.length
      : undefined;

    const totalProcessingTime = Date.now() - startTime;

    this.logger.log('Multi-variant generation complete', {
      totalVariants: variants.length,
      totalTime: totalProcessingTime,
      ragAvailable,
      locationType: locationContext?.locationType ?? 'unknown',
    });

    this.analyticsTelemetry.recordEvent('ai_content_generated', {
      sessionId: 'session-builder',
      metadata: {
        variantMode: 'multi_variant',
        processingTime: totalProcessingTime,
        totalVariants: variants.length,
        ragAvailable,
        ragSourcesFound: ragResults.length,
        averageSimilarity: avgSimilarity,
        rolloutPercentage: this.variantRolloutPercentage,
        rolloutSample: decision.rolloutSample,
        locationType: locationContext?.locationType ?? null,
        meetingPlatform: locationContext?.meetingPlatform ?? null,
      },
    });

    return {
      variants,
      metadata: {
        processingTime: totalProcessingTime,
        ragAvailable,
        ragSourcesFound: ragResults.length,
        totalVariants: variants.length,
        averageSimilarity: avgSimilarity
      }
    };
  }

  /**
   * Generate a single variant with specific RAG weight
   */
  private async generateSingleVariant(
    payload: SuggestOutlineDto,
    duration: number,
    audience: Audience | null,
    tone: Tone | null,
    location: LocationPromptContext | undefined,
    ragResults: any[],
    ragWeight: number,
    meta: { index: number; label: string; instruction: string; description: string },
    sandboxSettings: PromptSandboxSettings,
    quickDirectives: string[],
    persona: PromptVariantPersona | null
  ): Promise<{ outline: any; meta: { index: number; label: string; description: string; ragWeight: number } }> {
    const combinedInstruction = persona?.prompt
      ? `${meta.instruction.trim()}\n\nSandbox Persona Amplifier:\n${persona.prompt.trim()}`
      : meta.instruction;
    const variantDescription = persona?.summary ?? meta.description;

    const openAIRequest: OpenAISessionOutlineRequest = {
      title: payload.title,
      category: payload.category,
      sessionType: payload.sessionType,
      desiredOutcome: payload.desiredOutcome,
      currentProblem: payload.currentProblem,
      specificTopics: payload.specificTopics,
      duration,
      audienceSize: payload.audienceSize || '8-20',
      audienceId: payload.audienceId,
      toneId: payload.toneId,
      locationId: location?.id ?? payload.locationId,
      locationName: location?.name ?? payload.locationName,
      locationType: location?.locationType ?? payload.locationType,
      meetingPlatform: location?.meetingPlatform ?? payload.meetingPlatform,
      locationCapacity: location?.capacity ?? payload.locationCapacity,
      locationTimezone: location?.timezone ?? payload.locationTimezone,
      locationNotes: location?.notes ?? payload.locationNotes,
      ragWeight,
      variantIndex: meta.index,
      variantLabel: meta.label,
      variantInstruction: combinedInstruction,
      variantDescription,
      overrideDirectives: quickDirectives.length ? quickDirectives : undefined,
    };

    if (audience) {
      openAIRequest.audienceName = audience.name;
      openAIRequest.audienceDescription = audience.description;
      openAIRequest.audienceExperienceLevel = audience.experienceLevel;
      openAIRequest.audienceTechnicalDepth = audience.technicalDepth;
      openAIRequest.audienceCommunicationStyle = audience.communicationStyle;
      openAIRequest.audienceVocabularyLevel = audience.vocabularyLevel;
      openAIRequest.audienceLearningStyle = audience.preferredLearningStyle;
      openAIRequest.audienceExampleTypes = audience.exampleTypes;
      openAIRequest.audienceAvoidTopics = audience.avoidTopics;
      openAIRequest.audienceInstructions = audience.promptInstructions;
    }

    if (tone) {
      openAIRequest.toneName = tone.name;
      openAIRequest.toneDescription = tone.description;
      openAIRequest.toneStyle = tone.style;
      openAIRequest.toneFormality = tone.formality;
      openAIRequest.toneEnergyLevel = tone.energyLevel;
      openAIRequest.toneSentenceStructure = tone.sentenceStructure;
      openAIRequest.toneLanguageCharacteristics = tone.languageCharacteristics;
      openAIRequest.toneEmotionalResonance = tone.emotionalResonance;
      openAIRequest.toneExamplePhrases = tone.examplePhrases;
      openAIRequest.toneInstructions = tone.promptInstructions;
    }

    const outlineContext = this.buildOutlineGenerationContext({
      sandboxSettings,
      duration,
      variant: {
        index: meta.index,
        label: meta.label,
        description: variantDescription,
        instruction: combinedInstruction,
        persona,
      },
      ragWeight,
      ragSources: ragResults?.length ?? 0,
      quickDirectives,
    });

    const aiOutline = await this.openAIService.generateSessionOutline(
      openAIRequest,
      ragResults,
      ragWeight,
      outlineContext
    );

    let sections: FlexibleSessionSection[] = aiOutline.sections.map(
      (section: any, index: number): FlexibleSessionSection => ({
        id: `ai-${Date.now()}-${meta.index}-${index}`,
        type: this.mapSectionType(section.title, index),
        position: index,
        title: typeof section.title === 'string' ? section.title : `Section ${index + 1}`,
        duration: typeof section.duration === 'number' && Number.isFinite(section.duration)
          ? Math.max(1, Math.round(section.duration))
          : Math.max(5, Math.round(duration / Math.max(1, aiOutline.sections.length))),
        description: typeof section.description === 'string' ? section.description : '',
        learningObjectives: Array.isArray(section.learningObjectives) ? section.learningObjectives : [],
        suggestedActivities: Array.isArray(section.suggestedActivities) ? section.suggestedActivities : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    sections = this.ensureRequiredSectionCoverage(sections, duration);
    sections = this.applyStructuredDurationDefaults(sections, duration);
    sections = this.applyVariantPersonaAdjustments(sections, meta.label);

    let balancedSections = this.balanceDurations(sections, duration);

    const matchingTopics = await this.findMatchingTopics(balancedSections);
    let enhancedSections = await this.associateTopicsWithSections(balancedSections, matchingTopics);

    // Final pass to guarantee duration alignment and sequential positions
    balancedSections = this.balanceDurations(enhancedSections, duration);
    const finalSections = balancedSections.map((section, index) => ({
      ...section,
      position: index,
    }));

    const totalDuration = finalSections.reduce((acc, s) => acc + s.duration, 0);

    return {
      outline: {
        sections: finalSections,
        totalDuration,
        suggestedSessionTitle: aiOutline.suggestedTitle,
        suggestedDescription: aiOutline.summary,
        difficulty: aiOutline.difficulty || 'Intermediate',
        recommendedAudienceSize: aiOutline.recommendedAudienceSize || '8-20',
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
      meta: {
        index: meta.index,
        label: meta.label,
        description: variantDescription,
        ragWeight,
      },
    };
  }

  /**
   * Balance section durations to match target (within 10% tolerance)
   */
  private buildQuickTweakDirectives(quickTweaks?: PromptSandboxSettings['quickTweaks']): string[] {
    if (!quickTweaks) {
      return [];
    }

    const directives: string[] = [];

    if (quickTweaks.increaseDataEmphasis) {
      directives.push('Spotlight data-backed insights and call out relevant metrics or KPIs when they reinforce the narrative.');
    }

    if (quickTweaks.speedUpPace) {
      directives.push('Keep pacing brisk by tightening explanations and limiting transitions to rapid, action-focused handoffs.');
    }

    if (quickTweaks.raiseRagPriority) {
      directives.push('Prioritize knowledge-base (RAG) insights whenever available and weave them into sections with concise citations.');
    }

    return directives;
  }

  private buildOutlineGenerationContext(options: {
    sandboxSettings: PromptSandboxSettings;
    duration: number;
    variant?: {
      index?: number;
      label?: string;
      description?: string;
      instruction?: string;
      persona?: PromptVariantPersona | null;
    };
    ragWeight?: number;
    ragSources?: number;
    quickDirectives?: string[];
  }): OutlineGenerationContext {
    const { sandboxSettings, duration, variant, ragWeight = 0, ragSources = 0, quickDirectives } = options;

    const configSnapshot: Record<string, any> = {
      durationTarget: duration,
      ragWeight,
      ragSources,
      sandboxVersion: sandboxSettings.version,
    };

    if (variant?.label) {
      configSnapshot.variantLabel = variant.label;
    }
    if (variant?.description) {
      configSnapshot.variantDescription = variant.description;
    }
    if (variant?.index !== undefined) {
      configSnapshot.variantIndex = variant.index;
    }
    if (variant?.instruction) {
      configSnapshot.variantInstruction = variant.instruction;
    }

    const overridesSnapshot: Record<string, any> = {
      quickTweaks: { ...(sandboxSettings.quickTweaks ?? {}) },
      sandboxVersion: sandboxSettings.version,
    };

    if (variant?.persona) {
      overridesSnapshot.persona = {
        id: variant.persona.id,
        label: variant.persona.label,
        summary: variant.persona.summary,
      };
      configSnapshot.variantPersona = overridesSnapshot.persona;
    }

    configSnapshot.ragMode = ragWeight > 0 && ragSources > 0 ? 'rag' : 'baseline';

    const context: OutlineGenerationContext = {
      configSnapshot,
      overridesSnapshot,
      sandboxSettings: {
        globalTone: sandboxSettings.globalTone,
        durationFlow: sandboxSettings.durationFlow,
        quickTweaks: sandboxSettings.quickTweaks,
        version: sandboxSettings.version,
      },
      quickDirectives,
    };

    return context;
  }

  private balanceDurations(sections: any[], targetDuration: number): any[] {
    const totalDuration = sections.reduce((sum, s) => sum + s.duration, 0);

    let adjustedSections = sections.map(section => ({ ...section }));

    // If the gap is larger than 10%, proportionally adjust first
    if (Math.abs(totalDuration - targetDuration) > targetDuration * 0.1 && totalDuration > 0) {
      const ratio = targetDuration / totalDuration;
      adjustedSections = sections.map(section => ({
        ...section,
        duration: Math.max(1, Math.round(section.duration * ratio)),
      }));
    }

    const currentTotal = adjustedSections.reduce((sum, s) => sum + s.duration, 0);
    const delta = targetDuration - currentTotal;

    if (delta !== 0 && adjustedSections.length > 0) {
      const lastIndex = adjustedSections.length - 1;
      adjustedSections[lastIndex] = {
        ...adjustedSections[lastIndex],
        duration: Math.max(1, adjustedSections[lastIndex].duration + delta),
      };
    }

    return adjustedSections;
  }

  private ensureRequiredSectionCoverage(
    sections: FlexibleSessionSection[],
    targetDuration: number,
  ): FlexibleSessionSection[] {
    const now = new Date().toISOString();
    const requiredSequence: Array<{
      type: SectionType;
      title: string;
      description: string;
    }> = [
      {
        type: 'opener',
        title: 'Opening & Welcome',
        description: 'Set expectations, establish rapport, and preview the flow for participants.',
      },
      {
        type: 'topic',
        title: 'Theory Deep Dive',
        description: 'Deliver the core frameworks and concepts that underpin this session.',
      },
      {
        type: 'exercise',
        title: 'Application Lab',
        description: 'Guide participants through structured practice that translates theory into action.',
      },
      {
        type: 'video',
        title: 'Case Study Video',
        description: 'Review a curated video that illustrates the concepts in real-world context.',
      },
      {
        type: 'closing',
        title: 'Commitments & Next Steps',
        description: 'Surface insights, capture commitments, and define post-session follow-up.',
      },
    ];

    const updatedSections: FlexibleSessionSection[] = sections.map(section => ({
      ...section,
      type: this.normalizeSectionType(section.type),
    }));

    const insertAt = (list: FlexibleSessionSection[], index: number, item: FlexibleSessionSection) => {
      const safeIndex = Math.max(0, Math.min(index, list.length));
      list.splice(safeIndex, 0, item);
    };

    const findInsertIndex = (type: SectionType): number => {
      switch (type) {
        case 'opener':
          return 0;
        case 'topic': {
          const firstExercise = updatedSections.findIndex(
            section => section.type === 'exercise' || section.type === 'video' || section.type === 'closing',
          );
          return firstExercise === -1 ? updatedSections.length : firstExercise;
        }
        case 'exercise': {
          const firstVideoOrClosing = updatedSections.findIndex(
            section => section.type === 'video' || section.type === 'closing',
          );
          return firstVideoOrClosing === -1 ? updatedSections.length : firstVideoOrClosing;
        }
        case 'video': {
          const closingIndex = updatedSections.findIndex(section => section.type === 'closing');
          return closingIndex === -1 ? updatedSections.length : closingIndex;
        }
        case 'closing':
        default:
          return updatedSections.length;
      }
    };

    for (const required of requiredSequence) {
      const exists = updatedSections.some(section => section.type === required.type);
      if (exists) {
        continue;
      }

      const placeholder: FlexibleSessionSection = {
        id: `auto-${required.type}-${randomUUID()}`,
        type: required.type,
        position: 0,
        title: required.title,
        duration: Math.max(5, Math.round(targetDuration * 0.15)),
        description: required.description,
        learningObjectives: [],
        suggestedActivities: [],
        createdAt: now,
        updatedAt: now,
        isCollapsible: true,
      };

      const insertIndex = findInsertIndex(required.type);
      insertAt(updatedSections, insertIndex, placeholder);
    }

    return updatedSections.map((section, index) => ({
      ...section,
      position: index,
      updatedAt: now,
    }));
  }

  private applyStructuredDurationDefaults(
    sections: FlexibleSessionSection[],
    targetDuration: number,
  ): FlexibleSessionSection[] {
    if (!Array.isArray(sections) || sections.length === 0) {
      return sections;
    }

    if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
      return sections;
    }

    const ratios: Record<SectionType, number> = {
      opener: 10,
      topic: 25,
      exercise: 25,
      video: 10,
      closing: 20,
      inspiration: 0,
      discussion: 0,
      presentation: 0,
      break: 0,
      assessment: 0,
      custom: 0,
    };
    const ratioSum = Object.values(ratios).reduce((sum, value) => sum + value, 0);

    const updated = sections.map(section => ({ ...section }));
    const grouped = new Map<SectionType, number[]>();

    updated.forEach((section, index) => {
      const type = section.type ?? 'custom';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(index);
    });

    for (const [type, weight] of Object.entries(ratios) as Array<[SectionType, number]>) {
      if (weight <= 0) {
        continue;
      }
      const indices = grouped.get(type);
      if (!indices || indices.length === 0) {
        continue;
      }

      const typeTarget = Math.max(indices.length, Math.round((targetDuration * weight) / ratioSum));
      let remaining = typeTarget;

      indices.forEach((sectionIndex, idx) => {
        const isLast = idx === indices.length - 1;
        let allocation = Math.floor(typeTarget / indices.length);
        if (allocation < 1) {
          allocation = 1;
        }

        if (isLast) {
          allocation = Math.max(1, remaining);
        }

        updated[sectionIndex] = {
          ...updated[sectionIndex],
          duration: allocation,
        };

        remaining -= allocation;
      });

      if (remaining !== 0 && indices.length > 0) {
        const lastIndex = indices[indices.length - 1];
        updated[lastIndex] = {
          ...updated[lastIndex],
          duration: Math.max(1, updated[lastIndex].duration + remaining),
        };
      }
    }

    return updated;
  }

  private applyVariantPersonaAdjustments(
    sections: FlexibleSessionSection[],
    variantLabel?: string,
  ): FlexibleSessionSection[] {
    if (!variantLabel) {
      return sections;
    }

    const normalizedLabel = variantLabel.toLowerCase();
    const now = new Date().toISOString();

    const ensureList = (value?: string[]): string[] => {
      if (Array.isArray(value)) {
        return [...value];
      }
      return [];
    };

    const addUnique = (list: string[], entry: string): string[] => {
      if (!list.some(item => item.toLowerCase() === entry.toLowerCase())) {
        return [...list, entry];
      }
      return list;
    };

    return sections.map(section => {
      let description = section.description ?? '';
      let objectives = ensureList(section.learningObjectives);
      let activities = ensureList(section.suggestedActivities);

      const appendSentence = (base: string, sentence: string): string => {
        if (!sentence) {
          return base;
        }
        const normalizedSentence = sentence.trim();
        if (!normalizedSentence) {
          return base;
        }
        if (base.toLowerCase().includes(normalizedSentence.toLowerCase())) {
          return base;
        }
        return `${base}${base ? ' ' : ''}${normalizedSentence}`.trim();
      };

      if (normalizedLabel.includes('precision')) {
        description = appendSentence(
          description,
          'Utilize the facilitator checklist to confirm each micro-step before advancing.',
        );
        objectives = addUnique(objectives, 'Maintain a step-by-step cadence that follows the agenda without deviation.');
        activities = addUnique(activities, 'Review the facilitator checklist aloud to confirm each deliverable before moving on.');
        activities = addUnique(activities, 'Time-box each micro-step and capture status on the session scorecard.');
      } else if (normalizedLabel.includes('insight')) {
        description = appendSentence(
          description,
          'Anchor recommendations in relevant metrics, case studies, or benchmark data.',
        );
        objectives = addUnique(objectives, 'Reference at least one evidence-backed insight or metric to support decisions.');
        activities = addUnique(activities, 'Review supporting data or a benchmark report that validates the recommended approach.');
        activities = addUnique(activities, 'Debrief in pairs to extract measurable outcomes and capture them as proof points.');
      } else if (normalizedLabel.includes('connect')) {
        description = appendSentence(
          description,
          'Facilitate peer storytelling and reflection to build shared understanding.',
        );
        objectives = addUnique(objectives, 'Deepen peer connections through shared storytelling and collaborative reflection.');
        activities = addUnique(activities, 'Run paired storytelling rounds that surface personal change experiences.');
        activities = addUnique(activities, 'Host small-group discussions focused on shared commitments and support tactics.');
      } else if (normalizedLabel.includes('ignite')) {
        description = appendSentence(
          description,
          'Keep momentum high with countdown timers, rapid prompts, and immediate action commitments.',
        );
        objectives = addUnique(objectives, 'Convert insights into rapid, time-boxed action steps.');
        activities = addUnique(activities, 'Set a visible countdown timer to drive urgency during the activity.');
        activities = addUnique(activities, 'Finish with a rapid-fire share-out of next actions and who will start them within 24 hours.');
      }

      return {
        ...section,
        description: description.trim(),
        learningObjectives: objectives,
        suggestedActivities: activities,
        updatedAt: now,
      };
    });
  }

  /**
   * Get variant label from database
   */
  private async getVariantLabel(index: number): Promise<string> {
    try {
      return await this.variantConfigService.getVariantLabel(index);
    } catch (error) {
      // Fallback to hardcoded labels if database lookup fails
      const labels = [
        'Knowledge Base-Driven',
        'Recommended Mix',
        'Creative Approach',
        'Alternative Structure'
      ];
      return labels[index] || `Variant ${index + 1}`;
    }
  }

  /**
   * Get variant description from database
   */
  private async getVariantDescription(index: number, category: string): Promise<string> {
    try {
      const description = await this.variantConfigService.getVariantDescription(index);
      // Replace {{category}} placeholder if present
      return description.replace(/\{\{category\}\}/g, category);
    } catch (error) {
      // Fallback to hardcoded descriptions if database lookup fails
      const descriptions = [
        `Proven frameworks and trusted playbook approach for ${category}`,
        `Balanced mix of teaching and hands-on practice for ${category}`,
        `High-energy, imaginative approach to ${category}`,
        `Fast-paced, action-focused ${category} session`
      ];
      return descriptions[index] || `Variant ${index + 1} for ${category}`;
    }
  }

  /**
   * Get variant instruction from database
   */
  private async getVariantInstruction(
    index: number,
    category: string,
    duration: number,
  ): Promise<string> {
    try {
      const instruction = await this.variantConfigService.getVariantInstruction(index);
      // Replace {{category}} placeholder if present
      return instruction
        .replace(/\{\{category\}\}/g, category)
        .replace(/\{\{duration\}\}/g, String(duration));
    } catch (error) {
      // Fallback to hardcoded instructions if database lookup fails
      const instructions = [
        `Craft a precision-focused outline for ${category}. Use clearly labeled segments, sequential steps, and detailed trainer guidance so the flow feels predictable and easy to follow across ${duration} minutes.`,
        `Design an insight-driven experience for ${category}. Highlight research, data points, and analysis activities that help participants draw evidence-backed conclusions within the ${duration}-minute agenda.`,
        `Build an ignite-style session for ${category}. Keep the pacing energetic with rapid application sprints, collaborative challenges, and momentum-building checkpoints over ${duration} minutes.`,
        `Shape a connect-oriented agenda for ${category}. Emphasize storytelling, peer interaction, and reflection moments that deepen relationships and shared learning throughout the ${duration}-minute session.`,
      ];

      return `${instructions[index] ?? instructions[instructions.length - 1]} Make it feel distinctly different from the other variants through tone, pacing, and activity choices while still meeting the desired outcome.`;
    }
  }

  /**
   * Log variant selection for analytics
   */
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
    if (!this.logVariantSelections) {
      this.logger.log('Variant selection logging disabled via configuration');
      return;
    }

    try {
      this.logger.log('Variant selected', {
        sessionId,
        variantId: variantDetails.variantId,
        generationSource: variantDetails.generationSource,
        ragWeight: variantDetails.ragWeight,
        ragSourcesUsed: variantDetails.ragSourcesUsed,
        category: variantDetails.category,
      });

      // Find session if not 'new'
      let session: Session | undefined;
      if (sessionId !== 'new') {
        session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
      }

      // Save to database for analytics
      await this.aiInteractionsService.create({
        session: session || undefined,
        interactionType: AIInteractionType.VARIANT_SELECTION,
        status: AIInteractionStatus.SUCCESS,
        renderedPrompt: 'Variant selection tracking',
        inputVariables: {
          variantId: variantDetails.variantId,
          generationSource: variantDetails.generationSource,
          ragWeight: variantDetails.ragWeight,
          ragSourcesUsed: variantDetails.ragSourcesUsed,
          category: variantDetails.category,
        },
        metadata: {
          sessionId,
          timestamp: new Date().toISOString(),
          variantLabel: this.getVariantLabelFromId(variantDetails.variantId),
        },
        category: variantDetails.category,
      });

      this.logger.log('Variant selection logged to database successfully');

      this.analyticsTelemetry.recordEvent('ai_content_accepted', {
        sessionId: sessionId || 'new',
        metadata: {
          variantId: variantDetails.variantId,
          generationSource: variantDetails.generationSource,
          ragWeight: variantDetails.ragWeight,
          ragSourcesUsed: variantDetails.ragSourcesUsed,
          category: variantDetails.category,
          variantLabel: this.getVariantLabelFromId(variantDetails.variantId),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to log variant selection: ${message}`);

      this.analyticsTelemetry.recordEvent('ai_content_rejected', {
        sessionId: sessionId || 'new',
        metadata: {
          variantId: variantDetails.variantId,
          category: variantDetails.category,
          reason: message,
          context: 'variant_selection_logging',
        },
      });
    }
  }

  /**
   * Helper: Get variant label from ID
   */
  private getVariantLabelFromId(variantId: string): string {
    const labels = {
      'variant-1': 'Knowledge Base-Driven',
      'variant-2': 'Recommended Mix',
      'variant-3': 'Creative Approach',
      'variant-4': 'Alternative Structure',
    };
    return labels[variantId as keyof typeof labels] || variantId;
  }

  /**
   * Convert RAG results to RagSource format for frontend
   */
  private convertRagResultsToSources(ragResults: any[]): RagSource[] {
    return ragResults.map(result => ({
      filename: result.metadata?.filename || 'Unknown Source',
      category: result.metadata?.category || 'General',
      similarity: result.similarity || 0,
      excerpt: result.text?.substring(0, 200) || '', // First 200 chars as excerpt
      createdAt: result.metadata?.created_at
    }));
  }
}
