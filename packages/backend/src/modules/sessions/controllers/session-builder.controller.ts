import { Controller, Post, Body, Get, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SessionBuilderService } from '../services/session-builder.service';
import { SuggestSessionOutlineDto, SessionOutlineResponseDto } from '../dto/session-builder.dto';
import { FlexibleSessionOutline, FlexibleSessionSection, SessionTemplate } from '../interfaces/session-outline.interface';

@Controller('sessions/builder')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
export class SessionBuilderController {
  constructor(
    private readonly sessionBuilderService: SessionBuilderService
  ) {}

  @Post('suggest-outline')
  async suggestOutline(
    @Body() suggestOutlineDto: SuggestSessionOutlineDto,
    @Query('template') templateId?: string
  ): Promise<SessionOutlineResponseDto> {
    const startTime = Date.now();

    const result = await this.sessionBuilderService.generateSessionOutline(suggestOutlineDto, templateId);

    return {
      outline: result.outline,
      relevantTopics: result.relevantTopics,
      ragAvailable: result.ragAvailable,
      ragSuggestions: result.ragSuggestions,
      generationMetadata: {
        processingTime: Date.now() - startTime,
        ragQueried: result.ragQueried,
        fallbackUsed: result.fallbackUsed,
        topicsFound: result.relevantTopics.length
      }
    };
  }

  @Post('suggest-legacy-outline')
  async suggestLegacyOutline(
    @Body() suggestOutlineDto: SuggestSessionOutlineDto
  ): Promise<SessionOutlineResponseDto> {
    const startTime = Date.now();

    const result = await this.sessionBuilderService.generateLegacySessionOutline(suggestOutlineDto);

    return {
      outline: result.outline,
      relevantTopics: result.relevantTopics,
      ragAvailable: result.ragAvailable,
      ragSuggestions: result.ragSuggestions,
      generationMetadata: {
        processingTime: Date.now() - startTime,
        ragQueried: result.ragQueried,
        fallbackUsed: result.fallbackUsed,
        topicsFound: result.relevantTopics.length
      }
    };
  }

  @Get('suggestions/:category')
  async getSuggestionsForCategory(
    @Param('category') category: string
  ): Promise<{ topics: any[], ragAvailable: boolean }> {
    return this.sessionBuilderService.getSuggestionsForCategory(category);
  }

  @Post('test-rag')
  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    return this.sessionBuilderService.testRAGConnection();
  }

  // Template Management Endpoints
  @Get('templates')
  async getTemplates(): Promise<SessionTemplate[]> {
    return this.sessionBuilderService.getTemplates();
  }

  @Get('templates/:templateId')
  async getTemplate(@Param('templateId') templateId: string): Promise<SessionTemplate> {
    return this.sessionBuilderService.getTemplate(templateId);
  }

  @Post('templates')
  async createTemplate(@Body() templateData: {
    name: string;
    description: string;
    sections: FlexibleSessionSection[];
    category?: string;
  }): Promise<SessionTemplate> {
    return this.sessionBuilderService.createCustomTemplate(
      templateData.name,
      templateData.description,
      templateData.sections,
      templateData.category
    );
  }

  @Get('section-types')
  async getSectionTypes(): Promise<Record<string, any>> {
    return this.sessionBuilderService.getSectionTypes();
  }

  // Section Management Endpoints
  @Put('outlines/sections/add')
  async addSection(@Body() data: {
    outline: FlexibleSessionOutline;
    sectionType: string;
    position?: number;
  }): Promise<FlexibleSessionOutline> {
    return this.sessionBuilderService.addSectionToOutline(data.outline, data.sectionType, data.position);
  }

  @Put('outlines/sections/remove')
  async removeSection(@Body() data: {
    outline: FlexibleSessionOutline;
    sectionId: string;
  }): Promise<FlexibleSessionOutline> {
    return this.sessionBuilderService.removeSectionFromOutline(data.outline, data.sectionId);
  }

  @Put('outlines/sections/update')
  async updateSection(@Body() data: {
    outline: FlexibleSessionOutline;
    sectionId: string;
    updates: Partial<FlexibleSessionSection>;
  }): Promise<FlexibleSessionOutline> {
    return this.sessionBuilderService.updateSectionInOutline(data.outline, data.sectionId, data.updates);
  }

  @Put('outlines/sections/reorder')
  async reorderSections(@Body() data: {
    outline: FlexibleSessionOutline;
    sectionIds: string[];
  }): Promise<FlexibleSessionOutline> {
    return this.sessionBuilderService.reorderSections(data.outline, data.sectionIds);
  }

  @Put('outlines/sections/duplicate')
  async duplicateSection(@Body() data: {
    outline: FlexibleSessionOutline;
    sectionId: string;
  }): Promise<FlexibleSessionOutline> {
    return this.sessionBuilderService.duplicateSection(data.outline, data.sectionId);
  }

  @Post('outlines/validate')
  async validateOutline(@Body() outline: FlexibleSessionOutline): Promise<{ isValid: boolean; errors: string[] }> {
    return this.sessionBuilderService.validateOutline(outline);
  }

  // PHASE 5: Training Kit and Marketing Kit endpoints

  @Post(':sessionId/generate-training-kit')
  async generateTrainingKit(
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    return this.sessionBuilderService.generateTrainingKit(sessionId);
  }

  @Post(':sessionId/generate-marketing-kit')
  async generateMarketingKit(
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    return this.sessionBuilderService.generateMarketingKit(sessionId);
  }

  @Get(':sessionId/training-kit')
  async getTrainingKit(
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    return this.sessionBuilderService.getTrainingKit(sessionId);
  }

  @Get(':sessionId/marketing-kit')
  async getMarketingKit(
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    return this.sessionBuilderService.getMarketingKit(sessionId);
  }

  @Post(':sessionId/save-training-kit')
  async saveTrainingKit(
    @Param('sessionId') sessionId: string,
    @Body() trainingKitData: any
  ): Promise<any> {
    return this.sessionBuilderService.saveTrainingKit(sessionId, trainingKitData);
  }

  @Post(':sessionId/save-marketing-kit')
  async saveMarketingKit(
    @Param('sessionId') sessionId: string,
    @Body() marketingKitData: any
  ): Promise<any> {
    return this.sessionBuilderService.saveMarketingKit(sessionId, marketingKitData);
  }

  @Get(':sessionId/complete-data')
  async getCompleteSessionData(
    @Param('sessionId') sessionId: string
  ): Promise<any> {
    return this.sessionBuilderService.getCompleteSessionData(sessionId);
  }
}