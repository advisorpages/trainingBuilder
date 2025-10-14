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
    getMock.mockImplementation(async (url: string) => {
      if (url === '/topics') {
        return { data: [] };
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
        categoryId: 9, // Opening category
      })
    );

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

  it('captures all AI-generated fields when creating topics from outline', async () => {
    getMock.mockImplementation(async (url: string) => {
      if (url === '/topics') {
        return { data: [] };
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
        categoryId: 9, // Opening category
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
        categoryId: 1, // Leadership Development category
        aiGeneratedContent: expect.objectContaining({
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
        categoryId: 10, // Closing category
      })
    );

    // Verify session was created
    expect(postMock).toHaveBeenCalledWith('/sessions', expect.any(Object));
  });
});
