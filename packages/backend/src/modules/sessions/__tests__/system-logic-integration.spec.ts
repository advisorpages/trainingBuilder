import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PublishingAutomationService } from '../services/publishing-automation.service';
import { ContentValidationService } from '../services/content-validation.service';
import { SessionStatusService } from '../services/session-status.service';
import { WorkflowMonitoringService } from '../services/workflow-monitoring.service';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { SessionStatusHistory } from '../../../entities/session-status-history.entity';

describe('System Logic Integration (Story 3.3)', () => {
  let publishingService: PublishingAutomationService;
  let contentValidationService: ContentValidationService;
  let sessionStatusService: SessionStatusService;
  let monitoringService: WorkflowMonitoringService;
  let sessionRepository: Repository<Session>;
  let statusHistoryRepository: Repository<SessionStatusHistory>;

  // Mock session data
  const validSession: Partial<Session> = {
    id: 'test-session-id',
    title: 'Test Leadership Session',
    description: 'A comprehensive leadership training session',
    status: SessionStatus.DRAFT,
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
    endTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // 50 hours from now
    locationId: 1,
    trainerId: 1,
    authorId: 'author-id',
    isActive: true,
    contentValidationStatus: 'valid',
    publicationRequirementsMet: true,
  };

  const conflictingSession: Partial<Session> = {
    id: 'conflicting-session-id',
    title: 'Conflicting Session',
    status: SessionStatus.PUBLISHED,
    startTime: new Date(Date.now() + 47 * 60 * 60 * 1000), // Overlaps with validSession
    endTime: new Date(Date.now() + 49 * 60 * 60 * 1000),
    locationId: 1, // Same location
    isActive: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishingAutomationService,
        ContentValidationService,
        SessionStatusService,
        WorkflowMonitoringService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
            })),
          },
        },
        {
          provide: getRepositoryToken(SessionStatusHistory),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb) => cb({
              findOne: jest.fn(),
              save: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    publishingService = module.get<PublishingAutomationService>(PublishingAutomationService);
    contentValidationService = module.get<ContentValidationService>(ContentValidationService);
    sessionStatusService = module.get<SessionStatusService>(SessionStatusService);
    monitoringService = module.get<WorkflowMonitoringService>(WorkflowMonitoringService);
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    statusHistoryRepository = module.get<Repository<SessionStatusHistory>>(getRepositoryToken(SessionStatusHistory));
  });

  describe('PublishingAutomationService', () => {
    describe('validatePublishingRules', () => {
      it('should validate a session successfully when all rules are met', async () => {
        // Mock content validation to return valid
        jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
          score: 95,
        });

        // Mock session repository to return valid session
        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(validSession as Session);

        // Mock no conflicting sessions
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);

        const result = await publishingService.validatePublishingRules('test-session-id');

        expect(result.canPublish).toBe(true);
        expect(result.reason).toBeUndefined();
      });

      it('should reject publication when content validation fails', async () => {
        // Mock content validation to return invalid
        jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
          isValid: false,
          errors: [
            { field: 'title', message: 'Title is required', severity: 'error' },
            { field: 'description', message: 'Description is required', severity: 'error' },
          ],
          warnings: [],
          score: 40,
        });

        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(validSession as Session);

        const result = await publishingService.validatePublishingRules('test-session-id');

        expect(result.canPublish).toBe(false);
        expect(result.reason).toContain('Content validation failed');
      });

      it('should reject publication when minimum lead time is not met', async () => {
        const shortLeadSession = {
          ...validSession,
          startTime: new Date(Date.now() + 12 * 60 * 60 * 1000), // Only 12 hours ahead
        };

        jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
          score: 95,
        });

        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(shortLeadSession as Session);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);

        const result = await publishingService.validatePublishingRules('test-session-id');

        expect(result.canPublish).toBe(false);
        expect(result.reason).toContain('at least 24 hours in advance');
      });

      it('should reject publication when scheduling conflicts exist', async () => {
        jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
          score: 95,
        });

        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(validSession as Session);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([conflictingSession as Session]);

        const result = await publishingService.validatePublishingRules('test-session-id');

        expect(result.canPublish).toBe(false);
        expect(result.reason).toContain('Scheduling conflict');
        expect(result.conflictingSessions).toHaveLength(1);
      });

      it('should reject publication when session is outside business hours', async () => {
        const lateSession = {
          ...validSession,
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        // Set to 2 AM (outside business hours)
        lateSession.startTime.setHours(2, 0, 0, 0);
        lateSession.endTime.setHours(4, 0, 0, 0);

        jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
          isValid: true,
          errors: [],
          warnings: [],
          score: 95,
        });

        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(lateSession as Session);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);

        const result = await publishingService.validatePublishingRules('test-session-id');

        expect(result.canPublish).toBe(false);
        expect(result.reason).toContain('between 6:00 AM and 10:00 PM');
      });
    });

    describe('validateMultipleSessions', () => {
      it('should validate multiple sessions efficiently', async () => {
        const sessionIds = ['session1', 'session2', 'session3'];

        jest.spyOn(sessionRepository, 'find')
          .mockResolvedValueOnce([validSession, validSession, validSession] as Session[])
          .mockResolvedValueOnce([]); // No conflicting sessions

        jest.spyOn(contentValidationService, 'validateSessionContent')
          .mockResolvedValue({
            isValid: true,
            errors: [],
            warnings: [],
            score: 95,
          });

        const results = await publishingService.validateMultipleSessions(sessionIds);

        expect(results.size).toBe(3);
        expect(Array.from(results.values()).every(r => r.canPublish)).toBe(true);
      });
    });

    describe('attemptAutomaticPublication', () => {
      it('should automatically publish a valid session', async () => {
        jest.spyOn(publishingService, 'validatePublishingRules').mockResolvedValue({
          canPublish: true,
        });

        jest.spyOn(sessionStatusService, 'updateSessionStatus').mockResolvedValue(
          { ...validSession, status: SessionStatus.PUBLISHED } as Session
        );

        const result = await publishingService.attemptAutomaticPublication('test-session-id');

        expect(result).toBe(true);
        expect(sessionStatusService.updateSessionStatus).toHaveBeenCalledWith(
          'test-session-id',
          SessionStatus.PUBLISHED,
          undefined,
          true,
          'Automatically published after meeting all publishing requirements'
        );
      });

      it('should not publish a session that fails validation', async () => {
        jest.spyOn(publishingService, 'validatePublishingRules').mockResolvedValue({
          canPublish: false,
          reason: 'Content validation failed',
        });

        const result = await publishingService.attemptAutomaticPublication('test-session-id');

        expect(result).toBe(false);
        expect(sessionStatusService.updateSessionStatus).not.toHaveBeenCalled();
      });
    });
  });

  describe('WorkflowMonitoringService', () => {
    it('should collect workflow metrics successfully', async () => {
      // Mock database queries for metrics
      jest.spyOn(sessionRepository, 'count').mockResolvedValue(100);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { status: 'draft', count: '30' },
          { status: 'published', count: '40' },
          { status: 'completed', count: '25' },
          { status: 'cancelled', count: '5' },
        ]),
      };

      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);
      jest.spyOn(statusHistoryRepository, 'count').mockResolvedValue(15);

      const metrics = await monitoringService.collectWorkflowMetrics();

      expect(metrics.totalSessions).toBe(100);
      expect(metrics.sessionsByStatus.draft).toBe(30);
      expect(metrics.sessionsByStatus.published).toBe(40);
      expect(metrics.sessionsByStatus.completed).toBe(25);
      expect(metrics.sessionsByStatus.cancelled).toBe(5);
    });

    it('should perform health check and generate alerts for issues', async () => {
      // Mock metrics that would generate alerts
      jest.spyOn(monitoringService, 'collectWorkflowMetrics').mockResolvedValue({
        totalSessions: 100,
        sessionsByStatus: {
          draft: 60, // High number of drafts
          published: 20,
          completed: 15,
          cancelled: 5,
        },
        automatedTransitions: 50,
        failedAutomations: 25, // High failure rate
        avgCompletionTime: 200, // Long completion time
        publicationSuccessRate: 70, // Low success rate
        schedulingConflicts: 8, // High conflicts
        validationFailures: 30, // High validation failures
      });

      const healthCheck = await monitoringService.performHealthCheck();

      expect(healthCheck.status).toBe('warning');
      expect(healthCheck.alerts.length).toBeGreaterThan(0);
      expect(healthCheck.alerts.some(alert => alert.includes('publication success rate'))).toBe(true);
      expect(healthCheck.alerts.some(alert => alert.includes('failed automations'))).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete publication workflow', async () => {
      // Test the complete flow from draft to published
      const session = { ...validSession };

      // Mock all the dependencies for a successful publication
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(session as Session);
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([]); // No conflicts

      jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 95,
      });

      jest.spyOn(sessionStatusService, 'updateSessionStatus').mockResolvedValue(
        { ...session, status: SessionStatus.PUBLISHED } as Session
      );

      // Step 1: Validate publishing rules
      const validation = await publishingService.validatePublishingRules(session.id);
      expect(validation.canPublish).toBe(true);

      // Step 2: Attempt automatic publication
      const published = await publishingService.attemptAutomaticPublication(session.id);
      expect(published).toBe(true);

      // Step 3: Verify status was updated
      expect(sessionStatusService.updateSessionStatus).toHaveBeenCalledWith(
        session.id,
        SessionStatus.PUBLISHED,
        undefined,
        true,
        expect.any(String)
      );
    });

    it('should handle timezone considerations correctly', async () => {
      // Test with different timezone scenarios
      const session = {
        ...validSession,
        startTime: new Date('2024-12-01T14:00:00Z'), // 2 PM UTC
        endTime: new Date('2024-12-01T16:00:00Z'), // 4 PM UTC
      };

      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(session as Session);
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);

      jest.spyOn(contentValidationService, 'validateSessionContent').mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
        score: 95,
      });

      const result = await publishingService.validatePublishingRules(session.id);

      // Should pass business hours validation (UTC times are used consistently)
      expect(result.canPublish).toBe(true);
    });
  });
});