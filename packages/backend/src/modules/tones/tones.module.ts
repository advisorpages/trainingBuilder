import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TonesService } from './tones.service';
import { TonesController } from './tones.controller';
import { Tone } from '../../entities/tone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tone])],
  controllers: [TonesController],
  providers: [TonesService],
  exports: [TonesService],
})
export class TonesModule {}
