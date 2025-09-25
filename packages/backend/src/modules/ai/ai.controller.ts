import { Body, Controller, Post, Get, Query } from '@nestjs/common';
import { AiService, GenerateContentPayload } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generate(@Body() payload: GenerateContentPayload) {
    return this.aiService.generateContent(payload);
  }

  @Get('suggestions')
  async getContextualSuggestions(
    @Query('sessionId') sessionId: string,
    @Query('kind') kind: string,
  ) {
    return this.aiService.getContextualSuggestions(sessionId, kind);
  }
}
