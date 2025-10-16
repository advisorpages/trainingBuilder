import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedVariantsController } from './saved-variants.controller';
import { SavedVariantsService } from '../../services/saved-variants.service';
import { SavedVariant } from '../../entities/saved-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SavedVariant])],
  controllers: [SavedVariantsController],
  providers: [SavedVariantsService],
  exports: [SavedVariantsService],
})
export class SavedVariantsModule {}