import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { IncentivesService } from '../incentives.service';
import { Incentive, IncentiveStatus } from '../../../entities/incentive.entity';
import { User } from '../../../entities/user.entity';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('IncentivesService - Publishing Functionality', () => {
  let service: IncentivesService;
  let repository: Repository<Incentive>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncentivesService,
        {
          provide: getRepositoryToken(Incentive),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<IncentivesService>(IncentivesService);
    repository = module.get<Repository<Incentive>>(getRepositoryToken(Incentive));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('publish', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@test.com',
      role: { name: 'Content Developer' },
    } as User;

    const mockIncentive: Incentive = {
      id: 'incentive-1',
      title: 'Test Incentive',
      description: 'Test Description',
      rules: 'Test Rules',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: IncentiveStatus.DRAFT,
      authorId: 'user-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Incentive;

    it('should publish a valid draft incentive', async () => {
      mockRepository.findOne.mockResolvedValue(mockIncentive);
      mockRepository.save.mockResolvedValue({
        ...mockIncentive,
        status: IncentiveStatus.PUBLISHED,
      });

      const result = await service.publish('incentive-1', mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockIncentive,
        status: IncentiveStatus.PUBLISHED,
      });
      expect(result.status).toBe(IncentiveStatus.PUBLISHED);
    });

    it('should throw BadRequestException for incomplete incentive', async () => {
      const incompleteIncentive = {
        ...mockIncentive,
        description: '', // Missing description
      };
      mockRepository.findOne.mockResolvedValue(incompleteIncentive);

      await expect(
        service.publish('incentive-1', mockUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException for unauthorized user', async () => {
      const unauthorizedUser = { ...mockUser, id: 'different-user' };
      mockRepository.findOne.mockResolvedValue(mockIncentive);

      await expect(
        service.publish('incentive-1', unauthorizedUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for expired end date', async () => {
      const expiredIncentive = {
        ...mockIncentive,
        endDate: new Date('2020-01-01'), // Past date
      };
      mockRepository.findOne.mockResolvedValue(expiredIncentive);

      await expect(
        service.publish('incentive-1', mockUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('unpublish', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@test.com',
      role: { name: 'Content Developer' },
    } as User;

    const publishedIncentive: Incentive = {
      id: 'incentive-1',
      title: 'Test Incentive',
      status: IncentiveStatus.PUBLISHED,
      authorId: 'user-1',
      isActive: true,
    } as Incentive;

    it('should unpublish a published incentive', async () => {
      mockRepository.findOne.mockResolvedValue(publishedIncentive);
      mockRepository.save.mockResolvedValue({
        ...publishedIncentive,
        status: IncentiveStatus.DRAFT,
      });

      const result = await service.unpublish('incentive-1', mockUser);

      expect(mockRepository.save).toHaveBeenCalledWith({
        ...publishedIncentive,
        status: IncentiveStatus.DRAFT,
      });
      expect(result.status).toBe(IncentiveStatus.DRAFT);
    });

    it('should throw BadRequestException for non-published incentive', async () => {
      const draftIncentive = {
        ...publishedIncentive,
        status: IncentiveStatus.DRAFT,
      };
      mockRepository.findOne.mockResolvedValue(draftIncentive);

      await expect(
        service.unpublish('incentive-1', mockUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getActiveIncentives', () => {
    it('should return published incentives sorted by end date', async () => {
      const mockIncentives = [
        {
          id: 'incentive-1',
          endDate: new Date('2025-12-31'),
          status: IncentiveStatus.PUBLISHED,
        },
        {
          id: 'incentive-2',
          endDate: new Date('2025-06-30'),
          status: IncentiveStatus.PUBLISHED,
        },
      ];

      mockRepository.find.mockResolvedValue(mockIncentives);

      const result = await service.getActiveIncentives();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          status: IncentiveStatus.PUBLISHED,
          endDate: Not(IsNull()),
        },
        relations: ['author'],
        order: { endDate: 'ASC' },
      });
      expect(result).toEqual(mockIncentives);
    });
  });

  describe('expireIncentives', () => {
    it('should expire published incentives past their end date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const expiredIncentive = {
        id: 'incentive-1',
        endDate: pastDate,
        status: IncentiveStatus.PUBLISHED,
      };

      mockRepository.find.mockResolvedValue([expiredIncentive]);
      mockRepository.save.mockResolvedValue({
        ...expiredIncentive,
        status: IncentiveStatus.EXPIRED,
      });

      const result = await service.expireIncentives();

      expect(result.expired).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...expiredIncentive,
        status: IncentiveStatus.EXPIRED,
      });
    });

    it('should not expire incentives with future end dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const activeIncentive = {
        id: 'incentive-1',
        endDate: futureDate,
        status: IncentiveStatus.PUBLISHED,
      };

      mockRepository.find.mockResolvedValue([activeIncentive]);

      const result = await service.expireIncentives();

      expect(result.expired).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});