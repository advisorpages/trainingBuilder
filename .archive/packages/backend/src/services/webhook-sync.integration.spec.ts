import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WebhookSyncService } from './webhook-sync.service';
import { Registration, SyncStatus } from '../entities/registration.entity';
import { Session, SessionStatus } from '../entities/session.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';

// Mock fetch for integration tests
global.fetch = jest.fn();

describe('WebhookSyncService Integration', () => {
  let service: WebhookSyncService;
  let registrationRepository: Repository<Registration>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Registration, Session, User, Role],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Registration, Session, User, Role]),
      ],
      providers: [WebhookSyncService],
    }).compile();

    service = module.get<WebhookSyncService>(WebhookSyncService);
    registrationRepository = module.get<Repository<Registration>>(getRepositoryToken(Registration));

    // Mock environment variables
    const configService = module.get<ConfigService>(ConfigService);
    jest.spyOn(configService, 'get').mockImplementation((key: string, defaultValue?: any) => {
      const config = {
        'WEBHOOK_REGISTRATION_URL': 'https://api.example.com/webhooks/registration',
        'WEBHOOK_TIMEOUT_MS': 30000,
        'WEBHOOK_RETRY_MAX_ATTEMPTS': 6,
        'WEBHOOK_RETRY_BASE_DELAY_MS': 60000,
      };
      return config[key] || defaultValue;
    });
  }, 30000);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  }, 10000);

  beforeEach(async () => {
    // Clear all registrations before each test
    await registrationRepository.clear();
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  describe('End-to-End Webhook Sync Flow', () => {
    it('should sync a pending registration successfully', async () => {
      // Create a test session
      const sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
      const testSession = sessionRepository.create({
        id: 'test-session-id',
        title: 'Integration Test Session',
        startTime: new Date('2023-01-15T14:00:00Z'),
        endTime: new Date('2023-01-15T16:00:00Z'),
        status: SessionStatus.PUBLISHED,
        authorId: 'test-author-id',
        maxRegistrations: 50,
        isActive: true,
        automatedStatusChange: false,
        contentValidationStatus: 'valid',
        publicationRequirementsMet: true,
      });
      await sessionRepository.save(testSession);

      // Create a pending registration
      const testRegistration = registrationRepository.create({
        sessionId: 'test-session-id',
        name: 'Integration Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        referredBy: 'Test Referrer',
        syncStatus: SyncStatus.PENDING,
        syncAttempts: 0,
      });
      await registrationRepository.save(testRegistration);

      // Mock successful webhook response
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          registration_id: 'external-id-123',
        }),
      });

      // Process pending registrations
      await service.processPendingRegistrations();

      // Verify the registration was updated
      const updatedRegistration = await registrationRepository.findOne({
        where: { id: testRegistration.id },
        relations: ['session'],
      });

      expect(updatedRegistration).toBeTruthy();
      expect(updatedRegistration.syncStatus).toBe(SyncStatus.SYNCED);
      expect(updatedRegistration.syncAttempts).toBe(1);
      expect(updatedRegistration.externalId).toBe('external-id-123');
      expect(updatedRegistration.syncedAt).toBeTruthy();

      // Verify webhook was called with correct payload
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/webhooks/registration',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TrainingBuilder-Webhook/1.0',
          },
          body: expect.stringContaining('"name":"Integration Test User"'),
        })
      );

      const callArgs = (fetch as jest.Mock).mock.calls[0];
      const sentPayload = JSON.parse(callArgs[1].body);

      expect(sentPayload).toEqual({
        session_id: 'test-session-id',
        registration_id: testRegistration.id,
        name: 'Integration Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        referred_by: 'Test Referrer',
        session_details: {
          title: 'Integration Test Session',
          date: '2023-01-15T14:00:00.000Z',
          location: null,
        },
        registration_timestamp: testRegistration.createdAt.toISOString(),
      });
    });

    it('should handle webhook failure and implement retry logic', async () => {
      // Create a test session
      const sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
      const testSession = sessionRepository.create({
        id: 'test-session-id-2',
        title: 'Retry Test Session',
        startTime: new Date('2023-01-15T14:00:00Z'),
        endTime: new Date('2023-01-15T16:00:00Z'),
        status: SessionStatus.PUBLISHED,
        authorId: 'test-author-id',
        maxRegistrations: 50,
        isActive: true,
        automatedStatusChange: false,
        contentValidationStatus: 'valid',
        publicationRequirementsMet: true,
      });
      await sessionRepository.save(testSession);

      // Create a pending registration
      const testRegistration = registrationRepository.create({
        sessionId: 'test-session-id-2',
        name: 'Retry Test User',
        email: 'retry@example.com',
        syncStatus: SyncStatus.PENDING,
        syncAttempts: 0,
      });
      await registrationRepository.save(testRegistration);

      // Mock webhook failure
      (fetch as jest.Mock).mockRejectedValue(new Error('Network timeout'));

      // Process pending registrations
      await service.processPendingRegistrations();

      // Verify the registration was marked as failed
      const failedRegistration = await registrationRepository.findOne({
        where: { id: testRegistration.id },
      });

      expect(failedRegistration).toBeTruthy();
      expect(failedRegistration.syncStatus).toBe(SyncStatus.FAILED);
      expect(failedRegistration.syncAttempts).toBe(1);
      expect(failedRegistration.notes).toContain('Network timeout');
      expect(failedRegistration.syncedAt).toBeTruthy();
    });

    it('should mark registration as permanently failed after max attempts', async () => {
      // Create a test session
      const sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
      const testSession = sessionRepository.create({
        id: 'test-session-id-3',
        title: 'Permanent Failure Test Session',
        startTime: new Date('2023-01-15T14:00:00Z'),
        endTime: new Date('2023-01-15T16:00:00Z'),
        status: SessionStatus.PUBLISHED,
        authorId: 'test-author-id',
        maxRegistrations: 50,
        isActive: true,
        automatedStatusChange: false,
        contentValidationStatus: 'valid',
        publicationRequirementsMet: true,
      });
      await sessionRepository.save(testSession);

      // Create a registration that has already failed multiple times
      const testRegistration = registrationRepository.create({
        sessionId: 'test-session-id-3',
        name: 'Permanent Failure User',
        email: 'permanent@example.com',
        syncStatus: SyncStatus.FAILED,
        syncAttempts: 5, // One less than max attempts
      });
      await registrationRepository.save(testRegistration);

      // Mock webhook failure
      (fetch as jest.Mock).mockRejectedValue(new Error('Permanent failure'));

      // Process pending registrations (should process failed ones too)
      await service.processPendingRegistrations();

      // Verify the registration was marked as permanently failed
      const permanentlyFailedRegistration = await registrationRepository.findOne({
        where: { id: testRegistration.id },
      });

      expect(permanentlyFailedRegistration).toBeTruthy();
      expect(permanentlyFailedRegistration.syncStatus).toBe(SyncStatus.FAILED);
      expect(permanentlyFailedRegistration.syncAttempts).toBe(6); // Max attempts reached
      expect(permanentlyFailedRegistration.notes).toContain('Permanent failure after 6 attempts');
    });
  });

  describe('Manual Retry Integration', () => {
    it('should manually retry a failed registration', async () => {
      // Create a test session
      const sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
      const testSession = sessionRepository.create({
        id: 'retry-session-id',
        title: 'Manual Retry Session',
        startTime: new Date('2023-01-15T14:00:00Z'),
        endTime: new Date('2023-01-15T16:00:00Z'),
        status: SessionStatus.PUBLISHED,
        authorId: 'test-author-id',
        maxRegistrations: 50,
        isActive: true,
        automatedStatusChange: false,
        contentValidationStatus: 'valid',
        publicationRequirementsMet: true,
      });
      await sessionRepository.save(testSession);

      // Create a failed registration
      const failedRegistration = registrationRepository.create({
        sessionId: 'retry-session-id',
        name: 'Manual Retry User',
        email: 'manual@example.com',
        syncStatus: SyncStatus.FAILED,
        syncAttempts: 2,
        notes: 'Previous failure',
      });
      await registrationRepository.save(failedRegistration);

      // Mock successful webhook response for retry
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          status: 'success',
          registration_id: 'manual-retry-id-456',
        }),
      });

      // Manually retry the failed registration
      const retryResult = await service.retryFailedRegistration(failedRegistration.id);

      expect(retryResult.success).toBe(true);
      expect(retryResult.message).toBe('Retry initiated successfully');

      // Verify the registration was updated
      const retriedRegistration = await registrationRepository.findOne({
        where: { id: failedRegistration.id },
      });

      expect(retriedRegistration.syncStatus).toBe(SyncStatus.SYNCED);
      expect(retriedRegistration.syncAttempts).toBe(3);
      expect(retriedRegistration.externalId).toBe('manual-retry-id-456');
    });
  });

  describe('Statistics Integration', () => {
    it('should return accurate sync statistics', async () => {
      // Create multiple registrations with different sync statuses
      const registrations = [
        { syncStatus: SyncStatus.PENDING, syncAttempts: 0 },
        { syncStatus: SyncStatus.PENDING, syncAttempts: 0 },
        { syncStatus: SyncStatus.SYNCED, syncAttempts: 1 },
        { syncStatus: SyncStatus.SYNCED, syncAttempts: 1 },
        { syncStatus: SyncStatus.SYNCED, syncAttempts: 2 },
        { syncStatus: SyncStatus.FAILED, syncAttempts: 3 },
        { syncStatus: SyncStatus.FAILED, syncAttempts: 6 }, // Permanently failed
      ];

      for (const regData of registrations) {
        const reg = registrationRepository.create({
          sessionId: 'stats-session-id',
          name: 'Stats Test User',
          email: `stats${regData.syncAttempts}@example.com`,
          ...regData,
        });
        await registrationRepository.save(reg);
      }

      const stats = await service.getSyncStatistics();

      expect(stats).toEqual({
        pending: 2,
        synced: 3,
        failed: 2,
        permanentlyFailed: 1,
        totalRegistrations: 7,
      });
    });
  });
});