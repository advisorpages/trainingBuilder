import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../entities/user.entity';
import {
  AIInteractionsService,
  AIInteractionFilters,
  UpdateFeedbackDto,
} from '../../services/ai-interactions.service';
import {
  AIInteractionType,
  AIInteractionStatus,
  UserFeedback,
} from '../../entities/ai-interaction.entity';

@Controller('ai-interactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIInteractionsController {
  constructor(private readonly aiInteractionsService: AIInteractionsService) {}

  @Get()
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sessionId') sessionId?: string,
    @Query('userId') userId?: string,
    @Query('interactionType') interactionType?: string,
    @Query('status') status?: string,
    @Query('userFeedback') userFeedback?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string,
    @Query('sessionType') sessionType?: string,
    @Query('hasErrors') hasErrors?: string,
    @Query('minQualityScore') minQualityScore?: string,
    @Query('maxQualityScore') maxQualityScore?: string
  ) {
    const filters: AIInteractionFilters = {};

    if (sessionId) filters.sessionId = sessionId;
    if (userId) filters.userId = userId;
    if (interactionType) filters.interactionType = interactionType as AIInteractionType;
    if (status) filters.status = status as AIInteractionStatus;
    if (userFeedback) filters.userFeedback = userFeedback as UserFeedback;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (category) filters.category = category;
    if (sessionType) filters.sessionType = sessionType;
    if (hasErrors !== undefined) filters.hasErrors = hasErrors === 'true';
    if (minQualityScore) filters.minQualityScore = parseInt(minQualityScore, 10);
    if (maxQualityScore) filters.maxQualityScore = parseInt(maxQualityScore, 10);

    return this.aiInteractionsService.findAll(
      filters,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Get('metrics')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interactionType') interactionType?: string,
    @Query('category') category?: string
  ) {
    const filters: AIInteractionFilters = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (interactionType) filters.interactionType = interactionType as AIInteractionType;
    if (category) filters.category = category;

    return this.aiInteractionsService.getMetrics(filters);
  }

  @Get('failures')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async getRecentFailures(@Query('limit') limit?: string) {
    return this.aiInteractionsService.getRecentFailures(
      limit ? parseInt(limit, 10) : 20
    );
  }

  @Get('data-quality-issues')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async getDataQualityIssues(@Query('limit') limit?: string) {
    return this.aiInteractionsService.getDataQualityIssues(
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Get('export')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async exportInteractions(
    @Query('format') format?: 'json' | 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interactionType') interactionType?: string
  ) {
    const filters: AIInteractionFilters = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (interactionType) filters.interactionType = interactionType as AIInteractionType;

    const data = await this.aiInteractionsService.exportInteractions(
      filters,
      format || 'json'
    );

    return {
      format: format || 'json',
      data,
    };
  }

  @Public()
  @Get('variant-selection-metrics')
  async getVariantSelectionMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('category') category?: string
  ) {
    const filters: AIInteractionFilters = {};

    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (category) filters.category = category;

    return this.aiInteractionsService.getVariantSelectionMetrics(filters);
  }

  @Get(':id')
  @Roles(UserRole.CONTENT_DEVELOPER, UserRole.BROKER)
  async findOne(@Param('id') id: string) {
    return this.aiInteractionsService.findOne(id);
  }

  @Post(':id/feedback')
  async updateFeedback(
    @Param('id') id: string,
    @Body() feedbackData: UpdateFeedbackDto
  ) {
    return this.aiInteractionsService.updateFeedback(id, feedbackData);
  }
}
