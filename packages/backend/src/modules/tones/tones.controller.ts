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
import { TonesService, PaginatedTones } from './tones.service';
import { CreateToneDto } from './dto/create-tone.dto';
import { UpdateToneDto } from './dto/update-tone.dto';
import { ToneQueryDto } from './dto/tone-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { Tone } from '../../entities/tone.entity';

@Controller('admin/tones')
@UseGuards(JwtAuthGuard)
export class TonesController {
  constructor(private readonly tonesService: TonesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createToneDto: CreateToneDto): Promise<Tone> {
    return await this.tonesService.create(createToneDto);
  }

  @Get()
  async findAll(@Query() query: ToneQueryDto): Promise<PaginatedTones> {
    return await this.tonesService.findAll(query);
  }

  @Get('active')
  async findActiveTones(): Promise<Tone[]> {
    return await this.tonesService.findActiveTones();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Tone> {
    return await this.tonesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateToneDto: UpdateToneDto,
  ): Promise<Tone> {
    return await this.tonesService.update(id, updateToneDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.tonesService.remove(id);
  }

  @Get(':id/usage-check')
  async checkUsage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ inUse: boolean; sessionCount: number }> {
    return await this.tonesService.checkToneInUse(id);
  }
}