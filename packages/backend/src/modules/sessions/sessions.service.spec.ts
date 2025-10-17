import { Test, type TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import {
  entities,
  Session,
  SessionContentVersion,
  SessionAgendaItem,
  SessionStatusLog,
  SessionBuilderDraft,
  LandingPage,
  Topic,
  Incentive,
  User,
  UserRole,
  ContentSource,
  SessionContentKind,
  SessionStatus,
} from '../../entities';
import { SessionsService } from './sessions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuggestedSessionType } from './dto/suggest-outline.dto';
import { TopicsService } from '../topics/topics.service';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService } from '../../services/openai.service';
import { PromptRegistryService } from '../../services/prompt-registry.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';
import { AiPromptSettingsService } from '../../services/ai-prompt-settings.service';
import { VariantConfigService } from '../../services/variant-config.service';
import { ConfigService } from '@nestjs/config';

const mockReadinessScoringService = {
  calculateReadinessScore: jest.fn().mockResolvedValue({
    score: 100,
    maxScore: 100,
    percentage: 100,
    checks: [],
    canPublish: true,
    recommendedActions: [],
  }),
  getReadinessThreshold: jest.fn().mockReturnValue(0),
  canPublish: jest.fn().mockResolvedValue(true),
};

const mockOpenAIService = {
  isConfigured: jest.fn().mockReturnValue(false),
  generateSessionOutline: jest.fn(),
};

const mockPromptRegistryService = {
  registerPrompt: jest.fn(),
  getPrompt: jest.fn(),
};

const mockRagIntegrationService = {
  queryRAGWithRetry: jest.fn().mockResolvedValue({ results: [] }),
};

const mockAIInteractionsService = {
  create: jest.fn().mockResolvedValue(undefined),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(false),
};

const mockAnalyticsTelemetryService = {
  recordEvent: jest.fn(),
};

const mockPromptSettingsService = {
  getCurrentSettings: jest.fn().mockResolvedValue({
    settings: {
      variantPersonas: [],
      quickTweaks: [],
    },
  }),
};

const mockVariantConfigService = {
  getVariantLabel: jest.fn().mockResolvedValue('Default'),
  getVariantDescription: jest.fn().mockResolvedValue('Default description'),
  getVariantInstruction: jest.fn().mockResolvedValue('Default instruction'),
};

