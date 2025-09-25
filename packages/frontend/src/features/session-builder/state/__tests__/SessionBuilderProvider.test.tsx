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
  latestState: BuilderState | null;
};

const mocks = vi.hoisted<AutosaveMocks>(() => ({
  publishMock: vi.fn(),
  autosaveMock: vi.fn(),
  loadDraftMock: vi.fn(),
  completeDataMock: vi.fn(),
  latestState: null,
}));

vi.mock('../../../../services/session-builder.service', () => ({
  sessionBuilderService: {
    loadOutlineDraft: mocks.loadDraftMock,
    getCompleteSessionData: mocks.completeDataMock,
    autosaveDraft: mocks.autosaveMock,
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
};

const AutosaveHarness = React.forwardRef<HarnessHandle>((_, ref) => {
  const { state, updateMetadata, manualAutosave } = useSessionBuilder();

  React.useImperativeHandle(ref, () => ({
    getState: () => state,
    updateMetadata,
    manualAutosave,
  }), [state, updateMetadata, manualAutosave]);

  return null;
});
AutosaveHarness.displayName = 'AutosaveHarness';

describe('SessionBuilderProvider manual autosave', () => {
  beforeEach(() => {
    mocks.publishMock.mockReset();
    mocks.autosaveMock.mockReset();
    mocks.loadDraftMock.mockReset();
    mocks.completeDataMock.mockReset();
    mocks.latestState = null;

    mocks.loadDraftMock.mockResolvedValue(null);
    mocks.completeDataMock.mockResolvedValue(null);
    mocks.autosaveMock.mockResolvedValue({ savedAt: '2025-09-26T12:00:00.000Z' });
  });

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
