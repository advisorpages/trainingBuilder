import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incentive } from '../../entities';
import { CreateIncentiveDto } from './dto/create-incentive.dto';

@Injectable()
export class IncentivesService {
  constructor(
    @InjectRepository(Incentive)
    private readonly incentiveRepository: Repository<Incentive>,
  ) {}

  findAll(): Promise<Incentive[]> {
    return this.incentiveRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateIncentiveDto): Promise<Incentive> {
    const incentive = this.incentiveRepository.create({
      name: dto.name,
      overview: dto.overview,
      terms: dto.terms,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      isActive: dto.isActive ?? true,
    });

    return this.incentiveRepository.save(incentive);
  }
}
