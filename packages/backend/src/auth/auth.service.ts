import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedInitialUsers();
    } catch (error) {
      this.logger.error('Failed to seed initial users', error);
    }
  }

  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email, isActive: true } });

    if (!user) {
      this.logger.warn(`Login attempt with non-existent email: ${email}`);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password attempt for user: ${email}`);
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);

      const user = await this.usersRepository.findOne({ where: { id: payload.sub, isActive: true } });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccess = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: '1h' });

      return { accessToken: newAccess };
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId, isActive: true } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async seedInitialUsers(): Promise<void> {
    const passwordHash = await bcrypt.hash('Password123!', 10);

    const defaultUsers: Array<{ email: string; role: UserRole; displayName: string }> = [
      { email: 'sarah.content@company.com', role: UserRole.CONTENT_DEVELOPER, displayName: 'Sarah Content' },
      { email: 'broker1@company.com', role: UserRole.BROKER, displayName: 'Broker One' },
      { email: 'john.trainer@company.com', role: UserRole.TRAINER, displayName: 'John Trainer' },
      // Legacy demo accounts retained for backwards compatibility
      { email: 'dev@example.com', role: UserRole.CONTENT_DEVELOPER, displayName: 'Content Developer' },
      { email: 'broker@example.com', role: UserRole.BROKER, displayName: 'Broker User' },
      { email: 'trainer@example.com', role: UserRole.TRAINER, displayName: 'Trainer User' },
    ];

    for (const { email, role, displayName } of defaultUsers) {
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.role = role;
        existing.isActive = true;
        if (!existing.displayName) {
          existing.displayName = displayName;
        }
        await this.usersRepository.save(existing);
        continue;
      }

      const user = this.usersRepository.create({
        email,
        passwordHash,
        role,
        displayName,
        isActive: true,
      });
      await this.usersRepository.save(user);
    }
  }
}
