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
import { TonesService, PaginatedTonesResponse, UsageCheckResponse } from './tones.service';
import { CreateToneDto, UpdateToneDto, ToneQueryDto } from './dto';
import { Tone } from '../../entities/tone.entity';

@Controller('admin/tones')
export class TonesController {
  constructor(private readonly tonesService: TonesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createToneDto: CreateToneDto): Promise<Tone> {
    return await this.tonesService.create(createToneDto);
  }

  @Get()
  async findAll(@Query() query: ToneQueryDto): Promise<PaginatedTonesResponse> {
    return await this.tonesService.findAll(query);
  }

  @Get('active')
  async findActive(@Query() query: ToneQueryDto): Promise<Tone[]> {
    return await this.tonesService.findActive(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tone> {
    return await this.tonesService.findOne(id);
  }

  @Get(':id/usage-check')
  async checkUsage(@Param('id', ParseIntPipe) id: number): Promise<UsageCheckResponse> {
    return await this.tonesService.checkUsage(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToneDto: UpdateToneDto,
  ): Promise<Tone> {
    return await this.tonesService.update(id, updateToneDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.tonesService.remove(id);
  }
}
