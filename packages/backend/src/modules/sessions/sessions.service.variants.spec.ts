import { ConfigService } from '@nestjs/config';
import { Repository, EntityManager } from 'typeorm';
import { SessionsService, MultiVariantResponse } from './sessions.service';
import {
  Session,
  Topic,
  SessionTopic,
  Incentive,
  TrainerAssignment,
  Trainer,
  SessionContentVersion,
  SessionStatusLog,
  SessionBuilderDraft,
  Location,
} from '../../entities';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService, OpenAISessionOutlineRequest } from '../../services/openai.service';
import { PromptRegistryService } from '../../services/prompt-registry.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';
import { AIInteractionType } from '../../entities/ai-interaction.entity';
import { VariantConfigService } from '../../services/variant-config.service';
import { AiPromptSettingsService } from '../../services/ai-prompt-settings.service';
import { SuggestOutlineDto, SuggestOutlineResponse, SuggestedSessionType } from './dto/suggest-outline.dto';
import { TopicsService } from '../topics/topics.service';

type MockRepo<T> = Partial<Repository<T>> & {
  manager?: EntityManager;
  __managerMock?: { findOne: jest.Mock };
};

const createRepositoryMock = <T>(): MockRepo<T> => {
  const managerMock = {
    findOne: jest.fn(),
  };

  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    manager: managerMock as unknown as EntityManager,
    __managerMock: managerMock,
  };
};

const createConfigService = (overrides: Record<string, any> = {}) => {
  const defaults = {
    ENABLE_VARIANT_GENERATION_V2: true,
    VARIANT_GENERATION_ROLLOUT_PERCENTAGE: 100,
    LOG_VARIANT_SELECTIONS: true,
    RAG_API_URL: 'http://rag.example.com',
    RAG_TIMEOUT_MS: 1000,
    RAG_RETRY_ATTEMPTS: 1,
  };

  const values = { ...defaults, ...overrides };

  return {
    get: (key: string, fallback?: any) => {
      const value = values[key];
      return value !== undefined ? value : fallback;
    },
  } as unknown as ConfigService;
};

const createOutline = (label: string) => ({
  sections: [
    {
      title: `${label} Intro`,
      duration: 30,
      description: `${label} description`,
      learningObjectives: ['Understand context'],
      suggestedActivities: [],
    },
    {
      title: `${label} Workshop`,
      duration: 60,
      description: `${label} content`,
      learningObjectives: ['Apply learnings'],
      suggestedActivities: [],
    },
  ],
  suggestedTitle: `${label} Session`,
  summary: `${label} summary`,
  difficulty: 'Intermediate',
  recommendedAudienceSize: '8-20',
});

const createLegacyOutline = (): SuggestOutlineResponse => ({
  outline: {
    sections: [
      {
        id: 'legacy-1',
        type: 'opener',
        position: 0,
        title: 'Legacy Intro',
        duration: 30,
        description: 'Legacy description',
      },
    ],
    totalDuration: 30,
    suggestedSessionTitle: 'Legacy Title',
    suggestedDescription: 'Legacy description',
    difficulty: 'Beginner',
    recommendedAudienceSize: '8-12',
    fallbackUsed: false,
    generatedAt: new Date().toISOString(),
  },
  relevantTopics: [],
  ragAvailable: false,
  generationMetadata: {
    processingTime: 42,
    ragQueried: false,
    fallbackUsed: false,
    topicsFound: 0,
  },
});

interface ServiceBundle {
  service: SessionsService;
  mocks: {
    sessionRepo: MockRepo<Session>;
    topicsRepo: MockRepo<Topic>;
    sessionTopicsRepo: MockRepo<SessionTopic>;
    trainerAssignmentsRepo: MockRepo<TrainerAssignment>;
    trainersRepo: MockRepo<Trainer>;
    locationsRepo: MockRepo<Location>;
    ragService: { queryRAGWithRetry: jest.Mock };
    openAIService: { generateSessionOutline: jest.Mock };
    aiInteractionsService: { create: jest.Mock };
    analyticsTelemetry: { recordEvent: jest.Mock };
    promptSettingsService: { getCurrentSettings: jest.Mock };
    variantConfigService: {
      getVariantLabel: jest.Mock;
      getVariantDescription: jest.Mock;
      getVariantInstruction: jest.Mock;
    };
    topicsService: { importTopics: jest.Mock };
  };
}

