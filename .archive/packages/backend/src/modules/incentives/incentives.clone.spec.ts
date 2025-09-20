import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { IncentivesService } from './incentives.service';
import { Incentive, IncentiveStatus } from '../../entities/incentive.entity';
import { User } from '../../entities/user.entity';

describe('IncentivesService - Clone Functionality', () => {
  let service: IncentivesService;
  let incentiveRepository: jest.Mocked<Repository<Incentive>>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  } as unknown as User;

  const mockSourceIncentive: Incentive = {
    id: 'source-123',
    title: 'Original Incentive',
    description: 'Original description',
    rules: 'Original rules',
    aiGeneratedContent: 'AI content',
    status: IncentiveStatus.PUBLISHED,
    authorId: 'original-author-123',
    isActive: true,
    startDate: new Date('2023-01-01'),
    endDate: new Date('2023-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  } as Incentive;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

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
    incentiveRepository = module.get(getRepositoryToken(Incentive));
  });

  describe('clone', () => {
    it('should successfully clone an incentive', async () => {
      // Arrange
      const expectedClone = {
        ...mockSourceIncentive,
        id: 'cloned-123',
        title: 'Original Incentive (Copy)',
        authorId: mockUser.id,
        status: IncentiveStatus.DRAFT,
      };

      incentiveRepository.findOne
        .mockResolvedValueOnce(mockSourceIncentive) // First call to find source
        .mockResolvedValueOnce(expectedClone); // Second call to return saved clone

      incentiveRepository.create.mockReturnValue(expectedClone as any);
      incentiveRepository.save.mockResolvedValue(expectedClone);

      // Act
      const result = await service.clone('source-123', mockUser);

      // Assert
      expect(result).toEqual(expectedClone);
      expect(incentiveRepository.findOne).toHaveBeenCalledTimes(2);
      expect(incentiveRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { id: 'source-123', isActive: true },
        relations: ['author'],
      });
      expect(incentiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Original Incentive (Copy)',
          description: 'Original description',
          rules: 'Original rules',
          aiGeneratedContent: 'AI content',
          authorId: mockUser.id,
          status: IncentiveStatus.DRAFT,
          isActive: true,
        })
      );
      expect(incentiveRepository.save).toHaveBeenCalledWith(expectedClone);
    });

    it('should throw NotFoundException when source incentive does not exist', async () => {
      // Arrange
      incentiveRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.clone('non-existent-123', mockUser))
        .rejects
        .toThrow(NotFoundException);

      expect(incentiveRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent-123', isActive: true },
        relations: ['author'],
      });
      expect(incentiveRepository.create).not.toHaveBeenCalled();
      expect(incentiveRepository.save).not.toHaveBeenCalled();
    });

    it('should append (Copy) to the title', async () => {
      // Arrange
      const cloneData = { id: 'cloned-123' } as Incentive;
      incentiveRepository.findOne
        .mockResolvedValueOnce(mockSourceIncentive)
        .mockResolvedValueOnce(cloneData);
      incentiveRepository.create.mockReturnValue(cloneData);
      incentiveRepository.save.mockResolvedValue(cloneData);

      // Act
      await service.clone('source-123', mockUser);

      // Assert
      expect(incentiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Original Incentive (Copy)',
        })
      );
    });

    it('should reset status to DRAFT regardless of source status', async () => {
      // Arrange
      const publishedSource = { ...mockSourceIncentive, status: IncentiveStatus.PUBLISHED };
      const cloneData = { id: 'cloned-123' } as Incentive;

      incentiveRepository.findOne
        .mockResolvedValueOnce(publishedSource)
        .mockResolvedValueOnce(cloneData);
      incentiveRepository.create.mockReturnValue(cloneData);
      incentiveRepository.save.mockResolvedValue(cloneData);

      // Act
      await service.clone('source-123', mockUser);

      // Assert
      expect(incentiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: IncentiveStatus.DRAFT,
        })
      );
    });

    it('should set new author as the clone author', async () => {
      // Arrange
      const cloneData = { id: 'cloned-123' } as Incentive;
      incentiveRepository.findOne
        .mockResolvedValueOnce(mockSourceIncentive)
        .mockResolvedValueOnce(cloneData);
      incentiveRepository.create.mockReturnValue(cloneData);
      incentiveRepository.save.mockResolvedValue(cloneData);

      // Act
      await service.clone('source-123', mockUser);

      // Assert
      expect(incentiveRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          authorId: mockUser.id,
        })
      );
    });
  });
});