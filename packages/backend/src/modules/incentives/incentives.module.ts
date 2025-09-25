import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncentivesController } from './incentives.controller';
import { IncentivesService } from './incentives.service';
import { Incentive } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Incentive])],
  controllers: [IncentivesController],
  providers: [IncentivesService],
  exports: [IncentivesService],
})
export class IncentivesModule {}
