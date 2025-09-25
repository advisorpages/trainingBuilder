import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { SessionStatusHistory } from '../../../entities/session-status-history.entity';

export interface WorkflowMetrics {
  totalSessions: number;
  sessionsByStatus: Record<SessionStatus, number>;
  automatedTransitions: number;
  failedAutomations: number;
  avgCompletionTime: number;
  publicationSuccessRate: number;
  schedulingConflicts: number;
  validationFailures: number;
}

export interface HealthCheck {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: WorkflowMetrics;
  alerts: string[];
}

@Injectable()
export class WorkflowMonitoringService {
  private readonly logger = new Logger(WorkflowMonitoringService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(SessionStatusHistory)
    private statusHistoryRepository: Repository<SessionStatusHistory>,
  ) {}

  /**
   * Performs comprehensive health check of the publishing workflow
   */
  async performHealthCheck(): Promise<HealthCheck> {
    try {
      const metrics = await this.collectWorkflowMetrics();
      const alerts = this.generateAlerts(metrics);
      const status = this.determineHealthStatus(metrics, alerts);

      const healthCheck: HealthCheck = {
        status,
        message: this.generateHealthMessage(status, metrics),
        metrics,
        alerts,
      };

      this.logger.log(`Workflow health check completed: ${status}`);

      if (alerts.length > 0) {
        this.logger.warn(`Health check alerts: ${alerts.join(', ')}`);
      }

      return healthCheck;
    } catch (error) {
      this.logger.error('Error during workflow health check', error.stack);
      return {
        status: 'critical',
        message: 'Health check failed due to system error',
        metrics: this.getDefaultMetrics(),
        alerts: [`Health check error: ${error.message}`],
      };
    }
  }

  /**
   * Collects comprehensive metrics about the publishing workflow
   */
  async collectWorkflowMetrics(): Promise<WorkflowMetrics> {
    const [
      totalSessions,
      sessionsByStatus,
      automatedTransitions,
      failedAutomations,
      avgCompletionTime,
      publicationSuccessRate,
      schedulingConflicts,
      validationFailures,
    ] = await Promise.all([
      this.getTotalSessionCount(),
      this.getSessionCountsByStatus(),
      this.getAutomatedTransitionCount(),
      this.getFailedAutomationCount(),
      this.getAverageCompletionTime(),
      this.getPublicationSuccessRate(),
      this.getSchedulingConflictCount(),
      this.getValidationFailureCount(),
    ]);

    return {
      totalSessions,
      sessionsByStatus,
      automatedTransitions,
      failedAutomations,
      avgCompletionTime,
      publicationSuccessRate,
      schedulingConflicts,
      validationFailures,
    };
  }

  /**
   * Gets total count of active sessions
   */
  private async getTotalSessionCount(): Promise<number> {
    return await this.sessionRepository.count({
      where: { isActive: true }
    });
  }

  /**
   * Gets session counts grouped by status
   */
  private async getSessionCountsByStatus(): Promise<Record<SessionStatus, number>> {
    const results = await this.sessionRepository
      .createQueryBuilder('session')
      .select('session.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('session.isActive = :isActive', { isActive: true })
      .groupBy('session.status')
      .getRawMany();

    const counts: Record<SessionStatus, number> = {
      [SessionStatus.DRAFT]: 0,
      [SessionStatus.PUBLISHED]: 0,
      [SessionStatus.COMPLETED]: 0,
      [SessionStatus.CANCELLED]: 0,
    };

    results.forEach(result => {
      counts[result.status as SessionStatus] = parseInt(result.count, 10);
    });

    return counts;
  }

  /**
   * Gets count of automated status transitions in the last 24 hours
   */
  private async getAutomatedTransitionCount(): Promise<number> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.statusHistoryRepository.count({
      where: {
        automatedChange: true,
        createdAt: new Date(yesterday.getTime()),
      },
    });
  }

