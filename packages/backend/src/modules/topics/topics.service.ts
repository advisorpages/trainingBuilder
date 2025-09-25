import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic, Session } from '../../entities';
import { CreateTopicDto } from './dto/create-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async findAll(): Promise<(Topic & { sessionCount: number })[]> {
    const topics = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoin('topic.sessions', 'session')
      .addSelect('COUNT(session.id)', 'sessionCount')
      .groupBy('topic.id')
      .orderBy('topic.name', 'ASC')
      .getRawAndEntities();

    return topics.entities.map((topic, index) => ({
      ...topic,
      sessionCount: parseInt(topics.raw[index].sessionCount) || 0,
    }));
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!topic) {
      throw new NotFoundException(`Topic ${id} not found`);
    }

    return topic;
  }

  async create(dto: CreateTopicDto): Promise<Topic> {
    const topic = this.topicRepository.create({
      name: dto.name,
      description: dto.description,
      tags: dto.tags ? dto.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
    });

    return this.topicRepository.save(topic);
  }

  async update(id: string, dto: Partial<CreateTopicDto>): Promise<Topic> {
    const topic = await this.findOne(id);

    if (dto.name !== undefined) topic.name = dto.name;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.tags !== undefined) {
      topic.tags = dto.tags ? dto.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
    }

    return this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const topic = await this.findOne(id);

    // Check if topic is used by any sessions
    const sessionCount = await this.sessionRepository.count({ where: { topic: { id } } });

    if (sessionCount > 0) {
      return {
        deleted: false,
        message: `Cannot delete topic "${topic.name}" as it is used by ${sessionCount} session(s)`,
      };
    }

    await this.topicRepository.remove(topic);
    return { deleted: true };
  }
}
