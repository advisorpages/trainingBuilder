import { Repository, SelectQueryBuilder } from 'typeorm';
import { TestDataFactory } from './test-data.factory';

/**
 * Mock utilities for testing NestJS applications
 */

/**
 * Create a mock TypeORM repository
 */
export function createMockRepository<T = any>(): Partial<Repository<T>> {
  const mockQueryBuilder = createMockQueryBuilder<T>();

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    manager: {
      transaction: jest.fn((fn) => fn({})),
    } as any,
  };
}

/**
 * Create a mock TypeORM query builder
 */
export function createMockQueryBuilder<T = any>(): Partial<SelectQueryBuilder<T>> {
  const mockBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
    execute: jest.fn(),
  };

  return mockBuilder;
}

/**
 * Mock service for testing
 */
export function createMockService<T = any>(methods: (keyof T)[] = []): Partial<T> {
  const mockService: any = {};

  methods.forEach(method => {
    mockService[method] = jest.fn();
  });

  return mockService;
}

/**
 * Mock HTTP request/response objects
 */
export const mockRequest = () => ({
  user: TestDataFactory.createUser(),
  body: {},
  params: {},
  query: {},
  headers: {},
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Mock JWT service
 */
export const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn().mockReturnValue({ sub: 1, email: 'test@test.com' }),
  decode: jest.fn().mockReturnValue({ sub: 1, email: 'test@test.com' }),
});

/**
 * Mock config service
 */
export const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config = {
      'database.host': 'localhost',
      'database.port': 5433,
      'database.username': 'test_user',
      'database.password': 'test_password',
      'database.name': 'training_builder_test',
      'jwt.secret': 'test-secret',
      'jwt.expiresIn': '24h',
    };
    return config[key];
  }),
});

/**
 * Mock external services for Epic 4
 */
export const mockEmailService = () => ({
  sendTrainerKitEmail: jest.fn().mockResolvedValue({
    messageId: 'mock-message-id',
    response: '250 Message accepted',
  }),
  sendEmail: jest.fn().mockResolvedValue(true),
});

export const mockAIService = () => ({
  generateCoachingTips: jest.fn().mockResolvedValue([
    {
      category: 'preparation',
      tips: [
        'Review the session outline 24 hours before delivery',
        'Prepare interactive exercises for audience engagement',
      ],
    },
    {
      category: 'delivery',
      tips: [
        'Start with an engaging icebreaker or question',
        'Use the 10-minute rule for attention spans',
      ],
    },
  ]),
  generateContent: jest.fn().mockResolvedValue('Generated AI content'),
});

/**
 * Epic 4 specific mocks based on failed test analysis
 */
export const epic4Mocks = {
  /**
   * Mock trainer service with Epic 4 specific methods
   */
  trainerService: () => ({
    getTrainerDashboardSummary: jest.fn().mockResolvedValue({
      upcomingSessions: [
        TestDataFactory.createSession({
          id: 1,
          title: 'Leadership Fundamentals',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }),
      ],
      totalUpcoming: 1,
      thisWeekCount: 1,
    }),

    getTrainerUpcomingSessions: jest.fn().mockResolvedValue([
      TestDataFactory.createSession({
        id: 1,
        title: 'Leadership Fundamentals',
        trainerId: 1,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    ]),

    getTrainerSessionDetail: jest.fn().mockResolvedValue({
      ...TestDataFactory.createSession({
        id: 1,
        trainerId: 1,
      }),
      trainer: TestDataFactory.createTrainer({ id: 1 }),
      location: TestDataFactory.createLocation({ id: 1 }),
      registrationCount: 5,
    }),

    getSessionCoachingTips: jest.fn().mockResolvedValue([
      TestDataFactory.createCoachingTip({
        sessionId: 1,
        trainerId: 1,
        category: 'preparation',
      }),
    ]),
  }),

  /**
   * Mock repository responses for Epic 4 entities
   */
  sessionRepository: () => {
    const mockRepo = createMockRepository();

    // Fix the issues identified in Epic 4 failed tests
    mockRepo.find = jest.fn().mockImplementation((options) => {
      if (options?.where?.trainerId || options?.where?.trainer?.id) {
        return Promise.resolve([
          TestDataFactory.createSession({
            id: 1,
            trainerId: 1,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        ]);
      }
      return Promise.resolve([]);
    });

    mockRepo.findOne = jest.fn().mockImplementation((options) => {
      if (options?.where?.id) {
        return Promise.resolve({
          ...TestDataFactory.createSession({
            id: options.where.id,
            trainerId: 1,
          }),
          trainer: TestDataFactory.createTrainer({ id: 1 }),
          location: TestDataFactory.createLocation({ id: 1 }),
        });
      }
      return Promise.resolve(null);
    });

    return mockRepo;
  },

  /**
   * Mock coaching tips repository
   */
  coachingTipsRepository: () => {
    const mockRepo = createMockRepository();

    mockRepo.find = jest.fn().mockResolvedValue([
      TestDataFactory.createCoachingTip({
        sessionId: 1,
        trainerId: 1,
        category: 'preparation',
      }),
    ]);

    return mockRepo;
  },
};

/**
 * Test module builder helper
 */
export class TestModuleBuilder {
  private providers: any[] = [];

  addMockRepository<T>(token: string, mockRepo?: Partial<Repository<T>>) {
    this.providers.push({
      provide: token,
      useValue: mockRepo || createMockRepository<T>(),
    });
    return this;
  }

  addMockService<T>(token: string, mockService: Partial<T>) {
    this.providers.push({
      provide: token,
      useValue: mockService,
    });
    return this;
  }

  addEpic4Mocks() {
    // Add Epic 4 specific mocks
    this.addMockService('TrainerService', epic4Mocks.trainerService());
    this.addMockService('EmailService', mockEmailService());
    this.addMockService('AIService', mockAIService());
    return this;
  }

  build() {
    return this.providers;
  }
}

/**
 * Utility to create test module with common mocks
 */
export const createTestModule = () => new TestModuleBuilder();