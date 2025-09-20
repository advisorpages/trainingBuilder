import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IncentivesService } from '../incentives.service';

@Injectable()
export class IncentiveExpirationScheduler {
  private readonly logger = new Logger(IncentiveExpirationScheduler.name);

  constructor(
    private incentivesService: IncentivesService,
  ) {}

  /**
   * Runs every 15 minutes to check for expired incentives
   */
  @Cron('0 */15 * * * *')
  async handleIncentiveExpiration() {
    this.logger.log('Starting automated incentive expiration check...');

    try {
      const result = await this.incentivesService.expireIncentives();

      if (result.expired > 0) {
        this.logger.log(`Automatically expired ${result.expired} incentive(s)`);
      }

      if (result.errors.length > 0) {
        this.logger.error(`Errors during expiration check: ${result.errors.join(', ')}`);
      }

      if (result.expired === 0 && result.errors.length === 0) {
        this.logger.log('No incentives needed expiration');
      }
    } catch (error) {
      this.logger.error('Failed to run incentive expiration check', error.stack);
    }
  }
}