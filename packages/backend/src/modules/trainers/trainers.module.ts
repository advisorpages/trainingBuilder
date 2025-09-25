import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';
import { Trainer, TrainerAssignment, TrainerAsset } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer, TrainerAssignment, TrainerAsset])],
  controllers: [TrainersController],
  providers: [TrainersService],
  exports: [TrainersService],
})
export class TrainersModule {}
