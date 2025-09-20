import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private authService: AuthService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role'],
      select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
      select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findOne(id);

    // Don't allow updating password through this method
    const { passwordHash, ...safeUpdateData } = updateData;

    await this.usersRepository.update(id, safeUpdateData);
    return this.findOne(id);
  }

  async deactivateUser(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: false });
    return this.findOne(id);
  }

  async activateUser(id: string): Promise<User> {
    await this.usersRepository.update(id, { isActive: true });
    return this.findOne(id);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.rolesRepository.find({
      order: { id: 'ASC' },
    });
  }

  async getUsersByRole(roleName: string): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['role'],
      where: { role: { name: roleName }, isActive: true },
      select: ['id', 'email', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  getStatus(): object {
    return {
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
    };
  }
}