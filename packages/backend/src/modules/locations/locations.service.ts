import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '../../entities/location.entity';
import { CreateLocationDto, UpdateLocationDto, LocationQueryDto } from './dto';

export interface PaginatedLocationsResponse {
  locations: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsageCheckResponse {
  inUse: boolean;
  sessionCount?: number;
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
      where: { name: createLocationDto.name },
    });

    if (existingLocation) {
      throw new ConflictException('Location with this name already exists');
    }

    const location = this.locationRepository.create(createLocationDto);
    return await this.locationRepository.save(location);
  }

  async findAll(query: LocationQueryDto): Promise<PaginatedLocationsResponse> {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository.createQueryBuilder('location');

    if (search) {
      queryBuilder.where(
        '(location.name ILIKE :search OR location.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('location.isActive = :isActive', { isActive });
    }

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

  async findActive(): Promise<Location[]> {
    return await this.locationRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async update(id: number, updateLocationDto: UpdateLocationDto): Promise<Location> {
    const location = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing location
    if (updateLocationDto.name && updateLocationDto.name !== location.name) {
      const existingLocation = await this.locationRepository.findOne({
        where: { name: updateLocationDto.name },
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

    // Check if location is being used by sessions
    const usageCheck = await this.checkUsage(id);
    if (usageCheck.inUse) {
      throw new ConflictException(
        `Cannot delete location. It is currently used by ${usageCheck.sessionCount} session(s)`
      );
    }

    await this.locationRepository.remove(location);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    const sessionCount = location.sessions?.length || 0;
    return {
      inUse: sessionCount > 0,
      sessionCount,
    };
  }
}
