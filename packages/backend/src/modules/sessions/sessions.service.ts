import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
} from './dto/suggest-outline.dto';

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
    topicId?: string;
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

    if (filters?.topicId) {
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
      audience: dto.audience,
      objective: dto.objective,
      status: dto.status ?? SessionStatus.DRAFT,
      readinessScore: dto.readinessScore ?? 0,
      topic,
      incentives,
    });

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
    if (dto.audience !== undefined) session.audience = dto.audience;
    if (dto.objective !== undefined) session.objective = dto.objective;
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

  async suggestOutline(payload: SuggestOutlineDto): Promise<SuggestOutlineResponse> {
    const now = new Date();
    const sections: SuggestedSessionSection[] = [
      {
        id: `intro-${now.getTime()}`,
        type: 'opener',
        position: 0,
        title: 'Welcome & Context Setting',
        duration: 10,
        description: `Open the ${payload.sessionType} with a quick framing that highlights why ${payload.category.toLowerCase()} matters right now.`,
        learningObjectives: ['Establish psychological safety', 'Align on session outcomes'],
      },
      {
        id: `core-${now.getTime() + 1}`,
        type: 'topic',
        position: 1,
        title: 'Core Concepts & Stories',
        duration: 25,
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
        duration: 20,
        description: 'Move the group into pairs or triads to translate the ideas into their current challenges.',
        suggestedActivities: ['Role-play scenarios', 'Case study walk-through', 'Peer feedback loops'],
      },
      {
        id: `close-${now.getTime() + 3}`,
        type: 'closing',
        position: 3,
        title: 'Commitments & Next Actions',
        duration: 10,
        description: 'Capture top takeaways and individual commitments; reference support assets available post-session.',
      },
    ];

    const totalDuration = sections.reduce((acc, section) => acc + section.duration, 0);
    const sessionTitle = `${payload.category} ${payload.sessionType === 'workshop' ? 'Workshop' : 'Session'}`;

    return {
      outline: {
        sections,
        totalDuration,
        suggestedSessionTitle: sessionTitle,
        suggestedDescription:
          payload.currentProblem
            ? `Equip participants to address ${payload.currentProblem.toLowerCase()} while progressing toward ${payload.desiredOutcome}.`
            : `Guide participants toward ${payload.desiredOutcome} with practical tools they can deploy immediately.`,
        difficulty: 'Intermediate',
        recommendedAudienceSize: '8-20',
        fallbackUsed: false,
        generatedAt: now.toISOString(),
      },
      relevantTopics: [],
      ragAvailable: false,
      generationMetadata: {
        processingTime: 320,
        ragQueried: false,
        fallbackUsed: false,
        topicsFound: sections[1].learningObjectives?.length ?? 0,
      },
    };
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
    if (sessionIds.length === 0) {
      return { updated: 0 };
    }

    const sessions = await this.sessionsRepository.find({
      where: { id: In(sessionIds) },
      relations: ['contentVersions', 'agendaItems', 'trainerAssignments', 'landingPage', 'incentives'],
    });

    const previousStatusMap = new Map<string, SessionStatus>();
    const readinessMap = new Map<string, ReadinessScore>();
    const updates: Session[] = [];

    for (const session of sessions) {
      if (session.status === status) {
        continue;
      }

      const previousStatus = session.status;
      session.status = status;
      this.applyPublishTimestamp(session, previousStatus);

      const readiness = await this.readinessScoringService.calculateReadinessScore(session);
      session.readinessScore = readiness.percentage;

      previousStatusMap.set(session.id, previousStatus);
      readinessMap.set(session.id, readiness);
      updates.push(session);
    }

    if (updates.length === 0) {
      return { updated: 0 };
    }

    await this.sessionsRepository.save(updates);

    for (const session of updates) {
      const previousStatus = previousStatusMap.get(session.id);
      const readiness = readinessMap.get(session.id);
      if (previousStatus && readiness) {
        await this.recordStatusTransition(session, previousStatus, readiness);
      }
    }

    return { updated: updates.length };
  }

  async bulkArchive(sessionIds: string[]): Promise<{ archived: number }> {
    const result = await this.bulkUpdateStatus(sessionIds, SessionStatus.RETIRED);
    return { archived: result.updated };
  }

  async bulkPublish(sessionIds: string[]): Promise<{ published: number; failed: string[] }> {
    if (sessionIds.length === 0) {
      return { published: 0, failed: [] };
    }

    const sessions = await this.sessionsRepository.find({
      where: { id: In(sessionIds) },
      relations: ['contentVersions', 'agendaItems', 'trainerAssignments', 'landingPage', 'incentives'],
    });

    const foundIds = new Set(sessions.map((session) => session.id));
    const missingIds = sessionIds.filter((id) => !foundIds.has(id));

    const publishable: Session[] = [];
    const readinessMap = new Map<string, ReadinessScore>();
    const previousStatusMap = new Map<string, SessionStatus>();
    const failed: string[] = [...missingIds];

    for (const session of sessions) {
      const readiness = await this.readinessScoringService.calculateReadinessScore(session);
      if (readiness.canPublish) {
        const previousStatus = session.status;
        previousStatusMap.set(session.id, previousStatus);
        session.status = SessionStatus.PUBLISHED;
        this.applyPublishTimestamp(session, previousStatus);
        session.readinessScore = readiness.percentage;
        readinessMap.set(session.id, readiness);
        publishable.push(session);
      } else {
        failed.push(session.id);
      }
    }

    if (publishable.length === 0) {
      return { published: 0, failed };
    }

    await this.sessionsRepository.save(publishable);

    for (const session of publishable) {
      const previousStatus = previousStatusMap.get(session.id);
      const readiness = readinessMap.get(session.id);
      if (previousStatus && readiness) {
        await this.recordStatusTransition(session, previousStatus, readiness);
      }
    }

    return { published: publishable.length, failed };
  }

  async publishSession(id: string): Promise<Session> {
    const session = await this.findOne(id);
    const readiness = await this.readinessScoringService.calculateReadinessScore(session);

    if (!readiness.canPublish) {
      throw new ForbiddenException(
        `Session is not ready for publishing (${readiness.percentage}% complete, ${this.readinessScoringService.getReadinessThreshold()}% required). ` +
          `Required actions: ${readiness.recommendedActions.join('; ')}`
      );
    }

    const previousStatus = session.status;
    session.status = SessionStatus.PUBLISHED;
    session.readinessScore = readiness.percentage;
    this.applyPublishTimestamp(session, previousStatus);

    const saved = await this.sessionsRepository.save(session);
    await this.recordStatusTransition(saved, previousStatus, readiness);

    return saved;
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

  private async findTopic(topicId: string): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new NotFoundException(`Topic ${topicId} not found`);
    }
    return topic;
  }
}
