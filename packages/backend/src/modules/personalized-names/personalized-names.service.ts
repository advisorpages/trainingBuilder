import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonalizedName } from '../../entities/personalized-name.entity';
import { CreatePersonalizedNameDto, UpdatePersonalizedNameDto } from './dto';

@Injectable()
export class PersonalizedNamesService {
  constructor(
    @InjectRepository(PersonalizedName)
    private readonly personalizedNameRepository: Repository<PersonalizedName>,
  ) {}

  async create(userId: string, createDto: CreatePersonalizedNameDto): Promise<PersonalizedName> {
    const personalizedName = this.personalizedNameRepository.create({
      userId,
      ...createDto,
    });

    return this.personalizedNameRepository.save(personalizedName);
  }

  async findAll(userId: string): Promise<PersonalizedName[]> {
    return this.personalizedNameRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(userId: string, id: string): Promise<PersonalizedName> {
    const personalizedName = await this.personalizedNameRepository.findOne({
      where: { id, userId, isActive: true },
    });

    if (!personalizedName) {
      throw new NotFoundException(`Personalized name with ID ${id} not found`);
    }

    return personalizedName;
  }

  async update(userId: string, id: string, updateDto: UpdatePersonalizedNameDto): Promise<PersonalizedName> {
    const personalizedName = await this.findOne(userId, id);

    Object.assign(personalizedName, updateDto);
    return this.personalizedNameRepository.save(personalizedName);
  }

  async remove(userId: string, id: string): Promise<void> {
    const personalizedName = await this.findOne(userId, id);

    personalizedName.isActive = false;
    await this.personalizedNameRepository.save(personalizedName);
  }

  async findByType(userId: string, type: string): Promise<PersonalizedName | null> {
    return this.personalizedNameRepository.findOne({
      where: { userId, type: type as any, isActive: true },
    });
  }

  async getNameByType(userId: string, type: string): Promise<string | null> {
    const personalizedName = await this.findByType(userId, type);
    return personalizedName ? personalizedName.name : null;
  }
}