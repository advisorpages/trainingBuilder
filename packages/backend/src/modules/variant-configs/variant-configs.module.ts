import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VariantConfig } from '../../entities/variant-config.entity';
import { VariantConfigService } from '../../services/variant-config.service';
import { VariantConfigsController } from './variant-configs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VariantConfig])],
  controllers: [VariantConfigsController],
  providers: [VariantConfigService],
  exports: [VariantConfigService],
})
export class VariantConfigsModule {}
