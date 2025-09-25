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

      // Topics
      const leadershipTopic = manager.create(Topic, {
        name: 'Leadership Foundations',
        description: 'Core principles for new leaders.',
        tags: ['leadership', 'foundations'],
        createdBy: contentDeveloper,
        updatedBy: contentDeveloper,
      });
      await manager.save(leadershipTopic);

      // Incentives
      const incentive = manager.create(Incentive, {
        name: 'Early Bird Bonus',
        overview: 'Register before the deadline to receive a downloadable resource pack.',
        terms: 'Valid for the first 50 registrants.',
        isActive: true,
        createdBy: contentDeveloper,
        updatedBy: contentDeveloper,
      });
      await manager.save(incentive);

      // Trainer
      const trainer = manager.create(Trainer, {
        name: 'Alex Morgan',
        email: 'alex.morgan@example.com',
        bio: 'Seasoned leadership coach with 10 years of experience.',
        expertiseTags: ['leadership', 'communication'],
        timezone: 'America/Los_Angeles',
      });
      await manager.save(trainer);

      // Session + landing page
      const session = manager.create(Session, {
        title: 'Leading with Confidence',
        subtitle: 'A crash course for emerging leaders',
        audience: 'New managers and team leads',
        objective: 'Develop core leadership habits that inspire high-performing teams.',
        status: SessionStatus.DRAFT,
        readinessScore: 40,
        topic: leadershipTopic,
        incentives: [incentive],
        createdBy: contentDeveloper,
        updatedBy: contentDeveloper,
      });
      await manager.save(session);

      const landingPage = manager.create(LandingPage, {
        slug: 'leading-with-confidence',
        content: {
          heroHeadline: 'Lead with Confidence',
          heroSubheadline: 'Unlock leadership habits in a single session.',
        },
        session,
      });
      await manager.save(landingPage);
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
