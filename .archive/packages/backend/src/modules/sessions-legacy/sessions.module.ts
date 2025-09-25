import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionBuilderController } from './controllers/session-builder.controller';
import { SessionBuilderService } from './services/session-builder.service';
import { SessionStatusService } from './services/session-status.service';
import { ContentValidationService } from './services/content-validation.service';
import { PublishingAutomationService } from './services/publishing-automation.service';
import { SessionCompletionScheduler } from './schedulers/session-completion.scheduler';
import { ContentValidationScheduler } from './schedulers/content-validation.scheduler';
import { WorkflowMonitoringService } from './services/workflow-monitoring.service';
import { Session } from '../../entities/session.entity';
import { SessionStatusHistory } from '../../entities/session-status-history.entity';
import { Registration } from '../../entities/registration.entity';
import { Topic } from '../../entities/topic.entity';
import { QrCodeService } from '../../services/qr-code.service';
import { RAGIntegrationService } from '../../services/rag-integration.service';
import { TopicsModule } from '../topics/topics.module';
import { CategoriesModule } from '../categories/categories.module';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session, SessionStatusHistory, Registration, Topic]),
    HttpModule,
    TopicsModule,
    CategoriesModule,
    AIModule
  ],
  controllers: [SessionsController, SessionBuilderController],
  providers: [
    SessionsService,
    SessionStatusService,
    ContentValidationService,
    PublishingAutomationService,
    WorkflowMonitoringService,
    SessionCompletionScheduler,
    ContentValidationScheduler,
    QrCodeService,
    SessionBuilderService,
    RAGIntegrationService,
  ],
  exports: [
    SessionsService,
    SessionStatusService,
    ContentValidationService,
    PublishingAutomationService,
    WorkflowMonitoringService,
    SessionBuilderService,
  ],
})
export class SessionsModule {}