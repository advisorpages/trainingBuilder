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
import { TrainersService, PaginatedTrainers } from './trainers.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerQueryDto } from './dto/trainer-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { Trainer } from '../../entities/trainer.entity';

@Controller('admin/trainers')
@UseGuards(JwtAuthGuard)
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTrainerDto: CreateTrainerDto): Promise<Trainer> {
    return await this.trainersService.create(createTrainerDto);
  }

  @Get()
  async findAll(@Query() query: TrainerQueryDto): Promise<PaginatedTrainers> {
    return await this.trainersService.findAll(query);
  }

  @Get('active')
  async findActiveTrainers(): Promise<Trainer[]> {
    return await this.trainersService.findActiveTrainers();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Trainer> {
    return await this.trainersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTrainerDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    return await this.trainersService.update(id, updateTrainerDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.trainersService.remove(id);
  }

  @Get(':id/availability-check')
  async checkAvailability(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ available: boolean }> {
    const available = await this.trainersService.checkTrainerAvailable(id);

    return {
      available,
    };
  }
}