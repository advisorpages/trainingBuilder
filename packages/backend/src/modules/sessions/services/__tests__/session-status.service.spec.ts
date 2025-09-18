import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { SessionStatusService } from '../session-status.service';
import { Session, SessionStatus } from '../../../../entities/session.entity';
import { SessionStatusHistory } from '../../../../entities/session-status-history.entity';
import { QrCodeService } from '../../../../services/qr-code.service';

describe('SessionStatusService', () => {
  let service: SessionStatusService;
  let sessionRepository: jest.Mocked<Repository<Session>>;
  let statusHistoryRepository: jest.Mocked<Repository<SessionStatusHistory>>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionStatusService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(SessionStatusHistory),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3001'),
          },
        },
        {
          provide: QrCodeService,
          useValue: {
            generateQrCodeForSession: jest.fn().mockResolvedValue({
              success: true,
              qrCodeUrl: 'https://test-qr.com/test.png',
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SessionStatusService>(SessionStatusService);
    sessionRepository = module.get(getRepositoryToken(Session));
    statusHistoryRepository = module.get(getRepositoryToken(SessionStatusHistory));
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSessionStatus', () => {
    it('should update session status and create history record', async () => {
      const sessionId = 'test-session-id';
      const userId = 'test-user-id';
      const mockSession = {
        id: sessionId,
        status: SessionStatus.DRAFT,
        title: 'Test Session',
      } as Session;

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockSession),
        save: jest.fn().mockImplementation((entity, data) => ({ ...data, id: sessionId })),
      };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockManager);
      });

      statusHistoryRepository.create.mockReturnValue({
        sessionId,
        oldStatus: SessionStatus.DRAFT,
        newStatus: SessionStatus.PUBLISHED,
        changedBy: userId,
        automatedChange: false,
      } as SessionStatusHistory);

      const result = await service.updateSessionStatus(
        sessionId,
        SessionStatus.PUBLISHED,
        userId,
        false,
        'Test reason'
      );

      expect(mockManager.findOne).toHaveBeenCalledWith(Session, {
        where: { id: sessionId }
      });

      expect(result.status).toBe(SessionStatus.PUBLISHED);
      expect(statusHistoryRepository.create).toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      const sessionId = 'test-session-id';
      const mockSession = {
        id: sessionId,
        status: SessionStatus.COMPLETED,
        title: 'Test Session',
      } as Session;

      const mockManager = {
        findOne: jest.fn().mockResolvedValue(mockSession),
      };

      dataSource.transaction.mockImplementation(async (callback: any) => {
        return await callback(mockManager);
      });

      await expect(
        service.updateSessionStatus(
          sessionId,
          SessionStatus.PUBLISHED,
          'user-id',
          false
        )
      ).rejects.toThrow('Invalid status transition from completed to published');
    });
  });

  describe('getSessionsForAutomaticCompletion', () => {
    it('should return published sessions past their end time', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          status: SessionStatus.PUBLISHED,
          endTime: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          isActive: true,
        },
      ] as Session[];

      sessionRepository.find.mockResolvedValue(mockSessions);

      const result = await service.getSessionsForAutomaticCompletion();

      expect(sessionRepository.find).toHaveBeenCalledWith({
        where: {
          status: SessionStatus.PUBLISHED,
          endTime: expect.any(Date),
          isActive: true,
        },
        relations: ['author', 'location', 'trainer'],
      });

      expect(result).toEqual(mockSessions);
    });
  });
});