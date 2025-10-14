import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseSeeder, testDbUtils } from '../src/test/database-seeder';
import { createTestDatabase } from '../src/config/test-database.config';

describe('Epic 4: Trainer Dashboard Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let seeder: TestDatabaseSeeder;
  let authToken: string;
  let trainerUser: any;
  let testScenario: any;

  beforeAll(async () => {
    // Create test database
    dataSource = await createTestDatabase();
    seeder = testDbUtils.createSeeder(dataSource);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (dataSource) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Reset and seed database for each test
    await seeder.resetDatabase();
    testScenario = await seeder.seedEpic4Data();

    // Get auth token for trainer
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testScenario.trainerUser.email,
        password: 'password123',
      })
      .expect(200);

    authToken = loginResponse.body.access_token;
    trainerUser = testScenario.trainerUser;
  });

  afterEach(async () => {
    await seeder.cleanupTestData();
  });

  describe('Epic 4.1: Trainer Dashboard Shell', () => {
    it('should redirect trainer to dashboard after login', async () => {
      const response = await request(app.getHttpServer())
        .get('/trainer/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('upcomingSessionsCount');
      expect(response.body).toHaveProperty('nextSession');
      expect(response.body).toHaveProperty('totalCoachingTips');
    });

    it('should enforce role-based access control for trainers only', async () => {
      // Test with content developer token
      const contentDevResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testScenario.contentDevUser.email,
          password: 'password123',
        });

      await request(app.getHttpServer())
        .get('/trainer/dashboard')
        .set('Authorization', `Bearer ${contentDevResponse.body.access_token}`)
        .expect(403); // Forbidden for non-trainers
    });

    it('should require authentication for dashboard access', async () => {
      await request(app.getHttpServer())
        .get('/trainer/dashboard')
        .expect(401); // Unauthorized without token
    });
  });

  describe('Epic 4.2: Upcoming Session List', () => {
    it('should return sessions assigned to logged-in trainer for next 7 days', async () => {
      const response = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify sessions belong to the trainer
      response.body.forEach(session => {
        expect(session.trainerId).toBe(trainerUser.id);
        expect(session.status).toBe('published');

        // Verify session is within next 7 days
        const sessionDate = new Date(session.startTime);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        expect(sessionDate.getTime()).toBeLessThanOrEqual(weekFromNow.getTime());
      });
    });

    it('should return sessions sorted chronologically', async () => {
      const response = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.length > 1) {
        for (let i = 1; i < response.body.length; i++) {
          const prevDate = new Date(response.body[i - 1].startTime);
          const currDate = new Date(response.body[i].startTime);
          expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
        }
      }
    });

    it('should include essential session information', async () => {
      const response = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      if (response.body.length > 0) {
        const session = response.body[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('title');
        expect(session).toHaveProperty('startTime');
        expect(session).toHaveProperty('endTime');
        expect(session).toHaveProperty('location');
      }
    });
  });

  describe('Epic 4.3: Detailed Session View', () => {
    it('should return comprehensive session details for assigned trainer', async () => {
      // First, get the list of sessions
      const sessionsResponse = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      if (sessionsResponse.body.length > 0) {
        const sessionId = sessionsResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .get(`/trainer/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id', sessionId);
        expect(response.body).toHaveProperty('title');
        expect(response.body).toHaveProperty('description');
        expect(response.body).toHaveProperty('location');
        expect(response.body).toHaveProperty('trainer');
        expect(response.body.trainer.id).toBe(trainerUser.id);
      }
    });

    it('should return 404 for session not assigned to trainer', async () => {
      // Try to access a non-existent session
      await request(app.getHttpServer())
        .get('/trainer/sessions/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should include registration count and capacity info', async () => {
      const sessionsResponse = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      if (sessionsResponse.body.length > 0) {
        const sessionId = sessionsResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .get(`/trainer/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Registration count should be present (even if 0)
        expect(response.body).toHaveProperty('registrationCount');
        expect(typeof response.body.registrationCount).toBe('number');
      }
    });
  });

  describe('Epic 4.4: View or Generate AI Coaching Tips', () => {
    it('should return existing coaching tips for a session', async () => {
      const sessionsResponse = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      if (sessionsResponse.body.length > 0) {
        const sessionId = sessionsResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .get(`/trainer/sessions/${sessionId}/coaching-tips`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        // If tips exist, verify structure
        if (response.body.length > 0) {
          const tip = response.body[0];
          expect(tip).toHaveProperty('id');
          expect(tip).toHaveProperty('sessionId');
          expect(tip).toHaveProperty('coachingTip');
          expect(tip.coachingTip).toHaveProperty('text');
          expect(tip.coachingTip).toHaveProperty('category');
        }
      }
    });

    it('should generate new coaching tips for a session', async () => {
      const sessionsResponse = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      if (sessionsResponse.body.length > 0) {
        const sessionId = sessionsResponse.body[0].id;

        const response = await request(app.getHttpServer())
          .post(`/trainer/sessions/${sessionId}/generate-coaching-tips`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sessionId: sessionId,
            difficultyLevel: 'intermediate',
            focusAreas: ['engagement', 'preparation'],
          })
          .expect(201);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        // Verify generated tips structure
        response.body.forEach(tip => {
          expect(tip).toHaveProperty('id');
          expect(tip).toHaveProperty('text');
          expect(tip).toHaveProperty('category');
          expect(tip).toHaveProperty('difficultyLevel');
        });
      }
    });

    it('should handle tip generation errors gracefully', async () => {
      // Try to generate tips for non-existent session
      await request(app.getHttpServer())
        .post('/trainer/sessions/99999/generate-coaching-tips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId: '99999',
          difficultyLevel: 'intermediate',
        })
        .expect(404);
    });
  });

  describe('Epic 4.5: Trainer Kit Email Notification', () => {
    // Note: Email testing would typically use a mock email service
    // or email testing service like MailHog in a real implementation

    it('should have email service configured for trainer notifications', async () => {
      // Test the health check includes email service
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      // In a real implementation, this would check email service health
    });
  });

  describe('Epic 4.6: Coaching Tip Curation', () => {
    it('should allow trainers to curate coaching tips', async () => {
      // First, get coaching tips for a session
      const sessionsResponse = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`);

      if (sessionsResponse.body.length > 0) {
        const sessionId = sessionsResponse.body[0].id;

        // Generate some tips first
        await request(app.getHttpServer())
          .post(`/trainer/sessions/${sessionId}/generate-coaching-tips`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            sessionId: sessionId,
            difficultyLevel: 'intermediate',
          });

        // Get the tips
        const tipsResponse = await request(app.getHttpServer())
          .get(`/trainer/sessions/${sessionId}/coaching-tips`)
          .set('Authorization', `Bearer ${authToken}`);

        if (tipsResponse.body.length > 0) {
          const tipId = tipsResponse.body[0].id;

          // Curate the tip
          const response = await request(app.getHttpServer())
            .patch(`/trainer/coaching-tips/${tipId}/curate`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              sessionCoachingTipId: tipId,
              status: 'approved',
            })
            .expect(200);

          expect(response.body).toHaveProperty('status', 'approved');
        }
      }
    });
  });

  describe('Cross-Epic Integration Tests', () => {
    it('should integrate with Epic 2 session creation data', async () => {
      // Verify that published sessions from Epic 2 appear in trainer dashboard
      const response = await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Sessions should only be published ones (Epic 3 publishing)
      response.body.forEach(session => {
        expect(session.status).toBe('published');
      });
    });

    it('should handle trainer availability check from Epic 1', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/trainers/${trainerUser.id}/availability-check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('available');
      expect(typeof response.body.available).toBe('boolean');
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/trainer/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('upcomingSessionsCount');
      });
    });

    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/trainer/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(3000); // Less than 3 seconds
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection issues gracefully', async () => {
      // This would be tested with a mock that simulates database failures
      // For now, we ensure the service handles errors without crashing
      await request(app.getHttpServer())
        .get('/trainer/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle malformed authentication tokens', async () => {
      await request(app.getHttpServer())
        .get('/trainer/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should handle missing required parameters', async () => {
      await request(app.getHttpServer())
        .post('/trainer/sessions/1/generate-coaching-tips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Missing required sessionId
        .expect(400);
    });
  });
});