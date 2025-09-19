import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(MemoryHealthIndicator.name);

  async isHealthy(key: string, thresholdBytes: number = 1.5 * 1024 * 1024 * 1024): Promise<HealthIndicatorResult> {
    const memoryUsage = process.memoryUsage();
    const isHealthy = memoryUsage.heapUsed < thresholdBytes;

    const memoryInfo = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      threshold: thresholdBytes,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    if (isHealthy) {
      this.logger.debug('Memory health check passed', memoryInfo);
      return this.getStatus(key, true, memoryInfo);
    } else {
      this.logger.warn('Memory health check failed - high memory usage', memoryInfo);
      throw new HealthCheckError(
        'Memory usage exceeded threshold',
        this.getStatus(key, false, memoryInfo),
      );
    }
  }

  getMemoryStats() {
    const memoryUsage = process.memoryUsage();
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      formattedHeapUsed: this.formatBytes(memoryUsage.heapUsed),
      formattedHeapTotal: this.formatBytes(memoryUsage.heapTotal),
      formattedRss: this.formatBytes(memoryUsage.rss),
    };
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}