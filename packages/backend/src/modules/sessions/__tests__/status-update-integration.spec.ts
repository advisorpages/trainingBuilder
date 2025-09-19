import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SessionStatusService } from '../services/session-status.service';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { SessionStatusHistory } from '../../../entities/session-status-history.entity';

describe.skip('SessionStatusService Integration', () => {
  let service: SessionStatusService;
  let sessionRepository: Repository<Session>;
  let statusHistoryRepository: Repository<SessionStatusHistory>;
  let dataSource: DataSource;

  // Mock session data
  const mockSession: Partial<Session> = {
    id: 'test-session-id',
    title: 'Test Session',
    description: 'Test Description',
    status: SessionStatus.DRAFT,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    endTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // 26 hours from now
  };

  const mockUpdatedSession = {
    ...mockSession,
    status: SessionStatus.PUBLISHED,
    statusChangedAt: new Date(),
    statusChangedBy: 'test-user-id',
    automatedStatusChange: false,
  };

  beforeEach(async () => {
    const mockDataSource = {
      transaction: jest.fn((cb) => cb({
        findOne: jest.fn().mockResolvedValue(mockSession),
        save: jest.fn()
          .mockResolvedValueOnce(mockUpdatedSession) // For session save
          .mockResolvedValueOnce({}), // For status history save
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStatusService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SessionStatusHistory),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<SessionStatusService>(SessionStatusService);
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    statusHistoryRepository = module.get<Repository<SessionStatusHistory>>(getRepositoryToken(SessionStatusHistory));
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSessionStatus', () => {
    it('should successfully update session status from draft to published', async () => {
      const result = await service.updateSessionStatus(
        'test-session-id',
        SessionStatus.PUBLISHED,
        'test-user-id',
        false,
        'Publishing session for public registration'
      );

      expect(result).toEqual(mockUpdatedSession);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should create status history record', async () => {
      // Create a fresh mock to ensure draft status
      const mockDataSourceForHistory = {
        transaction: jest.fn((cb) => cb({
          findOne: jest.fn().mockResolvedValue(mockSession), // Ensure draft status
          save: jest.fn()
            .mockResolvedValueOnce(mockUpdatedSession) // For session save
            .mockResolvedValueOnce({}), // For status history save
        })),
      };

      const moduleForHistory = await Test.createTestingModule({
        providers: [
          SessionStatusService,
          {
            provide: getRepositoryToken(Session),
            useValue: { findOne: jest.fn(), update: jest.fn() },
          },
          {
            provide: getRepositoryToken(SessionStatusHistory),
            useValue: {
              create: jest.fn().mockReturnValue({}),
              find: jest.fn(),
            },
          },
          {
            provide: DataSource,
            useValue: mockDataSourceForHistory,
          },
        ],
      }).compile();

      const serviceForHistory = moduleForHistory.get<SessionStatusService>(SessionStatusService);
      const statusHistoryRepoForHistory = moduleForHistory.get<Repository<SessionStatusHistory>>(getRepositoryToken(SessionStatusHistory));

      await serviceForHistory.updateSessionStatus(
        'test-session-id',
        SessionStatus.PUBLISHED,
        'test-user-id',
        false,
        'Publishing session'
      );

      expect(statusHistoryRepoForHistory.create).toHaveBeenCalledWith({
        sessionId: 'test-session-id',
        oldStatus: SessionStatus.DRAFT,
        newStatus: SessionStatus.PUBLISHED,
        changedBy: 'test-user-id',
        automatedChange: false,
        changeReason: 'Publishing session',
      });
    });

    it('should validate status transitions', async () => {
      // Mock session with COMPLETED status
      const completedSession = { ...mockSession, status: SessionStatus.COMPLETED };

      const mockDataSourceWithCompletedSession = {
        transaction: jest.fn((cb) => cb({
          findOne: jest.fn().mockResolvedValue(completedSession),
          save: jest.fn(),
        })),
      };

      const moduleWithCompleted = await Test.createTestingModule({
        providers: [
          SessionStatusService,
          {
            provide: getRepositoryToken(Session),
            useValue: { findOne: jest.fn(), update: jest.fn() },
          },
          {
            provide: getRepositoryToken(SessionStatusHistory),
            useValue: { create: jest.fn(), find: jest.fn() },
          },
          {
            provide: DataSource,
            useValue: mockDataSourceWithCompletedSession,
          },
        ],
      }).compile();

      const serviceWithCompleted = moduleWithCompleted.get<SessionStatusService>(SessionStatusService);

      // Should throw error when trying to transition from COMPLETED to PUBLISHED
      await expect(
        serviceWithCompleted.updateSessionStatus(
          'test-session-id',
          SessionStatus.PUBLISHED,
          'test-user-id',
          false
        )
      ).rejects.toThrow('Invalid status transition from completed to published');
    });
  });

  describe('getSessionStatusHistory', () => {
    it('should return status history for a session', async () => {
      const mockHistory = [
        {
          id: 1,
          sessionId: 'test-session-id',
          oldStatus: SessionStatus.DRAFT,
          newStatus: SessionStatus.PUBLISHED,
          changedBy: 'test-user-id',
          automatedChange: false,
          changeReason: 'Publishing session',
          createdAt: new Date(),
          session: mockSession as Session,
          changedByUser: undefined,
        },
      ] as SessionStatusHistory[];

      jest.spyOn(statusHistoryRepository, 'find').mockResolvedValue(mockHistory);

      const result = await service.getSessionStatusHistory('test-session-id');

      expect(result).toEqual(mockHistory);
      expect(statusHistoryRepository.find).toHaveBeenCalledWith({
        where: { sessionId: 'test-session-id' },
        relations: ['changedByUser'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});