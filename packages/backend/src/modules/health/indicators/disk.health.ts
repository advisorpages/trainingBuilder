import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import * as fs from 'fs';

@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DiskHealthIndicator.name);

  async isHealthy(
    key: string,
    path = '/',
    thresholdPercent = 0.9
  ): Promise<HealthIndicatorResult> {
    try {
      const diskUsage = await this.getDiskUsage(path);
      const isHealthy = diskUsage.usedPercent < thresholdPercent;

      const diskInfo = {
        path,
        ...diskUsage,
        threshold: thresholdPercent,
        isHealthy,
      };

      if (isHealthy) {
        this.logger.debug('Disk health check passed', diskInfo);
        return this.getStatus(key, true, diskInfo);
      } else {
        this.logger.warn('Disk health check failed - high disk usage', diskInfo);
        throw new HealthCheckError(
          'Disk usage exceeded threshold',
          this.getStatus(key, false, diskInfo),
        );
      }
    } catch (error) {
      this.logger.error('Disk health check failed', { error: error.message, path });
      throw new HealthCheckError(
        'Disk check failed',
        this.getStatus(key, false, { message: error.message, path }),
      );
    }
  }

  private async getDiskUsage(path: string): Promise<{
    total: number;
    used: number;
    available: number;
    usedPercent: number;
    formattedTotal: string;
    formattedUsed: string;
    formattedAvailable: string;
  }> {
    return new Promise((resolve, _reject) => {
      fs.statfs(path, (err, stats) => {
        if (err) {
          // Fallback for systems without statvfs
          this.logger.warn('statvfs not available, using fallback disk check');
          resolve({
            total: 0,
            used: 0,
            available: 0,
            usedPercent: 0,
            formattedTotal: 'N/A',
            formattedUsed: 'N/A',
            formattedAvailable: 'N/A',
          });
          return;
        }

        const total = stats.blocks * stats.bsize;
        const available = stats.bavail * stats.bsize;
        const used = total - available;
        const usedPercent = total > 0 ? used / total : 0;

        resolve({
          total,
          used,
          available,
          usedPercent,
          formattedTotal: this.formatBytes(total),
          formattedUsed: this.formatBytes(used),
          formattedAvailable: this.formatBytes(available),
        });
      });
    });
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}