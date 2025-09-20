import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../../entities/trainer.entity';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { TrainerQueryDto } from './dto/trainer-query.dto';

export interface PaginatedTrainers {
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

  async create(createTrainerDto: CreateTrainerDto): Promise<Trainer> {
    // Check if trainer with same email already exists (if email provided)
    if (createTrainerDto.email) {
      const existingTrainer = await this.trainerRepository.findOne({
        where: { email: createTrainerDto.email }
      });

      if (existingTrainer) {
        throw new ConflictException('Trainer with this email already exists');
      }
    }

    const trainer = this.trainerRepository.create(createTrainerDto);
    return await this.trainerRepository.save(trainer);
  }

  async findAll(query: TrainerQueryDto): Promise<PaginatedTrainers> {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.trainerRepository.createQueryBuilder('trainer');

    // Apply filters
    if (search) {
      queryBuilder.where(
        '(trainer.name ILIKE :search OR trainer.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('trainer.isActive = :isActive', { isActive });
    }

    // Add pagination and ordering
    queryBuilder
      .orderBy('trainer.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [trainers, total] = await queryBuilder.getManyAndCount();

    return {
      trainers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    return trainer;
  }

  async update(id: number, updateTrainerDto: UpdateTrainerDto): Promise<Trainer> {
    const trainer = await this.findOne(id);

    // Check for email conflicts if email is being updated
    if (updateTrainerDto.email && updateTrainerDto.email !== trainer.email) {
      const existingTrainer = await this.trainerRepository.findOne({
        where: { email: updateTrainerDto.email }
      });

      if (existingTrainer) {
        throw new ConflictException('Trainer with this email already exists');
      }
    }

    Object.assign(trainer, updateTrainerDto);
    return await this.trainerRepository.save(trainer);
  }

  async remove(id: number): Promise<void> {
    const trainer = await this.findOne(id);

    // Soft delete by setting isActive to false
    trainer.isActive = false;
    await this.trainerRepository.save(trainer);
  }

  async findActiveTrainers(): Promise<Trainer[]> {
    return await this.trainerRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async checkTrainerAvailable(trainerId: number): Promise<boolean> {
    const trainer = await this.findOne(trainerId);
    return trainer.isActive;
  }
}