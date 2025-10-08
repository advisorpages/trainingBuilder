import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { VariantConfigService } from '../../services/variant-config.service';
import { UpdateVariantConfigDto } from './dto/update-variant-config.dto';

@Controller('variant-configs')
export class VariantConfigsController {
  constructor(private readonly variantConfigService: VariantConfigService) {}

  @Get()
  async getAllVariantConfigs() {
    return this.variantConfigService.getAllVariantConfigsIncludingInactive();
  }

  @Get(':id')
  async getVariantConfigById(@Param('id') id: string) {
    // This will find by UUID id
    return this.variantConfigService.getAllVariantConfigsIncludingInactive()
      .then(configs => configs.find(c => c.id === id));
  }

  @Patch(':id')
  async updateVariantConfig(
    @Param('id') id: string,
    @Body() updateDto: UpdateVariantConfigDto,
  ) {
    return this.variantConfigService.updateVariantConfig(id, updateDto);
  }
}
