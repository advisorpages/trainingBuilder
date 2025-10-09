import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIInteraction } from '../../entities/ai-interaction.entity';
import { AIInteractionsService } from '../../services/ai-interactions.service';
import { AIInteractionsController } from './ai-interactions.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { AiPromptsModule } from '../ai-prompts/ai-prompts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AIInteraction]),
    forwardRef(() => SessionsModule),
    AiPromptsModule,
  ],
  providers: [AIInteractionsService],
  controllers: [AIInteractionsController],
  exports: [AIInteractionsService],
})
export class AIInteractionsModule {}
