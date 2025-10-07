import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience } from '../../entities/audience.entity';
import { CreateAudienceDto, UpdateAudienceDto, AudienceQueryDto } from './dto';

export interface PaginatedAudiencesResponse {
  audiences: Audience[];
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
export class AudiencesService {
  constructor(
    @InjectRepository(Audience)
    private readonly audienceRepository: Repository<Audience>,
  ) {}

  async create(createAudienceDto: CreateAudienceDto): Promise<Audience> {
    // Check if audience with same name already exists
    const existingAudience = await this.audienceRepository.findOne({
      where: { name: createAudienceDto.name },
    });

    if (existingAudience) {
      throw new ConflictException('Audience with this name already exists');
    }

    const audience = this.audienceRepository.create(createAudienceDto);
    return await this.audienceRepository.save(audience);
  }

  async findAll(query: AudienceQueryDto): Promise<PaginatedAudiencesResponse> {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.audienceRepository.createQueryBuilder('audience');

    if (search) {
      queryBuilder.where(
        '(audience.name ILIKE :search OR audience.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('audience.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('audience.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [audiences, total] = await queryBuilder.getManyAndCount();

    return {
      audiences,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActive(): Promise<Audience[]> {
    return await this.audienceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Audience> {
    const audience = await this.audienceRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    return audience;
  }

  async update(id: number, updateAudienceDto: UpdateAudienceDto): Promise<Audience> {
    const audience = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing audience
    if (updateAudienceDto.name && updateAudienceDto.name !== audience.name) {
      const existingAudience = await this.audienceRepository.findOne({
        where: { name: updateAudienceDto.name },
      });

      if (existingAudience) {
        throw new ConflictException('Audience with this name already exists');
      }
    }

    Object.assign(audience, updateAudienceDto);
    return await this.audienceRepository.save(audience);
  }

  async remove(id: number): Promise<void> {
    const audience = await this.findOne(id);

    // Check if audience is being used by sessions
    const usageCheck = await this.checkUsage(id);
    if (usageCheck.inUse) {
      throw new ConflictException(
        `Cannot delete audience. It is currently used by ${usageCheck.sessionCount} session(s)`
      );
    }

    await this.audienceRepository.remove(audience);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const audience = await this.audienceRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    const sessionCount = audience.sessions?.length || 0;
    return {
      inUse: sessionCount > 0,
      sessionCount,
    };
  }
}
