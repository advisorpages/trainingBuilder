import { NotFoundException } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { Topic } from '../../entities';

describe('TopicsService', () => {
  let service: TopicsService;
  let topicRepository: ReturnType<typeof createTopicRepositoryMock>;
  let sessionRepository: ReturnType<typeof createSessionRepositoryMock>;

  beforeEach(() => {
    topicRepository = createTopicRepositoryMock();
    sessionRepository = createSessionRepositoryMock();
    service = new TopicsService(topicRepository as unknown as any, sessionRepository as unknown as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns topics with session counts', async () => {
    const queryBuilder = topicRepository.__queryBuilder;
    const topics: (Topic & { sessionCount?: number })[] = [
      {
        id: 1,
        name: 'Leadership Fundamentals',
        description: 'Core leadership skills',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        aiGeneratedContent: null,
        learningOutcomes: null,
        trainerNotes: null,
        materialsNeeded: null,
        deliveryGuidance: null,
        sessions: [],
        sessionCount: 2,
      },
    ];

    queryBuilder.getMany.mockResolvedValue(topics);

    const result = await service.findAll();

    expect(topicRepository.createQueryBuilder).toHaveBeenCalledWith('topic');
    expect(queryBuilder.loadRelationCountAndMap).toHaveBeenCalledWith('topic.sessionCount', 'topic.sessions');
    expect(queryBuilder.getMany).toHaveBeenCalled();
    expect(result).toEqual([
      {
        ...topics[0],
        sessionCount: 2,
      },
    ]);
  });

  it('findOne returns topic when found', async () => {
    const topic: Topic = {
      id: 5,
      name: 'Team Building',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGeneratedContent: null,
      learningOutcomes: null,
      trainerNotes: null,
      materialsNeeded: null,
      deliveryGuidance: null,
      sessions: [],
    };

    topicRepository.findOne.mockResolvedValue(topic);

    const result = await service.findOne('5');

    expect(topicRepository.findOne).toHaveBeenCalledWith({
      where: { id: 5 },
      relations: ['sessions'],
    });
    expect(result).toBe(topic);
  });

  it('findOne throws when topic missing', async () => {
    topicRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('99')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove prevents deletion when topic in use', async () => {
    const topic: Topic = {
      id: 3,
      name: 'Coaching',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGeneratedContent: null,
      learningOutcomes: null,
      trainerNotes: null,
      materialsNeeded: null,
      deliveryGuidance: null,
      sessions: [],
    };

    topicRepository.findOne.mockResolvedValue(topic);
    sessionRepository.count.mockResolvedValue(2);

    const result = await service.remove('3');

    expect(result).toEqual({
      deleted: false,
      message: 'Cannot delete topic "Coaching" as it is used by 2 session(s)',
    });
    expect(topicRepository.remove).not.toHaveBeenCalled();
  });

  it('remove deletes topic when unused', async () => {
    const topic: Topic = {
      id: 4,
      name: 'Strategic Planning',
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiGeneratedContent: null,
      learningOutcomes: null,
      trainerNotes: null,
      materialsNeeded: null,
      deliveryGuidance: null,
      sessions: [],
    };

    topicRepository.findOne.mockResolvedValue(topic);
    sessionRepository.count.mockResolvedValue(0);

    const result = await service.remove('4');

    expect(sessionRepository.count).toHaveBeenCalledWith({ where: { topic: { id: 4 } } as any });
    expect(topicRepository.remove).toHaveBeenCalledWith(topic);
    expect(result).toEqual({ deleted: true });
  });
});

function createTopicRepositoryMock() {
  const queryBuilder = {
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  return {
    __queryBuilder: queryBuilder,
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    findOne: jest.fn(),
    create: jest.fn((input) => input as Topic),
    save: jest.fn(),
    remove: jest.fn(),
  } as const;
}

function createSessionRepositoryMock() {
  return {
    count: jest.fn(),
  } as const;
}
