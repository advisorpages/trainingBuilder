vi.mock('./api.service', () => {
  const post = vi.fn().mockResolvedValue({ data: { variants: [], metadata: {} } });
  return {
    api: {
      post,
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionBuilderService, SessionBuilderInput } from './session-builder.service';
import { api } from './api.service';
import { LocationType, MeetingPlatform } from '@leadership-training/shared';

describe('SessionBuilderService', () => {
  const service = new SessionBuilderService();

  beforeEach(() => {
    (api.post as any).mockClear();
  });

  it('retains location and timezone fields in payload', async () => {
    const input: SessionBuilderInput = {
      title: 'Dynamic Leadership Workshop',
      category: 'Leadership',
      sessionType: 'workshop',
      desiredOutcome: 'Improve coaching conversations',
      currentProblem: 'Leaders avoid tough feedback',
      specificTopics: 'Feedback frameworks, role-play',
      date: '2025-05-01',
      startTime: '2025-05-01T16:00:00Z',
      endTime: '2025-05-01T19:00:00Z',
      timezone: 'America/New_York',
      locationId: 7,
      locationName: 'Innovation Lab',
      locationType: LocationType.PHYSICAL,
      meetingPlatform: MeetingPlatform.ZOOM,
      locationCapacity: 40,
      locationTimezone: 'America/New_York',
      locationNotes: 'Check in at security desk',
      audienceId: 3,
      audienceName: 'Regional Directors',
      toneId: 2,
      toneName: 'Motivational',
    };

    await service.generateMultipleOutlines(input);

    expect(api.post).toHaveBeenCalledWith(
      '/sessions/builder/suggest-outline-v2',
      expect.objectContaining({
        timezone: 'America/New_York',
        locationId: 7,
        locationName: 'Innovation Lab',
        locationType: LocationType.PHYSICAL,
        meetingPlatform: MeetingPlatform.ZOOM,
        locationCapacity: 40,
        locationTimezone: 'America/New_York',
        locationNotes: 'Check in at security desk',
      }),
    );
  });
});
