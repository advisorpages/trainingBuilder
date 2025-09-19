import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TopicsService, PaginatedTopics } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicQueryDto } from './dto/topic-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { Topic } from '../../entities/topic.entity';

@Controller('admin/topics')
@UseGuards(JwtAuthGuard)
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTopicDto: CreateTopicDto): Promise<Topic> {
    return await this.topicsService.create(createTopicDto);
  }

  @Get()
  async findAll(@Query() query: TopicQueryDto): Promise<PaginatedTopics> {
    return await this.topicsService.findAll(query);
  }

  @Get('active')
  async findActiveTopics(): Promise<Topic[]> {
    return await this.topicsService.findActiveTopics();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Topic> {
    return await this.topicsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTopicDto: UpdateTopicDto,
  ): Promise<Topic> {
    return await this.topicsService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.topicsService.remove(id);
  }

  @Get(':id/usage-check')
  async checkUsage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ inUse: boolean; sessionCount: number }> {
    return await this.topicsService.checkTopicInUse(id);
  }
}