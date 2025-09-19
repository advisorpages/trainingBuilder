import { Controller, Get, Logger } from '@nestjs/common';
import { HealthService, SystemMetrics } from './health.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check() {
    const startTime = Date.now();

    try {
      const result = await this.healthService.check();
      const duration = Date.now() - startTime;

      this.logger.log(`Health check completed in ${duration}ms`, {
        duration,
        status: result.status,
        checks: Object.keys(result.info || {}),
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Health check failed in ${duration}ms`, {
        duration,
        error: error.message,
        stack: error.stack,
      });

      throw error;
    }
  }

  @Public()
  @Get('ready')
  async readiness() {
    const startTime = Date.now();

    try {
      const result = await this.healthService.readiness();
      const duration = Date.now() - startTime;

      this.logger.log(`Readiness check completed in ${duration}ms`, {
        duration,
        status: result.status,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Readiness check failed in ${duration}ms`, {
        duration,
        error: error.message,
      });

      throw error;
    }
  }

  @Public()
  @Get('live')
  async liveness() {
    const startTime = Date.now();

    try {
      const result = await this.healthService.liveness();
      const duration = Date.now() - startTime;

      this.logger.debug(`Liveness check completed in ${duration}ms`, {
        duration,
        status: result.status,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Liveness check failed in ${duration}ms`, {
        duration,
        error: error.message,
      });

      throw error;
    }
  }

  @Public()
  @Get('metrics')
  async metrics(): Promise<SystemMetrics> {
    return this.healthService.getMetrics();
  }
}