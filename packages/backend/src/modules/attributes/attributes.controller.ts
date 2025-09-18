import { Controller, Get, Param } from '@nestjs/common';
import { AttributesService } from './attributes.service';
import { Audience, Tone, Category, Topic } from '../../entities';

@Controller()
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Get('audiences')
  getAudiences(): Promise<Audience[]> {
    return this.attributesService.getAudiences();
  }

  @Get('audiences/:id')
  getAudience(@Param('id') id: number): Promise<Audience> {
    return this.attributesService.getAudience(id);
  }

  @Get('tones')
  getTones(): Promise<Tone[]> {
    return this.attributesService.getTones();
  }

  @Get('tones/:id')
  getTone(@Param('id') id: number): Promise<Tone> {
    return this.attributesService.getTone(id);
  }

  @Get('categories')
  getCategories(): Promise<Category[]> {
    return this.attributesService.getCategories();
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: number): Promise<Category> {
    return this.attributesService.getCategory(id);
  }

  @Get('topics')
  getTopics(): Promise<Topic[]> {
    return this.attributesService.getTopics();
  }

  @Get('topics/:id')
  getTopic(@Param('id') id: number): Promise<Topic> {
    return this.attributesService.getTopic(id);
  }
}