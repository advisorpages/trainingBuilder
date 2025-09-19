import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      // Test database connectivity
      await this.dataSource.query('SELECT 1');

      const responseTime = Date.now() - startTime;
      const connectionCount = this.getConnectionCount();

      const result = this.getStatus(key, true, {
        responseTime,
        connections: connectionCount,
        database: this.dataSource.options.database,
      });

      this.logger.debug(`Database health check passed in ${responseTime}ms`, {
        responseTime,
        connections: connectionCount,
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error(`Database health check failed in ${responseTime}ms`, {
        error: error.message,
        responseTime,
      });

      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: error.message,
          responseTime,
        }),
      );
    }
  }

  async getResponseTime(): Promise<number> {
    const startTime = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return Date.now() - startTime;
    } catch (error) {
      this.logger.error('Failed to get database response time', { error: error.message });
      return -1;
    }
  }

  async getConnectionCount(): Promise<number> {
    try {
      // For PostgreSQL
      if (this.dataSource.options.type === 'postgres') {
        const result = await this.dataSource.query(
          `SELECT count(*) as active_connections
           FROM pg_stat_activity
           WHERE state = 'active' AND datname = $1`,
          [this.dataSource.options.database]
        );
        return parseInt(result[0]?.active_connections || '0', 10);
      }

      // For other databases, return pool info if available
      return this.dataSource.isInitialized ? 1 : 0;
    } catch (error) {
      this.logger.warn('Failed to get connection count', { error: error.message });
      return 0;
    }
  }

  async getConnectionPool(): Promise<{ active: number; idle: number; total: number }> {
    try {
      // This would need to be implemented based on the connection pool being used
      return {
        active: 1,
        idle: 0,
        total: 1,
      };
    } catch (error) {
      this.logger.warn('Failed to get connection pool info', { error: error.message });
      return {
        active: 0,
        idle: 0,
        total: 0,
      };
    }
  }
}