import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService } from '../../services/openai.service';
import { PromptsModule } from '../prompts/prompts.module';
import { AIInteractionsService } from '../../services/ai-interactions.service';
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
  ],
  controllers: [SessionsController],
  providers: [SessionsService, ReadinessScoringService, OpenAIService, AIInteractionsService],
  exports: [SessionsService, ReadinessScoringService, OpenAIService, AIInteractionsService],
})
export class SessionsModule {}
