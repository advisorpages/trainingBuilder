import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Trainer } from '../../entities';

export interface CreateTrainerDto {
  name: string;
  email: string;
  bio?: string;
  phone?: string;
  expertiseTags?: string[];
  timezone?: string;
}

export interface UpdateTrainerDto {
  name?: string;
  email?: string;
  bio?: string;
  phone?: string;
  expertiseTags?: string[];
  timezone?: string;
  isActive?: boolean;
}

export interface TrainerQueryDto {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedTrainersResponse {
  trainers: Trainer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  async findAll(query?: TrainerQueryDto): Promise<PaginatedTrainersResponse> {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    const whereConditions: any = {};

    // Filter by active status
    if (query?.isActive !== undefined) {
      whereConditions.isActive = query.isActive;
    }

    // Search across name, email, and bio
    let queryBuilder = this.trainerRepository
      .createQueryBuilder('trainer')
      .where(whereConditions);

    if (query?.search) {
      queryBuilder = queryBuilder.andWhere(
        '(trainer.name LIKE :search OR trainer.email LIKE :search OR trainer.bio LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const [trainers, total] = await queryBuilder
      .orderBy('trainer.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      trainers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({ where: { id } });
    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${id} not found`);
    }
    return trainer;
  }

  async findActive(): Promise<Trainer[]> {
    const trainers = await this.trainerRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    console.log(`[TrainersService] findActive() returned ${trainers.length} active trainers`);
    if (trainers.length === 0) {
      console.warn('[TrainersService] No active trainers found in database!');
    }

    return trainers;
  }

  async create(dto: CreateTrainerDto): Promise<Trainer> {
    // Check if email already exists
    const existing = await this.trainerRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`Trainer with email ${dto.email} already exists`);
    }

    const trainer = this.trainerRepository.create({
      ...dto,
      isActive: true,
    });

    return this.trainerRepository.save(trainer);
  }

  async update(id: number, dto: UpdateTrainerDto): Promise<Trainer> {
    const trainer = await this.findById(id);

    // If email is being updated, check for conflicts
    if (dto.email && dto.email !== trainer.email) {
      const existing = await this.trainerRepository.findOne({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException(`Trainer with email ${dto.email} already exists`);
      }
    }

    Object.assign(trainer, dto);
    return this.trainerRepository.save(trainer);
  }

  async delete(id: number): Promise<void> {
    const trainer = await this.findById(id);
    await this.trainerRepository.remove(trainer);
  }
}
