import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AiPromptSettingsService } from '../../services/ai-prompt-settings.service';
import {
  CreatePromptOverrideDto,
  UpdateCurrentPromptSettingsDto,
} from './dto/prompt-settings.dto';

@Controller('ai-prompts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiPromptsController {
  constructor(private readonly promptSettingsService: AiPromptSettingsService) {}

  @Get('current')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async getCurrent() {
    return this.promptSettingsService.getCurrentSettings();
  }

  @Put('current')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async updateCurrent(
    @Body() body: UpdateCurrentPromptSettingsDto,
    @Req() request: Request,
  ) {
    const actor = this.getActor(request);
    return this.promptSettingsService.updateCurrentSettings({
      ...body,
      actor: body.actor ?? actor,
    });
  }

  @Get('override')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async listOverrides() {
    return this.promptSettingsService.listOverrides();
  }

  @Post('override')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async createOverride(
    @Body() body: CreatePromptOverrideDto,
    @Req() request: Request,
  ) {
    const actor = this.getActor(request);
    return this.promptSettingsService.createOverride({
      ...body,
      actor: body.actor ?? actor,
    });
  }

  @Delete('override/:id')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async deleteOverride(@Param('id') id: string) {
    await this.promptSettingsService.deleteOverride(id);
    return { success: true };
  }

  private getActor(request: Request): string | undefined {
    const user: any = (request as any).user;
    if (!user) return undefined;
    return user.displayName || user.email || user.id;
  }
}

