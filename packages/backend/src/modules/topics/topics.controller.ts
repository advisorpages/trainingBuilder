import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Public()
  @Get()
  async list() {
    return this.topicsService.findAll();
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    return this.topicsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateTopicDto) {
    return this.topicsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTopicDto>) {
    return this.topicsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.topicsService.remove(id);
  }
}
