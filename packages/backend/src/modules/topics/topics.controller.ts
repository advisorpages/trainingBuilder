import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { TopicsService, UsageCheckResponse } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { Public } from '../../common/decorators/public.decorator';
import { ImportTopicsDto } from './dto/import-topics.dto';
import { Response } from 'express';
import { TopicEnhancementRequestDto } from './dto/enhance-topic.dto';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Public()
  @Get()
  async list() {
    return this.topicsService.findAll();
  }

  @Get('export')
  async exportAll(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res({ passthrough: true }) res: Response,
  ) {
    const exportData = await this.topicsService.exportAllDetailed();

    if (format === 'csv') {
      const csv = this.topicsService.buildTopicsExportCsv(exportData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="topics-export-${timestamp}.csv"`);
      res.setHeader('X-Export-Count', exportData.length.toString());
      return csv;
    }

    return exportData;
  }

  @Get(':id/usage-check')
  async checkUsage(@Param('id') id: string): Promise<UsageCheckResponse> {
    return this.topicsService.checkUsage(id);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Post('enhance')
  async enhance(@Body() dto: TopicEnhancementRequestDto) {
    return this.topicsService.enhanceTopic(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTopicDto>) {
    return this.topicsService.update(id, dto);
  }

  @Post('import')
  async import(@Body() dto: ImportTopicsDto) {
    return this.topicsService.importTopics(dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }

  @Post(':id/polish')
  async polishTopic(@Param('id') id: string) {
    return this.topicsService.polishTopic(id);
  }
}
