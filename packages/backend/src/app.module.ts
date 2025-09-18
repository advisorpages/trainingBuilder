import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { LocationsModule } from './modules/locations/locations.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { AIModule } from './modules/ai/ai.module';
import { TrainerDashboardModule } from './modules/trainer-dashboard/trainer-dashboard.module';
import { EmailModule } from './modules/email/email.module';
import { AdminModule } from './modules/admin/admin.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { entities } from './entities';
import { DatabaseHealthService } from './services/database-health.service';
import { WebhookSyncService } from './services/webhook-sync.service';
import { QrCodeService } from './services/qr-code.service';
import { Registration } from './entities/registration.entity';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'leadership_training'),
        entities: entities,
        migrations: ['dist/migrations/*.js'],
        synchronize: false, // Don't auto-sync in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // TypeORM for webhook sync service
    TypeOrmModule.forFeature([Registration]),

    // Feature modules
    AuthModule,
    UsersModule,
    SessionsModule,
    LocationsModule,
    TrainersModule,
    SettingsModule,
    AttributesModule,
    AIModule,
    TrainerDashboardModule,
    EmailModule,
    AdminModule,
    IncentivesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseHealthService,
    WebhookSyncService,
    QrCodeService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}