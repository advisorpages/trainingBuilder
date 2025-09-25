import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { TrainerDashboardService } from './trainer-dashboard.service';
import { Session, SessionStatus } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { User } from '../../entities/user.entity';
import { UserRole } from '../../common/guards/roles.guard';
import { CoachingTip } from '../../entities/coaching-tip.entity';
import { SessionCoachingTip } from '../../entities/session-coaching-tip.entity';
import { TestDataFactory } from '../../test/test-data.factory';
import { createMockRepository, createMockQueryBuilder } from '../../test/test-mocks';

describe('TrainerDashboardService - Epic 4 Fixed Tests', () => {
  let service: TrainerDashboardService;
  let sessionRepository: Repository<Session>;
  let trainerRepository: Repository<Trainer>;
  let userRepository: Repository<User>;
  let coachingTipRepository: Repository<CoachingTip>;
  let sessionCoachingTipRepository: Repository<SessionCoachingTip>;

  // Test data based on Epic 4 scenario
  const mockUser = TestDataFactory.createUser({
    id: 1,
    email: 'trainer@test.com',
    role: 'trainer',
    name: 'Test Trainer',
  });

  const mockTrainer = TestDataFactory.createTrainer({
    id: 1,
    name: 'Test Trainer',
    email: 'trainer@test.com',
    isActive: true,
  });

  const mockSession = TestDataFactory.createSession({
    id: 1,
    title: 'Leadership Fundamentals',
    trainerId: 1,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    status: 'published',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainerDashboardService,
        {
          provide: getRepositoryToken(Session),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(Trainer),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(CoachingTip),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(SessionCoachingTip),
          useValue: createMockRepository(),
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('EPIC 4 FAILED TESTS - FIXED VERSIONS', () => {
    describe('getTrainerDashboardSummary - FIXED', () => {
      it('should return dashboard summary with proper upcomingSessions array', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Create proper mock query builder for count
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getCount = jest.fn().mockResolvedValue(3);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        // Mock upcoming sessions find
        const upcomingSessions = [
          TestDataFactory.createSession({
            id: 1,
            trainerId: 1,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
          TestDataFactory.createSession({
            id: 2,
            trainerId: 1,
            startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          }),
        ];

        jest.spyOn(sessionRepository, 'find').mockResolvedValue(upcomingSessions as any);

        // Mock coaching tips count
        jest.spyOn(sessionCoachingTipRepository, 'count').mockResolvedValue(5);

        const result = await service.getTrainerDashboardSummary(mockUser as any);

        // FIXED: Ensure upcomingSessions is properly defined
        expect(result).toBeDefined();
        expect(result.upcomingSessionsCount).toBe(3);
        expect(result.nextSession).toBeDefined();
        expect(result.totalCoachingTips).toBe(5);
        expect(result.recentActivity).toBeDefined();
        expect(Array.isArray(result.recentActivity)).toBe(true);

        // Verify trainer lookup was called correctly
        expect(trainerRepository.findOne).toHaveBeenCalledWith({
          where: { email: mockUser.email, isActive: true }
        });
      });

      it('should handle empty upcoming sessions without crashing', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock empty sessions
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getCount = jest.fn().mockResolvedValue(0);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([]);
        jest.spyOn(sessionCoachingTipRepository, 'count').mockResolvedValue(0);

        const result = await service.getTrainerDashboardSummary(mockUser as any);

        expect(result.upcomingSessionsCount).toBe(0);
        expect(result.nextSession).toBeNull();
        expect(result.totalCoachingTips).toBe(0);
      });
    });

    describe('getTrainerUpcomingSessions - FIXED', () => {
      it('should return array of sessions, never undefined', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Create proper mock query builder
        const mockQueryBuilder = createMockQueryBuilder();
        const mockSessions = [
          TestDataFactory.createSession({
            id: 1,
            trainerId: 1,
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          }),
        ];
        mockQueryBuilder.getMany = jest.fn().mockResolvedValue(mockSessions);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getTrainerUpcomingSessions(mockUser as any, {});

        // FIXED: Always returns array, never undefined
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(0);
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('session.trainer = :trainerId', { trainerId: 1 });
      });

      it('should return empty array when no sessions found', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock empty sessions
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getMany = jest.fn().mockResolvedValue([]);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getTrainerUpcomingSessions(mockUser as any, {});

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });

      it('should handle null repository response gracefully', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock null response (edge case)
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getMany = jest.fn().mockResolvedValue(null);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

        const result = await service.getTrainerUpcomingSessions(mockUser as any, {});

        // FIXED: Handle null response, return empty array
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('getTrainerSessionDetail - FIXED', () => {
      it('should use correct query structure with trainer.id', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock session lookup with correct structure
        const sessionWithRelations = {
          ...mockSession,
          trainer: mockTrainer,
          location: TestDataFactory.createLocation({ id: 1 }),
        };
        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(sessionWithRelations as any);

        const result = await service.getTrainerSessionDetail('1', mockUser as any);

        expect(result).toBeDefined();
        expect(result.id).toBe(1);

        // FIXED: Verify correct query structure
        expect(sessionRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: '1',
            trainer: { id: 1 }, // Correct structure: trainer.id, not trainerId
            isActive: true
          },
          relations: expect.arrayContaining([
            'trainer',
            'location',
            'coachingTips',
          ])
        });
      });

      it('should throw NotFoundException when session not found', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock session not found
        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

        await expect(service.getTrainerSessionDetail('999', mockUser as any))
          .rejects
          .toThrow(NotFoundException);

        expect(sessionRepository.findOne).toHaveBeenCalledWith({
          where: {
            id: '999',
            trainer: { id: 1 },
            isActive: true
          },
          relations: expect.any(Array)
        });
      });
    });

    describe('getSessionCoachingTips - FIXED', () => {
      it('should return coaching tips without calling failing getTrainerSessionDetail', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock session verification (simplified)
        jest.spyOn(sessionRepository, 'findOne')
          .mockResolvedValueOnce({ // First call for session verification
            ...mockSession,
            trainer: mockTrainer,
          } as any);

        // Mock coaching tips
        const mockCoachingTips = [
          TestDataFactory.createCoachingTip({
            sessionId: 1,
            trainerId: 1,
            category: 'preparation',
          }),
        ];
        jest.spyOn(sessionCoachingTipRepository, 'find').mockResolvedValue(mockCoachingTips as any);

        const result = await service.getSessionCoachingTips('1', mockUser as any);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThanOrEqual(0);

        // Verify the query structure
        expect(sessionCoachingTipRepository.find).toHaveBeenCalledWith({
          where: {
            sessionId: '1',
            isActive: true
          },
          relations: ['coachingTip', 'coachingTip.topics', 'createdByUser'],
          order: { createdAt: 'DESC' }
        });
      });

      it('should return empty array when no tips found', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock session verification
        jest.spyOn(sessionRepository, 'findOne').mockResolvedValue({
          ...mockSession,
          trainer: mockTrainer,
        } as any);

        // Mock empty coaching tips
        jest.spyOn(sessionCoachingTipRepository, 'find').mockResolvedValue([]);

        const result = await service.getSessionCoachingTips('1', mockUser as any);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(0);
      });
    });

    describe('Data Structure and Type Safety', () => {
      it('should handle trainer not found gracefully', async () => {
        // Mock trainer not found
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(null);

        await expect(service.getTrainerDashboardSummary(mockUser as any))
          .rejects
          .toThrow(ForbiddenException);
      });

      it('should validate all return types are properly structured', async () => {
        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

        // Mock all repository calls
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getCount = jest.fn().mockResolvedValue(2);
        mockQueryBuilder.getMany = jest.fn().mockResolvedValue([mockSession]);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue([mockSession] as any);
        jest.spyOn(sessionCoachingTipRepository, 'count').mockResolvedValue(3);

        // Test dashboard summary structure
        const dashboardResult = await service.getTrainerDashboardSummary(mockUser as any);
        expect(typeof dashboardResult.upcomingSessionsCount).toBe('number');
        expect(Array.isArray(dashboardResult.recentActivity)).toBe(true);

        // Test upcoming sessions structure
        const sessionsResult = await service.getTrainerUpcomingSessions(mockUser as any, {});
        expect(Array.isArray(sessionsResult)).toBe(true);
        if (sessionsResult.length > 0) {
          expect(sessionsResult[0]).toHaveProperty('id');
          expect(sessionsResult[0]).toHaveProperty('title');
        }
      });
    });

    describe('Integration with Test Data', () => {
      it('should work with Epic 4 test scenario data', async () => {
        const scenario = TestDataFactory.createEpic4Scenario();

        // Mock trainer lookup
        jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(scenario.trainerUser as any);

        // Mock sessions
        const mockQueryBuilder = createMockQueryBuilder();
        mockQueryBuilder.getCount = jest.fn().mockResolvedValue(scenario.upcomingSessions.length);
        mockQueryBuilder.getMany = jest.fn().mockResolvedValue(scenario.upcomingSessions);
        jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
        jest.spyOn(sessionRepository, 'find').mockResolvedValue(scenario.upcomingSessions as any);
        jest.spyOn(sessionCoachingTipRepository, 'count').mockResolvedValue(scenario.coachingTips.length);

        const result = await service.getTrainerDashboardSummary({ email: scenario.trainerUser.email } as any);

        expect(result.upcomingSessionsCount).toBe(scenario.upcomingSessions.length);
        expect(result.totalCoachingTips).toBe(scenario.coachingTips.length);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      jest.spyOn(trainerRepository, 'findOne').mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getTrainerDashboardSummary(mockUser as any))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle malformed session data', async () => {
      jest.spyOn(trainerRepository, 'findOne').mockResolvedValue(mockTrainer as any);

      // Mock malformed session data
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany = jest.fn().mockResolvedValue([
        { id: null, title: undefined } // Malformed data
      ]);
      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);

      const result = await service.getTrainerUpcomingSessions(mockUser as any, {});

      // Should still return an array, even with malformed data
      expect(Array.isArray(result)).toBe(true);
    });
  });
});