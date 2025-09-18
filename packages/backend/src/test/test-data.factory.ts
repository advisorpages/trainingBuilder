import { faker } from '@faker-js/faker';

// Type definitions for test data
export interface TestUser {
  id?: number;
  email: string;
  password?: string;
  passwordHash?: string;
  role: 'broker' | 'content_developer' | 'trainer';
  name?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestSession {
  id?: number;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  status: 'draft' | 'published' | 'cancelled';
  trainerId?: number;
  locationId?: number;
  authorId?: number;
  qrCodeUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestTrainer {
  id?: number;
  name: string;
  email: string;
  bio?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestLocation {
  id?: number;
  name: string;
  address: string;
  capacity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestCoachingTip {
  id?: number;
  sessionId: number;
  trainerId: number;
  category: 'preparation' | 'delivery' | 'engagement' | 'follow_up';
  content: string;
  createdAt?: Date;
}

/**
 * Test Data Factory - Creates realistic test data using Faker.js
 */
export class TestDataFactory {
  /**
   * Create a test user with the specified role
   */
  static createUser(overrides: Partial<TestUser> = {}): TestUser {
    const role = overrides.role || 'trainer';

    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      email: overrides.email || faker.internet.email(),
      password: 'password123',
      passwordHash: '$2b$10$test.hash.for.password123', // Mock bcrypt hash
      role,
      name: faker.person.fullName(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test session
   */
  static createSession(overrides: Partial<TestSession> = {}): TestSession {
    const startTime = overrides.startTime || faker.date.future();
    const endTime = overrides.endTime || new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      startTime,
      endTime,
      status: 'published',
      trainerId: faker.number.int({ min: 1, max: 10 }),
      locationId: faker.number.int({ min: 1, max: 5 }),
      authorId: faker.number.int({ min: 1, max: 10 }),
      qrCodeUrl: faker.internet.url(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test trainer
   */
  static createTrainer(overrides: Partial<TestTrainer> = {}): TestTrainer {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      bio: faker.lorem.paragraph(),
      isActive: true,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test location
   */
  static createLocation(overrides: Partial<TestLocation> = {}): TestLocation {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.company.name() + ' Center',
      address: faker.location.streetAddress({ useFullAddress: true }),
      capacity: faker.number.int({ min: 10, max: 200 }),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a test coaching tip
   */
  static createCoachingTip(overrides: Partial<TestCoachingTip> = {}): TestCoachingTip {
    const categories = ['preparation', 'delivery', 'engagement', 'follow_up'] as const;
    const category = overrides.category || faker.helpers.arrayElement(categories);

    const tipsByCategory = {
      preparation: [
        'Review the session outline 24 hours before delivery',
        'Prepare interactive exercises for audience engagement',
        'Set up equipment and test all technology beforehand',
        'Research your audience demographics and experience level',
      ],
      delivery: [
        'Start with an engaging icebreaker or question',
        'Use the 10-minute rule for attention spans',
        'Encourage questions throughout the session',
        'Maintain eye contact and move around the room',
      ],
      engagement: [
        'Use interactive polls to gauge understanding',
        'Break into small groups for discussions',
        'Share real-world examples and case studies',
        'Encourage participants to share their experiences',
      ],
      follow_up: [
        'Send summary notes within 24 hours',
        'Provide additional resources for continued learning',
        'Schedule follow-up sessions if beneficial',
        'Create a feedback survey for participants',
      ],
    };

    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      sessionId: faker.number.int({ min: 1, max: 100 }),
      trainerId: faker.number.int({ min: 1, max: 10 }),
      category,
      content: faker.helpers.arrayElement(tipsByCategory[category]),
      createdAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create a complete Epic 4 test scenario
   */
  static createEpic4Scenario() {
    // Create a trainer user
    const trainerUser = this.createUser({
      role: 'trainer',
      email: 'trainer@test.com',
      name: 'Test Trainer',
    });

    // Create a content developer user
    const contentDevUser = this.createUser({
      role: 'content_developer',
      email: 'contentdev@test.com',
      name: 'Test Content Developer',
    });

    // Create a location
    const location = this.createLocation({
      name: 'Main Conference Room',
      address: '123 Business St, Suite 100',
    });

    // Create sessions assigned to the trainer (next 7 days)
    const upcomingSessions = [
      this.createSession({
        title: 'Leadership Fundamentals',
        trainerId: trainerUser.id,
        locationId: location.id,
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'published',
      }),
      this.createSession({
        title: 'Effective Communication',
        trainerId: trainerUser.id,
        locationId: location.id,
        startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        status: 'published',
      }),
      this.createSession({
        title: 'Team Building Workshop',
        trainerId: trainerUser.id,
        locationId: location.id,
        startTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        status: 'published',
      }),
    ];

    // Create coaching tips for the first session
    const coachingTips = [
      this.createCoachingTip({
        sessionId: upcomingSessions[0].id,
        trainerId: trainerUser.id,
        category: 'preparation',
        content: 'Review leadership principles and prepare interactive exercises',
      }),
      this.createCoachingTip({
        sessionId: upcomingSessions[0].id,
        trainerId: trainerUser.id,
        category: 'delivery',
        content: 'Start with a leadership challenge scenario to engage participants',
      }),
    ];

    return {
      trainerUser,
      contentDevUser,
      location,
      upcomingSessions,
      coachingTips,
    };
  }

  /**
   * Create multiple test items of a given type
   */
  static createMany<T>(
    factory: () => T,
    count: number,
    overrides: Partial<T>[] = []
  ): T[] {
    return Array.from({ length: count }, (_, index) => {
      const baseItem = factory();
      const override = overrides[index] || {};
      return { ...baseItem, ...override };
    });
  }

  /**
   * Create test data with relationships
   */
  static createSessionWithRelations() {
    const trainer = this.createTrainer();
    const location = this.createLocation();
    const session = this.createSession({
      trainerId: trainer.id,
      locationId: location.id,
    });
    const coachingTips = this.createMany(
      () => this.createCoachingTip({
        sessionId: session.id,
        trainerId: trainer.id,
      }),
      3
    );

    return {
      session,
      trainer,
      location,
      coachingTips,
    };
  }
}