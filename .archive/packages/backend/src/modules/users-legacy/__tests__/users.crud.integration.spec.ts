import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersModule } from '../users.module';
import { User } from '../../../entities/user.entity';
import { Role } from '../../../entities/role.entity';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { Incentive } from '../../../entities/incentive.entity';
import { JwtModule } from '@nestjs/jwt';
// import { AuthModule } from '../../../auth/auth.module';
import * as bcrypt from 'bcrypt';

describe('Users CRUD Integration Tests (Complete Coverage)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;
  let sessionRepository: Repository<Session>;
  let incentiveRepository: Repository<Incentive>;
  let adminAuthToken: string;
  let contentDeveloperAuthToken: string;
  let trainerAuthToken: string;
  let adminUser: User;
  let contentDeveloperRole: Role;
  let trainerRole: Role;
  let adminRole: Role;

  const sampleUserData = {
    email: 'test.user@example.com',
    password: 'SecurePassword123!',
    roleId: null, // Will be set in beforeEach
    isActive: true,
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        // AuthModule,
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
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    incentiveRepository = module.get<Repository<Incentive>>(getRepositoryToken(Incentive));
  });

  beforeEach(async () => {
    // Clean up database
    await incentiveRepository.delete({});
    await sessionRepository.delete({});
    await userRepository.delete({});
    await roleRepository.delete({});

    // Create roles
    contentDeveloperRole = await roleRepository.save({
      name: 'CONTENT_DEVELOPER',
      permissions: ['CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'READ_ALL_USERS'],
    });

    trainerRole = await roleRepository.save({
      name: 'TRAINER',
      permissions: ['READ_OWN_PROFILE', 'UPDATE_OWN_PROFILE'],
    });

    adminRole = await roleRepository.save({
      name: 'ADMIN',
      permissions: ['*'], // All permissions
    });

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    adminUser = await userRepository.save({
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      isActive: true,
    });

    const contentDeveloperUser = await userRepository.save({
      email: 'content.dev@test.com',
      passwordHash: hashedPassword,
      roleId: contentDeveloperRole.id,
      isActive: true,
    });

    const trainerUser = await userRepository.save({
      email: 'trainer@test.com',
      passwordHash: hashedPassword,
      roleId: trainerRole.id,
      isActive: true,
    });

    // Get auth tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminAuthToken = adminLogin.body.access_token;

    const contentDevLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'content.dev@test.com', password: 'password123' });
    contentDeveloperAuthToken = contentDevLogin.body.access_token;

    const trainerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'trainer@test.com', password: 'password123' });
    trainerAuthToken = trainerLogin.body.access_token;

    // Update sample data with role ID
    sampleUserData.roleId = trainerRole.id;
  });

  afterAll(async () => {
    await dataSource.query('DELETE FROM incentives');
    await dataSource.query('DELETE FROM sessions');
    await dataSource.query('DELETE FROM users');
    await dataSource.query('DELETE FROM roles');
    await app.close();
  });

  describe('POST /admin/users (Create User)', () => {
    it('should create user with valid data as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(sampleUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        email: sampleUserData.email,
        roleId: sampleUserData.roleId,
        isActive: sampleUserData.isActive,
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).not.toHaveProperty('passwordHash'); // Should not expose password
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // Verify in database
      const savedUser = await userRepository.findOne({
        where: { id: response.body.id },
      });
      expect(savedUser).toBeTruthy();
      expect(savedUser.email).toBe(sampleUserData.email);
      expect(savedUser.passwordHash).toBeTruthy(); // Should be hashed
      expect(savedUser.passwordHash).not.toBe(sampleUserData.password); // Should not be plain text
    });

    it('should hash password automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(sampleUserData)
        .expect(201);

      const savedUser = await userRepository.findOne({
        where: { id: response.body.id },
      });

      // Password should be hashed
      expect(savedUser.passwordHash).not.toBe(sampleUserData.password);
      expect(savedUser.passwordHash.length).toBeGreaterThan(50); // bcrypt hash length

      // Should be able to verify the hash
      const isValidPassword = await bcrypt.compare(sampleUserData.password, savedUser.passwordHash);
      expect(isValidPassword).toBe(true);
    });

    it('should fail with duplicate email', async () => {
      // Create first user
      await userRepository.save({
        email: sampleUserData.email,
        passwordHash: await bcrypt.hash('password', 10),
        roleId: trainerRole.id,
        isActive: true,
      });

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(sampleUserData)
        .expect(409);

      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const invalidEmailData = {
        ...sampleUserData,
        email: 'invalid-email-format',
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.message).toContain('email');
    });

    it('should fail with weak password', async () => {
      const weakPasswordData = {
        ...sampleUserData,
        password: '123', // Too short and weak
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.message).toContain('password');
    });

    it('should fail with non-existent role', async () => {
      const invalidRoleData = {
        ...sampleUserData,
        roleId: 99999, // Non-existent role
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(invalidRoleData)
        .expect(400);
    });

    it('should fail without admin authorization', async () => {
      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(sampleUserData)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/admin/users')
        .send(sampleUserData)
        .expect(401);
    });

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        roleId: trainerRole.id,
        isActive: true,
        maliciousField: '<script>alert("xss")</script>', // Should be filtered out
      };

      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(maliciousData)
        .expect(201);

      expect(response.body).not.toHaveProperty('maliciousField');
    });
  });

  describe('GET /admin/users (Read All Users)', () => {
    beforeEach(async () => {
      // Create additional test users
      const hashedPassword = await bcrypt.hash('password123', 10);
      await userRepository.save([
        { email: 'user1@test.com', passwordHash: hashedPassword, roleId: trainerRole.id, isActive: true },
        { email: 'user2@test.com', passwordHash: hashedPassword, roleId: trainerRole.id, isActive: false },
        { email: 'user3@test.com', passwordHash: hashedPassword, roleId: contentDeveloperRole.id, isActive: true },
      ]);
    });

    it('should return paginated users as admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.data.length).toBeGreaterThan(0);

      // Should not expose password hashes
      response.body.data.forEach(user => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).toHaveProperty('role'); // Should include role relationship
      });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
    });

    it('should filter by active status', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users?isActive=true')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.data.every(user => user.isActive)).toBe(true);
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users?roleId=${trainerRole.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.data.every(user => user.roleId === trainerRole.id)).toBe(true);
    });

    it('should support search by email', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users?search=user1@test.com')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].email).toBe('user1@test.com');
    });

    it('should fail without admin authorization', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .expect(403);
    });
  });

  describe('GET /admin/users/:id (Read One User)', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await userRepository.save({
        email: 'testuser@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: trainerRole.id,
        isActive: true,
      });
    });

    it('should return user by ID as admin', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        roleId: testUser.roleId,
        isActive: testUser.isActive,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).toHaveProperty('role'); // Should include role relationship
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app.getHttpServer())
        .get(`/admin/users/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/admin/users/invalid-uuid')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(400);
    });

    it('should allow users to view their own profile', async () => {
      const trainerUserFromDb = await userRepository.findOne({
        where: { email: 'trainer@test.com' }
      });

      const response = await request(app.getHttpServer())
        .get(`/users/profile`) // Different endpoint for own profile
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .expect(200);

      expect(response.body.email).toBe('trainer@test.com');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should prevent users from viewing other profiles', async () => {
      await request(app.getHttpServer())
        .get(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .expect(403);
    });
  });

  describe('PATCH /admin/users/:id (Update User)', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await userRepository.save({
        email: 'updatetest@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: trainerRole.id,
        isActive: true,
      });
    });

    it('should update user with valid data as admin', async () => {
      const updateData = {
        email: 'updated@example.com',
        roleId: contentDeveloperRole.id,
        isActive: false,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject(updateData);
      expect(response.body.updatedAt).not.toBe(testUser.updatedAt);

      // Verify in database
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.roleId).toBe(updateData.roleId);
      expect(updatedUser.isActive).toBe(updateData.isActive);
    });

    it('should support password updates', async () => {
      const updateData = { password: 'NewSecurePassword123!' };

      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');

      // Verify password was hashed and updated
      const updatedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.passwordHash).not.toBe(testUser.passwordHash);

      const isValidPassword = await bcrypt.compare('NewSecurePassword123!', updatedUser.passwordHash);
      expect(isValidPassword).toBe(true);
    });

    it('should support partial updates', async () => {
      const partialUpdate = { isActive: false };

      const response = await request(app.getHttpServer())
        .patch(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(partialUpdate)
        .expect(200);

      expect(response.body.isActive).toBe(false);
      expect(response.body.email).toBe(testUser.email); // Should remain unchanged
    });

    it('should prevent duplicate email on update', async () => {
      const secondUser = await userRepository.save({
        email: 'second@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: trainerRole.id,
        isActive: true,
      });

      await request(app.getHttpServer())
        .patch(`/admin/users/${secondUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({ email: testUser.email })
        .expect(409);
    });

    it('should allow users to update their own profile', async () => {
      const trainerUser = await userRepository.findOne({
        where: { email: 'trainer@test.com' }
      });

      const updateData = { email: 'new.trainer@test.com' };

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.email).toBe(updateData.email);
    });

    it('should prevent role escalation by non-admin users', async () => {
      const updateData = { roleId: adminRole.id };

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .patch(`/admin/users/${testUser.id}`)
        .send({ isActive: false })
        .expect(401);
    });
  });

  describe('DELETE /admin/users/:id (Delete User)', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await userRepository.save({
        email: 'deletetest@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: trainerRole.id,
        isActive: true,
      });
    });

    it('should delete user successfully as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(204);

      // Verify deletion in database
      const deletedUser = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeUuid = '123e4567-e89b-12d3-a456-426614174000';

      await request(app.getHttpServer())
        .delete(`/admin/users/${fakeUuid}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(404);
    });

    it('should fail without admin authorization', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${trainerAuthToken}`)
        .expect(403);
    });

    it('should prevent deletion if user has associated data', async () => {
      // Create a session authored by the test user
      await sessionRepository.save({
        title: 'Test Session',
        description: 'Test Description',
        startTime: new Date(),
        endTime: new Date(),
        status: SessionStatus.DRAFT,
        authorId: testUser.id,
        locationId: 1,
        trainerId: 1,
        isActive: true,
      });

      const response = await request(app.getHttpServer())
        .delete(`/admin/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(409);

      expect(response.body.message).toContain('has associated data');

      // User should still exist
      const userStillExists = await userRepository.findOne({
        where: { id: testUser.id },
      });
      expect(userStillExists).toBeTruthy();
    });

    it('should prevent self-deletion', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(409);
    });
  });

  describe('User Relationships and Data Integrity', () => {
    let userWithData: User;

    beforeEach(async () => {
      userWithData = await userRepository.save({
        email: 'datauser@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        roleId: contentDeveloperRole.id,
        isActive: true,
      });
    });

    it('should load user with role relationship', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${userWithData.id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.role).toBeDefined();
      expect(response.body.role.name).toBe('CONTENT_DEVELOPER');
    });

    it('should count associated sessions', async () => {
      // Create sessions authored by the user
      await sessionRepository.save([
        {
          title: 'Session 1',
          description: 'Description 1',
          startTime: new Date(),
          endTime: new Date(),
          status: SessionStatus.DRAFT,
          authorId: userWithData.id,
          locationId: 1,
          trainerId: 1,
          isActive: true,
        },
        {
          title: 'Session 2',
          description: 'Description 2',
          startTime: new Date(),
          endTime: new Date(),
          status: 'PUBLISHED',
          authorId: userWithData.id,
          locationId: 1,
          trainerId: 1,
          isActive: true,
        },
      ]);

      const response = await request(app.getHttpServer())
        .get(`/admin/users/${userWithData.id}/stats`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);

      expect(response.body.sessionCount).toBe(2);
    });

    it('should enforce foreign key constraints', async () => {
      // Try to create user with non-existent role
      const invalidUserData = {
        email: 'invalid@example.com',
        passwordHash: 'hashedpassword',
        roleId: 99999, // Non-existent role
        isActive: true,
      };

      await expect(userRepository.save(invalidUserData)).rejects.toThrow();
    });
  });

  describe('Authentication and Security', () => {
    it('should not accept weak passwords in any scenario', async () => {
      const weakPasswords = [
        'password',
        '12345',
        'qwerty',
        'admin',
        'user',
        '123456789',
        'password123',
      ];

      for (const weakPassword of weakPasswords) {
        const userData = {
          ...sampleUserData,
          email: `test${Date.now()}@example.com`,
          password: weakPassword,
        };

        await request(app.getHttpServer())
          .post('/admin/users')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(userData)
          .expect(400);
      }
    });

    it('should handle password complexity requirements', async () => {
      const strongPasswords = [
        'MySecur3P@ssw0rd!',
        'C0mpl3x!ty#2024',
        'Str0ng&S@f3P@ss',
      ];

      for (let i = 0; i < strongPasswords.length; i++) {
        const userData = {
          ...sampleUserData,
          email: `strong${i}@example.com`,
          password: strongPasswords[i],
        };

        await request(app.getHttpServer())
          .post('/admin/users')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send(userData)
          .expect(201);
      }
    });

    it('should prevent SQL injection in user queries', async () => {
      const maliciousQueries = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; UPDATE users SET isActive = false; --",
      ];

      for (const maliciousQuery of maliciousQueries) {
        const response = await request(app.getHttpServer())
          .get(`/admin/users?search=${encodeURIComponent(maliciousQuery)}`)
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .expect(200);

        // Should return safe results
        expect(response.body.data).toBeInstanceOf(Array);

        // Verify database integrity
        const userCount = await userRepository.count();
        expect(userCount).toBeGreaterThan(0); // Users should still exist
      }
    });

    it('should rate limit user creation attempts', async () => {
      // Attempt to create many users rapidly
      const promises = Array.from({ length: 20 }, (_, i) =>
        request(app.getHttpServer())
          .post('/admin/users')
          .set('Authorization', `Bearer ${adminAuthToken}`)
          .send({
            ...sampleUserData,
            email: `ratelimit${i}@example.com`,
          })
      );

      const responses = await Promise.all(promises.map(p => p.catch(err => err.response)));

      // Some requests should succeed, but if rate limiting is in place,
      // some might be rejected with 429 Too Many Requests
      const successCount = responses.filter(r => r.status === 201).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(successCount + rateLimitedCount).toBe(20);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle concurrent user operations', async () => {
      const concurrentOperations = [
        // Create users
        ...Array.from({ length: 5 }, (_, i) =>
          request(app.getHttpServer())
            .post('/admin/users')
            .set('Authorization', `Bearer ${adminAuthToken}`)
            .send({
              ...sampleUserData,
              email: `concurrent${i}@example.com`,
            })
        ),
        // Read operations
        ...Array.from({ length: 5 }, () =>
          request(app.getHttpServer())
            .get('/admin/users')
            .set('Authorization', `Bearer ${adminAuthToken}`)
        ),
      ];

      const responses = await Promise.all(concurrentOperations);

      // All operations should complete successfully
      responses.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
    });

    it('should handle large user datasets efficiently', async () => {
      // Create many users
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        email: `bulk${i}@example.com`,
        passwordHash: 'hashedpassword',
        roleId: trainerRole.id,
        isActive: i % 2 === 0,
      }));

      await userRepository.save(largeDataset);

      // Test pagination performance
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .get('/admin/users?limit=25&page=1')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.data).toHaveLength(25);
      expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should properly handle database transactions', async () => {
      // Test that partial failures don't leave database in inconsistent state
      const invalidUserData = {
        email: 'transaction@example.com',
        password: 'ValidPassword123!',
        roleId: 99999, // Invalid role ID - should cause rollback
        isActive: true,
      };

      await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(invalidUserData)
        .expect(400);

      // User should not exist in database
      const userShouldNotExist = await userRepository.findOne({
        where: { email: 'transaction@example.com' },
      });
      expect(userShouldNotExist).toBeNull();
    });
  });
});