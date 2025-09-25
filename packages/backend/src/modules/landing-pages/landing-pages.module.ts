import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingPagesController } from './landing-pages.controller';
import { LandingPagesService } from './landing-pages.service';
import { LandingPage, Session } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([LandingPage, Session])],
  controllers: [LandingPagesController],
  providers: [LandingPagesService],
  exports: [LandingPagesService],
})
export class LandingPagesModule {}
