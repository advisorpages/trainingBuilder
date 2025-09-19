import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AuthService } from '../../auth/auth.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<Repository<User>>;
  let roleRepository: jest.Mocked<Repository<Role>>;

  const mockRole = {
    id: 1,
    name: 'CONTENT_DEVELOPER',
    description: 'Content Developer Role',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Role;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    roleId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: mockRole,
    authoredSessions: [],
    authoredIncentives: [],
    createdCoachingTips: [],
  } as User;

  beforeEach(async () => {
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: mockRepository,
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
            login: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    roleRepository = module.get(getRepositoryToken(Role));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users with role relations', async () => {
      const mockUsers = [mockUser];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('findOne', () => {
    it('should return user by id when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('test-id');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        relations: ['role'],
        select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'User with ID non-existent-id not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['role'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = { email: 'updated@example.com' };
      const updatedUser = { ...mockUser, ...updateData };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser) // findOne call in updateUser
        .mockResolvedValueOnce(updatedUser); // findOne call after update
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateUser('test-id', updateData);

      expect(userRepository.update).toHaveBeenCalledWith('test-id', updateData);
      expect(result).toEqual(updatedUser);
    });

    it('should exclude passwordHash from update', async () => {
      const updateData = {
        email: 'updated@example.com',
        passwordHash: 'newPassword'
      };
      const expectedUpdateData = { email: 'updated@example.com' };

      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.updateUser('test-id', updateData);

      expect(userRepository.update).toHaveBeenCalledWith('test-id', expectedUpdateData);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, isActive: false };

      userRepository.findOne.mockResolvedValue(deactivatedUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deactivateUser('test-id');

      expect(userRepository.update).toHaveBeenCalledWith('test-id', { isActive: false });
      expect(result).toEqual(deactivatedUser);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);

      const result = await service.activateUser('test-id');

      expect(userRepository.update).toHaveBeenCalledWith('test-id', { isActive: true });
      expect(result).toEqual(mockUser);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles ordered by id', async () => {
      const mockRoles = [mockRole];
      roleRepository.find.mockResolvedValue(mockRoles);

      const result = await service.getAllRoles();

      expect(roleRepository.find).toHaveBeenCalledWith({
        order: { id: 'ASC' },
      });
      expect(result).toEqual(mockRoles);
    });
  });

  describe('getUsersByRole', () => {
    it('should return active users by role name', async () => {
      const mockUsers = [mockUser];
      userRepository.find.mockResolvedValue(mockUsers);

      const result = await service.getUsersByRole('CONTENT_DEVELOPER');

      expect(userRepository.find).toHaveBeenCalledWith({
        relations: ['role'],
        where: { role: { name: 'CONTENT_DEVELOPER' }, isActive: true },
        select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getStatus', () => {
    it('should return service status', () => {
      const result = service.getStatus();

      expect(result).toEqual({
        module: 'Users',
        status: 'Active - Authentication Ready',
        features: [
          'User profile management',
          'Role-based queries',
          'User activation/deactivation',
          'Secure user data access',
        ],
        endpoints: {
          'GET /users': 'List all users (Admin only)',
          'GET /users/:id': 'Get user profile',
          'GET /users/roles': 'List all roles',
          'PATCH /users/:id': 'Update user profile',
        },
      });
    });
  });
});