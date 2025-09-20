import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationQueryDto } from './dto/location-query.dto';

export interface PaginatedLocations {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async create(createLocationDto: CreateLocationDto): Promise<Location> {
    // Check if location with same name already exists
    const existingLocation = await this.locationRepository.findOne({
      where: { name: createLocationDto.name }
    });

    if (existingLocation) {
      throw new ConflictException('Location with this name already exists');
    }

    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(query: LocationQueryDto): Promise<PaginatedLocations> {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository.createQueryBuilder('location');

    // Apply filters
    if (search) {
      queryBuilder.where(
        '(location.name ILIKE :search OR location.address ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('location.isActive = :isActive', { isActive });
    }

    // Add pagination and ordering
    queryBuilder
      .orderBy('location.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [locations, total] = await queryBuilder.getManyAndCount();

    return {
      locations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    // Check for name conflicts if name is being updated
    if (updateLocationDto.name && updateLocationDto.name !== location.name) {
      const existingLocation = await this.locationRepository.findOne({
        where: { name: updateLocationDto.name }
      });

      if (existingLocation) {
        throw new ConflictException('Location with this name already exists');
      }
    }

    Object.assign(location, updateLocationDto);
    return await this.locationRepository.save(location);
  }

  async remove(id: number): Promise<void> {
    const location = await this.findOne(id);

    // Soft delete by setting isActive to false
    location.isActive = false;
    await this.locationRepository.save(location);
  }

  async findActiveLocations(): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async checkCapacityAvailable(locationId: number, requiredCapacity: number): Promise<boolean> {
    const location = await this.findOne(locationId);

    if (!location.capacity) {
      return true; // No capacity limit set
    }

    return location.capacity >= requiredCapacity;
  }
}