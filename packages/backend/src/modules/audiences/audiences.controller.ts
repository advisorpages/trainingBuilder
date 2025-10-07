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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AudiencesService, PaginatedAudiencesResponse, UsageCheckResponse } from './audiences.service';
import { CreateAudienceDto, UpdateAudienceDto, AudienceQueryDto } from './dto';
import { Audience } from '../../entities/audience.entity';

@Controller('admin/audiences')
export class AudiencesController {
  constructor(private readonly audiencesService: AudiencesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAudienceDto: CreateAudienceDto): Promise<Audience> {
    return await this.audiencesService.create(createAudienceDto);
  }

  @Get()
  async findAll(@Query() query: AudienceQueryDto): Promise<PaginatedAudiencesResponse> {
    return await this.audiencesService.findAll(query);
  }

  @Get('active')
  async findActive(): Promise<Audience[]> {
    return await this.audiencesService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Audience> {
    return await this.audiencesService.findOne(id);
  }

  @Get(':id/usage-check')
  async checkUsage(@Param('id', ParseIntPipe) id: number): Promise<UsageCheckResponse> {
    return await this.audiencesService.checkUsage(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ): Promise<Audience> {
    return await this.audiencesService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.audiencesService.remove(id);
  }
}
