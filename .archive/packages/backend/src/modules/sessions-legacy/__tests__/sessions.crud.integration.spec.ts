import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SessionsModule } from '../sessions.module';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';
import { Location } from '../../../entities/location.entity';
import { Trainer } from '../../../entities/trainer.entity';
import { Audience } from '../../../entities/audience.entity';
import { Topic } from '../../../entities/topic.entity';
import { Category } from '../../../entities/category.entity';
import { Tone } from '../../../entities/tone.entity';
import { Registration } from '../../../entities/registration.entity';
import { SessionStatusHistory } from '../../../entities/session-status-history.entity';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../modules/auth/auth.module';
import * as bcrypt from 'bcrypt';

describe('Sessions CRUD Integration Tests (Complete Coverage)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sessionRepository: Repository<Session>;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let locationRepository: Repository<Location>;
  let trainerRepository: Repository<Trainer>;
  let audienceRepository: Repository<Audience>;
  let topicRepository: Repository<Topic>;
  let categoryRepository: Repository<Category>;
  let toneRepository: Repository<Tone>;
  let registrationRepository: Repository<Registration>;
  let statusHistoryRepository: Repository<SessionStatusHistory>;

  let contentDeveloperAuthToken: string;
  let trainerAuthToken: string;
  let brokerAuthToken: string;
  let contentDeveloperUser: User;
  let trainerUser: User;
  let brokerUser: User;
  let testLocation: Location;
  let testTrainer: Trainer;
  let testAudience: Audience;
  let testTopic: Topic;
  let testCategory: Category;
  let testTone: Tone;

  const sampleSessionData = {
    title: 'Leadership Excellence Workshop',
    description: 'A comprehensive leadership development session',
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    endTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // 50 hours from now
    status: SessionStatus.DRAFT,
    locationId: null, // Will be set in beforeEach
    trainerId: null, // Will be set in beforeEach
    audienceId: null, // Will be set in beforeEach
    topicId: null, // Will be set in beforeEach
    categoryId: null, // Will be set in beforeEach
    toneId: null, // Will be set in beforeEach
    maxAttendees: 20,
    isActive: true,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        SessionsModule,
        AuthModule,
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    locationRepository = module.get<Repository<Location>>(getRepositoryToken(Location));
    trainerRepository = module.get<Repository<Trainer>>(getRepositoryToken(Trainer));
    audienceRepository = module.get<Repository<Audience>>(getRepositoryToken(Audience));
    topicRepository = module.get<Repository<Topic>>(getRepositoryToken(Topic));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    toneRepository = module.get<Repository<Tone>>(getRepositoryToken(Tone));
    registrationRepository = module.get<Repository<Registration>>(getRepositoryToken(Registration));
    statusHistoryRepository = module.get<Repository<SessionStatusHistory>>(getRepositoryToken(SessionStatusHistory));
  });

  beforeEach(async () => {
    // Clean up database
    await registrationRepository.delete({});
    await statusHistoryRepository.delete({});
    await sessionRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});
    await locationRepository.delete({});
    await trainerRepository.delete({});
    await audienceRepository.delete({});
    await topicRepository.delete({});
    await categoryRepository.delete({});
    await toneRepository.delete({});

    // Create roles
    const contentDeveloperRole = await roleRepository.save({
      name: 'CONTENT_DEVELOPER',
      permissions: ['CREATE_SESSION', 'UPDATE_SESSION', 'DELETE_SESSION', 'PUBLISH_SESSION'],
    });

    const trainerRole = await roleRepository.save({
      name: 'TRAINER',
      permissions: ['READ_SESSION', 'UPDATE_OWN_SESSION'],
    });

    const brokerRole = await roleRepository.save({
      name: 'BROKER',
      permissions: ['READ_SESSION', 'REGISTER_FOR_SESSION'],
    });

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);

    contentDeveloperUser = await userRepository.save({
      email: 'content.dev@test.com',
      passwordHash: hashedPassword,
      roleId: contentDeveloperRole.id,
      isActive: true,
    });

    trainerUser = await userRepository.save({
      email: 'trainer@test.com',
      passwordHash: hashedPassword,
      roleId: trainerRole.id,
      isActive: true,
    });

    brokerUser = await userRepository.save({
      email: 'broker@test.com',
      passwordHash: hashedPassword,
      roleId: brokerRole.id,
      isActive: true,
    });

    // Create related entities
    testLocation = await locationRepository.save({
      name: 'Main Conference Room',
      address: '123 Business Ave, City, State',
      capacity: 50,
      isActive: true,
    });

    testTrainer = await trainerRepository.save({
      firstName: 'John',
      lastName: 'Trainer',
      email: 'john.trainer@example.com',
      specialties: ['Leadership', 'Communication'],
      isActive: true,
    });

    testAudience = await audienceRepository.save({
      name: 'Senior Managers',
      description: 'Senior management level audience',
      isActive: true,
    });

    testTopic = await topicRepository.save({
      name: 'Leadership Development',
      description: 'Topics related to leadership skills',
      isActive: true,
    });

    testCategory = await categoryRepository.save({
      name: 'Professional Development',
      description: 'Professional growth and development',
      isActive: true,
    });

    testTone = await toneRepository.save({
      name: 'Professional',
      description: 'Professional and formal tone',
      isActive: true,
    });

    // Get auth tokens
    const contentDevLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'content.dev@test.com', password: 'password123' });
    contentDeveloperAuthToken = contentDevLogin.body.access_token;

    const trainerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'trainer@test.com', password: 'password123' });
    trainerAuthToken = trainerLogin.body.access_token;

    const brokerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'broker@test.com', password: 'password123' });
    brokerAuthToken = brokerLogin.body.access_token;

    // Update sample data with created entity IDs
    sampleSessionData.locationId = testLocation.id;
    sampleSessionData.trainerId = testTrainer.id;
    sampleSessionData.audienceId = testAudience.id;
    sampleSessionData.topicId = testTopic.id;
    sampleSessionData.categoryId = testCategory.id;
    sampleSessionData.toneId = testTone.id;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM registrations');
    await dataSource.query('DELETE FROM session_status_history');
    await dataSource.query('DELETE FROM sessions');
    await dataSource.query('DELETE FROM users');
    await dataSource.query('DELETE FROM roles');
    await dataSource.query('DELETE FROM locations');
    await dataSource.query('DELETE FROM trainers');
    await dataSource.query('DELETE FROM audiences');
    await dataSource.query('DELETE FROM topics');
    await dataSource.query('DELETE FROM categories');
    await dataSource.query('DELETE FROM tones');
    await app.close();
  });

  describe('POST /sessions (Create Session)', () => {
    it('should create session with valid data as content developer', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(sampleSessionData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: sampleSessionData.title,
        description: sampleSessionData.description,
        status: sampleSessionData.status,
        locationId: sampleSessionData.locationId,
        trainerId: sampleSessionData.trainerId,
        maxAttendees: sampleSessionData.maxAttendees,
        isActive: sampleSessionData.isActive,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body.authorId).toBe(contentDeveloperUser.id);

      // Verify in database with relationships
      const savedSession = await sessionRepository.findOne({
        where: { id: response.body.id },
        relations: ['author', 'location', 'trainer', 'audience', 'topic', 'category', 'tone'],
      });

      expect(savedSession).toBeTruthy();
      expect(savedSession.author.id).toBe(contentDeveloperUser.id);
      expect(savedSession.location.id).toBe(testLocation.id);
      expect(savedSession.trainer.id).toBe(testTrainer.id);
    });

    it('should auto-create status history entry on creation', async () => {
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(sampleSessionData)
        .expect(201);

      // Check status history
      const statusHistory = await statusHistoryRepository.find({
        where: { sessionId: response.body.id },
      });

      expect(statusHistory).toHaveLength(1);
      expect(statusHistory[0].newStatus).toBe(SessionStatus.DRAFT);
      expect(statusHistory[0].changedBy).toBe(contentDeveloperUser.id);
    });

    it('should fail with invalid time ranges', async () => {
      const invalidTimeData = {
        ...sampleSessionData,
        startTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // After end time
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      };

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(invalidTimeData)
        .expect(400);

      expect(response.body.message).toContain('end time must be after start time');
    });

    it('should fail with past dates', async () => {
      const pastDateData = {
        ...sampleSessionData,
        startTime: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        endTime: new Date(Date.now() - 46 * 60 * 60 * 1000), // 46 hours ago
      };

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(pastDateData)
        .expect(400);

      expect(response.body.message).toContain('cannot be in the past');
    });

    it('should fail with non-existent foreign key references', async () => {
      const invalidReferencesData = {
        ...sampleSessionData,
        locationId: 99999, // Non-existent location
      };

      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(invalidReferencesData)
        .expect(400);
    });

    it('should fail with schedule conflicts', async () => {
      // Create first session
      await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
        status: SessionStatus.PUBLISHED,
      });

      // Try to create overlapping session
      const conflictingData = {
        ...sampleSessionData,
        title: 'Conflicting Session',
        startTime: new Date(Date.now() + 47 * 60 * 60 * 1000), // Overlaps
        endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
      };

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(conflictingData)
        .expect(409);

      expect(response.body.message).toContain('schedule conflict');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .send(sampleSessionData)
        .expect(401);
    });

    it('should fail with insufficient permissions', async () => {
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(sampleSessionData)
        .expect(403);
    });

    it('should validate maximum attendees capacity', async () => {
      const overCapacityData = {
        ...sampleSessionData,
        maxAttendees: 100, // Exceeds location capacity of 50
      };

      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(overCapacityData)
        .expect(400);

      expect(response.body.message).toContain('exceeds location capacity');
    });
  });

  describe('GET /sessions (Read All Sessions)', () => {
    beforeEach(async () => {
      // Create test sessions with different statuses
      await sessionRepository.save([
        {
          ...sampleSessionData,
          title: 'Draft Session',
          status: SessionStatus.DRAFT,
          authorId: contentDeveloperUser.id,
        },
        {
          ...sampleSessionData,
          title: 'Published Session',
          status: SessionStatus.PUBLISHED,
          authorId: contentDeveloperUser.id,
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 74 * 60 * 60 * 1000),
        },
        {
          ...sampleSessionData,
          title: 'Completed Session',
          status: SessionStatus.COMPLETED,
          authorId: contentDeveloperUser.id,
          startTime: new Date(Date.now() + 96 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 98 * 60 * 60 * 1000),
        },
      ]);
    });

    it('should return paginated sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toHaveLength(3);

      // Should include relationships
      response.body.data.forEach(session => {
        expect(session).toHaveProperty('author');
        expect(session).toHaveProperty('location');
        expect(session).toHaveProperty('trainer');
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions?status=PUBLISHED')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(SessionStatus.PUBLISHED);
    });

    it('should filter by date range', async () => {
      const fromDate = new Date(Date.now() + 70 * 60 * 60 * 1000).toISOString();
      const toDate = new Date(Date.now() + 80 * 60 * 60 * 1000).toISOString();

      const response = await request(app.getHttpServer())
        .get(`/sessions?fromDate=${fromDate}&toDate=${toDate}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Published Session');
    });

    it('should filter by author', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions?authorId=${contentDeveloperUser.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data.every(session => session.authorId === contentDeveloperUser.id)).toBe(true);
    });

    it('should support search by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions?search=Draft')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Draft Session');
    });

    it('should show only published sessions to brokers', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(SessionStatus.PUBLISHED);
    });

    it('should support complex filtering combinations', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions?status=DRAFT&authorId=${contentDeveloperUser.id}&locationId=${testLocation.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Draft Session');
    });
  });

  describe('GET /sessions/:id (Read One Session)', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });
    });

    it('should return session with all relationships', async () => {
      const response = await request(app.getHttpServer())
        .get(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testSession.id,
        title: testSession.title,
        description: testSession.description,
        status: testSession.status,
      });

      // Should include all relationships
      expect(response.body.author).toBeDefined();
      expect(response.body.location).toBeDefined();
      expect(response.body.trainer).toBeDefined();
      expect(response.body.audience).toBeDefined();
      expect(response.body.topic).toBeDefined();
      expect(response.body.category).toBeDefined();
      expect(response.body.tone).toBeDefined();
    });

    it('should include registration count for published sessions', async () => {
      // Update session to published
      await sessionRepository.update(testSession.id, { status: SessionStatus.PUBLISHED });

      // Create some registrations
      await registrationRepository.save([
        { sessionId: testSession.id, participantName: 'John Doe', participantEmail: 'john@example.com' },
        { sessionId: testSession.id, participantName: 'Jane Smith', participantEmail: 'jane@example.com' },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);

      expect(response.body.registrationCount).toBe(2);
      expect(response.body.availableSpots).toBe(testSession.maxRegistrations - 2);
    });

    it('should return 404 for non-existent session', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/sessions/${fakeUuid}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should prevent brokers from viewing draft sessions', async () => {
      await request(app.getHttpServer())
        .get(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .expect(403);
    });

    it('should allow brokers to view published sessions', async () => {
      await sessionRepository.update(testSession.id, { status: SessionStatus.PUBLISHED });

      const response = await request(app.getHttpServer())
        .get(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .expect(200);

      expect(response.body.id).toBe(testSession.id);
    });
  });

  describe('PATCH /sessions/:id (Update Session)', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });
    });

    it('should update session with valid data', async () => {
      const updateData = {
        title: 'Updated Leadership Workshop',
        description: 'Updated description with new content',
        maxAttendees: 15,
      };

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(response.body.updatedAt).not.toBe(testSession.updatedAt);

      // Verify in database
      const updatedSession = await sessionRepository.findOne({
        where: { id: testSession.id },
      });
      expect(updatedSession.title).toBe(updateData.title);
    });

    it('should create status history on status change', async () => {
      const updateData = { status: SessionStatus.PUBLISHED };

      await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(updateData)
        .expect(200);

      // Check status history
      const statusHistory = await statusHistoryRepository.find({
        where: { sessionId: testSession.id },
        order: { createdAt: 'ASC' },
      });

      expect(statusHistory).toHaveLength(2); // Initial DRAFT + new PUBLISHED
      expect(statusHistory[1].newStatus).toBe(SessionStatus.PUBLISHED);
      expect(statusHistory[1].changedBy).toBe(contentDeveloperUser.id);
    });

    it('should prevent updates to published sessions without proper permissions', async () => {
      // Update to published first
      await sessionRepository.update(testSession.id, { status: SessionStatus.PUBLISHED });

      const updateData = { title: 'Unauthorized Update' };

      await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should validate schedule conflicts on time updates', async () => {
      // Create another session
      await sessionRepository.save({
        ...sampleSessionData,
        title: 'Existing Session',
        authorId: contentDeveloperUser.id,
        startTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 74 * 60 * 60 * 1000),
      });

      // Try to update current session to overlap
      const conflictingUpdate = {
        startTime: new Date(Date.now() + 71 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 73 * 60 * 60 * 1000),
      };

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(conflictingUpdate)
        .expect(409);

      expect(response.body.message).toContain('schedule conflict');
    });

    it('should prevent capacity reduction below current registrations', async () => {
      // Create registrations
      await registrationRepository.save([
        { sessionId: testSession.id, participantName: 'John Doe', participantEmail: 'john@example.com' },
        { sessionId: testSession.id, participantName: 'Jane Smith', participantEmail: 'jane@example.com' },
      ]);

      // Try to reduce capacity below registration count
      const updateData = { maxAttendees: 1 };

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('cannot reduce capacity below current registrations');
    });

    it('should allow authors to update their own sessions', async () => {
      // Create session by trainer user
      const trainerSession = await sessionRepository.save({
        ...sampleSessionData,
        title: 'Trainer Created Session',
        authorId: trainerUser.id,
      });

      const updateData = { description: 'Updated by trainer' };

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${trainerSession.id}`)
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.description).toBe(updateData.description);
    });

    it('should prevent authors from updating other users sessions', async () => {
      const updateData = { title: 'Unauthorized Update' };

      await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /sessions/:id (Delete Session)', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });
    });

    it('should delete draft session successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(204);

      // Verify deletion
      const deletedSession = await sessionRepository.findOne({
        where: { id: testSession.id },
      });
      expect(deletedSession).toBeNull();

      // Verify status history is also deleted
      const statusHistory = await statusHistoryRepository.find({
        where: { sessionId: testSession.id },
      });
      expect(statusHistory).toHaveLength(0);
    });

    it('should prevent deletion of published sessions', async () => {
      await sessionRepository.update(testSession.id, { status: SessionStatus.PUBLISHED });

      const response = await request(app.getHttpServer())
        .delete(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(409);

      expect(response.body.message).toContain('cannot delete published sessions');
    });

    it('should prevent deletion of sessions with registrations', async () => {
      await registrationRepository.save({
        sessionId: testSession.id,
        participantName: 'John Doe',
        participantEmail: 'john@example.com',
      });

      const response = await request(app.getHttpServer())
        .delete(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(409);

      expect(response.body.message).toContain('has registrations');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${testSession.id}`)
        .expect(401);
    });

    it('should fail with insufficient permissions', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${testSession.id}`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .expect(403);
    });
  });

  describe('Session Status Workflow', () => {
    let testSession: Session;

    beforeEach(async () => {
      testSession = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });
    });

    it('should follow proper status transition workflow', async () => {
      // DRAFT -> PUBLISHED
      await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}/status`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send({ status: SessionStatus.PUBLISHED })
        .expect(200);

      // PUBLISHED -> COMPLETED
      await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}/status`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send({ status: SessionStatus.COMPLETED })
        .expect(200);

      // Check status history
      const statusHistory = await statusHistoryRepository.find({
        where: { sessionId: testSession.id },
        order: { createdAt: 'ASC' },
      });

      expect(statusHistory).toHaveLength(3);
      expect(statusHistory[0].newStatus).toBe(SessionStatus.DRAFT);
      expect(statusHistory[1].newStatus).toBe(SessionStatus.PUBLISHED);
      expect(statusHistory[2].newStatus).toBe(SessionStatus.COMPLETED);
    });

    it('should prevent invalid status transitions', async () => {
      // Try to go directly from DRAFT to COMPLETED
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}/status`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send({ status: SessionStatus.COMPLETED })
        .expect(400);

      expect(response.body.message).toContain('invalid status transition');
    });

    it('should prevent status rollbacks', async () => {
      // First transition to PUBLISHED
      await sessionRepository.update(testSession.id, { status: SessionStatus.PUBLISHED });

      // Try to rollback to DRAFT
      const response = await request(app.getHttpServer())
        .patch(`/sessions/${testSession.id}/status`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send({ status: SessionStatus.DRAFT })
        .expect(400);

      expect(response.body.message).toContain('cannot rollback status');
    });

    it('should validate business rules for status changes', async () => {
      // Try to publish session without required fields
      const incompleteSession = await sessionRepository.save({
        title: 'Incomplete Session',
        authorId: contentDeveloperUser.id,
        status: SessionStatus.DRAFT,
        // Missing required fields for publication
      });

      const response = await request(app.getHttpServer())
        .patch(`/sessions/${incompleteSession.id}/status`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send({ status: SessionStatus.PUBLISHED })
        .expect(400);

      expect(response.body.message).toContain('missing required fields');
    });
  });

  describe('Session Registration Management', () => {
    let publishedSession: Session;

    beforeEach(async () => {
      publishedSession = await sessionRepository.save({
        ...sampleSessionData,
        status: SessionStatus.PUBLISHED,
        authorId: contentDeveloperUser.id,
      });
    });

    it('should allow registration for published sessions', async () => {
      const registrationData = {
        participantName: 'John Doe',
        participantEmail: 'john@example.com',
        participantPhone: '555-0123',
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${publishedSession.id}/register`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(registrationData)
        .expect(201);

      expect(response.body).toMatchObject(registrationData);
      expect(response.body).toHaveProperty('registrationId');

      // Verify in database
      const registration = await registrationRepository.findOne({
        where: { sessionId: publishedSession.id, email: registrationData.participantEmail },
      });
      expect(registration).toBeTruthy();
    });

    it('should prevent registration for draft sessions', async () => {
      const draftSession = await sessionRepository.save({
        ...sampleSessionData,
        status: SessionStatus.DRAFT,
        authorId: contentDeveloperUser.id,
      });

      const registrationData = {
        participantName: 'John Doe',
        participantEmail: 'john@example.com',
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${draftSession.id}/register`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(registrationData)
        .expect(400);

      expect(response.body.message).toContain('only published sessions');
    });

    it('should prevent registration when session is full', async () => {
      // Fill up the session
      const registrations = Array.from({ length: publishedSession.maxRegistrations }, (_, i) => ({
        sessionId: publishedSession.id,
        participantName: `Participant ${i}`,
        participantEmail: `participant${i}@example.com`,
      }));

      await registrationRepository.save(registrations);

      // Try to register one more
      const registrationData = {
        participantName: 'Late Registrant',
        participantEmail: 'late@example.com',
      };

      const response = await request(app.getHttpServer())
        .post(`/sessions/${publishedSession.id}/register`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(registrationData)
        .expect(409);

      expect(response.body.message).toContain('session is full');
    });

    it('should prevent duplicate registrations', async () => {
      const registrationData = {
        participantName: 'John Doe',
        participantEmail: 'john@example.com',
      };

      // First registration
      await request(app.getHttpServer())
        .post(`/sessions/${publishedSession.id}/register`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(registrationData)
        .expect(201);

      // Duplicate registration
      const response = await request(app.getHttpServer())
        .post(`/sessions/${publishedSession.id}/register`)
        .set('Authorization', `Bearer ${brokerAuthToken}`)
        .send(registrationData)
        .expect(409);

      expect(response.body.message).toContain('already registered');
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce session title uniqueness per author', async () => {
      await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });

      // Try to create duplicate title by same author
      await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .send(sampleSessionData)
        .expect(409);
    });

    it('should allow same title by different authors', async () => {
      await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });

      // Same title by different author should work
      const response = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(sampleSessionData)
        .expect(201);

      expect(response.body.title).toBe(sampleSessionData.title);
    });

    it('should enforce foreign key constraints', async () => {
      const invalidData = {
        ...sampleSessionData,
        locationId: 99999, // Non-existent location
      };

      await expect(sessionRepository.save({
        ...invalidData,
        authorId: contentDeveloperUser.id,
      })).rejects.toThrow();
    });

    it('should handle database cascading operations correctly', async () => {
      const session = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });

      // Create related data
      await registrationRepository.save({
        sessionId: session.id,
        participantName: 'Test Participant',
        participantEmail: 'test@example.com',
      });

      await statusHistoryRepository.save({
        sessionId: session.id,
        status: SessionStatus.PUBLISHED,
        changedBy: contentDeveloperUser.id,
      });

      // Delete session should cascade
      await sessionRepository.delete(session.id);

      // Verify cascading
      const registrations = await registrationRepository.find({
        where: { sessionId: session.id },
      });
      const statusHistory = await statusHistoryRepository.find({
        where: { sessionId: session.id },
      });

      expect(registrations).toHaveLength(0);
      expect(statusHistory).toHaveLength(0);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent session operations', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/sessions')
          .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
          .send({
            ...sampleSessionData,
            title: `Concurrent Session ${i}`,
            startTime: new Date(Date.now() + (48 + i) * 60 * 60 * 1000),
            endTime: new Date(Date.now() + (50 + i) * 60 * 60 * 1000),
          })
      );

      const responses = await Promise.all(concurrentOperations);
      const successfulRequests = responses.filter(r => r.status === 201);

      expect(successfulRequests).toHaveLength(10);
    });

    it('should handle large session datasets efficiently', async () => {
      // Create many sessions
      const sessions = Array.from({ length: 50 }, (_, i) => ({
        ...sampleSessionData,
        title: `Bulk Session ${i}`,
        authorId: contentDeveloperUser.id,
        startTime: new Date(Date.now() + (48 + i * 2) * 60 * 60 * 1000),
        endTime: new Date(Date.now() + (50 + i * 2) * 60 * 60 * 1000),
      }));

      await sessionRepository.save(sessions);

      // Test query performance
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/sessions?limit=25&page=1')
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(25);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should handle complex relationship queries efficiently', async () => {
      const session = await sessionRepository.save({
        ...sampleSessionData,
        authorId: contentDeveloperUser.id,
      });

      // Create related data
      await registrationRepository.save(
        Array.from({ length: 20 }, (_, i) => ({
          sessionId: session.id,
          participantName: `Participant ${i}`,
          participantEmail: `participant${i}@example.com`,
        }))
      );

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get(`/sessions/${session.id}`)
        .set('Authorization', `Bearer ${contentDeveloperAuthToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body).toHaveProperty('registrationCount');
      expect(response.body.registrationCount).toBe(20);
      expect(endTime - startTime).toBeLessThan(500); // Should respond within 500ms
    });
  });
});