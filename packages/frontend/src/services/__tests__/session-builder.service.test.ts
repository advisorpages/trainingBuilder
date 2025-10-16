import { describe, it, expect, beforeEach, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
}));

vi.mock('../api.service', () => ({
  api: {
    get: apiMocks.getMock,
    post: apiMocks.postMock,
    patch: apiMocks.patchMock,
  },
}));

import { sessionBuilderService } from '../session-builder.service';

const { getMock, postMock, patchMock } = apiMocks;

describe('sessionBuilderService', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    patchMock.mockReset();
  });

  it('creates missing topics when publishing a session from outline suggestions', async () => {
    getMock.mockImplementation(async (url: string) => {
      if (url === '/topics') {
        return { data: [] };
      }

      if (url.startsWith('/admin/categories/')) {
        const id = Number(url.split('/').pop());
        return { data: { id, name: 'Leadership Development' } };
      }

      if (url === '/admin/categories/active') {
        return {
          data: [
            { id: 9, name: 'Opening' },
            { id: 10, name: 'Closing' },
            { id: 1, name: 'Leadership Development' },
          ],
        };
      }

      throw new Error(`Unexpected GET to ${url}`);
    });

    postMock.mockImplementation(async (url: string, payload: any) => {
      if (url === '/sessions') {
        return { data: { id: 'session-001', status: 'published', ...payload } };
      }

      if (url === '/topics') {
        return { data: { id: 999, ...payload } };
      }

      if (url === '/admin/categories') {
        return { data: { id: 42, ...payload } };
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
        name: 'Warm Welcome',
        aiGeneratedContent: expect.objectContaining({
          categoryName: 'Opening',
        }),
      })
    );

    expect(postMock).toHaveBeenCalledWith(
      '/topics',
      expect.objectContaining({
        name: 'Leading with Empathy',
        description: 'Explore empathetic leadership techniques.',
        learningOutcomes: 'Recognize empathy blockers',
        aiGeneratedContent: expect.objectContaining({
          categoryName: 'Leadership',
        }),
      })
    );

    const sessionPayload = postMock.mock.calls.find(([url]) => url === '/sessions')?.[1];
    expect(sessionPayload).toBeDefined();
    expect(sessionPayload.sessionTopics).toHaveLength(2);
    expect(sessionPayload.sessionTopics.map((topic: any) => topic.sequenceOrder)).toEqual([1, 2]);

    expect(postMock).toHaveBeenCalledWith('/sessions', expect.any(Object));
  });

  it('captures all AI-generated fields when creating topics from outline', async () => {
    getMock.mockImplementation(async (url: string) => {
      if (url === '/topics') {
        return { data: [] };
      }

      if (url.startsWith('/admin/categories/')) {
        const id = Number(url.split('/').pop());
        return { data: { id, name: 'Leadership Development' } };
      }

      if (url === '/admin/categories/active') {
        return {
          data: [
            { id: 1, name: 'Leadership Development' },
            { id: 9, name: 'Opening' },
            { id: 10, name: 'Closing' },
          ],
        };
      }

      throw new Error(`Unexpected GET to ${url}`);
    });

    postMock.mockImplementation(async (url: string, payload: any) => {
      if (url === '/sessions') {
        return { data: { id: 'session-002', status: 'draft', ...payload } };
      }

      if (url === '/topics') {
        return { data: { id: 888, ...payload } };
      }

      if (url === '/admin/categories') {
        return { data: { id: 42, ...payload } };
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
            title: 'Welcome & Icebreaker',
            duration: 10,
            description: 'Set the tone for the session.',
            learningObjectives: ['Create a safe learning environment'],
            materialsNeeded: ['Name tags', 'Sticky notes'],
            trainerNotes: 'Start with energy and enthusiasm',
            deliveryGuidance: 'Keep it light and engaging',
          },
          {
            id: 'section-2',
            type: 'topic',
            position: 2,
            title: 'Strategic Decision Making',
            duration: 45,
            description: 'Learn frameworks for making tough decisions.',
            learningObjectives: ['Apply decision-making frameworks', 'Evaluate trade-offs'],
            suggestedActivities: ['Case study analysis', 'Group discussion'],
            materialsNeeded: ['Case study handouts', 'Decision matrix templates'],
            trainerNotes: 'Emphasize real-world applications',
            deliveryGuidance: 'Use the Eisenhower Matrix as a visual aid',
          },
          {
            id: 'section-3',
            type: 'closing',
            position: 3,
            title: 'Wrap Up & Next Steps',
            duration: 15,
            description: 'Summarize key learnings and action items.',
            keyTakeaways: ['Decision frameworks improve outcomes', 'Practice makes perfect'],
            actionItems: ['Apply one framework this week', 'Share results with the team'],
            nextSteps: ['Schedule follow-up session in 2 weeks'],
          },
        ],
        totalDuration: 70,
        suggestedSessionTitle: 'Strategic Leadership Workshop',
        suggestedDescription: 'Develop strategic decision-making skills.',
        difficulty: 'Advanced',
        recommendedAudienceSize: '12-20',
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
      input: {
        title: 'Strategic Leadership',
        category: 'Leadership Development',
        categoryId: 1,
        sessionType: 'workshop',
        desiredOutcome: 'Improve decision-making skills.',
        date: '2025-06-01',
        startTime: new Date('2025-06-01T14:00:00Z').toISOString(),
        endTime: new Date('2025-06-01T15:10:00Z').toISOString(),
      },
      readinessScore: 85,
    });

    // Verify opener topic captures all fields
    expect(postMock).toHaveBeenCalledWith(
      '/topics',
      expect.objectContaining({
        name: 'Welcome & Icebreaker',
        description: 'Set the tone for the session.',
        learningOutcomes: 'Create a safe learning environment',
        materialsNeeded: 'Name tags\nSticky notes',
        trainerNotes: 'Start with energy and enthusiasm',
        deliveryGuidance: 'Keep it light and engaging',
        aiGeneratedContent: expect.objectContaining({
          categoryName: 'Opening',
          materialsNeeded: ['Name tags', 'Sticky notes'],
          trainerNotes: 'Start with energy and enthusiasm',
        }),
      })
    );

    // Verify main topic captures all fields including activities
    expect(postMock).toHaveBeenCalledWith(
      '/topics',
      expect.objectContaining({
        name: 'Strategic Decision Making',
        description: 'Learn frameworks for making tough decisions.',
        learningOutcomes: 'Apply decision-making frameworks\nEvaluate trade-offs',
        materialsNeeded: 'Case study handouts\nDecision matrix templates',
        trainerNotes: 'Emphasize real-world applications',
        deliveryGuidance: 'Use the Eisenhower Matrix as a visual aid',
        aiGeneratedContent: expect.objectContaining({
          categoryName: 'Leadership Development',
          suggestedActivities: ['Case study analysis', 'Group discussion'],
        }),
      })
    );

    // Verify closing section is captured (even though it has different fields)
    expect(postMock).toHaveBeenCalledWith(
      '/topics',
      expect.objectContaining({
        name: 'Wrap Up & Next Steps',
        description: 'Summarize key learnings and action items.',
        aiGeneratedContent: expect.objectContaining({
          categoryName: 'Closing',
        }),
      })
    );

    const sessionPayload = postMock.mock.calls.find(([url]) => url === '/sessions')?.[1];
    expect(sessionPayload).toBeDefined();
    expect(sessionPayload.sessionTopics).toHaveLength(3);
    expect(sessionPayload.sessionTopics.map((topic: any) => topic.sequenceOrder)).toEqual([1, 2, 3]);

    // Verify session was created
    expect(postMock).toHaveBeenCalledWith('/sessions', expect.any(Object));
  });

  it('maps mixed content sections into ordered session topics', async () => {
    let savedPayload: any | null = null;
    let topicCounter = 200;

    getMock.mockImplementation(async (url: string) => {
      if (url === '/topics') {
        return { data: [] };
      }

      if (url.startsWith('/admin/categories/')) {
        const id = Number(url.split('/').pop());
        return { data: { id, name: 'Leadership Development' } };
      }

      if (url === '/admin/categories/active') {
        return {
          data: [
            { id: 1, name: 'Leadership Development' },
            { id: 9, name: 'Opening' },
            { id: 10, name: 'Closing' },
          ],
        };
      }

      throw new Error(`Unexpected GET to ${url}`);
    });

    postMock.mockImplementation(async (url: string, payload: any) => {
      if (url === '/sessions') {
        savedPayload = payload;
        return { data: { id: 'session-003', status: payload.status ?? 'draft', ...payload } };
      }

      if (url === '/topics') {
        topicCounter += 1;
        return { data: { id: topicCounter, ...payload } };
      }

      if (url === '/admin/categories') {
        topicCounter += 1;
        return { data: { id: topicCounter, ...payload } };
      }

      throw new Error(`Unexpected POST to ${url}`);
    });

    await sessionBuilderService.createSessionFromOutline({
      outline: {
        sections: [
          {
            id: 'section-1',
            type: 'topic',
            position: 1,
            title: 'Core Leadership Principles',
            duration: 30,
            description: 'Explore foundational leadership concepts.',
          },
          {
            id: 'section-2',
            type: 'exercise',
            position: 2,
            title: 'Leadership Role Play',
            duration: 20,
            description: 'Participants practice real-world leadership scenarios.',
            trainerNotes: 'Pair participants for maximum engagement.',
          },
          {
            id: 'section-3',
            type: 'discussion',
            position: 3,
            title: 'Peer Feedback Circle',
            duration: 15,
            description: 'Reflect on lessons learned and exchange insights.',
          },
        ],
        totalDuration: 65,
        suggestedSessionTitle: 'Leadership Mastery Lab',
        suggestedDescription: 'Blend instruction with hands-on learning for leaders.',
        difficulty: 'Intermediate',
        recommendedAudienceSize: '8-15',
        fallbackUsed: false,
        generatedAt: new Date().toISOString(),
      },
      input: {
        title: 'Leadership Mastery',
        category: 'Leadership Development',
        categoryId: 1,
        sessionType: 'workshop',
        desiredOutcome: 'Develop core leadership competencies.',
        date: '2025-07-01',
        startTime: new Date('2025-07-01T15:00:00Z').toISOString(),
        endTime: new Date('2025-07-01T16:05:00Z').toISOString(),
      },
      readinessScore: 92,
    });

    expect(savedPayload).not.toBeNull();
    expect(Array.isArray(savedPayload.sessionTopics)).toBe(true);
    expect(savedPayload.sessionTopics).toHaveLength(3);

    // Ensure sequence order is preserved and durations captured
    expect(savedPayload.sessionTopics.map((topic: any) => topic.sequenceOrder)).toEqual([1, 2, 3]);
    expect(savedPayload.sessionTopics.map((topic: any) => topic.durationMinutes)).toEqual([30, 20, 15]);

    // Confirm trainer notes propagate as notes for applicable sections
    const exerciseTopic = savedPayload.sessionTopics.find((topic: any) => topic.sequenceOrder === 2);
    expect(exerciseTopic?.notes).toBe('Pair participants for maximum engagement.');
  });
});
