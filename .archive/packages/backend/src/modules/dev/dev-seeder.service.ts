import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../entities/role.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class DevSeederService {
  private readonly logger = new Logger(DevSeederService.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async seedDemo(): Promise<void> {
    try {
      this.logger.log('Seeding demo roles and users (dev only)...');

      const roleNames = ['Broker', 'Content Developer', 'Trainer'];
      const roles: Record<string, Role> = {};

      // Ensure roles exist
      for (const name of roleNames) {
        let role = await this.roleRepo.findOne({ where: { name } });
        if (!role) {
          role = this.roleRepo.create({ name, description: `${name} role` });
          await this.roleRepo.save(role);
          this.logger.log(`Created role: ${name}`);
        }
        roles[name] = role;
      }

      const defaultPassword = 'Password123!';
      const passwordHash = await bcrypt.hash(defaultPassword, 12);

      // Demo users
      const usersToEnsure: Array<{ email: string; role: Role }> = [
        { email: 'sarah.content@company.com', role: roles['Content Developer'] },
        { email: 'john.trainer@company.com', role: roles['Trainer'] },
        { email: 'broker1@company.com', role: roles['Broker'] },
      ];

      for (const u of usersToEnsure) {
        let user = await this.userRepo.findOne({ where: { email: u.email } });
        if (!user) {
          user = this.userRepo.create({
            email: u.email,
            passwordHash,
            roleId: u.role.id,
            isActive: true,
          });
          await this.userRepo.save(user);
          this.logger.log(`Created demo user: ${u.email}`);
        }
      }

      this.logger.log('Demo seed complete. You can login with Password123!');
    } catch (err) {
      this.logger.error('Demo seed failed', err as any);
    }
  }
}

