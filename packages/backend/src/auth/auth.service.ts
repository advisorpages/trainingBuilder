import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      // Find user by email with role relationship
      const user = await this.usersRepository.findOne({
        where: { email, isActive: true },
        relations: ['role'],
      });

      if (!user) {
        this.logger.warn(`Login attempt with non-existent email: ${email}`);
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        this.logger.warn(`Invalid password attempt for user: ${email}`);
        return null;
      }

      this.logger.log(`Successful authentication for user: ${email}`);
      return user;
    } catch (error) {
      this.logger.error('Error during user validation', error);
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      iat: Math.floor(Date.now() / 1000),
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Get current user to ensure they're still active
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['role'],
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new access token
      const newPayload = {
        sub: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        iat: Math.floor(Date.now() / 1000),
      };

      const accessToken = this.jwtService.sign(newPayload);

      return { accessToken };
    } catch (error) {
      this.logger.error('Error refreshing token', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}