import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookAdminController } from './webhook-admin.controller';
import { QrAdminController } from './qr-admin.controller';
import { AnalyticsController } from './analytics.controller';
import { Registration } from '../../entities/registration.entity';
import { Session } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { WebhookSyncService } from '../../services/webhook-sync.service';
import { QrCodeService } from '../../services/qr-code.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, Session, Trainer]),
  ],
  controllers: [WebhookAdminController, QrAdminController, AnalyticsController],
  providers: [WebhookSyncService, QrCodeService],
  exports: [],
})
export class AdminModule {}