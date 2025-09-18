import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AIService, AIPromptRequest, AIPromptResponse, AIContentGenerationRequest, AIContentResponse, ContentRegenerationRequest, AIIncentiveContentRequest, AIIncentiveContentResponse } from './ai.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Post('generate-prompt')
  async generatePrompt(
    @Body() request: AIPromptRequest,
    @Request() req
  ): Promise<AIPromptResponse> {
    return this.aiService.generatePrompt(request);
  }

  @Post('generate-content')
  async generateContent(
    @Body() request: AIContentGenerationRequest,
    @Request() req
  ): Promise<AIContentResponse> {
    return this.aiService.generateContent(request);
  }

  @Post('regenerate-content')
  async regenerateContent(
    @Body() request: ContentRegenerationRequest,
    @Request() req
  ): Promise<AIContentResponse> {
    return this.aiService.regenerateContent(request);
  }

  @Get('templates')
  async getTemplates() {
    return this.aiService.getAvailableTemplates();
  }

  @Post('generate-incentive-content')
  async generateIncentiveContent(
    @Body() request: AIIncentiveContentRequest,
    @Request() req
  ): Promise<AIIncentiveContentResponse> {
    return this.aiService.generateIncentiveContent(request);
  }

  @Get('health')
  getAIServiceHealth() {
    return {
      service: 'AI Service',
      status: 'Active',
      features: [
        'Prompt generation',
        'Content generation',
        'Content regeneration',
        'Template management',
        'Session content optimization',
        'One-step incentive content generation'
      ],
      templates: 3
    };
  }
}