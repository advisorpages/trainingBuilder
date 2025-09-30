import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { SessionBuilderProvider, useSessionBuilder } from '../SessionBuilderContext';
import type { BuilderState, SessionMetadata } from '../types';

type AutosaveMocks = {
  publishMock: ReturnType<typeof vi.fn>;
  autosaveMock: ReturnType<typeof vi.fn>;
  loadDraftMock: ReturnType<typeof vi.fn>;
  completeDataMock: ReturnType<typeof vi.fn>;
  generateOutlineMock: ReturnType<typeof vi.fn>;
  createSessionMock: ReturnType<typeof vi.fn>;
  latestState: BuilderState | null;
};

const mocks = vi.hoisted<AutosaveMocks>(() => ({
  publishMock: vi.fn(),
  autosaveMock: vi.fn(),
  loadDraftMock: vi.fn(),
  completeDataMock: vi.fn(),
  generateOutlineMock: vi.fn(),
  createSessionMock: vi.fn(),
  latestState: null,
}));

const outlineFixtures = vi.hoisted(() => ({
  response: {
    outline: {
      sections: [
        {
          id: 'section-1',
          type: 'opener',
          position: 1,
          title: 'Welcome & Momentum',
          duration: 10,
          description: 'Kick-off and introduce objectives.',
          isTopicSuggestion: false,
        },
        {
          id: 'section-2',
          type: 'topic',
          position: 2,
          title: 'Leading with Empathy',
          duration: 30,
          description: 'Explore techniques to lead empathetically during change.',
          learningObjectives: ['Identify empathy blockers', 'Practice listening frameworks'],
          isTopicSuggestion: true,
        },
        {
          id: 'section-3',
          type: 'closing',
          position: 3,
          title: 'Commitments & Wrap',
          duration: 15,
          description: 'Define next steps and commitments.',
          keyTakeaways: ['Team commitments', 'Next steps'],
          isTopicSuggestion: false,
        },
      ],
      totalDuration: 55,
      suggestedSessionTitle: 'Empathetic Leadership Workshop',
      suggestedDescription: 'Help leaders support their teams through change with empathy.',
      difficulty: 'Intermediate',
      recommendedAudienceSize: '10-25',
      fallbackUsed: false,
      generatedAt: '2025-09-26T12:00:00.000Z',
    },
    relevantTopics: [],
    ragAvailable: false,
    generationMetadata: {
      processingTime: 1234,
      ragQueried: false,
      fallbackUsed: false,
      topicsFound: 0,
    },
  },
}));

vi.mock('../../../../services/session-builder.service', () => ({
  sessionBuilderService: {
    loadOutlineDraft: mocks.loadDraftMock,
    getCompleteSessionData: mocks.completeDataMock,
    autosaveDraft: mocks.autosaveMock,
    generateSessionOutline: mocks.generateOutlineMock,
    createSessionFromOutline: mocks.createSessionMock,
  },
}));

vi.mock('../../../../ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../../../ui');
  return {
    ...actual,
    useToast: () => ({ publish: mocks.publishMock }),
  };
});

type HarnessHandle = {
  getState: () => BuilderState;
  updateMetadata: (updates: Partial<SessionMetadata>) => void;
  manualAutosave: () => Promise<void>;
  generateAI: () => Promise<void>;
  acceptVersion: (id: string) => void;
  publishSession: () => Promise<void>;
};

const AutosaveHarness = React.forwardRef<HarnessHandle>((_, ref) => {
  const {
    state,
    updateMetadata,
    manualAutosave,
    generateAIContent,
    acceptVersion,
    publishSession,
  } = useSessionBuilder();

  React.useImperativeHandle(ref, () => ({
    getState: () => state,
    updateMetadata,
    manualAutosave,
    generateAI: () => generateAIContent(),
    acceptVersion,
    publishSession,
  }), [
    state,
    updateMetadata,
    manualAutosave,
    generateAIContent,
    acceptVersion,
    publishSession,
  ]);

  return null;
});
AutosaveHarness.displayName = 'AutosaveHarness';

