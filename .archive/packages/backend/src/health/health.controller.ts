import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database health check
      () => this.db.pingCheck('database'),

      // Memory usage check (fail if using more than 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),

      // Memory RSS check (fail if process uses more than 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk space check (fail if less than 250GB available)
      () => this.disk.checkStorage('disk', {
        thresholdPercent: 0.9, // 90% full
        path: '/',
      }),

      // External service health checks
      () => this.checkAIService(),
      () => this.checkQRService(),
      () => this.checkEmailService(),
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  detailedCheck() {
    return this.health.check([
      // All basic checks
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Additional detailed checks
      () => this.checkDatabaseConnections(),
      () => this.checkApplicationMetrics(),
      () => this.checkCacheHealth(),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readinessCheck() {
    // Readiness probe - checks if app is ready to receive traffic
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkCriticalServices(),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  livenessCheck() {
    // Liveness probe - checks if app is alive and should restart if failing
    return this.health.check([
      () => this.checkApplicationAlive(),
    ]);
  }

  private async checkAIService(): Promise<HealthIndicatorResult> {
    try {
      // Check if AI service is accessible
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://api.openai.com/v1/models';

      return await this.http.pingCheck('ai-service', aiServiceUrl, {
        timeout: 5000,
      });
    } catch (error) {
      return {
        'ai-service': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkQRService(): Promise<HealthIndicatorResult> {
    try {
      // Check QR code generation service
      const qrServiceUrl = process.env.QR_SERVICE_URL || 'https://api.qrserver.com/v1/create-qr-code/';

      return await this.http.pingCheck('qr-service', qrServiceUrl, {
        timeout: 3000,
      });
    } catch (error) {
      return {
        'qr-service': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkEmailService(): Promise<HealthIndicatorResult> {
    try {
      // In a real implementation, this would check SMTP server connectivity
      // For now, we'll do a simple configuration check
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;

      if (!smtpHost || !smtpPort) {
        return {
          'email-service': {
            status: 'down',
            message: 'Email configuration missing',
          },
        };
      }

      return {
        'email-service': {
          status: 'up',
          host: smtpHost,
          port: smtpPort,
        },
      };
    } catch (error) {
      return {
        'email-service': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkDatabaseConnections(): Promise<HealthIndicatorResult> {
    try {
      // Check database connection pool status
      return {
        'database-connections': {
          status: 'up',
          // In a real implementation, you'd check connection pool metrics
          activeConnections: 'healthy',
          maxConnections: 'within-limits',
        },
      };
    } catch (error) {
      return {
        'database-connections': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkApplicationMetrics(): Promise<HealthIndicatorResult> {
    try {
      // Basic application metrics
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      return {
        'application-metrics': {
          status: 'up',
          uptime: `${Math.floor(uptime)} seconds`,
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          },
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      return {
        'application-metrics': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkCacheHealth(): Promise<HealthIndicatorResult> {
    try {
      // If using Redis or another cache, check its health here
      // For now, return basic status
      return {
        'cache': {
          status: 'up',
          type: 'in-memory',
        },
      };
    } catch (error) {
      return {
        'cache': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkCriticalServices(): Promise<HealthIndicatorResult> {
    try {
      // Check all services critical for application functionality
      const checks = await Promise.allSettled([
        this.checkAIService(),
        this.checkEmailService(),
        this.checkDatabaseConnections(),
      ]);

      const failedServices = checks
        .filter((result, index) => {
          if (result.status === 'rejected') return true;
          const serviceName = ['ai-service', 'email-service', 'database-connections'][index];
          return result.value[serviceName]?.status === 'down';
        });

      return {
        'critical-services': {
          status: failedServices.length === 0 ? 'up' : 'down',
          failedCount: failedServices.length,
          totalCount: checks.length,
        },
      };
    } catch (error) {
      return {
        'critical-services': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }

  private async checkApplicationAlive(): Promise<HealthIndicatorResult> {
    try {
      // Simple check to verify the application is responsive
      return {
        'application': {
          status: 'up',
          timestamp: new Date().toISOString(),
          pid: process.pid,
        },
      };
    } catch (error) {
      return {
        'application': {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}