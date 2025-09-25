import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendTrainerAssignmentEmail(payload: { trainerEmail: string; sessionId: string }) {
    this.logger.log(`Queueing trainer assignment email`, payload);
    return { status: 'queued' };
  }
}
