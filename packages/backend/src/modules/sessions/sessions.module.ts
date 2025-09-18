import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionStatusService } from './services/session-status.service';
import { ContentValidationService } from './services/content-validation.service';
import { PublishingAutomationService } from './services/publishing-automation.service';
import { SessionCompletionScheduler } from './schedulers/session-completion.scheduler';
import { ContentValidationScheduler } from './schedulers/content-validation.scheduler';
import { WorkflowMonitoringService } from './services/workflow-monitoring.service';
import { Session } from '../../entities/session.entity';
import { SessionStatusHistory } from '../../entities/session-status-history.entity';
import { Registration } from '../../entities/registration.entity';
import { QrCodeService } from '../../services/qr-code.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session, SessionStatusHistory, Registration])],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    SessionStatusService,
    ContentValidationService,
    PublishingAutomationService,
    WorkflowMonitoringService,
    SessionCompletionScheduler,
    ContentValidationScheduler,
    QrCodeService,
  ],
  exports: [
    SessionsService,
    SessionStatusService,
    ContentValidationService,
    PublishingAutomationService,
    WorkflowMonitoringService,
  ],
})
export class SessionsModule {}