beforeEach(() => {
  mocks.publishMock.mockReset();
  mocks.autosaveMock.mockReset();
  mocks.loadDraftMock.mockReset();
  mocks.completeDataMock.mockReset();
  mocks.generateOutlineMock.mockReset();
  mocks.createSessionMock.mockReset();
  mocks.latestState = null;

  mocks.loadDraftMock.mockResolvedValue(null);
  mocks.completeDataMock.mockResolvedValue(null);
  mocks.autosaveMock.mockResolvedValue({ savedAt: '2025-09-26T12:00:00.000Z' });
  mocks.generateOutlineMock.mockResolvedValue(outlineFixtures.response);
  mocks.createSessionMock.mockResolvedValue({
    id: 'session-123',
    status: 'published',
    title: 'Empathetic Leadership Workshop',
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SessionBuilderProvider manual autosave', () => {

  it('persists draft changes via manual autosave and updates state metadata', async () => {
    const harnessRef = React.createRef<HarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="new">
        <AutosaveHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    act(() => {
      harnessRef.current?.updateMetadata({ title: 'Updated Title' });
    });

    await waitFor(() => expect(harnessRef.current?.getState().draft?.isDirty).toBe(true), { timeout: 2000 });

    await act(async () => {
      await harnessRef.current?.manualAutosave();
    });

    expect(mocks.autosaveMock).toHaveBeenCalledTimes(1);
    const autosaveArgs = mocks.autosaveMock.mock.calls[0];
    expect(autosaveArgs[0]).toBe('new');
    expect(autosaveArgs[1].metadata.title).toBe('Updated Title');

    await waitFor(() => expect(harnessRef.current?.getState().autosaveStatus).toBe('success'), { timeout: 3000 });
    const finalDraft = harnessRef.current?.getState().draft;
    expect(finalDraft?.isDirty).toBe(false);
    expect(finalDraft?.lastAutosaveAt).toEqual('2025-09-26T12:00:00.000Z');

    expect(mocks.publishMock).not.toHaveBeenCalled();
  }, { timeout: 15000 });
});

describe('SessionBuilderProvider workflow', () => {
  it('generates AI content, accepts a version, and publishes successfully', async () => {
    const harnessRef = React.createRef<HarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="new">
        <AutosaveHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    act(() => {
      harnessRef.current?.updateMetadata({
        title: 'Empathy in Action',
        category: 'Leadership',
        desiredOutcome: 'Equip managers to lead change with empathy.',
        location: 'Virtual',
      });
    });

    await act(async () => {
      await harnessRef.current?.generateAI();
    });

    await waitFor(() => {
      const state = harnessRef.current?.getState();
      expect(state?.aiStatus).toBe('idle');
      expect(state?.draft?.aiVersions.length).toBeGreaterThan(0);
      expect(state?.draft?.outline).not.toBeNull();
    }, { timeout: 5000 });

    const versionId = harnessRef.current?.getState().draft?.aiVersions[0]?.id;
    expect(versionId).toBeDefined();

    act(() => {
      if (versionId) {
        harnessRef.current?.acceptVersion(versionId);
      }
    });

    await waitFor(() => {
      const state = harnessRef.current?.getState();
      expect(state?.draft?.acceptedVersionId).toBe(versionId);
      expect(state?.draft?.outline?.sections?.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    await act(async () => {
      await harnessRef.current?.manualAutosave();
    });

    await act(async () => {
      await harnessRef.current?.publishSession();
    });

    await waitFor(() => {
      const state = harnessRef.current?.getState();
      expect(state?.publishStatus).toBe('success');
      expect(state?.draft?.sessionId).toBe('session-123');
      expect(state?.draft?.isDirty).toBe(false);
    }, { timeout: 5000 });

    expect(mocks.generateOutlineMock).toHaveBeenCalledTimes(1);
    expect(mocks.createSessionMock).toHaveBeenCalledTimes(1);
    expect(mocks.autosaveMock).toHaveBeenCalled();
    expect(mocks.publishMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Session published' }));
  }, { timeout: 20000 });
});
