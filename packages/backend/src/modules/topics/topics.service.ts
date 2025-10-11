import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Topic, Session } from '../../entities';
import { CreateTopicDto } from './dto/create-topic.dto';
import { ImportTopicsDto, ImportTopicItemDto } from './dto/import-topics.dto';
import { recordsToCsv, CsvColumn } from '../../utils/csv.util';

export interface TopicExportRecord {
  id: number;
  name: string;
  description?: string | null;
  learningOutcomes?: string | null;
  trainerNotes?: string | null;
  materialsNeeded?: string | null;
  deliveryGuidance?: string | null;
  isActive: boolean;
  aiGeneratedContent?: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  sessionIds: string[];
}

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    @InjectRepository(Topic)
    private readonly topicRepository: Repository<Topic>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async findAll(): Promise<(Topic & { sessionCount: number })[]> {
    try {
      this.logger.log('Fetching all topics with session counts');

      // First, let's try a simple query to see if basic topic fetching works
      const simpleTopics = await this.topicRepository.find();
      this.logger.log(`Found ${simpleTopics.length} topics in database`);

      // Now try the complex query with session count
      const topics = await this.topicRepository
        .createQueryBuilder('topic')
        .loadRelationCountAndMap('topic.sessionCount', 'topic.sessions')
        .orderBy('topic.name', 'ASC')
        .getMany();

      this.logger.log(`Successfully fetched ${topics.length} topics with session counts`);

      return topics.map((topic) => ({
        ...topic,
        sessionCount: (topic as Topic & { sessionCount?: number }).sessionCount ?? 0,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch topics:', error.message);
      this.logger.error('Error stack:', error.stack);

      // Try fallback - return topics without session counts
      try {
        this.logger.log('Attempting fallback: fetching topics without session counts');
        const fallbackTopics = await this.topicRepository.find();
        this.logger.log(`Fallback successful: found ${fallbackTopics.length} topics`);

        return fallbackTopics.map((topic) => ({
          ...topic,
          sessionCount: 0, // Default to 0 if we can't count sessions
        }));
      } catch (fallbackError) {
        this.logger.error('Fallback query also failed:', fallbackError.message);
        this.logger.error('Fallback error stack:', fallbackError.stack);
        throw fallbackError; // Re-throw the fallback error
      }
    }
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
      aiGeneratedContent: dto.aiGeneratedContent,
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
    if (dto.aiGeneratedContent !== undefined) topic.aiGeneratedContent = dto.aiGeneratedContent;

    topic.updatedAt = new Date();

    return this.topicRepository.save(topic);
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const topic = await this.findOne(id);

    // Check if topic is used by any sessions
    const topicId = Number.parseInt(id, 10);
    const sessionCount = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.topics', 'topic')
      .where('topic.id = :topicId', { topicId })
      .getCount();

    if (sessionCount > 0) {
      return {
        deleted: false,
        message: `Cannot delete topic "${topic.name}" as it is used by ${sessionCount} session(s)`,
      };
    }

    await this.topicRepository.remove(topic);
    return { deleted: true };
  }

  private toIsoString(value: Date | string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  async exportAllDetailed(): Promise<TopicExportRecord[]> {
    const topics = await this.topicRepository.find({
      relations: ['sessions'],
      order: { name: 'ASC' },
    });

    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      learningOutcomes: topic.learningOutcomes,
      trainerNotes: topic.trainerNotes,
      materialsNeeded: topic.materialsNeeded,
      deliveryGuidance: topic.deliveryGuidance,
      isActive: topic.isActive,
      aiGeneratedContent: topic.aiGeneratedContent,
      createdAt: this.toIsoString(topic.createdAt),
      updatedAt: this.toIsoString(topic.updatedAt),
      sessionIds: Array.isArray(topic.sessions) ? topic.sessions.map((session) => session.id) : [],
    }));
  }

  buildTopicsExportCsv(records: TopicExportRecord[]): string {
    const columns: CsvColumn[] = [
      { key: 'id' },
      { key: 'name' },
      { key: 'description' },
      { key: 'learningOutcomes' },
      { key: 'trainerNotes' },
      { key: 'materialsNeeded' },
      { key: 'deliveryGuidance' },
      { key: 'isActive' },
      {
        key: 'aiGeneratedContent',
        header: 'aiGeneratedContent',
        transform: (value) => (value ? JSON.stringify(value) : ''),
      },
      { key: 'createdAt' },
      { key: 'updatedAt' },
      {
        key: 'sessionIds',
        header: 'sessionIds',
        transform: (value) => {
          if (!Array.isArray(value)) {
            return '';
          }
          if (value.length === 0) {
            return '';
          }
          return value.join(';');
        },
      },
    ];

    return recordsToCsv(
      records.map((record) => record as unknown as Record<string, unknown>),
      columns,
    );
  }

  async importTopics(payload: ImportTopicsDto) {
    const summary = {
      total: payload.topics.length,
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    for (const topicDto of payload.topics) {
      try {
        const result = await this.upsertTopic(topicDto);
        if (result === 'created') {
          summary.created += 1;
        } else {
          summary.updated += 1;
        }
      } catch (error: any) {
        const message = error?.message ?? 'Unknown error';
        summary.errors.push(`${topicDto.name}: ${message}`);
        this.logger.error(`Failed to import topic "${topicDto.name}": ${message}`);
      }
    }

    return summary;
  }

  private async upsertTopic(topicDto: ImportTopicItemDto): Promise<'created' | 'updated'> {
    let existing: Topic | null = null;

    if (topicDto.id) {
      existing = await this.topicRepository.findOne({ where: { id: topicDto.id } });
    }

    if (!existing) {
      existing = await this.topicRepository.findOne({
        where: { name: ILike(topicDto.name) },
      });
    }

    if (existing) {
      existing.name = topicDto.name;
      existing.description = topicDto.description ?? existing.description ?? null;
      existing.learningOutcomes = topicDto.learningOutcomes ?? existing.learningOutcomes ?? null;
      existing.trainerNotes = topicDto.trainerNotes ?? existing.trainerNotes ?? null;
      existing.materialsNeeded = topicDto.materialsNeeded ?? existing.materialsNeeded ?? null;
      existing.deliveryGuidance = topicDto.deliveryGuidance ?? existing.deliveryGuidance ?? null;
      existing.aiGeneratedContent = topicDto.aiGeneratedContent ?? existing.aiGeneratedContent ?? null;
      if (typeof topicDto.isActive === 'boolean') {
        existing.isActive = topicDto.isActive;
      }

      existing.updatedAt = new Date();
      await this.topicRepository.save(existing);
      return 'updated';
    }

    const topic = this.topicRepository.create({
      name: topicDto.name,
      description: topicDto.description,
      learningOutcomes: topicDto.learningOutcomes,
      trainerNotes: topicDto.trainerNotes,
      materialsNeeded: topicDto.materialsNeeded,
      deliveryGuidance: topicDto.deliveryGuidance,
      isActive: typeof topicDto.isActive === 'boolean' ? topicDto.isActive : true,
      aiGeneratedContent: topicDto.aiGeneratedContent,
    });

    await this.topicRepository.save(topic);
    return 'created';
  }
}
