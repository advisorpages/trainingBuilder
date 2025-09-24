import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiUnauthorizedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RefreshTokenDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with email and password to receive JWT tokens'
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials or validation error' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh JWT token',
    description: 'Exchange refresh token for new access token'
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshResponseDto
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve authenticated user profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully'
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async getProfile(@Request() req): Promise<any> {
    // Remove sensitive information before returning
    const { passwordHash: _passwordHash, ...safeUser } = req.user;
    return safeUser;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate user session (client should remove token)'
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully'
  })
  @ApiUnauthorizedResponse({ description: 'JWT token required' })
  async logout(@Request() _req): Promise<{ message: string }> {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Get('status')
  @ApiOperation({
    summary: 'Authentication module status',
    description: 'Get authentication module status and available endpoints'
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication status retrieved successfully'
  })
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