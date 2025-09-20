import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainerDashboardService } from './trainer-dashboard.service';
import { Session } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { User } from '../../entities/user.entity';
import { CoachingTip } from '../../entities/coaching-tip.entity';
import { SessionCoachingTip } from '../../entities/session-coaching-tip.entity';

describe('TrainerDashboardService', () => {
  let service: TrainerDashboardService;
  let sessionRepository: Repository<Session>;
  let trainerRepository: Repository<Trainer>;
  let userRepository: Repository<User>;
  let coachingTipRepository: Repository<CoachingTip>;
  let sessionCoachingTipRepository: Repository<SessionCoachingTip>;

  const mockUser = {
    id: '1',
    email: 'trainer@test.com',
    role: { name: 'Trainer' }
  };

  const mockTrainer = {
    id: 1,
    name: 'Test Trainer',
    email: 'trainer@test.com',
    user: mockUser
  };

  const mockSession = {
    id: '1',
    title: 'Test Session',
    description: 'Test Description',
    startTime: new Date(),
    endTime: new Date(),
    status: 'published',
    trainer: mockTrainer
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerDashboardService,
        {
          provide: getRepositoryToken(Session),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Trainer),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CoachingTip),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SessionCoachingTip),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TrainerDashboardService>(TrainerDashboardService);
    sessionRepository = module.get<Repository<Session>>(getRepositoryToken(Session));
    trainerRepository = module.get<Repository<Trainer>>(getRepositoryToken(Trainer));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    coachingTipRepository = module.get<Repository<CoachingTip>>(getRepositoryToken(CoachingTip));
    sessionCoachingTipRepository = module.get<Repository<SessionCoachingTip>>(getRepositoryToken(SessionCoachingTip));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTrainerDashboardSummary', () => {
    it('should return dashboard summary for trainer', async () => {
      // Mock trainer lookup
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock upcoming sessions count
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      };
      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      // Mock session find for next session
      jest.spyOn(sessionRepository, 'find').mockResolvedValue([mockSession] as any);

      // Mock coaching tips count
      jest.spyOn(sessionCoachingTipRepository, 'count').mockResolvedValue(3);

      const result = await service.getTrainerDashboardSummary(mockUser as any);

      expect(result).toBeDefined();
      expect(result.upcomingSessionsCount).toBe(5);
      expect(result.totalCoachingTips).toBe(3);
      expect(result.nextSession).toBeDefined();
      expect(trainerRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email, isActive: true }
      });
    });
  });

  describe('getTrainerUpcomingSessions', () => {
    it('should return upcoming sessions for trainer', async () => {
      // Mock trainer lookup
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock sessions query
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockSession]),
      };
      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTrainerUpcomingSessions(mockUser as any, {});

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getTrainerSessionDetail', () => {
    it('should return session details for assigned trainer', async () => {
      // Mock trainer lookup
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock session lookup
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);

      const result = await service.getTrainerSessionDetail('1', mockUser as any);

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(sessionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1', trainer: { id: mockTrainer.id }, isActive: true },
        relations: expect.any(Array)
      });
    });

    it('should throw error if session not assigned to trainer', async () => {
      // Mock trainer lookup
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock session not found
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getTrainerSessionDetail('1', mockUser as any)).rejects.toThrow();
    });
  });

  describe('getSessionCoachingTips', () => {
    it('should return coaching tips for session', async () => {
      // Mock trainer lookup
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock session lookup (needed for getTrainerSessionDetail call)
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);

      // Mock coaching tips
      const mockCoachingTips = [
        { id: 1, tipContent: 'Test tip', focusArea: 'preparation', status: 'generated' }
      ];
      jest.spyOn(sessionCoachingTipRepository, 'find').mockResolvedValue(mockCoachingTips as any);

      const result = await service.getSessionCoachingTips('1', mockUser as any);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(sessionCoachingTipRepository.find).toHaveBeenCalledWith({
        where: { sessionId: '1', isActive: true },
        relations: ['coachingTip', 'coachingTip.topics', 'createdByUser'],
        order: { createdAt: 'DESC' }
      });
    });
  });
});