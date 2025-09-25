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
} from '../../entities';
import { SessionsService } from './sessions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SuggestedSessionType } from './dto/suggest-outline.dto';

describe('SessionsService', () => {
let service: SessionsService | undefined;
let topicRepository: Repository<Topic> | undefined;
let incentiveRepository: Repository<Incentive> | undefined;
let userRepository: Repository<User> | undefined;
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
      providers: [SessionsService],
    }).compile();

    service = moduleRef.get(SessionsService);
    topicRepository = moduleRef.get(getRepositoryToken(Topic));
    incentiveRepository = moduleRef.get(getRepositoryToken(Incentive));
    userRepository = moduleRef.get(getRepositoryToken(User));
    dataSource = moduleRef.get(DataSource);

    await userRepository.save(
      userRepository.create({
        email: 'dev@example.com',
        passwordHash: 'hash',
        role: UserRole.CONTENT_DEVELOPER,
      }),
    );
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
      topicId: topic.id,
      incentiveIds: [incentive.id],
    });

    expect(session.id).toBeDefined();
    const fetched = await service.findOne(session.id);
    expect(fetched.topic?.id).toEqual(topic.id);
    expect(fetched.incentives).toHaveLength(1);
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
