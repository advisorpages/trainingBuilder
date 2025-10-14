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
    console.log('[TrainersController] GET /admin/trainers called with query:', query);
    const result = await this.trainersService.findAll(query);
    console.log(`[TrainersController] Returning ${result.total} trainers (page ${result.page})`);
    return result;
  }

  // IMPORTANT: 'active' route MUST come before ':id' route
  // to prevent 'active' being interpreted as an ID
  @Get('active')
  async listActive() {
    console.log('[TrainersController] GET /admin/trainers/active called');
    const result = await this.trainersService.findActive();
    console.log(`[TrainersController] Returning ${result.length} active trainers`);
    return result;
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    console.log(`[TrainersController] GET /admin/trainers/${id} called`);

    // Safety check: if someone tries to access /active but it hits this route
    if (id === 'active' as any) {
      console.error('[TrainersController] ERROR: "active" was interpreted as :id parameter!');
      throw new Error('Route misconfiguration: "active" should not be treated as an ID');
    }

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
