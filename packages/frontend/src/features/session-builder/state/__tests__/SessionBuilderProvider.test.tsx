import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { SessionBuilderProvider, useSessionBuilder } from '../SessionBuilderContext';
import type { BuilderState, SessionMetadata } from '../types';

type AutosaveMocks = {
  publishMock: ReturnType<typeof vi.fn>;
  autosaveMock: ReturnType<typeof vi.fn>;
  completeDataMock: ReturnType<typeof vi.fn>;
  generateOutlineMock: ReturnType<typeof vi.fn>;
  createSessionMock: ReturnType<typeof vi.fn>;
  generateVariantsMock: ReturnType<typeof vi.fn>;
  logVariantSelectionMock: ReturnType<typeof vi.fn>;
  addSectionMock: ReturnType<typeof vi.fn>;
  updateSectionMock: ReturnType<typeof vi.fn>;
  removeSectionMock: ReturnType<typeof vi.fn>;
  reorderSectionsMock: ReturnType<typeof vi.fn>;
  duplicateSectionMock: ReturnType<typeof vi.fn>;
  latestState: BuilderState | null;
};

const mocks = vi.hoisted<AutosaveMocks>(() => ({
  publishMock: vi.fn(),
  autosaveMock: vi.fn(),
  completeDataMock: vi.fn(),
  generateOutlineMock: vi.fn(),
  createSessionMock: vi.fn(),
  generateVariantsMock: vi.fn(),
  logVariantSelectionMock: vi.fn(),
  addSectionMock: vi.fn(),
  updateSectionMock: vi.fn(),
  removeSectionMock: vi.fn(),
  reorderSectionsMock: vi.fn(),
  duplicateSectionMock: vi.fn(),
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
  variants: {
    variants: [
      {
        id: 'variant-primary',
        label: 'Knowledge Base-Driven',
        description: 'Based on your knowledge base',
        generationSource: 'rag' as const,
        ragWeight: 0.8,
        ragSourcesUsed: 3,
        outline: {
          sections: [
            {
              id: 'v1-section-1',
              title: 'Knowledge Base Opening',
              duration: 30,
              description: 'Warm up with familiar material.',
            },
            {
              id: 'v1-section-2',
              title: 'Deep Dive',
              duration: 45,
              description: 'Go deeper with curated insights.',
            },
          ],
          totalDuration: 90,
          suggestedSessionTitle: 'Knowledge Base Session',
          suggestedDescription: 'A session rooted in your content library.',
          difficulty: 'Intermediate',
          recommendedAudienceSize: '8-20',
          fallbackUsed: false,
          generatedAt: '2025-09-26T12:00:00.000Z',
        },
      },
      {
        id: 'variant-alt',
        label: 'Creative Approach',
        description: 'Fresh take for variety',
        generationSource: 'baseline' as const,
        ragWeight: 0.2,
        ragSourcesUsed: 0,
        outline: {
          sections: [
            {
              id: 'v2-section-1',
              title: 'Creative Kickoff',
              duration: 20,
              description: 'Set an imaginative tone.',
            },
            {
              id: 'v2-section-2',
              title: 'Design Sprint',
              duration: 60,
              description: 'Prototype new solutions together.',
            },
          ],
          totalDuration: 80,
          suggestedSessionTitle: 'Creative Momentum Session',
          suggestedDescription: 'Encourage experimentation and rapid iteration.',
          difficulty: 'Advanced',
          recommendedAudienceSize: '6-12',
          fallbackUsed: false,
          generatedAt: '2025-09-26T12:10:00.000Z',
        },
      },
    ],
    metadata: {
      processingTime: 1450,
      ragAvailable: true,
      ragSourcesFound: 3,
      totalVariants: 2,
      averageSimilarity: 0.86,
    },
  },
}));

