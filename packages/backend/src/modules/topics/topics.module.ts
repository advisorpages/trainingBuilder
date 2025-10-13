import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { Topic, Session, Audience, Tone, Category, AIInteraction } from '../../entities';
import { OpenAIService } from '../../services/openai.service';
import { AIInteractionsService } from '../../services/ai-interactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Topic, Session, Audience, Tone, Category, AIInteraction])],
  controllers: [TopicsController],
  providers: [TopicsService, OpenAIService, AIInteractionsService],
  exports: [TopicsService],
})
export class TopicsModule {}
