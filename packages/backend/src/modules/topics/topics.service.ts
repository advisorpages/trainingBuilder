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
      .loadRelationCountAndMap('topic.sessionCount', 'topic.sessions')
      .orderBy('topic.name', 'ASC')
      .getMany();

    return topics.map((topic) => ({
      ...topic,
      sessionCount: (topic as Topic & { sessionCount?: number }).sessionCount ?? 0,
    }));
  }

  async findOne(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id: parseInt(id) },
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
      learningOutcomes: dto.learningOutcomes,
      trainerNotes: dto.trainerNotes,
      materialsNeeded: dto.materialsNeeded,
      deliveryGuidance: dto.deliveryGuidance,
    });

    return this.topicRepository.save(topic);
  }

  async update(id: string, dto: Partial<CreateTopicDto>): Promise<Topic> {
    const topic = await this.findOne(id);

    if (dto.name !== undefined) topic.name = dto.name;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.learningOutcomes !== undefined) topic.learningOutcomes = dto.learningOutcomes;
    if (dto.trainerNotes !== undefined) topic.trainerNotes = dto.trainerNotes;
    if (dto.materialsNeeded !== undefined) topic.materialsNeeded = dto.materialsNeeded;
    if (dto.deliveryGuidance !== undefined) topic.deliveryGuidance = dto.deliveryGuidance;

    return this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const topic = await this.findOne(id);

    // Check if topic is used by any sessions
    const sessionCount = await this.sessionRepository.count({ where: { topic: { id: parseInt(id) } } });

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
