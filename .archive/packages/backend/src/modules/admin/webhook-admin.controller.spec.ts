import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
import { WebhookAdminController } from './webhook-admin.controller';
import { WebhookSyncService } from '../../services/webhook-sync.service';
import { Registration, SyncStatus } from '../../entities/registration.entity';
import { Session, SessionStatus } from '../../entities/session.entity';

describe('WebhookAdminController', () => {
  let controller: WebhookAdminController;
  let webhookSyncService: jest.Mocked<WebhookSyncService>;
  let registrationRepository: jest.Mocked<Repository<Registration>>;

  const mockSession: Session = {
    id: 'test-session-id',
    title: 'Test Session',
    startTime: new Date('2023-01-15T14:00:00Z'),
    endTime: new Date('2023-01-15T16:00:00Z'),
    status: SessionStatus.PUBLISHED,
    authorId: 'test-author-id',
    maxRegistrations: 50,
    isActive: true,
    automatedStatusChange: false,
    contentValidationStatus: 'valid',
    publicationRequirementsMet: true,
  } as Session;

  const mockRegistration: Registration = {
    id: 'test-reg-id',
    sessionId: 'test-session-id',
    name: 'John Doe',
    email: 'john@example.com',
    syncStatus: SyncStatus.PENDING,
    syncAttempts: 0,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    syncedAt: null,
    notes: null,
    session: mockSession,
  } as Registration;

  const mockFailedRegistration: Registration = {
    ...mockRegistration,
    id: 'failed-reg-id',
    syncStatus: SyncStatus.FAILED,
    syncAttempts: 3,
    syncedAt: new Date('2023-01-01T11:00:00Z'),
    notes: 'Attempt 3 failed: Network timeout',
  };

  beforeEach(async () => {
    const mockWebhookSyncService = {
      getSyncStatistics: jest.fn(),
      retryFailedRegistration: jest.fn(),
      processPendingRegistrations: jest.fn(),
    };

    const mockRegistrationRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookAdminController],
      providers: [
        {
          provide: WebhookSyncService,
          useValue: mockWebhookSyncService,
        },
        {
          provide: getRepositoryToken(Registration),
          useValue: mockRegistrationRepo,
        },
      ],
    }).compile();

    controller = module.get<WebhookAdminController>(WebhookAdminController);
    webhookSyncService = module.get(WebhookSyncService);
    registrationRepository = module.get(getRepositoryToken(Registration));
  });

  describe('getWebhookSyncHealth', () => {
    it('should return health statistics with success rates', async () => {
      const mockStats = {
        pending: 5,
        synced: 10,
        failed: 2,
        permanentlyFailed: 1,
        totalRegistrations: 17,
      };

      webhookSyncService.getSyncStatistics.mockResolvedValue(mockStats);
      registrationRepository.find.mockResolvedValue([mockFailedRegistration]);

      const result = await controller.getWebhookSyncHealth();

      expect(result.statistics).toEqual({
        ...mockStats,
        successRate: 58.82, // (10/17) * 100
        failureRate: 5.88,  // (1/17) * 100
      });
      expect(result.recentFailures).toHaveLength(1);
      expect(result.recentFailures[0]).toEqual({
        registration_id: 'failed-reg-id',
        name: 'John Doe',
        email: 'john@example.com',
        session_title: 'Test Session',
        sync_status: SyncStatus.FAILED,
        sync_attempts: 3,
        created_at: '2023-01-01T10:00:00.000Z',
        synced_at: '2023-01-01T11:00:00.000Z',
        notes: 'Attempt 3 failed: Network timeout',
      });
    });

    it('should handle zero total registrations', async () => {
      const mockStats = {
        pending: 0,
        synced: 0,
        failed: 0,
        permanentlyFailed: 0,
        totalRegistrations: 0,
      };

      webhookSyncService.getSyncStatistics.mockResolvedValue(mockStats);
      registrationRepository.find.mockResolvedValue([]);

      const result = await controller.getWebhookSyncHealth();

      expect(result.statistics.successRate).toBe(0);
      expect(result.statistics.failureRate).toBe(0);
    });

    it('should throw HttpException on error', async () => {
      webhookSyncService.getSyncStatistics.mockRejectedValue(new Error('Database error'));

      await expect(controller.getWebhookSyncHealth()).rejects.toThrow(
        new HttpException(
          'Failed to get webhook sync health: Database error',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    });
  });

  describe('getRegistrationSyncStatus', () => {
    it('should return registration sync status with summary', async () => {
      const mockRegistrations = [
        mockRegistration,
        { ...mockRegistration, id: 'reg-2', syncStatus: SyncStatus.SYNCED },
        mockFailedRegistration,
      ];

      registrationRepository.find.mockResolvedValue(mockRegistrations);

      const result = await controller.getRegistrationSyncStatus();

      expect(result.registrations).toHaveLength(3);
      expect(result.summary).toEqual({
        total: 3,
        pending: 1,
        synced: 1,
        failed: 1,
      });
    });

    it('should limit results to 100 registrations', async () => {
      registrationRepository.find.mockResolvedValue([]);

      await controller.getRegistrationSyncStatus();

      expect(registrationRepository.find).toHaveBeenCalledWith({
        relations: ['session'],
        order: { createdAt: 'DESC' },
        take: 100,
      });
    });
  });

  describe('getRegistrationSyncStatusById', () => {
    it('should return specific registration sync status', async () => {
      registrationRepository.findOne.mockResolvedValue(mockRegistration);

      const result = await controller.getRegistrationSyncStatusById('test-reg-id');

      expect(result).toEqual({
        registration_id: 'test-reg-id',
        name: 'John Doe',
        email: 'john@example.com',
        session_title: 'Test Session',
        sync_status: SyncStatus.PENDING,
        sync_attempts: 0,
        created_at: '2023-01-01T10:00:00.000Z',
        synced_at: undefined,
        notes: null,
      });
    });

    it('should throw 404 when registration not found', async () => {
      registrationRepository.findOne.mockResolvedValue(null);

      await expect(
        controller.getRegistrationSyncStatusById('non-existent-id')
      ).rejects.toThrow(
        new HttpException('Registration not found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('retryRegistrationSync', () => {
    it('should successfully retry registration sync', async () => {
      const mockResult = { success: true, message: 'Retry initiated successfully' };
      webhookSyncService.retryFailedRegistration.mockResolvedValue(mockResult);

      const result = await controller.retryRegistrationSync('test-reg-id');

      expect(result).toEqual({
        success: true,
        message: 'Retry initiated successfully',
        registration_id: 'test-reg-id',
      });
      expect(webhookSyncService.retryFailedRegistration).toHaveBeenCalledWith('test-reg-id');
    });

    it('should handle retry failure', async () => {
      const mockResult = { success: false, message: 'Registration not found' };
      webhookSyncService.retryFailedRegistration.mockResolvedValue(mockResult);

      const result = await controller.retryRegistrationSync('test-reg-id');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Registration not found');
    });

    it('should throw HttpException on service error', async () => {
      webhookSyncService.retryFailedRegistration.mockRejectedValue(new Error('Service error'));

      await expect(
        controller.retryRegistrationSync('test-reg-id')
      ).rejects.toThrow(
        new HttpException(
          'Failed to retry registration sync: Service error',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    });
  });

  describe('processPendingRegistrations', () => {
    it('should process pending registrations and return count', async () => {
      registrationRepository.count
        .mockResolvedValueOnce(5) // before processing
        .mockResolvedValueOnce(2); // after processing

      webhookSyncService.processPendingRegistrations.mockResolvedValue();

      const result = await controller.processPendingRegistrations();

      expect(result).toEqual({
        success: true,
        message: 'Processed 3 pending registrations',
        processed_count: 3,
      });
    });

    it('should handle zero pending registrations', async () => {
      registrationRepository.count
        .mockResolvedValueOnce(0) // before processing
        .mockResolvedValueOnce(0); // after processing

      webhookSyncService.processPendingRegistrations.mockResolvedValue();

      const result = await controller.processPendingRegistrations();

      expect(result.processed_count).toBe(0);
    });
  });

  describe('getFailedRegistrations', () => {
    it('should categorize failed registrations correctly', async () => {
      const permanentlyFailedReg = {
        ...mockFailedRegistration,
        id: 'perm-failed-id',
        syncAttempts: 6, // Max attempts reached
      };

      const retryableReg = {
        ...mockFailedRegistration,
        id: 'retryable-id',
        syncAttempts: 3, // Still retryable
      };

      registrationRepository.find.mockResolvedValue([
        permanentlyFailedReg,
        retryableReg,
      ]);

      const result = await controller.getFailedRegistrations();

      expect(result.permanentlyFailed).toHaveLength(1);
      expect(result.retryable).toHaveLength(1);
      expect(result.summary).toEqual({
        totalFailed: 2,
        permanentlyFailed: 1,
        retryable: 1,
      });

      expect(result.permanentlyFailed[0].registration_id).toBe('perm-failed-id');
      expect(result.retryable[0].registration_id).toBe('retryable-id');
    });

    it('should handle empty failed registrations list', async () => {
      registrationRepository.find.mockResolvedValue([]);

      const result = await controller.getFailedRegistrations();

      expect(result.permanentlyFailed).toHaveLength(0);
      expect(result.retryable).toHaveLength(0);
      expect(result.summary.totalFailed).toBe(0);
    });

    it('should order failed registrations by sync date descending', async () => {
      registrationRepository.find.mockResolvedValue([]);

      await controller.getFailedRegistrations();

      expect(registrationRepository.find).toHaveBeenCalledWith({
        where: { syncStatus: SyncStatus.FAILED },
        relations: ['session'],
        order: { syncedAt: 'DESC' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      registrationRepository.find.mockRejectedValue(new Error('Connection lost'));

      await expect(controller.getRegistrationSyncStatus()).rejects.toThrow(
        new HttpException(
          'Failed to get registration sync status: Connection lost',
          HttpStatus.INTERNAL_SERVER_ERROR
        )
      );
    });

    it('should preserve HttpException types', async () => {
      const customException = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      registrationRepository.findOne.mockRejectedValue(customException);

      await expect(
        controller.getRegistrationSyncStatusById('test-id')
      ).rejects.toThrow(customException);
    });
  });
});