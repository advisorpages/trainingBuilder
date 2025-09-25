import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesService } from './audiences.service';
import { AudiencesController } from './audiences.controller';
import { Audience } from '../../entities/audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Audience])],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [AudiencesService],
})
export class AudiencesModule {}