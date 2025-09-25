import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsTelemetryService],
  exports: [AnalyticsTelemetryService],
})
export class AnalyticsModule {}