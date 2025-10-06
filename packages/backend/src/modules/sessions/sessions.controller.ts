import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateContentVersionDto } from './dto/create-content-version.dto';
import { BuilderAutosaveDto } from './dto/builder-autosave.dto';
import { SuggestOutlineDto } from './dto/suggest-outline.dto';
import { SessionStatus } from '../../entities';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async list(
    @Query('status') status?: SessionStatus,
    @Query('topicId') topicId?: string,
    @Query('trainerId') trainerId?: string,
  ) {
    const topicIdNumber = topicId !== undefined ? Number(topicId) : undefined;
    const parsedTopicId =
      topicIdNumber !== undefined && !Number.isNaN(topicIdNumber) ? topicIdNumber : undefined;

    return this.sessionsService.findAll({ status, topicId: parsedTopicId, trainerId });
  }

  @Post('builder/:id/autosave')
  async autosave(
    @Param('id') id: string,
    @Body() dto: BuilderAutosaveDto,
  ) {
    return this.sessionsService.autosaveBuilderDraft(id, dto);
  }

  @Get('builder/:id/complete-data')
  async builderCompleteData(@Param('id') id: string) {
    return this.sessionsService.getBuilderCompleteData(id);
  }

  @Post('builder/suggest-outline')
  async suggestOutline(@Body() dto: SuggestOutlineDto) {
    return this.sessionsService.suggestOutline(dto);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    console.log('CreateSessionDto received:', dto);
    return this.sessionsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto);
  }

  @Post(':id/content')
  async createContent(
    @Param('id') id: string,
    @Body() dto: CreateContentVersionDto,
  ) {
    return this.sessionsService.createContentVersion(id, dto);
  }

  @Post('bulk/publish')
  async bulkPublish(@Body('sessionIds') sessionIds: string[]) {
    console.log('Backend controller - bulkPublish called with:', { sessionIds });
    const result = await this.sessionsService.bulkPublish(sessionIds);
    console.log('Backend controller - bulkPublish result:', result);
    return result;
  }

  @Post('bulk/archive')
  async bulkArchive(@Body('sessionIds') sessionIds: string[]) {
    return this.sessionsService.bulkArchive(sessionIds);
  }

  @Post('bulk/status')
  async bulkUpdateStatus(
    @Body('sessionIds') sessionIds: string[],
    @Body('status') status: SessionStatus,
  ) {
    console.log('Backend controller - bulkUpdateStatus called with:', { sessionIds, status });

    // Validate status parameter
    if (!status || !Object.values(SessionStatus).includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${Object.values(SessionStatus).join(', ')}`);
    }

    const result = await this.sessionsService.bulkUpdateStatus(sessionIds, status);
    console.log('Backend controller - bulkUpdateStatus result:', result);
    return result;
  }

  @Post(':id/publish')
  async publishSession(@Param('id') id: string) {
    return this.sessionsService.publishSession(id);
  }

  @Get(':id/readiness')
  async getReadinessScore(@Param('id') id: string) {
    return this.sessionsService.getReadinessScore(id);
  }

  @Get('readiness-checklist')
  async getReadinessChecklist(@Query('category') category?: string) {
    return this.sessionsService.getReadinessChecklist(category);
  }
}
