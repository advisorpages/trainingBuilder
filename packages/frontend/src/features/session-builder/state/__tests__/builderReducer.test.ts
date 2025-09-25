import { describe, expect, it } from 'vitest';
import { builderReducer, initialBuilderState } from '../builderReducer';
import { AIContentVersion, SessionDraftData } from '../types';
import { SessionOutline } from '../../../../services/session-builder.service';

const buildDraft = (overrides: Partial<SessionDraftData> = {}): SessionDraftData => {
  const outline: SessionOutline = {
    sections: [],
    totalDuration: 0,
    suggestedSessionTitle: 'Draft',
    suggestedDescription: 'Draft description',
    difficulty: 'Intermediate',
    recommendedAudienceSize: '10-25',
    fallbackUsed: false,
    generatedAt: new Date().toISOString(),
  };

  return {
    sessionId: 'session-1',
    metadata: {
      title: 'Test Session',
      sessionType: 'workshop',
      category: 'Leadership',
      desiredOutcome: 'Improved alignment',
      currentProblem: 'Miscommunication',
      specificTopics: 'Feedback loops',
      startDate: new Date().toISOString().slice(0, 10),
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timezone: 'America/New_York',
    },
    outline,
    aiPrompt: 'Generate an outline around leadership',
    aiVersions: [],
    acceptedVersionId: undefined,
    selectedVersionId: undefined,
    readinessScore: 0,
    lastAutosaveAt: undefined,
    isDirty: false,
    ...overrides,
  };
};

describe('builderReducer', () => {
  it('stores generated AI versions and marks draft dirty', () => {
    const version: AIContentVersion = {
      id: 'ai-1',
      prompt: 'Prompt',
      summary: 'Summary',
      blocks: [],
      createdAt: new Date().toISOString(),
      status: 'ready',
      source: 'ai',
    };

    const stateWithDraft = {
      ...initialBuilderState,
      status: 'ready' as const,
      draft: buildDraft(),
    };

    const updated = builderReducer(stateWithDraft, {
      type: 'AI_REQUEST_SUCCESS',
      payload: version,
    });

    expect(updated.draft?.aiVersions[0]).toEqual(version);
    expect(updated.draft?.isDirty).toBe(true);
    expect(updated.draft?.selectedVersionId).toBe('ai-1');
  });

  it('resets dirty flag on autosave success', () => {
    const dirtyDraft = buildDraft({ isDirty: true });
    const stateWithDraft = {
      ...initialBuilderState,
      status: 'ready' as const,
      autosaveStatus: 'pending' as const,
      draft: dirtyDraft,
    };

    const updated = builderReducer(stateWithDraft, {
      type: 'AUTOSAVE_SUCCESS',
      payload: '2024-03-01T10:00:00.000Z',
    });

    expect(updated.draft?.isDirty).toBe(false);
    expect(updated.draft?.lastAutosaveAt).toBe('2024-03-01T10:00:00.000Z');
    expect(updated.autosaveStatus).toBe('success');
  });

  it('accepts versions and tracks selection', () => {
    const draft = buildDraft({
      aiVersions: [
        {
          id: 'ai-1',
          prompt: 'Prompt',
          summary: 'Summary',
          blocks: [],
          createdAt: new Date().toISOString(),
          status: 'ready',
          source: 'ai',
        },
      ],
    });

    const stateWithDraft = {
      ...initialBuilderState,
      status: 'ready' as const,
      draft,
    };

    const updated = builderReducer(stateWithDraft, {
      type: 'ACCEPT_AI_VERSION',
      payload: 'ai-1',
    });

    expect(updated.draft?.acceptedVersionId).toBe('ai-1');
    expect(updated.draft?.selectedVersionId).toBe('ai-1');
    expect(updated.draft?.isDirty).toBe(true);
  });

  it('restores previous draft snapshots', () => {
    const draft = buildDraft({ readinessScore: 80 });
    const stateWithDraft = {
      ...initialBuilderState,
      status: 'ready' as const,
      draft,
    };

    const restored = builderReducer(stateWithDraft, {
      type: 'RESTORE_DRAFT',
      payload: buildDraft({ readinessScore: 60, aiPrompt: 'Restored prompt' }),
    });

    expect(restored.draft?.readinessScore).toBe(60);
    expect(restored.draft?.aiPrompt).toBe('Restored prompt');
    expect(restored.status).toBe('ready');
  });
});