const createService = (configOverrides: Record<string, any> = {}): ServiceBundle => {
  const sessionRepo = createRepositoryMock<Session>();
  sessionRepo.__managerMock?.findOne.mockResolvedValue(null);

  const topicsRepo = createRepositoryMock<Topic>();
  const sessionTopicsRepo = createRepositoryMock<SessionTopic>();

  const incentivesRepo = createRepositoryMock<Incentive>();
  const trainerAssignmentsRepo = createRepositoryMock<TrainerAssignment>();
  const trainersRepo = createRepositoryMock<Trainer>();
  const contentRepo = createRepositoryMock<SessionContentVersion>();
  const statusLogsRepo = createRepositoryMock<SessionStatusLog>();
  const draftsRepo = createRepositoryMock<SessionBuilderDraft>();
  const locationsRepo = createRepositoryMock<Location>();

  const readinessScoringService = {} as ReadinessScoringService;
  const openAIService = {
    generateSessionOutline: jest.fn().mockImplementation((request: any) => createOutline(request.category)),
  };
  const promptRegistry = {} as PromptRegistryService;
  const ragService = {
    queryRAGWithRetry: jest.fn().mockResolvedValue([
      {
        text: 'Relevant chunk',
        metadata: { filename: 'doc-1', category: 'Leadership', created_at: new Date().toISOString() },
        similarity: 0.9,
        finalScore: 0.9,
      },
    ]),
  };
  const aiInteractionsService = {
    create: jest.fn().mockResolvedValue({ id: 'interaction-1', interactionType: AIInteractionType.VARIANT_SELECTION }),
  };
  const analyticsTelemetry = {
    recordEvent: jest.fn(),
  };
  const promptSettingsService = {
    getCurrentSettings: jest.fn().mockResolvedValue({
      settings: {
        quickTweaks: {},
        variantPersonas: [],
      },
    }),
  };
  const variantConfigService = {
    getVariantLabel: jest.fn().mockResolvedValue('Precision'),
    getVariantDescription: jest.fn().mockResolvedValue('Structured outline emphasizing clarity.'),
    getVariantInstruction: jest.fn().mockResolvedValue('Follow a {{duration}}-minute precision structure.'),
  };
  const topicsService = {
    importTopics: jest.fn().mockResolvedValue({ created: 0, updated: 0, errors: [] }),
  };

  const configService = createConfigService(configOverrides);

  const service = new SessionsService(
    sessionRepo as unknown as Repository<Session>,
    topicsRepo as unknown as Repository<Topic>,
    incentivesRepo as unknown as Repository<Incentive>,
    sessionTopicsRepo as unknown as Repository<SessionTopic>,
    trainerAssignmentsRepo as unknown as Repository<TrainerAssignment>,
    trainersRepo as unknown as Repository<Trainer>,
    contentRepo as unknown as Repository<SessionContentVersion>,
    statusLogsRepo as unknown as Repository<SessionStatusLog>,
    draftsRepo as unknown as Repository<SessionBuilderDraft>,
    locationsRepo as unknown as Repository<Location>,
    readinessScoringService,
    openAIService as unknown as OpenAIService,
    promptRegistry,
    ragService as unknown as RagIntegrationService,
    aiInteractionsService as unknown as AIInteractionsService,
    configService,
    analyticsTelemetry as unknown as AnalyticsTelemetryService,
    promptSettingsService as unknown as AiPromptSettingsService,
    variantConfigService as unknown as VariantConfigService,
    topicsService as unknown as TopicsService,
  );

  return {
    service,
    mocks: {
      sessionRepo,
      topicsRepo,
      sessionTopicsRepo,
      locationsRepo,
      ragService,
      openAIService,
      aiInteractionsService,
      analyticsTelemetry,
      promptSettingsService,
      variantConfigService,
      topicsService,
      trainerAssignmentsRepo,
      trainersRepo,
    },
  };
};

