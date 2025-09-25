import { Test, TestingModule } from '@nestjs/testing';
import { TrainerDashboardController } from './trainer-dashboard.controller';
import { TrainerDashboardService } from './trainer-dashboard.service';
import { EmailService } from '../email/email.service';

describe('TrainerDashboardController', () => {
  let controller: TrainerDashboardController;
  let trainerDashboardService: TrainerDashboardService;
  let emailService: EmailService;

  const mockUser = {
    id: '1',
    email: 'trainer@test.com',
    role: { name: 'Trainer' }
  };

  const mockTrainerDashboardService = {
    getTrainerDashboardSummary: jest.fn(),
    getTrainerUpcomingSessions: jest.fn(),
    getTrainerSessionDetail: jest.fn(),
    getSessionCoachingTips: jest.fn(),
    generateSessionCoachingTips: jest.fn(),
    updateCoachingTipStatus: jest.fn(),
  };

  const mockEmailService = {
    sendTrainerKitEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrainerDashboardController],
      providers: [
        {
          provide: TrainerDashboardService,
          useValue: mockTrainerDashboardService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    controller = module.get<TrainerDashboardController>(TrainerDashboardController);
    trainerDashboardService = module.get<TrainerDashboardService>(TrainerDashboardService);
    emailService = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary', async () => {
      const mockSummary = {
        upcomingSessionsCount: 5,
        nextSession: null,
        totalCoachingTips: 10,
      };

      mockTrainerDashboardService.getTrainerDashboardSummary.mockResolvedValue(mockSummary);

      const result = await controller.getDashboardSummary(mockUser as any);

      expect(result).toEqual(mockSummary);
      expect(trainerDashboardService.getTrainerDashboardSummary).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('getUpcomingSessions', () => {
    it('should return upcoming sessions', async () => {
      const mockSessions = [
        { id: '1', title: 'Test Session', startTime: new Date() }
      ];
      const queryDto = { days: 7 };

      mockTrainerDashboardService.getTrainerUpcomingSessions.mockResolvedValue(mockSessions);

      const result = await controller.getUpcomingSessions(mockUser as any, queryDto);

      expect(result).toEqual(mockSessions);
      expect(trainerDashboardService.getTrainerUpcomingSessions).toHaveBeenCalledWith(mockUser, queryDto);
    });
  });

  describe('getSessionDetail', () => {
    it('should return session detail', async () => {
      const sessionId = '1';
      const mockSession = {
        id: sessionId,
        title: 'Test Session',
        description: 'Test Description',
      };

      mockTrainerDashboardService.getTrainerSessionDetail.mockResolvedValue(mockSession);

      const result = await controller.getSessionDetail(sessionId, mockUser as any);

      expect(result).toEqual(mockSession);
      expect(trainerDashboardService.getTrainerSessionDetail).toHaveBeenCalledWith(sessionId, mockUser);
    });
  });

  describe('getSessionCoachingTips', () => {
    it('should return coaching tips for session', async () => {
      const sessionId = '1';
      const mockTips = [
        { id: 1, tipContent: 'Test tip', focusArea: 'preparation' }
      ];

      mockTrainerDashboardService.getSessionCoachingTips.mockResolvedValue(mockTips);

      const result = await controller.getSessionCoachingTips(sessionId, mockUser as any);

      expect(result).toEqual(mockTips);
      expect(trainerDashboardService.getSessionCoachingTips).toHaveBeenCalledWith(sessionId, mockUser);
    });
  });
});