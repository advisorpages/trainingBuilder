import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { PromptRegistryService } from '../../services/prompt-registry.service';
import { PromptCategory } from '../../entities/prompt.entity';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { RenderPromptDto } from './dto/render-prompt.dto';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptRegistry: PromptRegistryService) {}

  @Get()
  async getAllPrompts() {
    return this.promptRegistry.getAllPrompts();
  }

  @Get('category/:category')
  async getPromptsByCategory(@Param('category') category: PromptCategory) {
    return this.promptRegistry.getPromptsByCategory(category);
  }

  @Get(':name')
  async getPrompt(@Param('name') name: string) {
    return this.promptRegistry.getPrompt(name);
  }

  @Post()
  async createPrompt(@Body() createPromptDto: CreatePromptDto) {
    return this.promptRegistry.createPrompt(createPromptDto);
  }

  @Put(':id')
  async updatePrompt(
    @Param('id') id: string,
    @Body() updatePromptDto: UpdatePromptDto,
  ) {
    return this.promptRegistry.updatePrompt(id, updatePromptDto);
  }

  @Delete(':id')
  async deletePrompt(@Param('id') id: string) {
    await this.promptRegistry.deletePrompt(id);
    return { message: 'Prompt deleted successfully' };
  }

  @Post('render')
  async renderPrompt(@Body() renderPromptDto: RenderPromptDto) {
    const rendered = await this.promptRegistry.renderPrompt(
      renderPromptDto.name,
      renderPromptDto.variables,
    );
    return { rendered };
  }

  @Post('seed')
  async seedDefaultPrompts() {
    await this.promptRegistry.seedDefaultPrompts();
    return { message: 'Default prompts seeded successfully' };
  }
}