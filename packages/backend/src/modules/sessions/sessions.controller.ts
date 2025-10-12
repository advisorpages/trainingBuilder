import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Res } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreateContentVersionDto } from './dto/create-content-version.dto';
import { BuilderAutosaveDto } from './dto/builder-autosave.dto';
import { SuggestOutlineDto } from './dto/suggest-outline.dto';
import { SessionStatus } from '../../entities';
import { Public } from '../../common/decorators/public.decorator';
import { CreateBuilderDraftDto } from './dto/create-builder-draft.dto';
import {
  AddOutlineSectionDto,
  UpdateOutlineSectionDto,
  RemoveOutlineSectionDto,
  ReorderOutlineSectionsDto,
  DuplicateOutlineSectionDto,
} from './dto/outline-section.dto';
import { ImportSessionsDto } from './dto/import-sessions.dto';
import { Response } from 'express';

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

    const trainerIdNumber = trainerId !== undefined ? Number(trainerId) : undefined;
    const parsedTrainerId =
      trainerIdNumber !== undefined && !Number.isNaN(trainerIdNumber) ? trainerIdNumber : undefined;

    return this.sessionsService.findAll({ status, topicId: parsedTopicId, trainerId: parsedTrainerId });
  }

  @Post('builder/:id/autosave')
  async autosave(
    @Param('id') id: string,
    @Body() dto: BuilderAutosaveDto,
  ) {
    return this.sessionsService.autosaveBuilderDraft(id, dto);
  }

  @Post('builder/drafts')
  async createDraft(@Body() dto: CreateBuilderDraftDto) {
    return this.sessionsService.createBuilderDraft(dto);
  }

  @Put('builder/:id/outlines/sections/add')
  async addOutlineSection(
    @Param('id') id: string,
    @Body() dto: AddOutlineSectionDto,
  ) {
    return this.sessionsService.addOutlineSection(id, dto);
  }

  @Put('builder/:id/outlines/sections/update')
  async updateOutlineSection(
    @Param('id') id: string,
    @Body() dto: UpdateOutlineSectionDto,
  ) {
    return this.sessionsService.updateOutlineSection(id, dto);
  }

  @Put('builder/:id/outlines/sections/remove')
  async removeOutlineSection(
    @Param('id') id: string,
    @Body() dto: RemoveOutlineSectionDto,
  ) {
    return this.sessionsService.removeOutlineSection(id, dto);
  }

  @Put('builder/:id/outlines/sections/reorder')
  async reorderOutlineSections(
    @Param('id') id: string,
    @Body() dto: ReorderOutlineSectionsDto,
  ) {
    return this.sessionsService.reorderOutlineSections(id, dto);
  }

  @Put('builder/:id/outlines/sections/duplicate')
  async duplicateOutlineSection(
    @Param('id') id: string,
    @Body() dto: DuplicateOutlineSectionDto,
  ) {
    return this.sessionsService.duplicateOutlineSection(id, dto);
  }

  @Get('builder/:id/complete-data')
  async builderCompleteData(@Param('id') id: string) {
    return this.sessionsService.getBuilderCompleteData(id);
  }

  @Post('builder/suggest-outline')
  async suggestOutline(@Body() dto: SuggestOutlineDto) {
    return this.sessionsService.suggestOutline(dto);
  }

  @Post('builder/suggest-outline-v2')
  async suggestMultipleOutlines(@Body() dto: SuggestOutlineDto) {
    return this.sessionsService.suggestMultipleOutlines(dto);
  }

  @Public()
  @Post('builder/:sessionId/log-variant-selection')
  async logVariantSelection(
    @Param('sessionId') sessionId: string,
    @Body() variantDetails: {
      variantId: string;
      generationSource: 'rag' | 'baseline';
      ragWeight: number;
      ragSourcesUsed: number;
      category: string;
    }
  ) {
    await this.sessionsService.logVariantSelection(sessionId, variantDetails);
    return { success: true };
  }

  @Get('readiness-checklist')
  async getReadinessChecklist(@Query('category') category?: string) {
    return this.sessionsService.getReadinessChecklist(category);
  }

  @Public()
  @Get('public')
  async getPublishedSessions() {
    return this.sessionsService.findAll({ status: SessionStatus.PUBLISHED });
  }

  @Public()
  @Get('public/:id')
  async getPublicSession(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get('export')
  async exportAll(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res({ passthrough: true }) res: Response,
  ) {
    const exportData = await this.sessionsService.exportAllSessionsDetailed();

    if (format === 'csv') {
      const csv = this.sessionsService.buildSessionsExportCsv(exportData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sessions-export-${timestamp}.csv"`);
      res.setHeader('X-Export-Count', exportData.length.toString());
      return csv;
    }

    return exportData;
  }

  @Post('import')
  async importAll(@Body() dto: ImportSessionsDto) {
    return this.sessionsService.importSessions(dto);
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

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
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

  @Post('bulk/delete')
  async bulkDelete(@Body('sessionIds') sessionIds: string[]) {
    console.log('Backend controller - bulkDelete called with:', { sessionIds });
    const result = await this.sessionsService.bulkDelete(sessionIds);
    console.log('Backend controller - bulkDelete result:', result);
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
}
