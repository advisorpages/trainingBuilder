import { Controller, Get, Put, Post, Body, Logger } from '@nestjs/common';
import {
  RagSettingsService,
  UpdateRagSettingsDto,
  TestRagConnectionDto,
  TestRagConnectionResponse,
} from '../../services/rag-settings.service';
import { RagSettings } from '../../entities/rag-settings.entity';

@Controller('rag-settings')
export class RagSettingsController {
  private readonly logger = new Logger(RagSettingsController.name);

  constructor(private readonly ragSettingsService: RagSettingsService) {}

  @Get()
  async getSettings(): Promise<RagSettings> {
    this.logger.log('GET /rag-settings');
    return this.ragSettingsService.getSettings();
  }

  @Put()
  async updateSettings(@Body() dto: UpdateRagSettingsDto): Promise<RagSettings> {
    this.logger.log('PUT /rag-settings', { dto });
    return this.ragSettingsService.updateSettings(dto);
  }

  @Post('test-connection')
  async testConnection(
    @Body() dto: TestRagConnectionDto,
  ): Promise<TestRagConnectionResponse> {
    this.logger.log('POST /rag-settings/test-connection', { dto });
    // TODO: Get actual user from auth context
    const testedBy = 'admin';
    return this.ragSettingsService.testConnection(dto, testedBy);
  }

  @Post('reset-defaults')
  async resetToDefaults(): Promise<RagSettings> {
    this.logger.log('POST /rag-settings/reset-defaults');
    return this.ragSettingsService.resetToDefaults();
  }

  @Get('default-template')
  async getDefaultTemplate(): Promise<{ template: string }> {
    this.logger.log('GET /rag-settings/default-template');
    return {
      template: this.ragSettingsService.getDefaultQueryTemplate(),
    };
  }

  @Get('variant-weights')
  async getVariantWeights(): Promise<{ weights: number[] }> {
    this.logger.log('GET /rag-settings/variant-weights');
    const weights = await this.ragSettingsService.getVariantWeights();
    return { weights };
  }
}
