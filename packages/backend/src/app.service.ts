import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0-alpha',
    };
  }

  getAppInfo() {
    return {
      name: 'Leadership Training App API',
      version: '2.0.0-alpha',
      description: 'Backend reboot centered on the AI Session Builder',
      endpoints: {
        health: '/api/health',
        sessions: '/api/sessions',
        topics: '/api/topics',
        incentives: '/api/incentives',
        landingPages: '/api/landing-pages',
        trainers: '/api/trainers',
        ai: '/api/ai',
      },
    };
  }

  getDatabaseStatus() {
    return {
      status: 'pending',
      message: 'Database migrations will be reintroduced in Phase 2.',
    };
  }

  getRelationshipTests() {
    return {
      status: 'pending',
      message: 'Relationship tests will be rebuilt after new schema is applied.',
    };
  }
}
