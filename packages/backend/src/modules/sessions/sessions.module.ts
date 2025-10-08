import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService } from '../../services/openai.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { PromptsModule } from '../prompts/prompts.module';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { VariantConfigsModule } from '../variant-configs/variant-configs.module';
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
      AIInteraction,
    ]),
    PromptsModule,
    AnalyticsModule,
    VariantConfigsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService, ReadinessScoringService, OpenAIService, RagIntegrationService, AIInteractionsService],
  exports: [SessionsService, ReadinessScoringService, OpenAIService, RagIntegrationService, AIInteractionsService],
})
export class SessionsModule {}
