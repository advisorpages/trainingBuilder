import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DevSeederService {
  private readonly logger = new Logger(DevSeederService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seedDemo(): Promise<void> {
    this.logger.log('Starting development seeding process...');

    try {
      // Ensure roles exist
      await this.ensureRoles();

      // Ensure demo users exist
      await this.ensureUsers();

      this.logger.log('Development seeding completed successfully');
    } catch (error) {
      this.logger.error('Failed to seed development data:', error);
      throw error;
    }
  }

  private async ensureRoles(): Promise<void> {
    const requiredRoles = ['Broker', 'Content Developer', 'Trainer'];

    for (const roleName of requiredRoles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleName }
      });

      if (!existingRole) {
        const role = this.roleRepository.create({
          name: roleName,
          description: `Auto-created ${roleName} role for development`,
        });
        await this.roleRepository.save(role);
        this.logger.log(`Created role: ${roleName}`);
      }
    }
  }

  private async ensureUsers(): Promise<void> {
    const demoUsers = [
      {
        email: 'sarah.content@company.com',
        roleName: 'Content Developer',
      },
      {
        email: 'john.trainer@company.com',
        roleName: 'Trainer',
      },
      {
        email: 'broker1@company.com',
        roleName: 'Broker',
      },
    ];

    const defaultPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const userData of demoUsers) {
      const existingUser = await this.userRepository.findOne({ where: { email: userData.email } });

      if (!existingUser) {
        const role = await this.roleRepository.findOne({ where: { name: userData.roleName } });

        if (!role) {
          this.logger.warn(`Role ${userData.roleName} not found for user ${userData.email}`);
          continue;
        }

        const user = this.userRepository.create({
          email: userData.email,
          passwordHash: hashedPassword,
          isActive: true,
          roleId: role.id,
        });

        await this.userRepository.save(user);
        this.logger.log(`Created demo user: ${userData.email} with role ${userData.roleName}`);
      } else {
        // Ensure user is active and has correct password
        let needsUpdate = !existingUser.isActive;
        if (!needsUpdate) {
          try {
            const matches = await bcrypt.compare(defaultPassword, existingUser.passwordHash);
            needsUpdate = !matches;
          } catch (err) {
            // Handle invalid/placeholder hash from old seed data
            this.logger.warn(`Invalid password hash detected for ${existingUser.email}. Resetting to default.`);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          existingUser.isActive = true;
          existingUser.passwordHash = hashedPassword;
          await this.userRepository.save(existingUser);
          this.logger.log(`Updated demo user: ${userData.email}`);
        }
      }
    }
  }
}