describe('SessionsService', () => {
  let service: SessionsService | undefined;
  let topicRepository: Repository<Topic> | undefined;
  let incentiveRepository: Repository<Incentive> | undefined;
  let userRepository: Repository<User> | undefined;
  let sessionRepository: Repository<Session> | undefined;
  let draftsRepository: Repository<SessionBuilderDraft> | undefined;
  let dataSource: DataSource | undefined;
  let container: StartedTestContainer | undefined;
  let runtimeAvailable = true;

  beforeAll(async () => {
    jest.setTimeout(60000);

    try {
      container = await new GenericContainer('postgres:15-alpine')
        .withEnvironment({
          POSTGRES_DB: 'test',
          POSTGRES_USER: 'test',
          POSTGRES_PASSWORD: 'test',
        })
        .withExposedPorts(5432)
        .start();
    } catch (error) {
      runtimeAvailable = false;
      console.warn('⚠️ Skipping SessionsService tests: unable to start Postgres test container.', error);
      return;
    }

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getMappedPort(5432),
          username: 'test',
          password: 'test',
          database: 'test',
          entities,
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          Session,
          SessionContentVersion,
          SessionAgendaItem,
          SessionStatusLog,
          SessionBuilderDraft,
          LandingPage,
          Topic,
          Incentive,
          User,
        ]),
      ],
      providers: [
        SessionsService,
        TopicsService,
        { provide: ReadinessScoringService, useValue: mockReadinessScoringService },
        { provide: OpenAIService, useValue: mockOpenAIService },
        { provide: PromptRegistryService, useValue: mockPromptRegistryService },
        { provide: RagIntegrationService, useValue: mockRagIntegrationService },
        { provide: AIInteractionsService, useValue: mockAIInteractionsService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AnalyticsTelemetryService, useValue: mockAnalyticsTelemetryService },
        { provide: AiPromptSettingsService, useValue: mockPromptSettingsService },
        { provide: VariantConfigService, useValue: mockVariantConfigService },
      ],
    }).compile();

    service = moduleRef.get(SessionsService);
    topicRepository = moduleRef.get(getRepositoryToken(Topic));
    incentiveRepository = moduleRef.get(getRepositoryToken(Incentive));
    userRepository = moduleRef.get(getRepositoryToken(User));
    sessionRepository = moduleRef.get(getRepositoryToken(Session));
    draftsRepository = moduleRef.get(getRepositoryToken(SessionBuilderDraft));
    dataSource = moduleRef.get(DataSource);

    await userRepository.save(
      userRepository.create({
        email: 'dev@example.com',
        passwordHash: 'hash',
        role: UserRole.CONTENT_DEVELOPER,
      }),
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (container) {
      await container.stop();
    }
  });

  it('creates a session with topic and incentives', async () => {
    if (!runtimeAvailable || !service || !topicRepository || !incentiveRepository) {
      return;
    }
    const topic = await topicRepository.save(
      topicRepository.create({ name: 'Leadership', description: 'Leadership essentials' }),
    );

    const incentive = await incentiveRepository.save(
      incentiveRepository.create({ name: 'Early bird', overview: 'Register early' }),
    );

    const session = await service.create({
      title: 'Leading with Confidence',
      topicIds: [topic.id],
      incentiveIds: [incentive.id],
    });

    expect(session.id).toBeDefined();
    const fetched = await service.findOne(session.id);
    expect(fetched.topics?.[0]?.id).toEqual(topic.id);
    expect(fetched.incentives).toHaveLength(1);
  });

  it('updates session metadata via autosaveBuilderDraft for existing sessions', async () => {
    if (!runtimeAvailable || !service || !sessionRepository || !draftsRepository) {
      return;
    }

    const session = await sessionRepository.save(
      sessionRepository.create({
        title: 'Original Session',
        status: SessionStatus.DRAFT,
        readinessScore: 10,
      }),
    );

    const startTime = new Date('2024-04-01T15:00:00.000Z');
    const endTime = new Date('2024-04-01T16:30:00.000Z');

    await service.autosaveBuilderDraft(session.id, {
      metadata: {
        title: 'Updated Session Title',
        desiredOutcome: 'Updated objective',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
      outline: {
        sections: [],
        totalDuration: 0,
      },
      aiPrompt: 'Prompt',
      aiVersions: [],
      readinessScore: 72,
    });

    const updatedSession = await sessionRepository.findOne({ where: { id: session.id } });
    expect(updatedSession).toBeTruthy();
    expect(updatedSession?.title).toBe('Updated Session Title');
    expect(updatedSession?.objective).toBe('Updated objective');
    expect(updatedSession?.readinessScore).toBe(72);
    expect(updatedSession?.scheduledAt?.toISOString()).toBe(startTime.toISOString());
    expect(updatedSession?.durationMinutes).toBe(90);

    const draft = await draftsRepository.findOne({ where: { draftKey: session.id } });
    expect(draft).toBeTruthy();
    expect(draft?.payload).toBeTruthy();
  });

  it('imports sessions with reusable topics and enriched fields', async () => {
    if (!runtimeAvailable || !service || !topicRepository || !sessionRepository) {
      return;
    }

    const importResult = await service.importSessions({
      sessions: [
        {
          title: 'AI Leadership 101',
          status: SessionStatus.DRAFT,
          objective: 'Help leaders understand the foundations of AI adoption.',
          topics: [
            {
              name: 'AI Foundations',
              description: 'Intro to AI concepts',
              learningOutcomes: 'Explain key AI terms to stakeholders',
              trainerNotes: 'Share a success story from the field',
              materialsNeeded: 'Slides, markers',
              deliveryGuidance: 'Encourage open discussion',
            },
          ],
        },
      ],
    });

    expect(importResult.created).toBe(1);
    expect(importResult.updated).toBe(0);
    expect(importResult.topicsCreated).toBe(1);
    expect(importResult.topicsUpdated).toBe(0);
    expect(importResult.errors).toHaveLength(0);

    const savedTopic = await topicRepository.findOne({ where: { name: 'AI Foundations' } });
    expect(savedTopic).toBeDefined();
    expect(savedTopic?.description).toBe('Intro to AI concepts');
    expect(savedTopic?.learningOutcomes).toContain('Explain key AI terms');

    const savedSession = await sessionRepository.findOne({
      where: { title: 'AI Leadership 101' },
      relations: ['topics'],
    });

    expect(savedSession).toBeDefined();
    expect(savedSession?.topics?.[0]?.id).toEqual(savedTopic?.id);

    const secondImport = await service.importSessions({
      sessions: [
        {
          title: 'AI Leadership Advanced',
          status: SessionStatus.DRAFT,
          topics: [
            {
              name: 'AI Foundations',
              trainerNotes: 'Updated facilitation notes',
              materialsNeeded: 'Case studies, whiteboard',
            },
          ],
        },
      ],
    });

    expect(secondImport.created).toBe(1);
    expect(secondImport.topicsCreated).toBe(0);
    expect(secondImport.topicsUpdated).toBeGreaterThan(0);
    expect(secondImport.errors).toHaveLength(0);

    const updatedTopic = await topicRepository.findOne({ where: { name: 'AI Foundations' } });
    expect(updatedTopic?.trainerNotes).toBe('Updated facilitation notes');
    expect(updatedTopic?.materialsNeeded).toBe('Case studies, whiteboard');
  });

  it('creates a content version for a session', async () => {
    if (!runtimeAvailable || !service) {
      return;
    }
    const [session] = await service.findAll();

    const version = await service.createContentVersion(session.id, {
      kind: SessionContentKind.HEADLINE,
      source: ContentSource.AI,
      content: { text: 'Inspire your team' },
      prompt: 'Generate headline',
    });

    expect(version.id).toBeDefined();
    expect(version.session.id).toEqual(session.id);
  });

  it('suggests a draft outline', async () => {
    if (!service) {
      return;
    }

    const response = await service.suggestOutline({
      category: 'Leadership',
      sessionType: SuggestedSessionType.WORKSHOP,
      desiredOutcome: 'Managers navigate change confidently',
      currentProblem: 'Teams are uncertain about priorities',
      specificTopics: 'Change curve, resilience stories',
    });

    expect(response.outline.sections).toHaveLength(4);
    expect(response.outline.totalDuration).toBeGreaterThan(0);
    expect(response.outline.suggestedSessionTitle).toContain('Leadership');
    expect(response.generationMetadata.fallbackUsed).toBe(false);
  });
});