vi.mock('../../../../services/session-builder.service', () => ({
  sessionBuilderService: {
    getCompleteSessionData: mocks.completeDataMock,
    autosaveDraft: mocks.autosaveMock,
    generateSessionOutline: mocks.generateOutlineMock,
    createSessionFromOutline: mocks.createSessionMock,
    generateMultipleOutlines: mocks.generateVariantsMock,
    logVariantSelection: mocks.logVariantSelectionMock,
    addSection: mocks.addSectionMock,
    updateSection: mocks.updateSectionMock,
    removeSection: mocks.removeSectionMock,
    reorderSections: mocks.reorderSectionsMock,
    duplicateSection: mocks.duplicateSectionMock,
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
  getVariants: () => ReturnType<typeof useSessionBuilder>['variants'];
  getVariantsStatus: () => ReturnType<typeof useSessionBuilder>['variantsStatus'];
  getVariantSelectionTime: () => ReturnType<typeof useSessionBuilder>['variantSelectionTime'];
  updateMetadata: (updates: Partial<SessionMetadata>) => void;
  manualAutosave: () => Promise<void>;
  generateAI: () => Promise<void>;
  generateVariants: () => Promise<boolean>;
  acceptVersion: (id: string) => void;
  selectVariant: (id: string) => Promise<void>;
  publishSession: () => Promise<void>;
};

const AutosaveHarness = React.forwardRef<HarnessHandle>((_, ref) => {
  const {
    state,
    updateMetadata,
    manualAutosave,
    generateAIContent,
    generateMultipleVariants,
    acceptVersion,
    selectVariant,
    publishSession,
    variants,
    variantsStatus,
    variantSelectionTime,
  } = useSessionBuilder();

  React.useImperativeHandle(ref, () => ({
    getState: () => state,
    getVariants: () => variants,
    getVariantsStatus: () => variantsStatus,
    getVariantSelectionTime: () => variantSelectionTime,
    updateMetadata,
    manualAutosave,
    generateAI: () => generateAIContent(),
    generateVariants: () => generateMultipleVariants(),
    selectVariant: (variantId: string) => selectVariant(variantId),
    acceptVersion,
    publishSession,
  }), [
    state,
    variants,
    variantsStatus,
    variantSelectionTime,
    updateMetadata,
    manualAutosave,
    generateAIContent,
    generateMultipleVariants,
    acceptVersion,
    selectVariant,
    publishSession,
  ]);

  return null;
});
AutosaveHarness.displayName = 'AutosaveHarness';

beforeEach(() => {
  mocks.publishMock.mockReset();
  mocks.autosaveMock.mockReset();
  mocks.completeDataMock.mockReset();
  mocks.generateOutlineMock.mockReset();
  mocks.createSessionMock.mockReset();
  mocks.generateVariantsMock.mockReset();
  mocks.logVariantSelectionMock.mockReset();
  mocks.addSectionMock.mockReset();
  mocks.updateSectionMock.mockReset();
  mocks.removeSectionMock.mockReset();
  mocks.reorderSectionsMock.mockReset();
  mocks.duplicateSectionMock.mockReset();
  mocks.latestState = null;

  mocks.completeDataMock.mockResolvedValue(null);
  mocks.autosaveMock.mockResolvedValue({ savedAt: '2025-09-26T12:00:00.000Z' });
  mocks.generateOutlineMock.mockResolvedValue(outlineFixtures.response);
  mocks.createSessionMock.mockResolvedValue({
    id: 'session-123',
    status: 'published',
    title: 'Empathetic Leadership Workshop',
  });
  mocks.generateVariantsMock.mockResolvedValue(outlineFixtures.variants);
  mocks.logVariantSelectionMock.mockResolvedValue(undefined);
  mocks.addSectionMock.mockResolvedValue(outlineFixtures.response.outline);
  mocks.updateSectionMock.mockResolvedValue(outlineFixtures.response.outline);
  mocks.removeSectionMock.mockResolvedValue(outlineFixtures.response.outline);
  mocks.reorderSectionsMock.mockResolvedValue(outlineFixtures.response.outline);
  mocks.duplicateSectionMock.mockResolvedValue(outlineFixtures.response.outline);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('SessionBuilderProvider manual autosave', () => {

  it('persists draft changes via manual autosave and updates state metadata', async () => {
    const harnessRef = React.createRef<HarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
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
    expect(autosaveArgs[0]).toBe('draft-123');
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
      <SessionBuilderProvider sessionId="draft-123">
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

describe('SessionBuilderProvider variant generation', () => {
  it('requires metadata before generating variants', async () => {
    const harnessRef = React.createRef<HarnessHandle>();

    await act(async () => {
      render(
        <SessionBuilderProvider sessionId="new">
          <AutosaveHarness ref={harnessRef} />
        </SessionBuilderProvider>,
      );
    });

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    let result: boolean | undefined;
    await act(async () => {
      result = await harnessRef.current?.generateVariants();
    });
    expect(result).toBe(false);
    expect(mocks.generateVariantsMock).not.toHaveBeenCalled();

    await waitFor(() => expect(harnessRef.current?.getVariantsStatus()).toBe('error'), { timeout: 2000 });
    expect(mocks.publishMock).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'warning',
      title: 'More details needed',
    }));
  }, { timeout: 10000 });

  it('generates variants successfully and tracks analytics', async () => {
    const harnessRef = React.createRef<HarnessHandle>();
    const gtagSpy = vi.fn();
    (globalThis as any).gtag = gtagSpy;

    await act(async () => {
      render(
        <SessionBuilderProvider sessionId="new">
          <AutosaveHarness ref={harnessRef} />
        </SessionBuilderProvider>,
      );
    });

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    act(() => {
      harnessRef.current?.updateMetadata({
        title: 'Variant Ready Session',
        desiredOutcome: 'Drive variant testing',
        category: 'Leadership',
      });
    });

    let result: boolean | undefined;
    await act(async () => {
      result = await harnessRef.current?.generateVariants();
    });
    expect(result).toBe(true);
    expect(mocks.generateVariantsMock).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(harnessRef.current?.getVariantsStatus()).toBe('success'), { timeout: 2000 });
    expect(harnessRef.current?.getVariants()).toHaveLength(2);

    expect(gtagSpy).toHaveBeenCalledWith('event', 'variant_generation_complete', expect.objectContaining({
      event_category: 'Session Builder v2',
      event_label: 'rag',
      value: expect.any(Number),
    }));

    delete (globalThis as any).gtag;
  }, { timeout: 15000 });

  it('selects a variant and logs selection', async () => {
    const harnessRef = React.createRef<HarnessHandle>();

    await act(async () => {
      render(
        <SessionBuilderProvider sessionId="new">
          <AutosaveHarness ref={harnessRef} />
        </SessionBuilderProvider>,
      );
    });

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    act(() => {
      harnessRef.current?.updateMetadata({
        title: 'Variant Selection',
        desiredOutcome: 'Pick the best variant',
        category: 'Leadership',
      });
    });

    await act(async () => {
      await harnessRef.current?.generateVariants();
    });
    await waitFor(() => expect(harnessRef.current?.getVariantsStatus()).toBe('success'), { timeout: 2000 });

    await act(async () => {
      await harnessRef.current?.selectVariant('variant-primary');
    });

    const state = harnessRef.current?.getState();
    expect(state?.draft?.acceptedVersionId).toBeTruthy();
    expect(state?.draft?.outline?.suggestedSessionTitle).toBe('Knowledge Base Session');
    expect(harnessRef.current?.getVariantSelectionTime()).toBeGreaterThanOrEqual(0);

    expect(mocks.logVariantSelectionMock).toHaveBeenCalledWith('new', expect.objectContaining({
      variantId: 'variant-primary',
      generationSource: 'rag',
      ragWeight: 0.8,
    }));
  }, { timeout: 15000 });
});

describe('SessionBuilderProvider outline section operations', () => {
  type OutlineHarnessHandle = {
    getState: () => BuilderState;
    addOutlineSection: (sectionType: string, position?: number) => Promise<void>;
    updateOutlineSection: (sectionId: string, updates: Record<string, any>) => Promise<void>;
    removeOutlineSection: (sectionId: string) => Promise<void>;
    moveOutlineSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;
    duplicateOutlineSection: (sectionId: string) => Promise<void>;
  };

  const OutlineHarness = React.forwardRef<OutlineHarnessHandle>((_, ref) => {
    const {
      state,
      addOutlineSection,
      updateOutlineSection,
      removeOutlineSection,
      moveOutlineSection,
      duplicateOutlineSection,
    } = useSessionBuilder();

    React.useImperativeHandle(ref, () => ({
      getState: () => state,
      addOutlineSection,
      updateOutlineSection,
      removeOutlineSection,
      moveOutlineSection,
      duplicateOutlineSection,
    }), [
      state,
      addOutlineSection,
      updateOutlineSection,
      removeOutlineSection,
      moveOutlineSection,
      duplicateOutlineSection,
    ]);

    return null;
  });
  OutlineHarness.displayName = 'OutlineHarness';

  it('adds a new section and updates outline', async () => {
    const harnessRef = React.createRef<OutlineHarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    await act(async () => {
      await harnessRef.current?.addOutlineSection('topic', 2);
    });

    expect(mocks.addSectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.addSectionMock).toHaveBeenCalledWith('draft-123', 'topic', 2);

    await waitFor(() => {
      const outline = harnessRef.current?.getState().draft?.outline;
      expect(outline).toBeTruthy();
      expect(outline?.sections).toHaveLength(3);
    }, { timeout: 2000 });
  }, { timeout: 10000 });

  it('updates a section and refreshes outline', async () => {
    const harnessRef = React.createRef<OutlineHarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    await act(async () => {
      await harnessRef.current?.updateOutlineSection('section-1', {
        title: 'Updated Title',
        duration: 20,
      });
    });

    expect(mocks.updateSectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateSectionMock).toHaveBeenCalledWith('draft-123', 'section-1', {
      title: 'Updated Title',
      duration: 20,
    });

    await waitFor(() => {
      const outline = harnessRef.current?.getState().draft?.outline;
      expect(outline?.sections).toHaveLength(3);
    }, { timeout: 2000 });
  }, { timeout: 10000 });

  it('removes a section and updates outline', async () => {
    const harnessRef = React.createRef<OutlineHarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    await act(async () => {
      await harnessRef.current?.removeOutlineSection('section-2');
    });

    expect(mocks.removeSectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.removeSectionMock).toHaveBeenCalledWith('draft-123', 'section-2');

    await waitFor(() => {
      const outline = harnessRef.current?.getState().draft?.outline;
      expect(outline).toBeTruthy();
    }, { timeout: 2000 });
  }, { timeout: 10000 });

  it('moves a section and reorders outline', async () => {
    // Mock complete data with outline for this test
    mocks.completeDataMock.mockResolvedValueOnce({
      id: 'draft-123',
      title: 'Test Session',
      category: { id: 1, name: 'Leadership' },
      desiredOutcome: 'Test outcome',
      startTime: '2025-01-01T18:00:00.000Z',
      endTime: '2025-01-01T19:00:00.000Z',
      timezone: 'America/New_York',
      sessionType: 'workshop',
      aiGeneratedContent: {
        outline: outlineFixtures.response.outline,
      },
      builderDraft: {
        metadata: {
          title: 'Test Session',
          category: 'Leadership',
          desiredOutcome: 'Test outcome',
          currentProblem: '',
          specificTopics: '',
          startDate: '2025-01-01',
          startTime: '2025-01-01T18:00:00.000Z',
          endTime: '2025-01-01T19:00:00.000Z',
          timezone: 'America/New_York',
          location: '',
        },
      },
    });

    const harnessRef = React.createRef<OutlineHarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    // Wait for initial outline to load
    await waitFor(() => {
      const outline = harnessRef.current?.getState().draft?.outline;
      expect(outline?.sections).toHaveLength(3);
    }, { timeout: 2000 });

    await act(async () => {
      await harnessRef.current?.moveOutlineSection('section-2', 'up');
    });

    expect(mocks.reorderSectionsMock).toHaveBeenCalledTimes(1);
    const reorderArgs = mocks.reorderSectionsMock.mock.calls[0];
    expect(reorderArgs[0]).toBe('draft-123');
    expect(reorderArgs[1]).toEqual(['section-2', 'section-1', 'section-3']);
  }, { timeout: 10000 });

  it('duplicates a section and updates outline', async () => {
    const harnessRef = React.createRef<OutlineHarnessHandle>();

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    await act(async () => {
      await harnessRef.current?.duplicateOutlineSection('section-1');
    });

    expect(mocks.duplicateSectionMock).toHaveBeenCalledTimes(1);
    expect(mocks.duplicateSectionMock).toHaveBeenCalledWith('draft-123', 'section-1');

    await waitFor(() => {
      const outline = harnessRef.current?.getState().draft?.outline;
      expect(outline).toBeTruthy();
    }, { timeout: 2000 });
  }, { timeout: 10000 });

  it('handles errors gracefully and shows toast notification', async () => {
    const harnessRef = React.createRef<OutlineHarnessHandle>();
    mocks.addSectionMock.mockRejectedValueOnce(new Error('Failed to add section'));

    render(
      <SessionBuilderProvider sessionId="draft-123">
        <OutlineHarness ref={harnessRef} />
      </SessionBuilderProvider>,
    );

    await waitFor(() => expect(harnessRef.current).toBeTruthy(), { timeout: 5000 });
    await waitFor(() => expect(harnessRef.current?.getState().status).toBe('ready'), { timeout: 5000 });

    await act(async () => {
      await harnessRef.current?.addOutlineSection('topic');
    });

    expect(mocks.publishMock).toHaveBeenCalledWith(expect.objectContaining({
      variant: 'error',
      title: 'Unable to add section',
      description: 'Failed to add section',
    }));
  }, { timeout: 10000 });
});
