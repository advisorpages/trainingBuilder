import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';
import { IncentiveExpirationScheduler } from './schedulers/incentive-expiration.scheduler';
import { Incentive } from '../../entities/incentive.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incentive])],
  controllers: [IncentivesController],
  providers: [IncentivesService, IncentiveExpirationScheduler],
  exports: [IncentivesService],
})
export class IncentivesModule {}