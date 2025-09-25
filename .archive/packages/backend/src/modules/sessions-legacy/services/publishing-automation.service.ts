import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { SessionStatusService } from './session-status.service';
import { ContentValidationService } from './content-validation.service';

export interface PublishingRuleResult {
  canPublish: boolean;
  reason?: string;
  conflictingSessions?: Session[];
}

@Injectable()
export class PublishingAutomationService {
  private readonly logger = new Logger(PublishingAutomationService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private sessionStatusService: SessionStatusService,
    private contentValidationService: ContentValidationService,
  ) {}

  /**
   * Comprehensive publishing rule validation
   */
  async validatePublishingRules(sessionId: string): Promise<PublishingRuleResult> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['location', 'trainer'],
    });

    if (!session) {
      return {
        canPublish: false,
        reason: 'Session not found',
      };
    }

    // Check content validation
    const contentValidation = await this.contentValidationService.validateSessionContent(sessionId);
    if (!contentValidation.isValid) {
      return {
        canPublish: false,
        reason: `Content validation failed: ${contentValidation.errors.map(e => e.message).join(', ')}`,
      };
    }

    // Check minimum lead time (24 hours)
    const leadTimeResult = this.validateLeadTime(session);
    if (!leadTimeResult.canPublish) {
      return leadTimeResult;
    }

    // Check business hours
    const businessHoursResult = this.validateBusinessHours(session);
    if (!businessHoursResult.canPublish) {
      return businessHoursResult;
    }

    // Check for scheduling conflicts
    const conflictResult = await this.validateSchedulingConflicts(session);
    if (!conflictResult.canPublish) {
      return conflictResult;
    }

    return { canPublish: true };
  }

  /**
   * Validates minimum lead time requirement with timezone support
   */
  private validateLeadTime(session: Session): PublishingRuleResult {
    if (!session.startTime) {
      return {
        canPublish: false,
        reason: 'Session start time is not set',
      };
    }

    // Use UTC for consistent comparison across timezones
    const now = new Date();
    const sessionStart = new Date(session.startTime);
    const hoursUntilStart = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Minimum lead time of 24 hours
    if (hoursUntilStart < 24) {
      return {
        canPublish: false,
        reason: `Session must be scheduled at least 24 hours in advance (currently ${Math.round(hoursUntilStart * 10) / 10} hours)`,
      };
    }

    // Maximum advance scheduling (180 days)
    if (hoursUntilStart > 180 * 24) {
      return {
        canPublish: false,
        reason: 'Session cannot be scheduled more than 180 days in advance',
      };
    }

    return { canPublish: true };
  }

  /**
   * Validates business hours and reasonable scheduling times
   */
  private validateBusinessHours(session: Session): PublishingRuleResult {
    if (!session.startTime || !session.endTime) {
      return { canPublish: true }; // Skip if times not set
    }

    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date(session.endTime);

    // Check if session is during reasonable business hours (6 AM to 10 PM)
    const startHour = sessionStart.getHours();
    const endHour = sessionEnd.getHours();

    if (startHour < 6 || startHour > 22) {
      return {
        canPublish: false,
        reason: 'Sessions should start between 6:00 AM and 10:00 PM',
      };
    }

    if (endHour > 23 || (endHour === 0 && sessionEnd.getMinutes() > 0)) {
      return {
        canPublish: false,
        reason: 'Sessions should end before 11:00 PM',
      };
    }

    // Check if session spans multiple days
    if (sessionStart.toDateString() !== sessionEnd.toDateString()) {
      return {
        canPublish: false,
        reason: 'Sessions cannot span multiple days',
      };
    }

    return { canPublish: true };
  }

  /**
   * Validates scheduling conflicts with other published sessions
   */
  private async validateSchedulingConflicts(session: Session): Promise<PublishingRuleResult> {
    if (!session.startTime || !session.endTime || !session.locationId) {
      return { canPublish: true }; // Skip conflict check if required fields missing
    }

    // Convert to UTC for consistent comparison
    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date(session.endTime);

    // Find all published sessions at the same location
    const publishedSessions = await this.sessionRepository.find({
      where: {
        locationId: session.locationId,
        status: SessionStatus.PUBLISHED,
        isActive: true,
      },
      select: ['id', 'title', 'startTime', 'endTime'],
    });

    // Filter out the current session and check for time overlaps
    const conflictingSessions = publishedSessions
      .filter(s => s.id !== session.id)
      .filter(s => {
        const existingStart = new Date(s.startTime);
        const existingEnd = new Date(s.endTime);

        // Check for any time overlap using proper interval logic
        return (
          (sessionStart < existingEnd && sessionEnd > existingStart) ||
          (existingStart < sessionEnd && existingEnd > sessionStart)
        );
      });

    if (conflictingSessions.length > 0) {
      return {
        canPublish: false,
        reason: `Scheduling conflict with ${conflictingSessions.length} existing session(s) at the same location: ${conflictingSessions.map(s => s.title).join(', ')}`,
        conflictingSessions,
      };
    }

    // Check for minimum buffer time between sessions (30 minutes)
    const bufferMinutes = 30;
    const bufferedSessions = publishedSessions
      .filter(s => s.id !== session.id)
      .filter(s => {
        const existingStart = new Date(s.startTime);
        const existingEnd = new Date(s.endTime);

        // Check if sessions are too close together
        const timeBetweenSessions = Math.min(
          Math.abs(sessionStart.getTime() - existingEnd.getTime()),
          Math.abs(existingStart.getTime() - sessionEnd.getTime())
        );

        return timeBetweenSessions < bufferMinutes * 60 * 1000; // Convert to milliseconds
      });

    if (bufferedSessions.length > 0) {
      return {
        canPublish: false,
        reason: `Sessions must have at least ${bufferMinutes} minutes between them at the same location`,
        conflictingSessions: bufferedSessions,
      };
    }

    return { canPublish: true };
  }

  /**
   * Attempts to automatically publish a session if all rules are met
   */
  async attemptAutomaticPublication(sessionId: string, triggeredBy?: string): Promise<boolean> {
    try {
      const validation = await this.validatePublishingRules(sessionId);

      if (!validation.canPublish) {
        this.logger.warn(
          `Automatic publication failed for session ${sessionId}: ${validation.reason}`
        );
        return false;
      }

      await this.sessionStatusService.updateSessionStatus(
        sessionId,
        SessionStatus.PUBLISHED,
        triggeredBy,
        true, // automated
        'Automatically published after meeting all publishing requirements'
      );

      this.logger.log(`Successfully auto-published session ${sessionId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error during automatic publication of session ${sessionId}`,
        error.stack
      );
      return false;
    }
  }

  /**
   * Bulk validation for multiple sessions (performance optimized)
   */
  async validateMultipleSessions(sessionIds: string[]): Promise<Map<string, PublishingRuleResult>> {
    const results = new Map<string, PublishingRuleResult>();

    if (sessionIds.length === 0) {
      return results;
    }

    try {
      // Batch load sessions with only necessary relations
      const sessions = await this.sessionRepository.find({
        where: { id: sessionIds as any }, // TypeORM typing issue workaround
        relations: ['location', 'trainer'],
        select: [
          'id', 'title', 'startTime', 'endTime', 'status', 'locationId', 'trainerId',
          'contentValidationStatus', 'publicationRequirementsMet', 'lastValidationCheck'
        ],
      });

      // Batch load all published sessions for conflict detection (single query)
      const allPublishedSessions = await this.sessionRepository.find({
        where: {
          status: SessionStatus.PUBLISHED,
          isActive: true,
        },
        select: ['id', 'title', 'startTime', 'endTime', 'locationId'],
      });

      // Batch load content validation for all sessions
      const contentValidationPromises = sessions.map(session =>
        this.contentValidationService.validateSessionContent(session.id)
          .catch(error => ({
            isValid: false,
            errors: [{ field: 'validation', message: error.message, severity: 'error' as const }],
            warnings: [],
            score: 0,
          }))
      );

      const contentValidations = await Promise.all(contentValidationPromises);

      // Process each session with pre-loaded data
      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const contentValidation = contentValidations[i];

        try {
          // Skip content validation API call since we already have the result
          if (!contentValidation.isValid) {
            results.set(session.id, {
              canPublish: false,
              reason: `Content validation failed: ${contentValidation.errors.map(e => e.message).join(', ')}`,
            });
            continue;
          }

          // Perform other validations
          const leadTimeResult = this.validateLeadTime(session);
          if (!leadTimeResult.canPublish) {
            results.set(session.id, leadTimeResult);
            continue;
          }

          const businessHoursResult = this.validateBusinessHours(session);
          if (!businessHoursResult.canPublish) {
            results.set(session.id, businessHoursResult);
            continue;
          }

          // Use pre-loaded published sessions for conflict detection
          const conflictResult = this.validateSchedulingConflictsWithPreloadedData(session, allPublishedSessions);
          if (!conflictResult.canPublish) {
            results.set(session.id, conflictResult);
            continue;
          }

          results.set(session.id, { canPublish: true });
        } catch (error) {
          results.set(session.id, {
            canPublish: false,
            reason: `Validation error: ${error.message}`,
          });
        }
      }
    } catch (error) {
      this.logger.error('Error during bulk session validation', error.stack);
      // Return error result for all sessions
      for (const sessionId of sessionIds) {
        results.set(sessionId, {
          canPublish: false,
          reason: `Bulk validation error: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Optimized conflict detection using pre-loaded data
   */
  private validateSchedulingConflictsWithPreloadedData(
    session: Session,
    allPublishedSessions: Session[]
  ): PublishingRuleResult {
    if (!session.startTime || !session.endTime || !session.locationId) {
      return { canPublish: true };
    }

    const sessionStart = new Date(session.startTime);
    const sessionEnd = new Date(session.endTime);

    // Filter sessions at the same location
    const sessionsAtLocation = allPublishedSessions.filter(s =>
      s.locationId === session.locationId && s.id !== session.id
    );

    // Check for time overlaps
    const conflictingSessions = sessionsAtLocation.filter(s => {
      const existingStart = new Date(s.startTime);
      const existingEnd = new Date(s.endTime);

      return (
        (sessionStart < existingEnd && sessionEnd > existingStart) ||
        (existingStart < sessionEnd && existingEnd > sessionStart)
      );
    });

    if (conflictingSessions.length > 0) {
      return {
        canPublish: false,
        reason: `Scheduling conflict with ${conflictingSessions.length} existing session(s) at the same location: ${conflictingSessions.map(s => s.title).join(', ')}`,
        conflictingSessions,
      };
    }

    // Check for minimum buffer time (30 minutes)
    const bufferMinutes = 30;
    const bufferedSessions = sessionsAtLocation.filter(s => {
      const existingStart = new Date(s.startTime);
      const existingEnd = new Date(s.endTime);

      const timeBetweenSessions = Math.min(
        Math.abs(sessionStart.getTime() - existingEnd.getTime()),
        Math.abs(existingStart.getTime() - sessionEnd.getTime())
      );

      return timeBetweenSessions < bufferMinutes * 60 * 1000;
    });

    if (bufferedSessions.length > 0) {
      return {
        canPublish: false,
        reason: `Sessions must have at least ${bufferMinutes} minutes between them at the same location`,
        conflictingSessions: bufferedSessions,
      };
    }

    return { canPublish: true };
  }

  /**
   * Gets sessions that are ready for automatic publication
   */
  async getSessionsReadyForPublication(): Promise<Session[]> {
    // Get draft sessions that haven't been checked recently
    const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    return await this.sessionRepository.find({
      where: [
        {
          status: SessionStatus.DRAFT,
          isActive: true,
          lastValidationCheck: null,
        },
        {
          status: SessionStatus.DRAFT,
          isActive: true,
          lastValidationCheck: cutoffTime,
        },
      ],
      relations: ['location', 'trainer'],
    });
  }

  /**
   * Performs maintenance tasks for publishing system
   */
  async performPublishingMaintenance(): Promise<void> {
    this.logger.log('Starting publishing system maintenance...');

    try {
      // Check sessions ready for publication
      const readySessions = await this.getSessionsReadyForPublication();
      this.logger.log(`Found ${readySessions.length} sessions to check for auto-publication`);

      for (const session of readySessions) {
        await this.contentValidationService.validateSessionContent(session.id);
      }

      // Clean up old validation data (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await this.sessionRepository.update(
        {
          lastValidationCheck: thirtyDaysAgo,
          status: SessionStatus.CANCELLED,
        },
        {
          contentValidationErrors: null,
          lastValidationCheck: null,
        }
      );

      this.logger.log('Publishing system maintenance completed');
    } catch (error) {
      this.logger.error('Error during publishing system maintenance', error.stack);
    }
  }
}