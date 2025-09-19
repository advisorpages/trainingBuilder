import { DataSource } from 'typeorm';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { entities } from '../entities';
import {
  Role,
  User,
  Location,
  Trainer,
  Topic,
  Audience,
  Tone,
  Category,
  Session,
  SessionStatus,
  SessionStatusHistory,
  Incentive,
  IncentiveStatus,
  Registration,
  // SystemSetting,
  // SettingDataType,
  CoachingTip,
  DifficultyLevel,
  SessionCoachingTip,
  SessionCoachingTipStatus
} from '../entities';

/**
 * Production Database Seeder
 * Populates all tables with realistic dummy data
 */
class ProductionDatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  async seedDatabase() {
    console.log('🌱 Starting database seeding...');

    try {
      // 1. Seed Core Data (Roles, System Settings)
      const roles = await this.seedRoles();
      console.log(`✅ Created ${roles.length} roles`);

      // Skip system settings for now due to schema mismatch
      console.log('⚠️ Skipping system settings due to schema mismatch');

      // 2. Seed Attribute Data
      const audiences = await this.seedAudiences();
      const tones = await this.seedTones();
      const categories = await this.seedCategories();
      const topics = await this.seedTopics();
      console.log(`✅ Created attributes: ${audiences.length} audiences, ${tones.length} tones, ${categories.length} categories, ${topics.length} topics`);

      // 3. Seed Resource Data
      const locations = await this.seedLocations();
      const trainers = await this.seedTrainers();
      console.log(`✅ Created ${locations.length} locations and ${trainers.length} trainers`);

      // 4. Seed Users
      const users = await this.seedUsers(roles);
      console.log(`✅ Created ${users.length} users`);

      // 5. Seed Sessions
      const sessions = await this.seedSessions(users, locations, trainers, audiences, tones, categories, topics);
      console.log(`✅ Created ${sessions.length} sessions`);

      // 6. Seed Incentives
      const incentives = await this.seedIncentives(users);
      console.log(`✅ Created ${incentives.length} incentives`);

      // 7. Seed Session-Related Data
      const coachingTips = await this.seedCoachingTips(users);
      const sessionCoachingTips = await this.seedSessionCoachingTips(sessions, coachingTips);
      const registrations = await this.seedRegistrations(sessions);
      console.log(`✅ Created ${coachingTips.length} coaching tips, ${sessionCoachingTips.length} session coaching tips, and ${registrations.length} registrations`);

      console.log('🎉 Database seeding completed successfully!');
      return {
        roles,
        users,
        locations,
        trainers,
        audiences,
        tones,
        categories,
        topics,
        sessions,
        incentives,
        coachingTips,
        sessionCoachingTips,
        registrations
        // systemSettings - skipped due to schema mismatch
      };
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async clearAllTables() {
    console.log('🧹 Clearing all tables...');

    // Clear in dependency order with CASCADE
    const tablesToClear = [
      'session_coaching_tips',
      'registrations',
      'session_topics',
      'sessions',
      'session_status_history',
      'incentives',
      'coaching_tips',
      'users',
      'trainers',
      'locations',
      'topics',
      'categories',
      'tones',
      'audiences',
      'system_settings',
      'roles'
    ];

    for (const table of tablesToClear) {
      try {
        await this.dataSource.query(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch (error) {
        // Ignore errors for tables that might not exist
        console.warn(`⚠️ Could not clear table ${table}:`, error.message);
      }
    }
  }

  private async seedRoles(): Promise<Role[]> {
    const roleRepo = this.dataSource.getRepository(Role);

    const rolesToCreate = [
      { name: 'Broker', description: 'Can view published content and reports' },
      { name: 'Content Developer', description: 'Can create and manage training content' },
      { name: 'Trainer', description: 'Can deliver training sessions and access trainer materials' }
    ];

    // Check existing roles and only create missing ones
    const allRoles = [];
    for (const roleData of rolesToCreate) {
      const existingRole = await roleRepo.findOne({ where: { name: roleData.name } });
      if (existingRole) {
        allRoles.push(existingRole);
      } else {
        const newRole = await roleRepo.save(roleData);
        allRoles.push(newRole);
      }
    }

    return allRoles;
  }

  // private async seedSystemSettings(): Promise<SystemSetting[]> {
  //   const settingRepo = this.dataSource.getRepository(SystemSetting);


  //   const settings = [
  //     {
  //       key: 'app.name',
  //       value: 'Leadership Training Platform',
  //       dataType: SettingDataType.STRING,
  //       category: 'application',
  //       description: 'Application name'
  //     },
  //     {
  //       key: 'app.version',
  //       value: '4.0.0',
  //       dataType: SettingDataType.STRING,
  //       category: 'application',
  //       description: 'Application version'
  //     },
  //     {
  //       key: 'session.max_registrations_default',
  //       value: '50',
  //       dataType: SettingDataType.NUMBER,
  //       category: 'sessions',
  //       description: 'Default maximum registrations per session'
  //     },
  //     {
  //       key: 'notifications.email_enabled',
  //       value: 'true',
  //       dataType: SettingDataType.BOOLEAN,
  //       category: 'notifications',
  //       description: 'Enable email notifications'
  //     }
  //   ];

  //   return await settingRepo.save(settings);
  // }

  private async seedAudiences(): Promise<Audience[]> {
    const audienceRepo = this.dataSource.getRepository(Audience);


    const audiences = [
      { name: 'New Managers', description: 'First-time managers and supervisors' },
      { name: 'Senior Leaders', description: 'Experienced executives and senior management' },
      { name: 'Team Leads', description: 'Team leaders and project managers' },
      { name: 'Individual Contributors', description: 'Individual team members looking to develop leadership skills' },
      { name: 'C-Suite', description: 'Chief executives and board members' }
    ];

    return await audienceRepo.save(audiences);
  }

  private async seedTones(): Promise<Tone[]> {
    const toneRepo = this.dataSource.getRepository(Tone);


    const tones = [
      { name: 'Professional', description: 'Formal business tone' },
      { name: 'Conversational', description: 'Casual and approachable tone' },
      { name: 'Motivational', description: 'Inspiring and energetic tone' },
      { name: 'Educational', description: 'Informative and instructional tone' },
      { name: 'Collaborative', description: 'Team-focused and inclusive tone' }
    ];

    return await toneRepo.save(tones);
  }

  private async seedCategories(): Promise<Category[]> {
    const categoryRepo = this.dataSource.getRepository(Category);


    const categories = [
      { name: 'Leadership Development', description: 'Core leadership skills and competencies' },
      { name: 'Communication', description: 'Effective communication and presentation skills' },
      { name: 'Team Management', description: 'Building and managing high-performing teams' },
      { name: 'Strategic Thinking', description: 'Strategic planning and decision making' },
      { name: 'Change Management', description: 'Leading organizational change and transformation' },
      { name: 'Performance Management', description: 'Managing and improving team performance' }
    ];

    return await categoryRepo.save(categories);
  }

  private async seedTopics(): Promise<Topic[]> {
    const topicRepo = this.dataSource.getRepository(Topic);


    const topics = [
      { name: 'Emotional Intelligence', description: 'Understanding and managing emotions in leadership' },
      { name: 'Conflict Resolution', description: 'Resolving workplace conflicts effectively' },
      { name: 'Public Speaking', description: 'Effective presentation and speaking skills' },
      { name: 'Decision Making', description: 'Strategic and tactical decision-making processes' },
      { name: 'Team Building', description: 'Creating cohesive and productive teams' },
      { name: 'Delegation', description: 'Effective task delegation and empowerment' },
      { name: 'Feedback & Coaching', description: 'Providing constructive feedback and coaching' },
      { name: 'Time Management', description: 'Prioritization and productivity techniques' },
      { name: 'Cultural Intelligence', description: 'Leading diverse and global teams' },
      { name: 'Innovation', description: 'Fostering creativity and innovation' }
    ];

    return await topicRepo.save(topics);
  }

  private async seedLocations(): Promise<Location[]> {
    const locationRepo = this.dataSource.getRepository(Location);


    const locations = [];
    for (let i = 0; i < 8; i++) {
      locations.push({
        name: faker.helpers.arrayElement([
          'Main Conference Room',
          'Training Center A',
          'Workshop Space',
          'Executive Boardroom',
          'Innovation Lab',
          'Collaboration Hub',
          'Learning Commons',
          'Presentation Theater'
        ]) + ` ${i + 1}`,
        address: faker.location.streetAddress({ useFullAddress: true }),
        capacity: faker.number.int({ min: 10, max: 100 }),
        isActive: true
      });
    }

    return await locationRepo.save(locations);
  }

  private async seedTrainers(): Promise<Trainer[]> {
    const trainerRepo = this.dataSource.getRepository(Trainer);


    const trainers = [];
    for (let i = 0; i < 12; i++) {
      trainers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        bio: faker.lorem.paragraphs(2),
        isActive: true
      });
    }

    return await trainerRepo.save(trainers);
  }

  private async seedUsers(roles: Role[]): Promise<User[]> {
    const userRepo = this.dataSource.getRepository(User);

    // Check if users already exist
    const existingUsers = await userRepo.find();
    if (existingUsers.length > 0) {
      console.log(`⚠️ Found ${existingUsers.length} existing users, skipping user seeding`);
      return existingUsers;
    }

    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [];

    // Create specific test users
    const testUsers = [
      { email: 'broker@test.com', roleId: roles.find(r => r.name === 'Broker')!.id },
      { email: 'contentdev@test.com', roleId: roles.find(r => r.name === 'Content Developer')!.id },
      { email: 'trainer@test.com', roleId: roles.find(r => r.name === 'Trainer')!.id },
    ];

    for (const testUser of testUsers) {
      users.push({
        email: testUser.email,
        passwordHash,
        roleId: testUser.roleId,
        isActive: true
      });
    }

    // Create additional random users
    for (let i = 0; i < 20; i++) {
      users.push({
        email: faker.internet.email(),
        passwordHash,
        roleId: faker.helpers.arrayElement(roles).id,
        isActive: faker.datatype.boolean(0.9) // 90% active
      });
    }

    return await userRepo.save(users);
  }

  private async seedSessions(
    users: User[],
    locations: Location[],
    trainers: Trainer[],
    audiences: Audience[],
    tones: Tone[],
    categories: Category[],
    topics: Topic[]
  ): Promise<Session[]> {
    const sessionRepo = this.dataSource.getRepository(Session);


    const sessions = [];
    const contentDevs = users.filter(u => u.role?.name === 'Content Developer');

    // Create sessions with different statuses and times
    for (let i = 0; i < 30; i++) {
      const startTime = faker.date.between({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      });

      const endTime = new Date(startTime.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000);

      const session = {
        title: faker.helpers.arrayElement([
          'Leadership Fundamentals',
          'Effective Communication',
          'Team Building Workshop',
          'Strategic Decision Making',
          'Conflict Resolution',
          'Emotional Intelligence Training',
          'Performance Management',
          'Change Leadership',
          'Innovation and Creativity',
          'Public Speaking Mastery'
        ]) + (i > 9 ? ` - Session ${i + 1}` : ''),
        description: faker.lorem.paragraphs(2),
        startTime,
        endTime,
        status: faker.helpers.weightedArrayElement([
          { weight: 0.4, value: SessionStatus.PUBLISHED },
          { weight: 0.3, value: SessionStatus.DRAFT },
          { weight: 0.2, value: SessionStatus.COMPLETED },
          { weight: 0.1, value: SessionStatus.CANCELLED }
        ]),
        authorId: faker.helpers.arrayElement(contentDevs).id,
        locationId: faker.helpers.arrayElement(locations).id,
        trainerId: faker.helpers.arrayElement(trainers).id,
        audienceId: faker.helpers.arrayElement(audiences).id,
        toneId: faker.helpers.arrayElement(tones).id,
        categoryId: faker.helpers.arrayElement(categories).id,
        maxRegistrations: faker.number.int({ min: 10, max: 100 }),
        qrCodeUrl: faker.internet.url(),
        promotionalHeadline: faker.lorem.sentence(),
        promotionalSummary: faker.lorem.paragraph(),
        keyBenefits: faker.lorem.lines(3),
        callToAction: 'Register now to secure your spot!',
        socialMediaContent: faker.lorem.paragraph(),
        emailMarketingContent: faker.lorem.paragraphs(2),
        contentValidationStatus: faker.helpers.arrayElement(['pending', 'valid', 'invalid']),
        publicationRequirementsMet: faker.datatype.boolean(0.7),
        isActive: true
      };

      sessions.push(session);
    }

    const savedSessions = await sessionRepo.save(sessions);

    // Add topics to sessions (many-to-many relationship)
    for (const session of savedSessions) {
      const sessionTopics = faker.helpers.arrayElements(topics, { min: 1, max: 3 });
      session.topics = sessionTopics;
      await sessionRepo.save(session);
    }

    return savedSessions;
  }

  private async seedIncentives(users: User[]): Promise<Incentive[]> {
    const incentiveRepo = this.dataSource.getRepository(Incentive);


    const incentives = [];
    const contentDevs = users.filter(u => u.role?.name === 'Content Developer');

    for (let i = 0; i < 10; i++) {
      const startDate = faker.date.between({
        from: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        to: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      });

      const endDate = new Date(startDate.getTime() + faker.number.int({ min: 7, max: 30 }) * 24 * 60 * 60 * 1000);

      incentives.push({
        title: faker.helpers.arrayElement([
          'Early Bird Discount',
          'Group Registration Bonus',
          'Leadership Excellence Certificate',
          'Free Follow-up Session',
          'Executive Coaching Hour',
          'Team Workshop Package',
          'Professional Development Credit',
          'VIP Networking Access',
          'Resource Library Access',
          'Mentorship Program Entry'
        ]),
        description: faker.lorem.paragraph(),
        rules: faker.lorem.lines(3),
        startDate,
        endDate,
        status: faker.helpers.weightedArrayElement([
          { weight: 0.6, value: IncentiveStatus.PUBLISHED },
          { weight: 0.2, value: IncentiveStatus.DRAFT },
          { weight: 0.1, value: IncentiveStatus.EXPIRED },
          { weight: 0.1, value: IncentiveStatus.CANCELLED }
        ]),
        authorId: faker.helpers.arrayElement(contentDevs).id,
        isActive: true
      });
    }

    return await incentiveRepo.save(incentives);
  }

  private async seedCoachingTips(users: User[]): Promise<CoachingTip[]> {
    const tipRepo = this.dataSource.getRepository(CoachingTip);


    const tips = [];
    const categories = ['preparation', 'delivery', 'engagement', 'follow_up'];

    const tipContent = {
      preparation: [
        'Review session materials 24 hours before delivery',
        'Prepare interactive exercises for audience engagement',
        'Test all technology and equipment beforehand',
        'Research participant backgrounds and experience levels'
      ],
      delivery: [
        'Start with an engaging icebreaker question',
        'Use the 10-minute rule for attention spans',
        'Maintain eye contact and move around the room',
        'Encourage questions throughout the session'
      ],
      engagement: [
        'Use interactive polls to gauge understanding',
        'Break into small groups for discussions',
        'Share real-world examples and case studies',
        'Encourage participants to share experiences'
      ],
      follow_up: [
        'Send summary notes within 24 hours',
        'Provide additional resources for learning',
        'Schedule follow-up sessions if beneficial',
        'Create feedback surveys for participants'
      ]
    };

    for (let i = 0; i < 40; i++) {
      const category = faker.helpers.arrayElement(categories);
      tips.push({
        category,
        title: faker.lorem.sentence(),
        content: faker.helpers.arrayElement(tipContent[category as keyof typeof tipContent]),
        difficultyLevel: faker.helpers.arrayElement(Object.values(DifficultyLevel)),
        createdByUserId: faker.helpers.arrayElement(users).id,
        isActive: true
      });
    }

    return await tipRepo.save(tips);
  }

  private async seedSessionCoachingTips(sessions: Session[], coachingTips: CoachingTip[]): Promise<SessionCoachingTip[]> {
    const sessionTipRepo = this.dataSource.getRepository(SessionCoachingTip);


    const sessionTips = [];
    const publishedSessions = sessions.filter(s => s.status === SessionStatus.PUBLISHED);

    for (const session of publishedSessions) {
      // Add 2-4 coaching tips per published session
      const tipsToAdd = faker.helpers.arrayElements(coachingTips, { min: 2, max: 4 });

      for (const tip of tipsToAdd) {
        sessionTips.push({
          sessionId: session.id,
          coachingTipId: tip.id,
          status: faker.helpers.arrayElement(Object.values(SessionCoachingTipStatus)),
          customContent: faker.datatype.boolean(0.3) ? faker.lorem.paragraph() : null
        });
      }
    }

    return await sessionTipRepo.save(sessionTips);
  }

  private async seedRegistrations(sessions: Session[]): Promise<Registration[]> {
    const registrationRepo = this.dataSource.getRepository(Registration);


    const registrations = [];
    const publishedSessions = sessions.filter(s => s.status === SessionStatus.PUBLISHED);

    for (const session of publishedSessions) {
      // Create 5-25 registrations per published session
      const numRegistrations = faker.number.int({ min: 5, max: 25 });

      for (let i = 0; i < numRegistrations; i++) {
        registrations.push({
          sessionId: session.id,
          participantName: faker.person.fullName(),
          participantEmail: faker.internet.email(),
          registrationDate: faker.date.between({
            from: new Date(session.createdAt),
            to: new Date()
          }),
          syncStatus: faker.helpers.arrayElement(['pending', 'synced', 'failed']),
          isActive: true
        });
      }
    }

    return await registrationRepo.save(registrations);
  }
}

// Script to run the seeder
async function runSeeder() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'leadership_training',
    entities: entities,
    synchronize: false, // Don't auto-create schema
    logging: false
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    const seeder = new ProductionDatabaseSeeder(dataSource);
    await seeder.seedDatabase();

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('📦 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  runSeeder();
}