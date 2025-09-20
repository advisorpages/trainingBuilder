import { Injectable } from '@nestjs/common';
import { DatabaseHealthService } from './services/database-health.service';

@Injectable()
export class AppService {
  constructor(private readonly databaseHealthService: DatabaseHealthService) {}

  async getHealth(): Promise<object> {
    const dbHealth = await this.databaseHealthService.checkHealth();

    return {
      status: dbHealth.connected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.2.0',
      database: {
        status: dbHealth.status,
        connected: dbHealth.connected,
        entities: dbHealth.entities,
        schemaVersion: dbHealth.schemaVersion,
        host: dbHealth.connectionInfo.host,
        database: dbHealth.connectionInfo.database,
      },
    };
  }

  async getAppInfo(): Promise<object> {
    const dbHealth = await this.databaseHealthService.checkHealth();

    return {
      name: 'Leadership Training App API',
      version: '1.2.0',
      description: 'Backend API for Leadership Training Application',
      endpoints: {
        health: '/api/health',
        'database-status': '/api/database-status',
        'relationship-tests': '/api/relationship-tests',
        auth: '/api/auth (coming in Story 1.3)',
        sessions: '/api/sessions (coming in Story 2.x)',
        users: '/api/users (coming in Story 1.3)',
      },
      story: '1.2 - Database Schema & Roles',
      status: 'In Development',
      database: {
        entities: dbHealth.entities,
        schemaVersion: dbHealth.schemaVersion,
        tableCounts: dbHealth.tableCounts,
      },
    };
  }

  async getDatabaseStatus(): Promise<object> {
    return await this.databaseHealthService.checkHealth();
  }

  async getRelationshipTests(): Promise<object> {
    return await this.databaseHealthService.testEntityRelationships();
  }
}