import { Injectable, Logger } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';

export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    connections: number;
    responseTime: number;
  };
  timestamp: string;
  version: string;
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private customDb: DatabaseHealthIndicator,
  ) {}

  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database connectivity
      () => this.db.pingCheck('database'),
      () => this.customDb.isHealthy('database_custom'),

      // Memory usage (fail if over 1.5GB)
      () => this.memory.checkHeap('memory_heap', 1.5 * 1024 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1.5 * 1024 * 1024 * 1024),

      // Disk usage (fail if over 90%)
      () => this.disk.checkStorage('storage', {
        path: '/',
        thresholdPercent: 0.9,
      }),
    ]);
  }

  @HealthCheck()
  async readiness(): Promise<HealthCheckResult> {
    // Readiness checks - is the app ready to serve traffic?
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.customDb.isHealthy('database_ready'),
    ]);
  }

  @HealthCheck()
  async liveness(): Promise<HealthCheckResult> {
    // Liveness checks - is the app still alive?
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 2 * 1024 * 1024 * 1024), // 2GB limit for liveness
    ]);
  }

  async getMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    try {
      const dbResponseTime = await this.customDb.getResponseTime();
      const dbConnections = await this.customDb.getConnectionCount();

      return {
        uptime: Math.floor(uptime / 1000), // in seconds
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        cpu: {
          usage: await this.getCpuUsage(),
        },
        database: {
          connections: dbConnections,
          responseTime: dbResponseTime,
        },
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      this.logger.error('Failed to get metrics', { error: error.message });
      throw error;
    }
  }

  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const totalUsage = currentUsage.user + currentUsage.system;
        const percentage = Math.round((totalUsage / 1000000) * 100); // Convert to percentage
        resolve(Math.min(percentage, 100)); // Cap at 100%
      }, 100);
    });
  }
}