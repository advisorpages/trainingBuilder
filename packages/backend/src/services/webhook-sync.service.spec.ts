import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookSyncService } from './webhook-sync.service';
import { Registration, SyncStatus } from '../entities/registration.entity';
import { Session } from '../entities/session.entity';

// Mock fetch globally
global.fetch = jest.fn();

describe('WebhookSyncService', () => {
  let service: WebhookSyncService;
  let registrationRepository: jest.Mocked<Repository<Registration>>;
  let configService: jest.Mocked<ConfigService>;

  const mockRegistration: Registration = {
    id: 'test-reg-id',
    sessionId: 'test-session-id',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    referredBy: 'Jane Doe',
    syncStatus: SyncStatus.PENDING,
    syncAttempts: 0,
    externalId: null,
    notes: null,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    syncedAt: null,
    session: {
      id: 'test-session-id',
      title: 'Test Session',
      startTime: new Date('2023-01-15T14:00:00Z'),
      endTime: new Date('2023-01-15T16:00:00Z'),
      status: 'published',
      authorId: 'test-author-id',
      maxRegistrations: 50,
      isActive: true,
      automatedStatusChange: false,
      contentValidationStatus: 'valid',
      publicationRequirementsMet: true,
      location: { name: 'Test Location' },
    } as Session,
  } as Registration;

  const mockConfigValues = {
    WEBHOOK_REGISTRATION_URL: 'https://api.example.com/webhooks/registration',
    WEBHOOK_TIMEOUT_MS: 30000,
    WEBHOOK_RETRY_MAX_ATTEMPTS: 6,
    WEBHOOK_RETRY_BASE_DELAY_MS: 60000,
  };

  beforeEach(async () => {
    const mockRegistrationRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        return mockConfigValues[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookSyncService,
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepo,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<WebhookSyncService>(WebhookSyncService);
    registrationRepository = module.get(getRepositoryToken(Registration));
    configService = module.get(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  describe('processPendingRegistrations', () => {
    it('should skip processing when webhook URL is not configured', async () => {
      configService.get.mockReturnValueOnce(''); // Empty webhook URL
      const consoleSpy = jest.spyOn(service['logger'], 'warn').mockImplementation();

      await service.processPendingRegistrations();

      expect(consoleSpy).toHaveBeenCalledWith(
        'WEBHOOK_REGISTRATION_URL not configured, skipping webhook sync'
      );
      expect(registrationRepository.find).not.toHaveBeenCalled();
    });

    it('should process pending registrations successfully', async () => {
      registrationRepository.find.mockResolvedValue([mockRegistration]);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success', registration_id: 'ext-123' }),
      });

      await service.processPendingRegistrations();

      expect(registrationRepository.find).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/webhooks/registration',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TrainingBuilder-Webhook/1.0',
          },
          body: expect.stringContaining('"registration_id":"test-reg-id"'),
        })
      );
      expect(registrationRepository.update).toHaveBeenCalledWith(
        'test-reg-id',
        expect.objectContaining({
          syncStatus: SyncStatus.SYNCED,
          syncAttempts: 1,
          externalId: 'ext-123',
        })
      );
    });

    it('should handle webhook failures and schedule retries', async () => {
      registrationRepository.find.mockResolvedValue([mockRegistration]);
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await service.processPendingRegistrations();

      expect(registrationRepository.update).toHaveBeenCalledWith(
        'test-reg-id',
        expect.objectContaining({
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 1,
          notes: 'Attempt 1 failed: Network error',
        })
      );
    });

    it('should mark registration as permanently failed after max attempts', async () => {
      const failedRegistration = { ...mockRegistration, syncAttempts: 5 };
      registrationRepository.find.mockResolvedValue([failedRegistration]);
      (fetch as jest.Mock).mockRejectedValue(new Error('Permanent failure'));

      await service.processPendingRegistrations();

      expect(registrationRepository.update).toHaveBeenCalledWith(
        'test-reg-id',
        expect.objectContaining({
          syncStatus: SyncStatus.FAILED,
          syncAttempts: 6,
          notes: 'Permanent failure after 6 attempts: Permanent failure',
        })
      );
    });
  });

  describe('buildWebhookPayload', () => {
    it('should build correct webhook payload', () => {
      const payload = service['buildWebhookPayload'](mockRegistration);

      expect(payload).toEqual({
        session_id: 'test-session-id',
        registration_id: 'test-reg-id',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        referred_by: 'Jane Doe',
        session_details: {
          title: 'Test Session',
          date: '2023-01-15T14:00:00.000Z',
          location: 'Test Location',
        },
        registration_timestamp: '2023-01-01T10:00:00.000Z',
      });
    });

    it('should handle missing optional fields', () => {
      const minimalRegistration = {
        ...mockRegistration,
        phone: null,
        referredBy: null,
        session: {
          ...mockRegistration.session,
          location: null,
        },
      };

      const payload = service['buildWebhookPayload'](minimalRegistration);

      expect(payload.phone).toBeNull();
      expect(payload.referred_by).toBeNull();
      expect(payload.session_details.location).toBeUndefined();
    });
  });

  describe('sendWebhookRequest', () => {
    const mockPayload = {
      session_id: 'test-session-id',
      registration_id: 'test-reg-id',
      name: 'John Doe',
      email: 'john@example.com',
      session_details: {
        title: 'Test Session',
        date: '2023-01-15T14:00:00.000Z',
      },
      registration_timestamp: '2023-01-01T10:00:00.000Z',
    };

    it('should send webhook request with correct parameters', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

      const result = await service['sendWebhookRequest']('https://api.example.com/webhook', mockPayload);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'TrainingBuilder-Webhook/1.0',
          },
          body: JSON.stringify(mockPayload),
        })
      );
      expect(result).toEqual({ status: 'success' });
    });

    it('should throw error for non-ok HTTP responses', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(
        service['sendWebhookRequest']('https://api.example.com/webhook', mockPayload)
      ).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network connection failed'));

      await expect(
        service['sendWebhookRequest']('https://api.example.com/webhook', mockPayload)
      ).rejects.toThrow('Network connection failed');
    });
  });

  describe('retryFailedRegistration', () => {
    it('should retry failed registration successfully', async () => {
      registrationRepository.findOne.mockResolvedValue(mockRegistration);
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });

      const result = await service.retryFailedRegistration('test-reg-id');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Retry initiated successfully');
    });

    it('should return error when registration not found', async () => {
      registrationRepository.findOne.mockResolvedValue(null);

      const result = await service.retryFailedRegistration('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration not found');
    });

    it('should return error when registration is already synced', async () => {
      const syncedRegistration = { ...mockRegistration, syncStatus: SyncStatus.SYNCED };
      registrationRepository.findOne.mockResolvedValue(syncedRegistration);

      const result = await service.retryFailedRegistration('test-reg-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration is already synced');
    });

    it('should return error when webhook URL is not configured', async () => {
      configService.get.mockReturnValueOnce(''); // Empty webhook URL

      const result = await service.retryFailedRegistration('test-reg-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Webhook URL not configured');
    });
  });

  describe('getSyncStatistics', () => {
    it('should return correct sync statistics', async () => {
      registrationRepository.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(10) // synced
        .mockResolvedValueOnce(2) // failed
        .mockResolvedValueOnce(1) // permanently failed
        .mockResolvedValueOnce(17); // total

      const stats = await service.getSyncStatistics();

      expect(stats).toEqual({
        pending: 5,
        synced: 10,
        failed: 2,
        permanentlyFailed: 1,
        totalRegistrations: 17,
      });
      expect(registrationRepository.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('Exponential Backoff', () => {
    it('should calculate correct retry timestamps', () => {
      const now = new Date('2023-01-01T12:00:00Z');

      // Test retry timestamps for different attempts
      const attempt1 = service['getRetryTimestamp'](now, 1);
      const attempt2 = service['getRetryTimestamp'](now, 2);
      const attempt3 = service['getRetryTimestamp'](now, 3);

      expect(attempt1.getTime()).toBe(now.getTime() - 60000); // 1 minute
      expect(attempt2.getTime()).toBe(now.getTime() - 300000); // 5 minutes
      expect(attempt3.getTime()).toBe(now.getTime() - 900000); // 15 minutes
    });
  });

  describe('Service Lifecycle', () => {
    it('should log startup message on bootstrap', () => {
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      service.onApplicationBootstrap();

      expect(logSpy).toHaveBeenCalledWith('WebhookSyncService started');
    });

    it('should set shutdown flag on application shutdown', () => {
      const logSpy = jest.spyOn(service['logger'], 'log').mockImplementation();

      service.onApplicationShutdown();

      expect(service['isShuttingDown']).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('WebhookSyncService shutting down gracefully');
    });

    it('should skip scheduled sync when shutting down', async () => {
      service['isShuttingDown'] = true;
      const processSpy = jest.spyOn(service, 'processPendingRegistrations').mockResolvedValue();

      await service.handleScheduledSync();

      expect(processSpy).not.toHaveBeenCalled();
    });
  });
});