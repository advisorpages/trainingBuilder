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
import { LocationsService, PaginatedLocationsResponse, UsageCheckResponse } from './locations.service';
import { CreateLocationDto, UpdateLocationDto, LocationQueryDto } from './dto';
import { Location } from '../../entities/location.entity';

@Controller('admin/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createLocationDto: CreateLocationDto): Promise<Location> {
    return await this.locationsService.create(createLocationDto);
  }

  @Get()
  async findAll(@Query() query: LocationQueryDto): Promise<PaginatedLocationsResponse> {
    return await this.locationsService.findAll(query);
  }

  @Get('active')
  async findActive(): Promise<Location[]> {
    return await this.locationsService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Location> {
    return await this.locationsService.findOne(id);
  }

  @Get(':id/usage-check')
  async checkUsage(@Param('id', ParseIntPipe) id: number): Promise<UsageCheckResponse> {
    return await this.locationsService.checkUsage(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
  ): Promise<Location> {
    return await this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.locationsService.remove(id);
  }
}
