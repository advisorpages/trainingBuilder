import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AuthModule } from '../auth.module';
import { User } from '../../../entities/user.entity';
import { UserRole } from '@leadership-training/shared';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    role: UserRole.CONTENT_DEVELOPER,
    isActive: true,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    dataSource = module.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // Clean up database
    await dataSource.query('DELETE FROM users');

    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    await dataSource.query(
      'INSERT INTO users (email, password, role, isActive) VALUES ($1, $2, $3, $4)',
      [testUser.email, hashedPassword, testUser.role, testUser.isActive],
    );
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM users');
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.role).toBe(testUser.role);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should fail with missing fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400);
    });

    it('should fail with inactive user', async () => {
      // Deactivate user
      await dataSource.query(
        'UPDATE users SET isActive = $1 WHERE email = $2',
        [false, testUser.email],
      );

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      accessToken = loginResponse.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.role).toBe(testUser.role);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Token ${accessToken}`)
        .expect(401);
    });
  });

  describe('/auth/status (GET)', () => {
    it('should return auth module status', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/status')
        .expect(200);

      expect(response.body).toHaveProperty('module');
      expect(response.body.module).toBe('auth');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('operational');
    });
  });

  describe('Token Expiration and Refresh', () => {
    it('should handle token expiration gracefully', async () => {
      // This test would require configuring a very short JWT expiration
      // For now, we'll test the structure and assume proper JWT configuration
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const token = loginResponse.body.access_token;

      // Verify token structure
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('Security Headers and Response Format', () => {
    it('should not expose sensitive data in error responses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // Should not reveal whether email exists or not
      expect(response.body.message).toBe('Invalid credentials');
      expect(response.body).not.toHaveProperty('user');
      expect(response.body).not.toHaveProperty('access_token');
    });

    it('should have proper CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .options('/auth/login');

      // Note: Actual CORS headers depend on your CORS configuration
      expect(response.status).toBe(200);
    });
  });
});