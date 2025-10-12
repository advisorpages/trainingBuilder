import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService } from '../../services/openai.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { PromptsModule } from '../prompts/prompts.module';
import { AiPromptsModule } from '../ai-prompts/ai-prompts.module';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { VariantConfigsModule } from '../variant-configs/variant-configs.module';
import { TopicsModule } from '../topics/topics.module';
import { TopicsService } from '../topics/topics.service';
import { AIInteraction } from '../../entities/ai-interaction.entity';
import {
  Session,
  SessionContentVersion,
  SessionAgendaItem,
  SessionStatusLog,
  SessionBuilderDraft,
  LandingPage,
  Topic,
  Incentive,
  Location,
  SessionTopic,
  TrainerAssignment,
  Trainer,
} from '../../entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      SessionContentVersion,
      SessionAgendaItem,
      SessionStatusLog,
      SessionBuilderDraft,
      LandingPage,
      Topic,
      Incentive,
      Location,
      SessionTopic,
      TrainerAssignment,
      Trainer,
      AIInteraction,
    ]),
    PromptsModule,
    AiPromptsModule,
    AnalyticsModule,
    VariantConfigsModule,
    TopicsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, ReadinessScoringService, OpenAIService, RagIntegrationService, AIInteractionsService, TopicsService],
  exports: [SessionsService, ReadinessScoringService, OpenAIService, RagIntegrationService, AIInteractionsService],
})
export class SessionsModule {}
