import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Topic } from '../../entities/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicQueryDto } from './dto/topic-query.dto';

export interface PaginatedTopics {
  topics: Topic[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicsRepository: Repository<Topic>,
  ) {}

  async create(createTopicDto: CreateTopicDto): Promise<Topic> {
    // Check for duplicate name
    const existingTopic = await this.topicsRepository.findOne({
      where: { name: createTopicDto.name }
    });

    if (existingTopic) {
      throw new BadRequestException('A topic with this name already exists');
    }

    const topic = this.topicsRepository.create(createTopicDto);
    return await this.topicsRepository.save(topic);
  }

  async findAll(query: TopicQueryDto): Promise<PaginatedTopics> {
    const { page = 1, limit = 10, search, isActive } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.topicsRepository.createQueryBuilder('topic');

    if (search) {
      queryBuilder.where(
        'topic.name ILIKE :search OR topic.description ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('topic.isActive = :isActive', { isActive });
    }

    queryBuilder
      .orderBy('topic.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [topics, total] = await queryBuilder.getManyAndCount();

    return {
      topics,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActiveTopics(): Promise<Topic[]> {
    return await this.topicsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  async findOne(id: number): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    return topic;
  }

  async update(id: number, updateTopicDto: UpdateTopicDto): Promise<Topic> {
    const topic = await this.findOne(id);

    // Check for duplicate name if name is being updated
    if (updateTopicDto.name && updateTopicDto.name !== topic.name) {
      const existingTopic = await this.topicsRepository.findOne({
        where: { name: updateTopicDto.name }
      });

      if (existingTopic) {
        throw new BadRequestException('A topic with this name already exists');
      }
    }

    Object.assign(topic, updateTopicDto);
    return await this.topicsRepository.save(topic);
  }

  async remove(id: number): Promise<void> {
    const topic = await this.topicsRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    // Check if topic is in use by sessions
    if (topic.sessions && topic.sessions.length > 0) {
      throw new BadRequestException(
        `Cannot delete topic "${topic.name}" as it is referenced by ${topic.sessions.length} session(s). Please remove it from all sessions first.`
      );
    }

    await this.topicsRepository.remove(topic);
  }

  async checkTopicInUse(id: number): Promise<{ inUse: boolean; sessionCount: number }> {
    const topic = await this.topicsRepository.findOne({
      where: { id },
      relations: ['sessions']
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    const sessionCount = topic.sessions ? topic.sessions.length : 0;

    return {
      inUse: sessionCount > 0,
      sessionCount
    };
  }
}