const basePayload: SuggestOutlineDto = {
  category: 'Leadership',
  sessionType: SuggestedSessionType.WORKSHOP,
  desiredOutcome: 'Boost coaching skills',
  currentProblem: 'Managers lack confidence',
  specificTopics: 'feedback, mentoring',
};

describe('SessionsService – multi-variant generation', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('falls back to legacy outline when feature flag is disabled', async () => {
    const { service, mocks } = createService({ ENABLE_VARIANT_GENERATION_V2: false });
    const legacyOutline = createLegacyOutline();

    jest.spyOn(service, 'suggestOutline').mockResolvedValueOnce(legacyOutline);

    const result = await service.suggestMultipleOutlines(basePayload);

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].id).toEqual('legacy-variant');
    expect(result.metadata.totalVariants).toEqual(1);

    expect(mocks.analyticsTelemetry.recordEvent).toHaveBeenCalledWith(
      'ai_content_generated',
      expect.objectContaining({
        sessionId: 'session-builder',
        metadata: expect.objectContaining({ variantMode: 'legacy' }),
      }),
    );
  });

  it('generates four variants with analytics when rollout is 100%', async () => {
    const { service, mocks } = createService({
      ENABLE_VARIANT_GENERATION_V2: true,
      VARIANT_GENERATION_ROLLOUT_PERCENTAGE: 100,
    });

    const response = await service.suggestMultipleOutlines(basePayload);

    expect(response.variants).toHaveLength(4);
    expect(response.metadata.totalVariants).toEqual(4);
    expect(response.metadata.processingTime).toBeGreaterThanOrEqual(0);
    expect(mocks.openAIService.generateSessionOutline).toHaveBeenCalledTimes(4);
    expect(mocks.ragService.queryRAGWithRetry).toHaveBeenCalledTimes(1);

    expect(mocks.analyticsTelemetry.recordEvent).toHaveBeenCalledWith(
      'ai_content_generated',
      expect.objectContaining({
        sessionId: 'session-builder',
        metadata: expect.objectContaining({
          variantMode: 'multi_variant',
          totalVariants: 4,
          ragAvailable: true,
        }),
      }),
    );
  });

  it('replaces instruction tokens with session context values', async () => {
    const { service, mocks } = createService({
      ENABLE_VARIANT_GENERATION_V2: true,
      VARIANT_GENERATION_ROLLOUT_PERCENTAGE: 100,
    });

    mocks.variantConfigService.getVariantInstruction.mockResolvedValue(
      'Guide {{audience_name}} through {{topics_count}} topics in {{duration_minutes}} minutes. Focus on {{specific_topics_list}}.',
    );

    const payload: SuggestOutlineDto = {
      ...basePayload,
      audienceName: 'Emerging Leaders',
      specificTopics: 'feedback, mentoring, delegation',
      topics: [
        { title: 'Feedback Frameworks', description: 'Role-play practice', durationMinutes: 30 },
        { title: 'Delegation Coaching', description: 'Case study', durationMinutes: 45 },
      ],
    };

    await service.suggestMultipleOutlines(payload);

    const firstCall =
      mocks.openAIService.generateSessionOutline.mock.calls[0][0] as OpenAISessionOutlineRequest;

    expect(firstCall.variantInstruction).toContain('Emerging Leaders');
    expect(firstCall.variantInstruction).toContain('2 topics');
    expect(firstCall.variantInstruction).toContain('90 minutes');
    expect(firstCall.variantInstruction).toContain('feedback, mentoring, delegation');
    expect(firstCall.variantInstruction).not.toMatch(/\{\{.*\}\}/);
  });

  it('falls back to legacy when variant generation fails for all variants', async () => {
    const { service, mocks } = createService();
    const legacyOutline = createLegacyOutline();

    mocks.openAIService.generateSessionOutline.mockRejectedValue(new Error('OpenAI error'));
    jest.spyOn(service, 'suggestOutline').mockResolvedValueOnce(legacyOutline);

    const result: MultiVariantResponse = await service.suggestMultipleOutlines(basePayload);

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].id).toEqual('legacy-variant');
    expect(mocks.analyticsTelemetry.recordEvent).toHaveBeenCalledWith(
      'ai_content_generated',
      expect.objectContaining({
        sessionId: 'session-builder',
        metadata: expect.objectContaining({ variantMode: 'legacy_fallback' }),
      }),
    );
  });

  it('adjusts only the final section to resolve minor duration drift', () => {
    const { service } = createService();
    const sections = [
      { id: 'seg-1', title: 'Opening', duration: 30 },
      { id: 'seg-2', title: 'Deep Dive', duration: 30 },
      { id: 'seg-3', title: 'Closing', duration: 30 },
    ];

    const balanced = (service as any).balanceDurations(sections, 92);

    expect(balanced[0].duration).toBe(30);
    expect(balanced[1].duration).toBe(30);
    expect(balanced[2].duration).toBe(32);
    expect(balanced.reduce((sum: number, section: any) => sum + section.duration, 0)).toBe(92);
  });
});

