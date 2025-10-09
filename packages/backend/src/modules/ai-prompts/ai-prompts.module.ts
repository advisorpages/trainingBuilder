import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiPromptSetting } from '../../entities/ai-prompt-setting.entity';
import { AiPromptSettingsService } from '../../services/ai-prompt-settings.service';
import { AiPromptsController } from './ai-prompts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiPromptSetting])],
  providers: [AiPromptSettingsService],
  controllers: [AiPromptsController],
  exports: [AiPromptSettingsService],
})
export class AiPromptsModule {}