  /**
   * Gets count of failed automation attempts (estimated from validation errors)
   */
  private async getFailedAutomationCount(): Promise<number> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return await this.sessionRepository.count({
      where: {
        contentValidationStatus: 'invalid',
        lastValidationCheck: new Date(yesterday.getTime()),
      },
    });
  }

  /**
   * Calculates average time from creation to completion for sessions
   */
  private async getAverageCompletionTime(): Promise<number> {
    const completedSessions = await this.sessionRepository.find({
      where: {
        status: SessionStatus.COMPLETED,
        isActive: true,
      },
      select: ['id', 'createdAt', 'statusChangedAt'],
      take: 100, // Last 100 completed sessions
      order: { createdAt: 'DESC' },
    });

    if (completedSessions.length === 0) {
      return 0;
    }

    const totalTime = completedSessions.reduce((sum, session) => {
      if (session.statusChangedAt) {
        return sum + (session.statusChangedAt.getTime() - session.createdAt.getTime());
      }
      return sum;
    }, 0);

    // Return average time in hours
    return Math.round((totalTime / completedSessions.length) / (1000 * 60 * 60));
  }

  /**
   * Calculates publication success rate (published vs. total eligible)
   */
  private async getPublicationSuccessRate(): Promise<number> {
    const totalEligible = await this.sessionRepository.count({
      where: {
        isActive: true,
        status: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED] as any,
      },
    });

    const published = await this.sessionRepository.count({
      where: {
        status: [SessionStatus.PUBLISHED, SessionStatus.COMPLETED] as any,
        isActive: true,
      },
    });

    return totalEligible > 0 ? Math.round((published / totalEligible) * 100) : 100;
  }

  /**
   * Gets count of sessions with scheduling conflicts in validation errors
   */
  private async getSchedulingConflictCount(): Promise<number> {
    // Use query builder for JSON array contains operation
    const result = await this.sessionRepository
      .createQueryBuilder('session')
      .where('session.isActive = :isActive', { isActive: true })
      .andWhere('session.contentValidationErrors::text LIKE :conflict', { conflict: '%conflict%' })
      .getCount();

    return result;
  }

  /**
   * Gets count of sessions with validation failures
   */
  private async getValidationFailureCount(): Promise<number> {
    return await this.sessionRepository.count({
      where: {
        contentValidationStatus: 'invalid',
        isActive: true,
      },
    });
  }

  /**
   * Generates alerts based on metrics
   */
  private generateAlerts(metrics: WorkflowMetrics): string[] {
    const alerts: string[] = [];

    // Check for high failure rates
    if (metrics.publicationSuccessRate < 80) {
      alerts.push(`Low publication success rate: ${metrics.publicationSuccessRate}%`);
    }

    // Check for excessive failed automations
    if (metrics.failedAutomations > 10) {
      alerts.push(`High number of failed automations: ${metrics.failedAutomations}`);
    }

    // Check for scheduling conflicts
    if (metrics.schedulingConflicts > 5) {
      alerts.push(`Multiple scheduling conflicts detected: ${metrics.schedulingConflicts}`);
    }

    // Check for validation failures
    if (metrics.validationFailures > 20) {
      alerts.push(`High number of validation failures: ${metrics.validationFailures}`);
    }

    // Check for stuck drafts
    const totalNonDrafts = metrics.sessionsByStatus.published +
                          metrics.sessionsByStatus.completed +
                          metrics.sessionsByStatus.cancelled;
    const draftRatio = totalNonDrafts > 0 ?
      metrics.sessionsByStatus.draft / totalNonDrafts : 0;

    if (draftRatio > 2) {
      alerts.push(`High ratio of draft sessions may indicate workflow bottleneck`);
    }

    // Check for long completion times
    if (metrics.avgCompletionTime > 168) { // More than a week
      alerts.push(`Average completion time is high: ${metrics.avgCompletionTime} hours`);
    }

    return alerts;
  }

  /**
   * Determines overall health status
   */
  private determineHealthStatus(metrics: WorkflowMetrics, alerts: string[]): 'healthy' | 'warning' | 'critical' {
    if (alerts.length === 0) {
      return 'healthy';
    }

    // Critical conditions
    if (metrics.publicationSuccessRate < 50 || metrics.failedAutomations > 50) {
      return 'critical';
    }

    // Warning conditions
    if (alerts.length > 2 || metrics.publicationSuccessRate < 80) {
      return 'warning';
    }

    return 'warning';
  }

  /**
   * Generates human-readable health message
   */
  private generateHealthMessage(status: 'healthy' | 'warning' | 'critical', metrics: WorkflowMetrics): string {
    switch (status) {
      case 'healthy':
        return `Publishing workflow is operating normally. ${metrics.totalSessions} total sessions, ${metrics.publicationSuccessRate}% success rate.`;
      case 'warning':
        return `Publishing workflow has some issues that need attention. Success rate: ${metrics.publicationSuccessRate}%.`;
      case 'critical':
        return `Publishing workflow has critical issues requiring immediate attention. Success rate: ${metrics.publicationSuccessRate}%.`;
      default:
        return 'Unknown health status';
    }
  }

  /**
   * Returns default metrics for error cases
   */
  private getDefaultMetrics(): WorkflowMetrics {
    return {
      totalSessions: 0,
      sessionsByStatus: {
        [SessionStatus.DRAFT]: 0,
        [SessionStatus.PUBLISHED]: 0,
        [SessionStatus.COMPLETED]: 0,
        [SessionStatus.CANCELLED]: 0,
      },
      automatedTransitions: 0,
      failedAutomations: 0,
      avgCompletionTime: 0,
      publicationSuccessRate: 0,
      schedulingConflicts: 0,
      validationFailures: 0,
    };
  }

  /**
   * Logs workflow statistics for monitoring
   */
  async logWorkflowStatistics(): Promise<void> {
    try {
      const metrics = await this.collectWorkflowMetrics();

      this.logger.log('=== Publishing Workflow Statistics ===');
      this.logger.log(`Total Sessions: ${metrics.totalSessions}`);
      this.logger.log(`Draft: ${metrics.sessionsByStatus.draft}, Published: ${metrics.sessionsByStatus.published}, Completed: ${metrics.sessionsByStatus.completed}, Cancelled: ${metrics.sessionsByStatus.cancelled}`);
      this.logger.log(`Publication Success Rate: ${metrics.publicationSuccessRate}%`);
      this.logger.log(`Automated Transitions (24h): ${metrics.automatedTransitions}`);
      this.logger.log(`Failed Automations (24h): ${metrics.failedAutomations}`);
      this.logger.log(`Average Completion Time: ${metrics.avgCompletionTime} hours`);
      this.logger.log(`Validation Failures: ${metrics.validationFailures}`);
      this.logger.log('=====================================');
    } catch (error) {
      this.logger.error('Error logging workflow statistics', error.stack);
    }
  }
}