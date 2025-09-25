import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AnalyticsTelemetryService } from '../../services/analytics-telemetry.service';
import { Session, Topic } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Topic])],
  controllers: [AiController],
  providers: [AiService, AnalyticsTelemetryService],
  exports: [AiService],
})
export class AIModule {}
