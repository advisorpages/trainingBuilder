import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Tone } from '../../entities/tone.entity';
import { CreateToneDto } from './dto/create-tone.dto';
import { UpdateToneDto } from './dto/update-tone.dto';
import { ToneQueryDto } from './dto/tone-query.dto';

export interface PaginatedTones {
  tones: Tone[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class TonesService {
  constructor(
    @InjectRepository(Tone)
    private tonesRepository: Repository<Tone>,
  ) {}

  async create(createToneDto: CreateToneDto): Promise<Tone> {
    // Check for duplicate name
    const existingTone = await this.tonesRepository.findOne({
      where: { name: createToneDto.name }
    });

    if (existingTone) {
      throw new BadRequestException('A tone with this name already exists');
    }

    const tone = this.tonesRepository.create(createToneDto);
    return await this.tonesRepository.save(tone);
  }

  async findAll(query: ToneQueryDto): Promise<PaginatedTones> {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.tonesRepository.createQueryBuilder('tone');

    if (search) {
      queryBuilder.where(
        'tone.name ILIKE :search OR tone.description ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('tone.isActive = :isActive', { isActive });
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
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveTones(): Promise<Tone[]> {
    return await this.tonesRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Tone> {
    const tone = await this.tonesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    return tone;
  }

  async update(id: number, updateToneDto: UpdateToneDto): Promise<Tone> {
    const tone = await this.findOne(id);

    // Check for duplicate name if name is being updated
    if (updateToneDto.name && updateToneDto.name !== tone.name) {
      const existingTone = await this.tonesRepository.findOne({
        where: { name: updateToneDto.name }
      });

      if (existingTone) {
        throw new BadRequestException('A tone with this name already exists');
      }
    }

    Object.assign(tone, updateToneDto);
    return await this.tonesRepository.save(tone);
  }

  async remove(id: number): Promise<void> {
    const tone = await this.tonesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    // Check if tone is in use by sessions
    if (tone.sessions && tone.sessions.length > 0) {
      throw new BadRequestException(
        `Cannot delete tone "${tone.name}" as it is referenced by ${tone.sessions.length} session(s). Please remove it from all sessions first.`
      );
    }

    await this.tonesRepository.remove(tone);
  }

  async checkToneInUse(id: number): Promise<{ inUse: boolean; sessionCount: number }> {
    const tone = await this.tonesRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    const sessionCount = tone.sessions ? tone.sessions.length : 0;

    return {
      inUse: sessionCount > 0,
      sessionCount
    };
  }
}