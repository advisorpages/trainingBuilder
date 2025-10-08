import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagSettings } from '../../entities/rag-settings.entity';
import { RagSettingsController } from './rag-settings.controller';
import { RagSettingsService } from '../../services/rag-settings.service';
import { RagIntegrationService } from '../../services/rag-integration.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([RagSettings]), ConfigModule],
  controllers: [RagSettingsController],
  providers: [RagSettingsService, RagIntegrationService],
  exports: [RagSettingsService],
})
export class RagSettingsModule {}
