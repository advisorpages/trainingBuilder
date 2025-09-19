import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience } from '../../entities/audience.entity';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { AudienceQueryDto } from './dto/audience-query.dto';

export interface PaginatedAudiences {
  audiences: Audience[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class AudiencesService {
  constructor(
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
  ) {}

  async create(createAudienceDto: CreateAudienceDto): Promise<Audience> {
    // Check for duplicate name
    const existingAudience = await this.audiencesRepository.findOne({
      where: { name: createAudienceDto.name }
    });

    if (existingAudience) {
      throw new BadRequestException('An audience with this name already exists');
    }

    const audience = this.audiencesRepository.create(createAudienceDto);
    return await this.audiencesRepository.save(audience);
  }

  async findAll(query: AudienceQueryDto): Promise<PaginatedAudiences> {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.audiencesRepository.createQueryBuilder('audience');

    if (search) {
      queryBuilder.where(
        'audience.name ILIKE :search OR audience.description ILIKE :search',
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
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveAudiences(): Promise<Audience[]> {
    return await this.audiencesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Audience> {
    const audience = await this.audiencesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    return audience;
  }

  async update(id: number, updateAudienceDto: UpdateAudienceDto): Promise<Audience> {
    const audience = await this.findOne(id);

    // Check for duplicate name if name is being updated
    if (updateAudienceDto.name && updateAudienceDto.name !== audience.name) {
      const existingAudience = await this.audiencesRepository.findOne({
        where: { name: updateAudienceDto.name }
      });

      if (existingAudience) {
        throw new BadRequestException('An audience with this name already exists');
      }
    }

    Object.assign(audience, updateAudienceDto);
    return await this.audiencesRepository.save(audience);
  }

  async remove(id: number): Promise<void> {
    const audience = await this.audiencesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    // Check if audience is in use by sessions
    if (audience.sessions && audience.sessions.length > 0) {
      throw new BadRequestException(
        `Cannot delete audience "${audience.name}" as it is referenced by ${audience.sessions.length} session(s). Please remove it from all sessions first.`
      );
    }

    await this.audiencesRepository.remove(audience);
  }

  async checkAudienceInUse(id: number): Promise<{ inUse: boolean; sessionCount: number }> {
    const audience = await this.audiencesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    const sessionCount = audience.sessions ? audience.sessions.length : 0;

    return {
      inUse: sessionCount > 0,
      sessionCount
    };
  }
}