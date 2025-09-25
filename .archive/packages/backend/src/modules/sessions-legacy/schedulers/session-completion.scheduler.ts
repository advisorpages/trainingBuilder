import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionStatusService } from '../services/session-status.service';
import { SessionStatus } from '../../../entities/session.entity';

@Injectable()
export class SessionCompletionScheduler {
  private readonly logger = new Logger(SessionCompletionScheduler.name);

  constructor(private sessionStatusService: SessionStatusService) {}

  /**
   * Runs every 15 minutes to check for sessions that should be automatically completed
   */
  @Cron('0 */15 * * * *')
  async handleSessionCompletion() {
    this.logger.log('Starting automated session completion check...');

    try {
      // Get sessions that are published and past their end time
      const sessionsToComplete = await this.sessionStatusService.getSessionsForAutomaticCompletion();

      this.logger.log(`Found ${sessionsToComplete.length} sessions to automatically complete`);

      // Process each session
      for (const session of sessionsToComplete) {
        try {
          await this.sessionStatusService.updateSessionStatus(
            session.id,
            SessionStatus.COMPLETED,
            undefined, // No user ID for automated changes
            true, // isAutomated = true
            'Automatically completed after session end time'
          );

          this.logger.log(`Successfully completed session ${session.id}: "${session.title}"`);
        } catch (error) {
          this.logger.error(
            `Failed to complete session ${session.id}: ${error.message}`,
            error.stack
          );
        }
      }

      this.logger.log('Automated session completion check completed');
    } catch (error) {
      this.logger.error('Error during automated session completion check', error.stack);
    }
  }
}