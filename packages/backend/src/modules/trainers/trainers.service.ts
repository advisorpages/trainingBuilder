import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from '../../entities';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  findAll(): Promise<Trainer[]> {
    return this.trainerRepository.find({ order: { name: 'ASC' } });
  }
}
