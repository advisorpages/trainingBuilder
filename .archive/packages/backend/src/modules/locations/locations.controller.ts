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
import { LocationsService, PaginatedLocations } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@shared/types';
import { Location } from '../../entities/location.entity';

@Controller('admin/locations')
@UseGuards(JwtAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLocationDto: CreateLocationDto): Promise<Location> {
    return await this.locationsService.create(createLocationDto);
  }

  @Get()
  async findAll(@Query() query: LocationQueryDto): Promise<PaginatedLocations> {
    return await this.locationsService.findAll(query);
  }

  @Get('active')
  async findActiveLocations(): Promise<Location[]> {
    return await this.locationsService.findActiveLocations();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Location> {
    return await this.locationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    return await this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CONTENT_DEVELOPER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.locationsService.remove(id);
  }

  @Get(':id/capacity-check')
  async checkCapacity(
    @Param('id', ParseIntPipe) id: number,
    @Query('required', ParseIntPipe) requiredCapacity: number,
  ): Promise<{ available: boolean; capacity?: number }> {
    const location = await this.locationsService.findOne(id);
    const available = await this.locationsService.checkCapacityAvailable(id, requiredCapacity);

    return {
      available,
      capacity: location.capacity,
    };
  }
}