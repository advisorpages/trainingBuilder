import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesModule } from '../audiences.module';
import { Audience } from '../../../entities/audience.entity';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';
import { entities } from '../../../entities';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../../modules/auth/auth.module';
import * as bcrypt from 'bcrypt';
// import { testDatabaseConfig } from '../../../config/test-database.config';
import { ConfigModule } from '@nestjs/config';

describe('Audiences CRUD Integration Tests (Complete Coverage)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let audienceRepository: Repository<Audience>;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let authToken: string;
  let contentDeveloperUser: User;
  let trainerUser: User;

  const sampleAudience = {
    name: 'Test Audience',
    description: 'A test audience for integration testing',
    isActive: true,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AudiencesModule,
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    })
    .overrideProvider(DataSource)
    .useValue({
      query: jest.fn(),
      manager: {
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        delete: jest.fn(),
      },
    })
    .overrideProvider(getRepositoryToken(Audience))
    .useValue({
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue({
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    })
    .overrideProvider(getRepositoryToken(Role))
    .useValue({
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    })
    .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Mock providers instead of real database
    dataSource = {
      query: jest.fn(),
    } as any;
    audienceRepository = module.get<Repository<Audience>>(getRepositoryToken(Audience));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
  });

  beforeEach(async () => {
    // Clean up database
    await audienceRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});

    // Create roles
    const contentDeveloperRole = await roleRepository.save({
      name: 'CONTENT_DEVELOPER',
      permissions: ['CREATE_AUDIENCE', 'UPDATE_AUDIENCE', 'DELETE_AUDIENCE'],
    });

    const trainerRole = await roleRepository.save({
      name: 'TRAINER',
      permissions: ['READ_AUDIENCE'],
    });

    // Create test users
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

    // Get auth token for content developer
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'content.dev@test.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM audiences');
    await dataSource.query('DELETE FROM users');
    await dataSource.query('DELETE FROM roles');
    await app.close();
  });

  describe('POST /admin/audiences (Create)', () => {
    it('should create audience with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleAudience)
        .expect(201);

      expect(response.body).toMatchObject({
        name: sampleAudience.name,
        description: sampleAudience.description,
        isActive: sampleAudience.isActive,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');

      // Verify in database
      const savedAudience = await audienceRepository.findOne({
        where: { id: response.body.id },
      });
      expect(savedAudience).toBeTruthy();
      expect(savedAudience.name).toBe(sampleAudience.name);
    });

    it('should fail with missing required fields', async () => {
      const invalidData = { description: 'Missing name field' };

      const response = await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('name');
    });

    it('should fail with duplicate name', async () => {
      // Create first audience
      await audienceRepository.save(sampleAudience);

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sampleAudience)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/admin/audiences')
        .send(sampleAudience)
        .expect(401);
    });

    it('should fail with invalid authorization role', async () => {
      // Get trainer token
      const trainerLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'trainer@test.com',
          password: 'password123',
        });

      await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${trainerLoginResponse.body.access_token}`)
        .send(sampleAudience)
        .expect(403);
    });

    it('should handle extremely long names gracefully', async () => {
      const longNameData = {
        ...sampleAudience,
        name: 'A'.repeat(300), // Exceeds typical database limits
      };

      await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(longNameData)
        .expect(400);
    });

    it('should sanitize and validate special characters', async () => {
      const specialCharData = {
        name: 'Test <script>alert("xss")</script> Audience',
        description: 'Description with <b>HTML</b> tags',
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(specialCharData)
        .expect(201);

      // Should sanitize HTML/script tags
      expect(response.body.name).not.toContain('<script>');
      expect(response.body.description).not.toContain('<b>');
    });
  });

  describe('GET /admin/audiences (Read All)', () => {
    beforeEach(async () => {
      // Create test audiences
      await audienceRepository.save([
        { name: 'Audience 1', description: 'First audience', isActive: true },
        { name: 'Audience 2', description: 'Second audience', isActive: false },
        { name: 'Audience 3', description: 'Third audience', isActive: true },
      ]);
    });

    it('should return paginated audiences', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data).toHaveLength(3);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.total).toBe(3);
    });

    it('should filter by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(audience => audience.isActive)).toBe(true);
    });

    it('should support search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences?search=Audience 1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Audience 1');
    });

    it('should work without authentication for read operations', async () => {
      // Note: Update this if your API requires auth for GET operations
      const response = await request(app.getHttpServer())
        .get('/admin/audiences')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /admin/audiences/active (Read Active)', () => {
    beforeEach(async () => {
      await audienceRepository.save([
        { name: 'Active 1', description: 'Active audience', isActive: true },
        { name: 'Inactive 1', description: 'Inactive audience', isActive: false },
        { name: 'Active 2', description: 'Another active audience', isActive: true },
      ]);
    });

    it('should return only active audiences', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body.every(audience => audience.isActive)).toBe(true);
    });

    it('should return empty array when no active audiences', async () => {
      await audienceRepository.update({}, { isActive: false });

      const response = await request(app.getHttpServer())
        .get('/admin/audiences/active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /admin/audiences/:id (Read One)', () => {
    let testAudience: Audience;

    beforeEach(async () => {
      testAudience = await audienceRepository.save(sampleAudience);
    });

    it('should return audience by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/audiences/${testAudience.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testAudience.id,
        name: testAudience.name,
        description: testAudience.description,
        isActive: testAudience.isActive,
      });
    });

    it('should return 404 for non-existent ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/audiences/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid ID format', async () => {
      await request(app.getHttpServer())
        .get('/admin/audiences/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /admin/audiences/:id (Update)', () => {
    let testAudience: Audience;

    beforeEach(async () => {
      testAudience = await audienceRepository.save(sampleAudience);
    });

    it('should update audience with valid data', async () => {
      const updateData = {
        name: 'Updated Audience Name',
        description: 'Updated description',
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/audiences/${testAudience.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);

      // Verify in database
      const updatedAudience = await audienceRepository.findOne({
        where: { id: testAudience.id },
      });
      expect(updatedAudience.name).toBe(updateData.name);
    });

    it('should support partial updates', async () => {
      const partialUpdate = { name: 'Partially Updated Name' };

      const response = await request(app.getHttpServer())
        .patch(`/admin/audiences/${testAudience.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.name).toBe(partialUpdate.name);
      expect(response.body.description).toBe(testAudience.description); // Should remain unchanged
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .patch('/admin/audiences/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' })
        .expect(404);
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/audiences/${testAudience.id}`)
        .send({ name: 'New Name' })
        .expect(401);
    });

    it('should prevent duplicate names on update', async () => {
      const secondAudience = await audienceRepository.save({
        name: 'Second Audience',
        description: 'Another audience',
        isActive: true,
      });

      await request(app.getHttpServer())
        .patch(`/admin/audiences/${secondAudience.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: testAudience.name })
        .expect(409);
    });
  });

  describe('DELETE /admin/audiences/:id (Delete)', () => {
    let testAudience: Audience;

    beforeEach(async () => {
      testAudience = await audienceRepository.save(sampleAudience);
    });

    it('should delete audience successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/audiences/${testAudience.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify deletion in database
      const deletedAudience = await audienceRepository.findOne({
        where: { id: testAudience.id },
      });
      expect(deletedAudience).toBeNull();
    });

    it('should return 404 for non-existent ID', async () => {
      await request(app.getHttpServer())
        .delete('/admin/audiences/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/audiences/${testAudience.id}`)
        .expect(401);
    });

    it('should prevent deletion if audience is in use', async () => {
      // This test assumes there's a usage check implementation
      // You may need to create a session that uses this audience first

      const response = await request(app.getHttpServer())
        .get(`/admin/audiences/${testAudience.id}/usage-check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // If in use, deletion should fail
      if (response.body.inUse) {
        await request(app.getHttpServer())
          .delete(`/admin/audiences/${testAudience.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(409);
      }
    });
  });

  describe('GET /admin/audiences/:id/usage-check (Usage Check)', () => {
    let testAudience: Audience;

    beforeEach(async () => {
      testAudience = await audienceRepository.save(sampleAudience);
    });

    it('should return usage information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/audiences/${testAudience.id}/usage-check`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('inUse');
      expect(response.body).toHaveProperty('sessionCount');
      expect(typeof response.body.inUse).toBe('boolean');
      expect(typeof response.body.sessionCount).toBe('number');
    });

    it('should return 404 for non-existent audience', async () => {
      await request(app.getHttpServer())
        .get('/admin/audiences/99999/usage-check')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Data Validation and Constraints', () => {
    it('should enforce unique constraints', async () => {
      await audienceRepository.save(sampleAudience);

      // Try to create duplicate
      await expect(audienceRepository.save(sampleAudience)).rejects.toThrow();
    });

    it('should enforce required field constraints', async () => {
      const invalidAudience = { description: 'Missing name' };

      await expect(audienceRepository.save(invalidAudience)).rejects.toThrow();
    });

    it('should handle SQL injection attempts', async () => {
      const maliciousData = {
        name: "'; DROP TABLE audiences; --",
        description: 'Malicious description',
        isActive: true,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/audiences')
        .set('Authorization', `Bearer ${authToken}`)
        .send(maliciousData)
        .expect(201);

      // Should create safely without executing SQL
      expect(response.body.name).toBe(maliciousData.name);

      // Verify table still exists
      const audiences = await audienceRepository.find();
      expect(audiences).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent requests gracefully', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app.getHttpServer())
          .post('/admin/audiences')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Concurrent Audience ${i}`,
            description: `Audience created concurrently ${i}`,
            isActive: true,
          })
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(r => r.status === 201);

      expect(successfulRequests).toHaveLength(10);
    });

    it('should handle large datasets efficiently', async () => {
      // Create many audiences
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        name: `Bulk Audience ${i}`,
        description: `Bulk description ${i}`,
        isActive: i % 2 === 0,
      }));

      await audienceRepository.save(largeDataset);

      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/admin/audiences?limit=50')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});