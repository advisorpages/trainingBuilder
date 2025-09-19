import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookAdminController } from './webhook-admin.controller';
import { QrAdminController } from './qr-admin.controller';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { Registration } from '../../entities/registration.entity';
import { Session } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { Topic } from '../../entities/topic.entity';
import { WebhookSyncService } from '../../services/webhook-sync.service';
import { QrCodeService } from '../../services/qr-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, Session, Trainer, Topic]),
  ],
  controllers: [WebhookAdminController, QrAdminController, AnalyticsController],
  providers: [WebhookSyncService, QrCodeService, AnalyticsService, ExportService],
  exports: [],
})
export class AdminModule {}