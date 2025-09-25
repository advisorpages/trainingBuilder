import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PublishingAutomationService } from '../services/publishing-automation.service';
import { WorkflowMonitoringService } from '../services/workflow-monitoring.service';

@Injectable()
export class ContentValidationScheduler {
  private readonly logger = new Logger(ContentValidationScheduler.name);

  constructor(
    private publishingAutomationService: PublishingAutomationService,
    private workflowMonitoringService: WorkflowMonitoringService,
  ) {}

  /**
   * Runs daily at 2 AM to perform content validation and publishing maintenance
   */
  @Cron('0 0 2 * * *')
  async handleContentValidation() {
    this.logger.log('Starting daily content validation and publishing maintenance...');

    try {
      await this.publishingAutomationService.performPublishingMaintenance();

      // Log workflow statistics
      await this.workflowMonitoringService.logWorkflowStatistics();

      this.logger.log('Daily content validation completed successfully');
    } catch (error) {
      this.logger.error('Error during daily content validation', error.stack);
    }
  }

  /**
   * Runs every 4 hours to check for sessions ready for auto-publication
   */
  @Cron('0 0 */4 * * *')
  async handleAutoPublication() {
    this.logger.log('Starting auto-publication check...');

    try {
      const readySessions = await this.publishingAutomationService.getSessionsReadyForPublication();

      for (const session of readySessions) {
        const success = await this.publishingAutomationService.attemptAutomaticPublication(session.id);
        if (success) {
          this.logger.log(`Auto-published session ${session.id}: "${session.title}"`);
        }
      }

      this.logger.log('Auto-publication check completed');
    } catch (error) {
      this.logger.error('Error during auto-publication check', error.stack);
    }
  }

  /**
   * Runs every 12 hours to perform workflow health checks
   */
  @Cron('0 0 */12 * * *')
  async handleWorkflowHealthCheck() {
    this.logger.log('Starting workflow health check...');

    try {
      const healthCheck = await this.workflowMonitoringService.performHealthCheck();

      if (healthCheck.status === 'critical') {
        this.logger.error(`CRITICAL: Publishing workflow health check failed: ${healthCheck.message}`);
        // In a production environment, this would trigger alerts (email, Slack, etc.)
      } else if (healthCheck.status === 'warning') {
        this.logger.warn(`WARNING: Publishing workflow has issues: ${healthCheck.message}`);
      } else {
        this.logger.log('Publishing workflow health check passed');
      }

      if (healthCheck.alerts.length > 0) {
        this.logger.warn(`Health check alerts: ${healthCheck.alerts.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Error during workflow health check', error.stack);
    }
  }
}