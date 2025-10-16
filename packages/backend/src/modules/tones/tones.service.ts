import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tone, ToneUsageType } from '../../entities/tone.entity';
import { CreateToneDto, UpdateToneDto, ToneQueryDto } from './dto';

export interface PaginatedTonesResponse {
  tones: Tone[];
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
export class TonesService {
  constructor(
    @InjectRepository(Tone)
    private readonly toneRepository: Repository<Tone>,
  ) {}

  async create(createToneDto: CreateToneDto): Promise<Tone> {
    // Check if tone with same name already exists
    const existingTone = await this.toneRepository.findOne({
      where: { name: createToneDto.name },
    });

    if (existingTone) {
      throw new ConflictException('Tone with this name already exists');
    }

    const tone = this.toneRepository.create({
      ...createToneDto,
      usageType: createToneDto.usageType ?? ToneUsageType.INSTRUCTIONAL,
    });
    return await this.toneRepository.save(tone);
  }

  async findAll(query: ToneQueryDto): Promise<PaginatedTonesResponse> {
    const { search, isActive, usageType, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.toneRepository.createQueryBuilder('tone');

    if (search) {
      queryBuilder.where(
        '(tone.name ILIKE :search OR tone.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('tone.isActive = :isActive', { isActive });
    }

    const usageTypes = this.resolveUsageTypesFilter(usageType);
    if (usageTypes) {
      queryBuilder.andWhere('tone.usageType IN (:...usageTypes)', { usageTypes });
    }

    queryBuilder
      .orderBy('tone.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [tones, total] = await queryBuilder.getManyAndCount();

    return {
      tones,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActive(query: Partial<ToneQueryDto> = {}): Promise<Tone[]> {
    const queryBuilder = this.toneRepository
      .createQueryBuilder('tone')
      .where('tone.isActive = :isActive', { isActive: true })
      .orderBy('tone.name', 'ASC');

    const usageTypes = this.resolveUsageTypesFilter(query.usageType);
    if (usageTypes) {
      queryBuilder.andWhere('tone.usageType IN (:...usageTypes)', { usageTypes });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Tone> {
    const tone = await this.toneRepository.findOne({
      where: { id },
      relations: ['sessions', 'marketingSessions'],
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    return tone;
  }

  async update(id: number, updateToneDto: UpdateToneDto): Promise<Tone> {
    const tone = await this.findOne(id);

    // Check if name is being updated and if it conflicts with existing tone
    if (updateToneDto.name && updateToneDto.name !== tone.name) {
      const existingTone = await this.toneRepository.findOne({
        where: { name: updateToneDto.name },
      });

      if (existingTone) {
        throw new ConflictException('Tone with this name already exists');
      }
    }

    Object.assign(tone, updateToneDto);
    return await this.toneRepository.save(tone);
  }

  async remove(id: number): Promise<void> {
    const tone = await this.findOne(id);

    // Check if tone is being used by sessions
    const usageCheck = await this.checkUsage(id);
    if (usageCheck.inUse) {
      throw new ConflictException(
        `Cannot delete tone. It is currently used by ${usageCheck.sessionCount} session(s)`
      );
    }

    await this.toneRepository.remove(tone);
  }

  async checkUsage(id: number): Promise<UsageCheckResponse> {
    const tone = await this.toneRepository.findOne({
      where: { id },
      relations: ['sessions', 'marketingSessions'],
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    const instructionalCount = tone.sessions?.length ?? 0;
    const marketingCount = tone.marketingSessions?.length ?? 0;
    const sessionCount = instructionalCount + marketingCount;
    return {
      inUse: sessionCount > 0,
      sessionCount,
    };
  }

  private resolveUsageTypesFilter(usageType?: ToneUsageType): ToneUsageType[] | undefined {
    if (!usageType) {
      return undefined;
    }

    if (usageType === ToneUsageType.BOTH) {
      return [ToneUsageType.BOTH, ToneUsageType.INSTRUCTIONAL, ToneUsageType.MARKETING];
    }

    return [usageType, ToneUsageType.BOTH];
  }
}
