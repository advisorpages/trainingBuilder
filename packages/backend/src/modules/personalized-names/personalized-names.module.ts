import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalizedName } from '../../entities/personalized-name.entity';
import { PersonalizedNamesService } from './personalized-names.service';
import { PersonalizedNamesController } from './personalized-names.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PersonalizedName])],
  controllers: [PersonalizedNamesController],
  providers: [PersonalizedNamesService],
  exports: [PersonalizedNamesService],
})
export class PersonalizedNamesModule {}