import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audience, Tone, Category, Topic } from '../../entities';

@Injectable()
export class AttributesService {
  constructor(
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Tone)
    private toneRepository: Repository<Tone>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async getAudiences(): Promise<Audience[]> {
    return this.audienceRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getAudience(id: number): Promise<Audience> {
    const audience = await this.audienceRepository.findOne({
      where: { id, isActive: true },
    });

    if (!audience) {
      throw new NotFoundException(`Audience with ID ${id} not found`);
    }

    return audience;
  }

  async getTones(): Promise<Tone[]> {
    return this.toneRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getTone(id: number): Promise<Tone> {
    const tone = await this.toneRepository.findOne({
      where: { id, isActive: true },
    });

    if (!tone) {
      throw new NotFoundException(`Tone with ID ${id} not found`);
    }

    return tone;
  }

  async getCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getCategory(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async getTopics(): Promise<Topic[]> {
    return this.topicRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getTopic(id: number): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id, isActive: true },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }
}