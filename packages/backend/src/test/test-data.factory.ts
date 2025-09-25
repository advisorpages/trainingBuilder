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

export interface TestTopic {
  id?: number;
  name: string;
  description?: string;
  isActive?: boolean;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
   * Create a test topic
   */
  static createTopic(overrides: Partial<TestTopic> = {}): TestTopic {
    return {
      id: faker.number.int({ min: 1, max: 1000 }),
      name: faker.lorem.words(2),
      description: faker.lorem.sentence(),
      isActive: true,
      learningOutcomes: faker.lorem.paragraph(),
      trainerNotes: faker.lorem.paragraph(),
      materialsNeeded: faker.lorem.sentence(),
      deliveryGuidance: faker.lorem.paragraph(),
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
   * Create comprehensive business training topics
   */
  static createBusinessTopics(): TestTopic[] {
    const topics = [
      // Leadership & Management
      {
        name: 'Strategic Leadership',
        description: 'Develop vision, strategic thinking, and long-term planning skills for organizational success',
        learningOutcomes: 'Participants will be able to create strategic vision, develop long-term plans, and align team goals with organizational objectives.',
        trainerNotes: 'Focus on practical exercises and real-world case studies. Encourage group discussions on leadership challenges.',
        materialsNeeded: 'Whiteboard, flip charts, case study handouts, strategic planning templates'
      },
      {
        name: 'Team Building & Dynamics',
        description: 'Build high-performing teams through effective communication, trust, and collaboration',
        learningOutcomes: 'Teams will demonstrate improved communication, establish trust protocols, and implement collaborative work processes.',
        trainerNotes: 'Use interactive team exercises. Address conflict resolution and communication barriers.',
        materialsNeeded: 'Team assessment tools, trust-building activities, communication frameworks'
      },
      {
        name: 'Performance Management',
        description: 'Master goal setting, feedback delivery, and performance improvement strategies',
        learningOutcomes: 'Managers will effectively set SMART goals, deliver constructive feedback, and create performance improvement plans.',
        trainerNotes: 'Practice feedback scenarios with role-play exercises. Emphasize continuous improvement mindset.',
        materialsNeeded: 'Goal-setting templates, feedback forms, performance evaluation rubrics'
      },
      {
        name: 'Change Management',
        description: 'Lead organizational change initiatives and help teams adapt to new challenges',
        learningOutcomes: 'Leaders will navigate change processes, communicate change effectively, and support team adaptation.',
        trainerNotes: 'Address resistance to change and provide coping strategies. Use change model frameworks.',
        materialsNeeded: 'Change management models, communication templates, resistance assessment tools'
      },
      {
        name: 'Conflict Resolution',
        description: 'Navigate workplace conflicts and mediate disputes effectively',
        learningOutcomes: 'Participants will identify conflict sources, use mediation techniques, and implement resolution strategies.',
        trainerNotes: 'Practice with real scenarios. Emphasize neutral communication and win-win solutions.',
        materialsNeeded: 'Conflict resolution frameworks, mediation guides, communication scripts'
      },
      {
        name: 'Emotional Intelligence',
        description: 'Develop self-awareness and interpersonal skills for effective leadership',
        learningOutcomes: 'Leaders will demonstrate improved self-awareness, empathy, and emotional regulation in workplace situations.',
        trainerNotes: 'Use self-assessment tools and reflection exercises. Focus on practical application.',
        materialsNeeded: 'EQ assessment tools, reflection journals, interpersonal skills checklists'
      },

      // Sales & Business Development
      {
        name: 'Consultative Selling',
        description: 'Build relationships and solve customer problems through consultative sales approaches',
        learningOutcomes: 'Sales professionals will master consultative questioning, solution development, and relationship building.',
        trainerNotes: 'Role-play customer scenarios. Focus on listening skills and problem identification.',
        materialsNeeded: 'Customer personas, questioning frameworks, solution mapping tools'
      },
      {
        name: 'Prospecting & Lead Generation',
        description: 'Identify and qualify potential customers through various prospecting methods',
        learningOutcomes: 'Sales teams will implement systematic prospecting processes and qualification criteria.',
        trainerNotes: 'Practice prospecting techniques and qualification questions. Use CRM tools effectively.',
        materialsNeeded: 'Prospecting templates, CRM system access, qualification checklists'
      },
      {
        name: 'Negotiation Skills',
        description: 'Master win-win negotiation techniques for successful deal closure',
        learningOutcomes: 'Negotiators will prepare effectively, manage concessions, and close deals while maintaining relationships.',
        trainerNotes: 'Use negotiation simulations. Emphasize preparation and mutual value creation.',
        materialsNeeded: 'Negotiation frameworks, simulation scenarios, preparation templates'
      },
      {
        name: 'Customer Relationship Management',
        description: 'Build lasting customer relationships and maximize lifetime value',
        learningOutcomes: 'Teams will develop customer retention strategies, implement loyalty programs, and measure relationship health.',
        trainerNotes: 'Focus on customer journey mapping and touchpoint optimization.',
        materialsNeeded: 'Customer journey templates, relationship mapping tools, loyalty program examples'
      },
      {
        name: 'Presentation Skills',
        description: 'Deliver compelling presentations that persuade and influence audiences',
        learningOutcomes: 'Presenters will structure persuasive presentations, engage audiences, and handle questions confidently.',
        trainerNotes: 'Practice with video recording. Provide feedback on body language and vocal delivery.',
        materialsNeeded: 'Presentation templates, video equipment, feedback forms, audience engagement tools'
      },

      // Professional Development
      {
        name: 'Time Management & Productivity',
        description: 'Optimize personal and team productivity through effective time management',
        learningOutcomes: 'Participants will prioritize tasks effectively, eliminate time wasters, and implement productivity systems.',
        trainerNotes: 'Focus on practical tools and personal productivity audits. Address common time management challenges.',
        materialsNeeded: 'Time tracking tools, priority matrices, productivity apps, planning templates'
      },
      {
        name: 'Communication Skills',
        description: 'Enhance verbal, written, and non-verbal communication effectiveness',
        learningOutcomes: 'Communicators will deliver clear messages, active listen, and adapt communication styles to audiences.',
        trainerNotes: 'Practice active listening exercises and communication style assessments.',
        materialsNeeded: 'Communication style assessments, listening exercises, message clarity checklists'
      },
      {
        name: 'Problem Solving & Decision Making',
        description: 'Develop analytical thinking and structured problem-solving approaches',
        learningOutcomes: 'Teams will systematically analyze problems, generate solutions, and make data-driven decisions.',
        trainerNotes: 'Use case studies and problem-solving frameworks. Emphasize creative thinking techniques.',
        materialsNeeded: 'Problem-solving frameworks, case studies, decision matrices, brainstorming tools'
      },
      {
        name: 'Professional Networking',
        description: 'Build and maintain professional networks for career growth',
        learningOutcomes: 'Professionals will develop networking strategies, build meaningful connections, and leverage networks for opportunities.',
        trainerNotes: 'Practice elevator pitches and networking conversations. Address introversion challenges.',
        materialsNeeded: 'Networking templates, contact management tools, elevator pitch worksheets'
      }
    ];

    return topics.map((topicData, index) => this.createTopic({
      name: topicData.name,
      description: topicData.description,
      learningOutcomes: topicData.learningOutcomes,
      trainerNotes: topicData.trainerNotes,
      materialsNeeded: topicData.materialsNeeded,
      deliveryGuidance: 'Standard 2-hour workshop format with breaks every 45 minutes. Include interactive elements and practical exercises.',
      isActive: true,
      createdAt: new Date(Date.now() - (topics.length - index) * 24 * 60 * 60 * 1000), // Spread creation dates
      updatedAt: faker.date.recent(),
    }));
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