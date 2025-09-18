import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributesController } from './attributes.controller';
import { AttributesService } from './attributes.service';
import { Audience, Tone, Category, Topic } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([Audience, Tone, Category, Topic])],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}