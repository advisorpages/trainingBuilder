import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompt } from '../../entities/prompt.entity';
import { PromptRegistryService } from '../../services/prompt-registry.service';
import { PromptsController } from './prompts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Prompt])],
  controllers: [PromptsController],
  providers: [PromptRegistryService],
  exports: [PromptRegistryService],
})
export class PromptsModule {}