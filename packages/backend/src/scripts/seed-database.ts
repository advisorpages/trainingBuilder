import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { entities, Session, Topic, User, UserRole, Trainer, Incentive, LandingPage, SessionStatus } from '../entities';

async function runSeeder() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'leadership_training',
    entities,
    synchronize: false,
  });

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      // Clear existing data for development seeding
      console.log('🧹 Clearing existing data...');
      await manager.query('DELETE FROM session_incentives');
      await manager.query('DELETE FROM trainer_assets');
      await manager.query('DELETE FROM trainer_assignments');
      await manager.query('DELETE FROM session_content_versions');
      await manager.query('DELETE FROM session_status_logs');
      await manager.query('DELETE FROM session_agenda_items');
      await manager.query('DELETE FROM landing_pages');
      await manager.query('DELETE FROM sessions');
      await manager.query('DELETE FROM incentives');
      await manager.query('DELETE FROM trainers');
      await manager.query('DELETE FROM topics');
      await manager.query('DELETE FROM users');
      console.log('✅ Existing data cleared');

      // Users
      const passwordHash = await bcrypt.hash('Password123!', 10);
      const users = [
        {
          email: 'sarah.content@company.com',
          role: UserRole.CONTENT_DEVELOPER,
          displayName: 'Sarah Content',
        },
        {
          email: 'broker1@company.com',
          role: UserRole.BROKER,
          displayName: 'Broker One',
        },
        {
          email: 'john.trainer@company.com',
          role: UserRole.TRAINER,
          displayName: 'John Trainer',
        },
      ].map(({ email, role, displayName }) =>
        manager.create(User, {
          email,
          passwordHash,
          role,
          displayName,
        }),
      );

      await manager.save(users);

      const contentDeveloper = users.find((user) => user.role === UserRole.CONTENT_DEVELOPER);

      if (!contentDeveloper) {
        throw new Error('Content developer seed user missing');
      }

      // Topics - Use raw SQL to insert with correct column names since TypeORM entity mapping is not working
      await manager.query(`
        INSERT INTO "topics"("name", "description", "is_active", "ai_generated_content", "learning_outcomes", "trainer_notes", "materials_needed", "delivery_guidance", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'Leadership Foundations',
        'Core principles for new leaders.',
        true,
        JSON.stringify({ summary: 'Core leadership principles and practices', keyPoints: ['Vision setting', 'Team motivation', 'Decision making'] }),
        'Participants will understand core leadership principles',
        'Focus on practical application examples',
        'Whiteboard, markers',
        'Interactive discussion format',
        new Date(),
        new Date()
      ]);

      // Get the created topic for use in sessions
      const topicResult = await manager.query('SELECT * FROM "topics" WHERE "name" = $1', ['Leadership Foundations']);
      const leadershipTopic = topicResult[0];

      // Incentives - Use raw SQL to avoid TypeORM entity issues
      const incentiveResult = await manager.query(`
        INSERT INTO "incentives"("name", "overview", "terms", "is_active", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "id"
      `, [
        'Early Bird Bonus',
        'Register before the deadline to receive a downloadable resource pack.',
        'Valid for the first 50 registrants.',
        true,
        new Date(),
        new Date()
      ]);

      const incentive = { id: incentiveResult[0].id };

      // Trainer - Use raw SQL to avoid TypeORM entity issues
      await manager.query(`
        INSERT INTO "trainers"("name", "email", "bio", "expertise_tags", "timezone", "is_active", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        'Alex Morgan',
        'alex.morgan@example.com',
        'Seasoned leadership coach with 10 years of experience.',
        'leadership,communication',
        'America/Los_Angeles',
        true,
        new Date(),
        new Date()
      ]);

      // Session + landing page - Use raw SQL to avoid TypeORM entity issues
      const sessionResult = await manager.query(`
        INSERT INTO "sessions"("title", "subtitle", "audience", "objective", "status", "readiness_score", "topic_id", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING "id"
      `, [
        'Leading with Confidence',
        'A crash course for emerging leaders',
        'New managers and team leads',
        'Develop core leadership habits that inspire high-performing teams.',
        'draft',
        40,
        leadershipTopic.id,
        new Date(),
        new Date()
      ]);

      const sessionId = sessionResult[0].id;

      await manager.query(`
        INSERT INTO "landing_pages"("slug", "content", "session_id", "created_at", "updated_at")
        VALUES ($1, $2, $3, $4, $5)
      `, [
        'leading-with-confidence',
        JSON.stringify({
          heroHeadline: 'Lead with Confidence',
          heroSubheadline: 'Unlock leadership habits in a single session.',
        }),
        sessionId,
        new Date(),
        new Date()
      ]);

      // Link incentive to session
      await manager.query(`
        INSERT INTO "session_incentives"("session_id", "incentive_id")
        VALUES ($1, $2)
      `, [sessionId, incentive.id]);
    });

    console.log('✅ Seed data inserted.');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  runSeeder().catch((error) => {
    console.error('❌ Seeding failed', error);
    process.exit(1);
  });
}
