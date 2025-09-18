import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RefreshTokenDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<any> {
    // Remove sensitive information before returning
    const { user } = req.user;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('status')
  getAuthStatus(): object {
    return {
      module: 'Authentication',
      status: 'Active',
      endpoints: {
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        profile: 'GET /auth/profile',
        logout: 'POST /auth/logout',
      },
      features: [
        'JWT Authentication',
        'Role-based Access Control',
        'Password Hashing (bcrypt)',
        'Token Refresh',
        'User Profile Management',
      ],
      roles: ['Broker', 'Content Developer', 'Trainer'],
    };
  }
}