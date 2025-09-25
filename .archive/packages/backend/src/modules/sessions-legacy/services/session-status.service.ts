import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Session, SessionStatus } from '../../../entities/session.entity';
import { SessionStatusHistory } from '../../../entities/session-status-history.entity';
import { QrCodeService } from '../../../services/qr-code.service';

@Injectable()
export class SessionStatusService {
  private readonly logger = new Logger(SessionStatusService.name);

  constructor(
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(SessionStatusHistory)
    private statusHistoryRepository: Repository<SessionStatusHistory>,
    private dataSource: DataSource,
    private configService: ConfigService,
    private qrCodeService: QrCodeService,
  ) {}

  /**
   * Updates session status with audit trail and transaction management
   */
  async updateSessionStatus(
    sessionId: string,
    newStatus: SessionStatus,
    changedBy?: string,
    isAutomated = false,
    reason?: string,
  ): Promise<Session> {
    return await this.dataSource.transaction(async (manager) => {
      // Get current session
      const session = await manager.findOne(Session, {
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      const oldStatus = session.status;

      // Validate status transition
      this.validateStatusTransition(oldStatus, newStatus);

      // Update session status
      session.status = newStatus;
      session.statusChangedAt = new Date();
      session.statusChangedBy = changedBy;
      session.automatedStatusChange = isAutomated;

      const updatedSession = await manager.save(Session, session);

      // Create status history record
      const statusHistory = this.statusHistoryRepository.create({
        sessionId: session.id,
        oldStatus,
        newStatus,
        changedBy,
        automatedChange: isAutomated,
        changeReason: reason,
      });

      await manager.save(SessionStatusHistory, statusHistory);

      this.logger.log(
        `Session ${sessionId} status changed from ${oldStatus} to ${newStatus} ${
          isAutomated ? '(automated)' : `by user ${changedBy}`
        }`
      );

      // Generate QR code when session is published (AC: 1, 2, 3, 6)
      if (newStatus === SessionStatus.PUBLISHED && oldStatus !== SessionStatus.PUBLISHED) {
        this.generateQrCodeForSession(updatedSession).catch(error => {
          // Log error but don't fail the transaction - AC: 6 (don't block publishing)
          this.logger.error(`Failed to generate QR code for session ${sessionId}:`, error);
        });
      }

      return updatedSession;
    });
  }

  /**
   * Validates if a status transition is allowed based on business rules
   */
  private validateStatusTransition(currentStatus: SessionStatus, newStatus: SessionStatus): void {
    const validTransitions = {
      [SessionStatus.DRAFT]: [SessionStatus.PUBLISHED, SessionStatus.CANCELLED],
      [SessionStatus.PUBLISHED]: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
      [SessionStatus.COMPLETED]: [], // No transitions from completed
      [SessionStatus.CANCELLED]: [], // No transitions from cancelled
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Gets sessions that are published and past their end time (for automated completion)
   */
  async getSessionsForAutomaticCompletion(): Promise<Session[]> {
    const now = new Date();

    return await this.sessionRepository.find({
      where: {
        status: SessionStatus.PUBLISHED,
        endTime: new Date(now.getTime() - 0), // Sessions that have ended
        isActive: true,
      },
      relations: ['author', 'location', 'trainer'],
    });
  }

  /**
   * Gets status change history for a session
   */
  async getSessionStatusHistory(sessionId: string): Promise<SessionStatusHistory[]> {
    return await this.statusHistoryRepository.find({
      where: { sessionId },
      relations: ['changedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate QR code for a published session
   * This runs asynchronously and logs errors without blocking the publishing workflow
   */
  private async generateQrCodeForSession(session: Session): Promise<void> {
    try {
      // Get base URL from configuration
      const baseUrl = this.configService.get<string>('VITE_API_URL', 'http://localhost:3001/api').replace('/api', '');

      this.logger.log(`Generating QR code for published session: ${session.id} - ${session.title}`);

      // Generate QR code using the QrCodeService
      const result = await this.qrCodeService.generateQrCodeForSession(
        session.id,
        session.title,
        baseUrl
      );

      if (result.success && result.qrCodeUrl) {
        // Update the session with the QR code URL (AC: 3)
        await this.sessionRepository.update(session.id, {
          qrCodeUrl: result.qrCodeUrl
        });

        this.logger.log(`QR code generated and saved for session ${session.id}: ${result.qrCodeUrl}`);
      } else {
        this.logger.error(`QR code generation failed for session ${session.id}: ${result.error}`);
      }
    } catch (error) {
      this.logger.error(`Unexpected error generating QR code for session ${session.id}:`, error);
    }
  }
}