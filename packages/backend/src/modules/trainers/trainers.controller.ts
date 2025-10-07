import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  TrainersService,
  CreateTrainerDto,
  UpdateTrainerDto,
  TrainerQueryDto,
} from './trainers.service';

@Controller('admin/trainers')
export class TrainersController {
  constructor(private readonly trainersService: TrainersService) {}

  @Get()
  async list(@Query() query: TrainerQueryDto) {
    return this.trainersService.findAll(query);
  }

  @Get('active')
  async listActive() {
    return this.trainersService.findActive();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.trainersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateTrainerDto) {
    return this.trainersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTrainerDto,
  ) {
    return this.trainersService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.trainersService.delete(id);
    return { message: 'Trainer deleted successfully' };
  }
}
