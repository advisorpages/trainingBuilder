import { describe, it, expect, beforeEach, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock('../api.service', () => ({
  api: {
    get: apiMocks.getMock,
    post: apiMocks.postMock,
  },
}));

import { sessionBuilderService } from '../session-builder.service';

const { getMock, postMock } = apiMocks;

describe('sessionBuilderService', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
  });

  it('creates missing topics when publishing a session from outline suggestions', async () => {
    getMock.mockResolvedValueOnce({ data: [] });

    postMock.mockImplementation(async (url: string, payload: any) => {
      if (url === '/sessions') {
        return { data: { id: 'session-001', status: 'published', ...payload } };
      }

      if (url === '/topics') {
        return { data: { id: 999, ...payload } };
      }

      throw new Error(`Unexpected POST to ${url}`);
    });

    await sessionBuilderService.createSessionFromOutline({
      outline: {
        sections: [
          {
            id: 'section-1',
            type: 'opener',
            position: 1,
            title: 'Warm Welcome',
            duration: 10,
            description: 'Kick-off the session.',
          },
          {
            id: 'section-2',
            type: 'topic',
            position: 2,
            title: 'Leading with Empathy',
            duration: 30,
            description: 'Explore empathetic leadership techniques.',
            learningObjectives: ['Recognize empathy blockers'],
            isTopicSuggestion: true,
          },
        ],
        totalDuration: 40,
        suggestedSessionTitle: 'Empathetic Leadership Workshop',
        suggestedDescription: 'Help leaders navigate change with empathy.',
        difficulty: 'Intermediate',
        recommendedAudienceSize: '10-25',
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
      input: {
        title: 'Empathy in Action',
        category: 'Leadership',
        sessionType: 'workshop',
        desiredOutcome: 'Equip managers to lead change with empathy.',
        currentProblem: 'Teams are struggling with change fatigue.',
        specificTopics: 'Change leadership, empathy',
        date: '2025-05-01',
        startTime: new Date('2025-05-01T18:00:00Z').toISOString(),
        endTime: new Date('2025-05-01T19:00:00Z').toISOString(),
      },
      readinessScore: 95,
    });

    expect(postMock).toHaveBeenCalledWith(
      '/topics',
      expect.objectContaining({
        name: 'Leading with Empathy',
        description: 'Explore empathetic leadership techniques.',
        learningOutcomes: 'Recognize empathy blockers',
      })
    );

    expect(postMock).toHaveBeenCalledWith('/sessions', expect.any(Object));
  });
});
