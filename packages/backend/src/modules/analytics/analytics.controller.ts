import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly telemetryService: AnalyticsTelemetryService) {}

  @Get('ai-metrics')
  getAIMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const timeRange = this.parseTimeRange(startDate, endDate);
    return this.telemetryService.getAIInteractionMetrics(timeRange);
  }

  @Get('builder-metrics')
  getBuilderMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const timeRange = this.parseTimeRange(startDate, endDate);
    return this.telemetryService.getBuilderUsageMetrics(timeRange);
  }

  @Get('events')
  getEvents(
    @Query('limit') limit?: string,
    @Query('eventType') eventType?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.telemetryService.getRecentEvents(limitNum, eventType);
  }

  @Get('event-stats')
  getEventStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const timeRange = this.parseTimeRange(startDate, endDate);
    return this.telemetryService.getEventStats(timeRange);
  }

  @Get('export')
  exportEvents(
    @Query('format') format: 'json' | 'csv' = 'json',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const timeRange = this.parseTimeRange(startDate, endDate);
    const data = this.telemetryService.exportEvents(format, timeRange);

    return {
      format,
      timeRange,
      data,
      generatedAt: new Date().toISOString(),
    };
  }

  private parseTimeRange(startDate?: string, endDate?: string) {
    if (!startDate || !endDate) return undefined;

    try {
      return {
        start: new Date(startDate),
        end: new Date(endDate),
      };
    } catch (error) {
      return undefined;
    }
  }
}