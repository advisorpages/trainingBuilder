import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Incentive,
  Session,
  SessionBuilderDraft,
  SessionContentVersion,
  SessionStatus,
  SessionStatusLog,
  Topic,
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
import { OpenAIService, OpenAISessionOutlineRequest } from '../../services/openai.service';
import { PromptRegistryService } from '../../services/prompt-registry.service';

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
    private readonly readinessScoringService: ReadinessScoringService,
    private readonly openAIService: OpenAIService,
    private readonly promptRegistry: PromptRegistryService,
  ) {}

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

  async createContentVersion(sessionId: string, payload: CreateContentVersionDto) {
    const session = await this.findOne(sessionId);
    const version = this.contentRepository.create({ ...payload, session });
    return this.contentRepository.save(version);
  }

  private readonly logger = new Logger(SessionsService.name);

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
          audienceSize: '8-20', // Could be made configurable
        };

        aiOutline = await this.openAIService.generateSessionOutline(openAIRequest);
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

  private mapSectionType(title: string, index: number): string {
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
    const session = await this.findOne(sessionId);
    const draft = await this.draftsRepository.findOne({ where: { draftKey: sessionId } });
    const payload = draft?.payload ?? null;
    const metadata = (payload?.metadata as Record<string, any>) ?? {};
    const outline = payload?.outline ?? null;

    const sessionStart = metadata.startTime ?? session.scheduledAt?.toISOString() ?? null;
    let sessionEnd: string | null = metadata.endTime ?? null;
    if (!sessionEnd && session.scheduledAt && session.durationMinutes) {
      sessionEnd = new Date(
        session.scheduledAt.getTime() + session.durationMinutes * 60 * 1000,
      ).toISOString();
    }

    return {
      id: session.id,
      title: session.title,
      subtitle: session.subtitle,
      readinessScore: session.readinessScore,
      status: session.status,
      sessionType: metadata.sessionType ?? 'workshop',
      category: session.topic
        ? {
            id: session.topic.id,
            name: session.topic.name,
          }
        : metadata.category
        ? { name: metadata.category }
        : null,
      desiredOutcome: metadata.desiredOutcome ?? session.objective ?? '',
      currentProblem: metadata.currentProblem ?? '',
      specificTopics: metadata.specificTopics ?? '',
      startTime: sessionStart,
      endTime: sessionEnd,
      timezone: metadata.timezone ?? null,
      locationId: metadata.locationId ?? null,
      audienceId: metadata.audienceId ?? null,
      toneId: metadata.toneId ?? null,
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

  async autosaveBuilderDraft(
    sessionId: string,
    payload: BuilderAutosaveDto,
  ): Promise<{ savedAt: string }> {
    const savedAt = new Date();
    let session: Session | undefined;

    if (sessionId !== 'new') {
      session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
      if (!session) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }
    }

    await this.draftsRepository.upsert(
      {
        draftKey: sessionId,
        session: session ?? null,
        payload: { ...payload },
        savedAt,
      },
      {
        conflictPaths: ['draftKey'],
      },
    );

    return { savedAt: savedAt.toISOString() };
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

  private async findTopic(topicId: number): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException(`Topic ${topicId} not found`);
    }
    return topic;
  }
}
