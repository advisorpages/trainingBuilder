import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainerDashboardController } from './trainer-dashboard.controller';
import { TrainerDashboardService } from './trainer-dashboard.service';
import { Session } from '../../entities/session.entity';
import { Trainer } from '../../entities/trainer.entity';
import { User } from '../../entities/user.entity';
import { CoachingTip } from '../../entities/coaching-tip.entity';
import { SessionCoachingTip } from '../../entities/session-coaching-tip.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      Trainer,
      User,
      CoachingTip,
      SessionCoachingTip,
    ]),
    EmailModule,
  ],
  controllers: [TrainerDashboardController],
  providers: [TrainerDashboardService],
  exports: [TrainerDashboardService],
})
export class TrainerDashboardModule {}