describe('SessionsService – variant selection logging', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('records variant selection analytics when logging enabled', async () => {
    const { service, mocks } = createService({
      ENABLE_VARIANT_GENERATION_V2: true,
      LOG_VARIANT_SELECTIONS: true,
    });

    mocks.aiInteractionsService.create.mockResolvedValueOnce({ id: 'interaction-123' });

    await service.logVariantSelection('session-789', {
      variantId: 'variant-1',
      generationSource: 'rag',
      ragWeight: 0.8,
      ragSourcesUsed: 5,
      category: 'Leadership',
    });

    expect(mocks.aiInteractionsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        interactionType: AIInteractionType.VARIANT_SELECTION,
        metadata: expect.objectContaining({
          sessionId: 'session-789',
          variantLabel: 'Knowledge Base-Driven',
        }),
      }),
    );

    expect(mocks.analyticsTelemetry.recordEvent).toHaveBeenCalledWith(
      'ai_content_accepted',
      expect.objectContaining({
        sessionId: 'session-789',
        metadata: expect.objectContaining({ variantId: 'variant-1', generationSource: 'rag' }),
      }),
    );
  });

  it('skips logging when disabled via configuration', async () => {
    const { service, mocks } = createService({
      LOG_VARIANT_SELECTIONS: false,
    });

    await service.logVariantSelection('session-123', {
      variantId: 'variant-2',
      generationSource: 'baseline',
      ragWeight: 0,
      ragSourcesUsed: 0,
      category: 'Leadership',
    });

    expect(mocks.aiInteractionsService.create).not.toHaveBeenCalled();
    expect(mocks.analyticsTelemetry.recordEvent).not.toHaveBeenCalled();
  });

  it('captures analytics error event when logging fails', async () => {
    const { service, mocks } = createService({
      LOG_VARIANT_SELECTIONS: true,
    });

    mocks.aiInteractionsService.create.mockRejectedValueOnce(new Error('DB write failed'));

    await service.logVariantSelection('session-456', {
      variantId: 'variant-3',
      generationSource: 'baseline',
      ragWeight: 0.2,
      ragSourcesUsed: 0,
      category: 'Leadership',
    });

    expect(mocks.analyticsTelemetry.recordEvent).toHaveBeenCalledWith(
      'ai_content_rejected',
      expect.objectContaining({
        sessionId: 'session-456',
        metadata: expect.objectContaining({
          variantId: 'variant-3',
          context: 'variant_selection_logging',
        }),
      }),
    );
  });
});
