import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session, SessionStatus } from '../../../entities/session.entity';

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ContentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number; // 0-100 completeness score
}

@Injectable()
export class ContentValidationService {
  private readonly logger = new Logger(ContentValidationService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  /**
   * Validates session content for publication readiness
   */
  async validateSessionContent(sessionId: string): Promise<ContentValidationResult> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['location', 'trainer', 'author'],
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Required field validation
    this.validateRequiredFields(session, errors);

    // Business rule validation
    this.validateBusinessRules(session, errors, warnings);

    // Content completeness validation
    this.validateContentCompleteness(session, warnings);

    // Scheduling validation
    this.validateScheduling(session, errors, warnings);

    const isValid = errors.length === 0;
    const score = this.calculateCompletenessScore(session, errors, warnings);

    // Update session validation status
    await this.updateSessionValidationStatus(session, isValid, errors);

    return {
      isValid,
      errors,
      warnings,
      score,
    };
  }

  /**
   * Validates required fields for publication
   */
  private validateRequiredFields(session: Session, errors: ValidationError[]): void {
    if (!session.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Session title is required',
        severity: 'error',
      });
    }

    if (!session.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Session description is required',
        severity: 'error',
      });
    }

    if (!session.startTime) {
      errors.push({
        field: 'startTime',
        message: 'Session start time is required',
        severity: 'error',
      });
    }

    if (!session.endTime) {
      errors.push({
        field: 'endTime',
        message: 'Session end time is required',
        severity: 'error',
      });
    }

    if (!session.locationId) {
      errors.push({
        field: 'location',
        message: 'Session location is required',
        severity: 'error',
      });
    }

    if (!session.trainerId) {
      errors.push({
        field: 'trainer',
        message: 'Session trainer is required',
        severity: 'error',
      });
    }
  }

  /**
   * Validates business rules
   */
  private validateBusinessRules(
    session: Session,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    const now = new Date();

    // Session must be at least 24 hours in future when published
    if (session.startTime && session.status === SessionStatus.PUBLISHED) {
      const hoursUntilStart = (session.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilStart < 24) {
        errors.push({
          field: 'startTime',
          message: 'Published sessions must be at least 24 hours in the future',
          severity: 'error',
        });
      }
    }

    // End time must be after start time
    if (session.startTime && session.endTime) {
      if (session.endTime <= session.startTime) {
        errors.push({
          field: 'endTime',
          message: 'Session end time must be after start time',
          severity: 'error',
        });
      }
    }

    // Session duration validation (e.g., not too long or too short)
    if (session.startTime && session.endTime) {
      const durationHours = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60);
      if (durationHours > 8) {
        warnings.push({
          field: 'duration',
          message: 'Session duration exceeds 8 hours',
          severity: 'warning',
        });
      }
      if (durationHours < 0.5) {
        warnings.push({
          field: 'duration',
          message: 'Session duration is less than 30 minutes',
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Validates promotional content completeness
   */
  private validateContentCompleteness(session: Session, warnings: ValidationError[]): void {
    if (!session.promotionalHeadline?.trim()) {
      warnings.push({
        field: 'promotionalHeadline',
        message: 'Promotional headline would improve marketing effectiveness',
        severity: 'warning',
      });
    }

    if (!session.promotionalSummary?.trim()) {
      warnings.push({
        field: 'promotionalSummary',
        message: 'Promotional summary would improve marketing effectiveness',
        severity: 'warning',
      });
    }

    if (!session.keyBenefits?.trim()) {
      warnings.push({
        field: 'keyBenefits',
        message: 'Key benefits would improve marketing effectiveness',
        severity: 'warning',
      });
    }

    if (!session.callToAction?.trim()) {
      warnings.push({
        field: 'callToAction',
        message: 'Call to action would improve conversion rates',
        severity: 'warning',
      });
    }
  }

  /**
   * Validates scheduling constraints
   */
  private validateScheduling(
    session: Session,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): void {
    // TODO: Add session conflict detection with other published sessions
    // This would require querying for overlapping sessions at the same location

    // Validate reasonable session times (e.g., not at 3 AM)
    if (session.startTime) {
      const hour = session.startTime.getHours();
      if (hour < 6 || hour > 22) {
        warnings.push({
          field: 'startTime',
          message: 'Session scheduled outside typical business hours',
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Calculates content completeness score (0-100)
   */
  private calculateCompletenessScore(
    session: Session,
    errors: ValidationError[],
    warnings: ValidationError[]
  ): number {
    let score = 100;

    // Deduct points for errors (critical issues)
    score -= errors.length * 20;

    // Deduct points for warnings (minor issues)
    score -= warnings.length * 5;

    // Bonus points for optional content
    if (session.promotionalHeadline) score += 5;
    if (session.promotionalSummary) score += 5;
    if (session.keyBenefits) score += 5;
    if (session.callToAction) score += 5;
    if (session.socialMediaContent) score += 3;
    if (session.emailMarketingContent) score += 3;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Updates session validation status in database
   */
  private async updateSessionValidationStatus(
    session: Session,
    isValid: boolean,
    errors: ValidationError[]
  ): Promise<void> {
    try {
      await this.sessionRepository.update(session.id, {
        contentValidationStatus: isValid ? 'valid' : 'invalid',
        contentValidationErrors: errors.map(e => e.message),
        publicationRequirementsMet: isValid,
        lastValidationCheck: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to update validation status for session ${session.id}`, error.stack);
    }
  }

  /**
   * Checks if session can be published based on validation rules
   */
  async canSessionBePublished(sessionId: string): Promise<boolean> {
    const validation = await this.validateSessionContent(sessionId);
    return validation.isValid;
  }
}