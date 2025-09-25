import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { ReadinessScoringService } from './services/readiness-scoring.service';
import { OpenAIService } from '../../services/openai.service';
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
    ]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, ReadinessScoringService, OpenAIService],
  exports: [SessionsService, ReadinessScoringService],
})
export class SessionsModule {}
