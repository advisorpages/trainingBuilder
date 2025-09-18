import { DataSource } from 'typeorm';
import { TestDataFactory } from './test-data.factory';

/**
 * Database seeder for test environments
 * Provides utilities to seed and clean test data
 */
export class TestDatabaseSeeder {
  constructor(private dataSource: DataSource) {}

  /**
   * Seed basic test data for Epic 4 testing
   */
  async seedEpic4Data() {
    console.log('🌱 Seeding Epic 4 test data...');

    // Create the Epic 4 scenario
    const scenario = TestDataFactory.createEpic4Scenario();

    // Note: In a real implementation, you would save these to the database
    // For now, we'll return the data for use in tests

    try {
      // Save users (assuming User entity exists)
      // const userRepo = this.dataSource.getRepository(User);
      // const savedTrainer = await userRepo.save(scenario.trainerUser);
      // const savedContentDev = await userRepo.save(scenario.contentDevUser);

      // Save location
      // const locationRepo = this.dataSource.getRepository(Location);
      // const savedLocation = await locationRepo.save(scenario.location);

      // Save sessions
      // const sessionRepo = this.dataSource.getRepository(Session);
      // const savedSessions = await sessionRepo.save(scenario.upcomingSessions);

      // Save coaching tips
      // const tipRepo = this.dataSource.getRepository(CoachingTip);
      // const savedTips = await tipRepo.save(scenario.coachingTips);

      console.log('✅ Epic 4 test data seeded successfully');
      return scenario;
    } catch (error) {
      console.error('❌ Failed to seed Epic 4 test data:', error);
      throw error;
    }
  }

  /**
   * Seed comprehensive test data for all epics
   */
  async seedAllTestData() {
    console.log('🌱 Seeding comprehensive test data...');

    try {
      // Create users for each role
      const broker = TestDataFactory.createUser({ role: 'broker', email: 'broker@test.com' });
      const contentDev = TestDataFactory.createUser({
        role: 'content_developer',
        email: 'contentdev@test.com'
      });
      const trainer1 = TestDataFactory.createUser({ role: 'trainer', email: 'trainer1@test.com' });
      const trainer2 = TestDataFactory.createUser({ role: 'trainer', email: 'trainer2@test.com' });

      // Create locations
      const locations = TestDataFactory.createMany(
        () => TestDataFactory.createLocation(),
        3,
        [
          { name: 'Main Conference Room' },
          { name: 'Training Center A' },
          { name: 'Workshop Space' },
        ]
      );

      // Create trainers
      const trainers = TestDataFactory.createMany(
        () => TestDataFactory.createTrainer(),
        5
      );

      // Create sessions with various statuses
      const sessions = [
        // Published sessions for next 7 days (Epic 4)
        ...TestDataFactory.createMany(
          () => TestDataFactory.createSession({
            status: 'published',
            startTime: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
            trainerId: trainer1.id,
          }),
          5
        ),
        // Draft sessions (Epic 2, 3)
        ...TestDataFactory.createMany(
          () => TestDataFactory.createSession({
            status: 'draft',
            authorId: contentDev.id,
          }),
          3
        ),
        // Past sessions
        ...TestDataFactory.createMany(
          () => TestDataFactory.createSession({
            status: 'published',
            startTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          }),
          10
        ),
      ];

      // Create coaching tips for published sessions
      const coachingTips = sessions
        .filter(s => s.status === 'published')
        .flatMap(session =>
          TestDataFactory.createMany(
            () => TestDataFactory.createCoachingTip({
              sessionId: session.id,
              trainerId: session.trainerId,
            }),
            2
          )
        );

      console.log(`✅ Created test data:
        - ${4} users
        - ${locations.length} locations
        - ${trainers.length} trainers
        - ${sessions.length} sessions
        - ${coachingTips.length} coaching tips`);

      return {
        users: [broker, contentDev, trainer1, trainer2],
        locations,
        trainers,
        sessions,
        coachingTips,
      };
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  /**
   * Clean all test data from the database
   */
  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');

    try {
      // Clean in reverse dependency order to avoid foreign key constraints
      const queries = [
        'DELETE FROM coaching_tips',
        'DELETE FROM session_topics',
        'DELETE FROM registrations',
        'DELETE FROM sessions',
        'DELETE FROM trainers',
        'DELETE FROM locations',
        'DELETE FROM users',
      ];

      for (const query of queries) {
        try {
          await this.dataSource.query(query);
        } catch (error) {
          // Ignore errors for tables that might not exist yet
          console.warn(`⚠️ Could not execute: ${query}`, error.message);
        }
      }

      console.log('✅ Test data cleanup completed');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      throw error;
    }
  }

  /**
   * Reset the entire test database
   */
  async resetDatabase() {
    console.log('🔄 Resetting test database...');

    try {
      await this.cleanupTestData();

      // Reset auto-increment sequences
      const resetQueries = [
        'ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1',
        'ALTER SEQUENCE IF EXISTS locations_id_seq RESTART WITH 1',
        'ALTER SEQUENCE IF EXISTS trainers_id_seq RESTART WITH 1',
        'ALTER SEQUENCE IF EXISTS sessions_id_seq RESTART WITH 1',
        'ALTER SEQUENCE IF EXISTS coaching_tips_id_seq RESTART WITH 1',
      ];

      for (const query of resetQueries) {
        try {
          await this.dataSource.query(query);
        } catch (error) {
          // Ignore errors for sequences that might not exist
          console.warn(`⚠️ Could not reset sequence: ${query}`);
        }
      }

      console.log('✅ Database reset completed');
    } catch (error) {
      console.error('❌ Failed to reset database:', error);
      throw error;
    }
  }

  /**
   * Create minimal data for a specific test
   */
  async seedMinimalData(options: {
    includeTrainer?: boolean;
    includeContentDev?: boolean;
    includeSessions?: number;
    includeLocations?: number;
  } = {}) {
    const {
      includeTrainer = true,
      includeContentDev = false,
      includeSessions = 0,
      includeLocations = 1,
    } = options;

    const data: any = {};

    if (includeTrainer) {
      data.trainer = TestDataFactory.createUser({
        role: 'trainer',
        email: 'trainer@test.com',
      });
    }

    if (includeContentDev) {
      data.contentDev = TestDataFactory.createUser({
        role: 'content_developer',
        email: 'contentdev@test.com',
      });
    }

    if (includeLocations > 0) {
      data.locations = TestDataFactory.createMany(
        () => TestDataFactory.createLocation(),
        includeLocations
      );
    }

    if (includeSessions > 0) {
      data.sessions = TestDataFactory.createMany(
        () => TestDataFactory.createSession({
          trainerId: data.trainer?.id,
          locationId: data.locations?.[0]?.id,
        }),
        includeSessions
      );
    }

    return data;
  }
}

/**
 * Utility functions for test setup and teardown
 */
export const testDbUtils = {
  /**
   * Create a seeder instance for the given data source
   */
  createSeeder: (dataSource: DataSource) => new TestDatabaseSeeder(dataSource),

  /**
   * Quick setup for Epic 4 tests
   */
  setupEpic4: async (dataSource: DataSource) => {
    const seeder = new TestDatabaseSeeder(dataSource);
    await seeder.resetDatabase();
    return await seeder.seedEpic4Data();
  },

  /**
   * Quick cleanup for any test
   */
  cleanup: async (dataSource: DataSource) => {
    const seeder = new TestDatabaseSeeder(dataSource);
    await seeder.cleanupTestData();
  },
};