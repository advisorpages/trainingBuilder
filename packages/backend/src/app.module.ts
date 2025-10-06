import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { TopicsModule } from './modules/topics/topics.module';
import { IncentivesModule } from './modules/incentives/incentives.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { AIModule } from './modules/ai/ai.module';
import { EmailModule } from './modules/email/email.module';
import { HealthModule } from './modules/health/health.module';
import { LandingPagesModule } from './modules/landing-pages/landing-pages.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PromptsModule } from './modules/prompts/prompts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { entities } from './entities';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SnakeNamingStrategy } from './config/snake-naming.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'postgres'),
        database: configService.get('DATABASE_NAME', 'leadership_training'),
        entities,
        migrations: ['dist/migrations/*.js'],
        synchronize: false,
        migrationsRun: true,
        logging: configService.get('NODE_ENV') === 'development',
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
    HttpModule,
    AuthModule,
    UsersModule,
    SessionsModule,
    TopicsModule,
    IncentivesModule,
    TrainersModule,
    LandingPagesModule,
    AIModule,
    EmailModule,
    HealthModule,
    AnalyticsModule,
    PromptsModule,
    CategoriesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
