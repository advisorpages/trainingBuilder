import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

export interface SystemHealth {
  database: 'connected' | 'disconnected' | 'error';
  api: 'healthy' | 'degraded' | 'down';
  lastCheck: string;
  uptime: number;
  version: string;
}

export interface SystemConfig {
  apiTimeout: number;
  maxRequestSize: string;
  environment: string;
  nodeVersion: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
export class AdminController {

  @Get('health')
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // In a real implementation, you'd check actual database connection
      // For now, return mock healthy status
      return {
        database: 'connected',
        api: 'healthy',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };
    } catch (error) {
      return {
        database: 'error',
        api: 'down',
        lastCheck: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };
    }
  }

  @Get('config')
  async getSystemConfig(): Promise<SystemConfig> {
    return {
      apiTimeout: 45000,
      maxRequestSize: '50mb',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    };
  }

  @Put('config')
  async updateSystemConfig(@Body() _config: Partial<SystemConfig>): Promise<SystemConfig> {
    // In a real implementation, you'd update actual configuration
    // For now, return the current config
    return this.getSystemConfig();
  }

  @Get('logs')
  async getLogs(): Promise<LogEntry[]> {
    // In a real implementation, you'd read from actual log files
    // For now, return mock logs
    const now = new Date();
    return [
      {
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'Application started successfully',
        context: 'bootstrap'
      },
      {
        timestamp: new Date(now.getTime() - 3 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'Database connection established',
        context: 'database'
      },
      {
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        level: 'info',
        message: 'All modules loaded successfully',
        context: 'module-loader'
      },
      {
        timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
        level: 'warn',
        message: 'High memory usage detected',
        context: 'system'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Admin accessed system logs',
        context: 'admin'
      }
    ];
  }
}