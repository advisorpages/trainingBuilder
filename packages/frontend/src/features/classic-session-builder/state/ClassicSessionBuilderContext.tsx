import * as React from 'react';
import {
  sessionBuilderService,
  SectionType,
  FlexibleSessionSection,
  SessionOutline,
  SessionBuilderInput,
} from '../../../services/session-builder.service';
import { useToast } from '../../../ui';
import {
  classicBuilderReducer,
  initialClassicBuilderState,
  ClassicBuilderState,
  ClassicSessionDraft,
  ClassicSessionMetadata,
} from './types';
import {
  calculateClassicReadiness,
  areClassicRequiredItemsComplete,
} from '../utils/readiness';

interface ClassicSessionBuilderContextValue {
  state: ClassicBuilderState;
  updateMetadata: (updates: Partial<ClassicSessionMetadata>) => void;
  updateOutline: (outline: SessionOutline) => void;
  addOutlineSection: (sectionType: SectionType, position?: number) => Promise<void>;
  updateOutlineSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => Promise<void>;
  removeOutlineSection: (sectionId: string) => Promise<void>;
  moveOutlineSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;
  duplicateOutlineSection: (sectionId: string) => Promise<void>;
  manualAutosave: () => Promise<void>;
  publishSession: () => Promise<void>;
  canUndoAutosave: boolean;
  undoAutosave: () => void;
}

const ClassicSessionBuilderContext =
  React.createContext<ClassicSessionBuilderContextValue | undefined>(undefined);

const AUTOSAVE_DEBOUNCE_MS = 1500;
const DEFAULT_TIMEZONE = 'America/New_York';
const SESSION_TYPE_VALUES = ['event', 'training', 'workshop', 'webinar'] as const;

type SessionTypeValue = (typeof SESSION_TYPE_VALUES)[number];

function normalizeSessionType(value: unknown): ClassicSessionMetadata['sessionType'] {
  return typeof value === 'string' && (SESSION_TYPE_VALUES as readonly string[]).includes(value)
    ? (value as SessionTypeValue)
    : null;
}

function createEmptyOutline(): SessionOutline {
  const nowIso = new Date().toISOString();
  return {
    sections: [],
    totalDuration: 0,
    suggestedSessionTitle: '',
    suggestedDescription: '',
    difficulty: 'Intermediate',
    recommendedAudienceSize: '10-25',
    fallbackUsed: false,
    generatedAt: nowIso,
  };
}

function buildDefaultMetadata(): ClassicSessionMetadata {
  const today = new Date();
  const start = new Date(today);
  start.setHours(19, 0, 0, 0);
  const end = new Date(start.getTime() + 90 * 60 * 1000);

  return {
    title: '',
    sessionType: null,
    category: '',
    desiredOutcome: '',
    currentProblem: '',
    specificTopics: '',
    startDate: today.toISOString().slice(0, 10),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    timezone: DEFAULT_TIMEZONE,
    location: '',
    locationId: undefined,
    locationType: undefined,
    meetingPlatform: undefined,
    locationCapacity: undefined,
    locationTimezone: undefined,
    locationNotes: undefined,
    audienceId: undefined,
    audienceName: undefined,
    toneId: undefined,
    toneName: undefined,
    topics: [],
  };
}

function metadataToInput(metadata: ClassicSessionMetadata): SessionBuilderInput {
  return {
    title: metadata.title,
    category: metadata.category,
    categoryId: metadata.categoryId,
    categoryName: metadata.category,
    sessionType: normalizeSessionType(metadata.sessionType),
    desiredOutcome: metadata.desiredOutcome,
    currentProblem: metadata.currentProblem,
    specificTopics: metadata.specificTopics,
    topics: metadata.topics,
    date: metadata.startDate,
    startTime: metadata.startTime,
    endTime: metadata.endTime,
    timezone: metadata.timezone,
    locationId: metadata.locationId,
    locationName: metadata.location,
    locationType: metadata.locationType,
    meetingPlatform: metadata.meetingPlatform,
    locationCapacity: metadata.locationCapacity,
    locationTimezone: metadata.locationTimezone ?? metadata.timezone,
    locationNotes: metadata.locationNotes,
    audienceId: metadata.audienceId,
    audienceName: metadata.audienceName,
    toneId: metadata.toneId,
    toneName: metadata.toneName,
  };
}

function inputToMetadata(input: SessionBuilderInput): ClassicSessionMetadata {
  const startTime = input.startTime || new Date().toISOString();
  const endTime = input.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const normalizedSessionType = normalizeSessionType(input.sessionType);

  return {
    title: input.title ?? '',
    sessionType: normalizedSessionType,
    category: input.categoryName ?? input.category,
    categoryId: input.categoryId,
    desiredOutcome: input.desiredOutcome,
    currentProblem: input.currentProblem ?? '',
    specificTopics: input.specificTopics ?? '',
    topics: input.topics ? [...input.topics] : [],
    startDate: input.date,
    startTime,
    endTime,
    timezone: input.timezone ?? DEFAULT_TIMEZONE,
    location: input.locationName ?? '',
    locationId: input.locationId,
    locationType: input.locationType,
    meetingPlatform: input.meetingPlatform,
    locationCapacity: input.locationCapacity,
    locationTimezone: input.locationTimezone ?? input.timezone ?? DEFAULT_TIMEZONE,
    locationNotes: input.locationNotes ?? undefined,
    audienceId: input.audienceId,
    audienceName: input.audienceName ?? undefined,
    toneId: input.toneId,
    toneName: input.toneName ?? undefined,
  };
}

function buildPrompt(metadata: ClassicSessionMetadata): string {
  const sessionTypeDescription = metadata.sessionType
    ? `${metadata.sessionType} session`
    : 'session';
  const segments = [
    metadata.category?.trim()
      ? `Design a ${sessionTypeDescription} about ${metadata.category}.`
      : `Design a ${sessionTypeDescription}.`,
  ];
  if (metadata.title) {
    segments.push(`Working title: ${metadata.title}.`);
  }
  if (metadata.desiredOutcome) {
    segments.push(`Desired outcome: ${metadata.desiredOutcome}.`);
  }
  if (metadata.currentProblem) {
    segments.push(`Problem to solve: ${metadata.currentProblem}.`);
  }
  if (metadata.specificTopics) {
    segments.push(`Specific topics: ${metadata.specificTopics}.`);
  }
  segments.push(
    `Session duration: ${
      Math.round(
        (new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime()) / 60000,
      )
    } minutes.`,
  );
  return segments.join(' ');
}

const cloneDraft = (draft: ClassicSessionDraft): ClassicSessionDraft =>
  JSON.parse(JSON.stringify(draft));

function convertAutosavePayload(draft: ClassicSessionDraft) {
  return {
    metadata: metadataToInput(draft.metadata),
    outline: draft.outline,
    aiPrompt: draft.aiPrompt,
    aiVersions: [],
    acceptedVersionId: undefined,
    readinessScore: draft.readinessScore,
  };
}

export const ClassicSessionBuilderProvider: React.FC<{
  sessionId?: string;
  prefilledTopics?: any[] | null;
  children: React.ReactNode;
}> = ({ sessionId = 'new', prefilledTopics = null, children }) => {
  const [state, dispatch] = React.useReducer(classicBuilderReducer, initialClassicBuilderState);
  const { publish } = useToast();
  const lastSavedRef = React.useRef<ClassicSessionDraft | null>(null);
  const undoTimerRef = React.useRef<number | null>(null);
  const [canUndoAutosave, setCanUndoAutosave] = React.useState(false);

  const handleOutlineError = React.useCallback(
    (title: string, error: unknown) => {
      const message = error instanceof Error ? error.message : (error as any)?.message ?? 'Please try again.';
      publish({
        variant: 'error',
        title,
        description: message,
      });
    },
    [publish],
  );

  const showUndoTemporarily = React.useCallback(() => {
    setCanUndoAutosave(true);
    if (typeof window === 'undefined') {
      return;
    }

    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }

    undoTimerRef.current = window.setTimeout(() => {
      setCanUndoAutosave(false);
      undoTimerRef.current = null;
    }, 8000);
  }, []);

  const undoAutosave = React.useCallback(() => {
    if (!lastSavedRef.current) return;
    const restored = cloneDraft(lastSavedRef.current);
    dispatch({ type: 'RESTORE_DRAFT', payload: restored });
    setCanUndoAutosave(false);

    if (typeof window !== 'undefined' && undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const loadDraft = React.useCallback(async (): Promise<ClassicSessionDraft> => {
    if (sessionId && sessionId !== 'new') {
      const serverDraft = await sessionBuilderService.getCompleteSessionData(sessionId);

      const draftMetadataInput = serverDraft.builderDraft?.metadata as SessionBuilderInput | undefined;
      const metadataFromDraft = draftMetadataInput ? inputToMetadata(draftMetadataInput) : undefined;

      const metadata: ClassicSessionMetadata = {
        title: serverDraft.title ?? metadataFromDraft?.title ?? '',
        sessionType: normalizeSessionType(
          serverDraft.sessionType ?? metadataFromDraft?.sessionType ?? null,
        ),
        category: metadataFromDraft?.category ?? serverDraft.category?.name ?? '',
        categoryId: metadataFromDraft?.categoryId ?? serverDraft.category?.id,
        desiredOutcome: serverDraft.desiredOutcome ?? metadataFromDraft?.desiredOutcome ?? '',
        currentProblem: metadataFromDraft?.currentProblem ?? '',
        specificTopics: metadataFromDraft?.specificTopics ?? '',
        topics: metadataFromDraft?.topics ?? [],
        startDate:
          metadataFromDraft?.startDate ??
          serverDraft.startTime?.slice(0, 10) ??
          new Date().toISOString().slice(0, 10),
        startTime: metadataFromDraft?.startTime ?? serverDraft.startTime ?? new Date().toISOString(),
        endTime:
          metadataFromDraft?.endTime ??
          serverDraft.endTime ??
          new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        timezone: metadataFromDraft?.timezone ?? serverDraft.timezone ?? DEFAULT_TIMEZONE,
        location: metadataFromDraft?.location ?? serverDraft.locationName ?? '',
        locationId: metadataFromDraft?.locationId ?? serverDraft.locationId,
        locationType: metadataFromDraft?.locationType ?? serverDraft.location?.locationType,
        meetingPlatform: metadataFromDraft?.meetingPlatform ?? serverDraft.location?.meetingPlatform,
        locationCapacity: metadataFromDraft?.locationCapacity ?? serverDraft.location?.capacity,
        locationTimezone:
          metadataFromDraft?.locationTimezone ??
          serverDraft.location?.timezone ??
          serverDraft.timezone ??
          DEFAULT_TIMEZONE,
        locationNotes:
          metadataFromDraft?.locationNotes ??
          serverDraft.location?.notes ??
          serverDraft.location?.accessInstructions ??
          undefined,
        audienceId: metadataFromDraft?.audienceId ?? serverDraft.audienceId,
        audienceName: metadataFromDraft?.audienceName ?? serverDraft.audienceName ?? undefined,
        toneId: metadataFromDraft?.toneId ?? serverDraft.toneId,
        toneName: metadataFromDraft?.toneName ?? serverDraft.toneName ?? undefined,
      };

      if (prefilledTopics && Array.isArray(prefilledTopics) && prefilledTopics.length > 0) {
        if (!metadata.topics || metadata.topics.length === 0) {
          metadata.topics = prefilledTopics;
          metadata.specificTopics = prefilledTopics.map((t: any) => t.title).join(', ');

          const categories = [...new Set(prefilledTopics.map((t: any) => t.category).filter(Boolean))];
          if (categories.length === 1 && !metadata.category) {
            metadata.category = categories[0];
          }

          try {
            sessionStorage.removeItem('sessionBuilder_prefilledTopics');
            sessionStorage.removeItem('sessionBuilder_prefilledTopics_timestamp');
          } catch {
            // ignore
          }
        }
      }

      const outline: SessionOutline | null =
        serverDraft.aiGeneratedContent?.outline ??
        serverDraft.outline ??
        createEmptyOutline();

      const prompt = buildPrompt(metadata);

      return {
        sessionId,
        metadata,
        outline,
        aiPrompt: prompt,
        readinessScore: calculateClassicReadiness({
          sessionId,
          metadata,
          outline,
          aiPrompt: prompt,
          readinessScore: 0,
          isDirty: false,
        }),
        lastAutosaveAt: serverDraft.builderDraft?.lastSavedAt,
        isDirty: false,
      };
    }

    const metadata = buildDefaultMetadata();
    const prompt = buildPrompt(metadata);
    return {
      sessionId: 'new',
      metadata,
      outline: createEmptyOutline(),
      aiPrompt: prompt,
      readinessScore: 0,
      isDirty: false,
    };
  }, [sessionId, prefilledTopics]);

  const initialize = React.useCallback(async () => {
    dispatch({ type: 'INIT_START' });
    try {
      const draft = await loadDraft();
      const readiness = calculateClassicReadiness(draft);
      const prepared = { ...draft, readinessScore: readiness };
      lastSavedRef.current = cloneDraft(prepared);
      dispatch({ type: 'INIT_SUCCESS', payload: prepared });
    } catch (error: any) {
      const message = error?.message ?? 'Failed to load classic builder';
      dispatch({ type: 'INIT_FAILURE', payload: message });
      publish({
        variant: 'error',
        title: 'Unable to load builder',
        description: message,
      });
    }
  }, [loadDraft, publish]);

  React.useEffect(() => {
    void initialize();
  }, [initialize]);

  React.useEffect(() => {
    const timer =
      state.autosaveStatus === 'success'
        ? window.setTimeout(() => dispatch({ type: 'AUTOSAVE_IDLE' }), 2000)
        : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [state.autosaveStatus]);

  React.useEffect(() => {
    if (!state.draft) return;
    const nextReadiness = calculateClassicReadiness(state.draft);
    if (nextReadiness !== state.draft.readinessScore) {
      dispatch({ type: 'UPDATE_READINESS', payload: nextReadiness });
    }
  }, [state.draft]);

  const manualAutosave = React.useCallback(async () => {
    if (!state.draft) return;
    dispatch({ type: 'AUTOSAVE_PENDING' });
    try {
      const response = await sessionBuilderService.autosaveDraft(
        state.draft.sessionId,
        convertAutosavePayload(state.draft),
      );
      const savedAt = response?.savedAt ?? new Date().toISOString();
      lastSavedRef.current = cloneDraft({ ...state.draft, lastAutosaveAt: savedAt, isDirty: false });
      dispatch({ type: 'AUTOSAVE_SUCCESS', payload: savedAt });
      showUndoTemporarily();
    } catch (error: any) {
      const message = error?.message ?? 'Autosave failed';
      dispatch({ type: 'AUTOSAVE_FAILURE', payload: message });
      publish({
        variant: 'error',
        title: 'Autosave failed',
        description: message,
      });
      throw error;
    }
  }, [state.draft, publish, showUndoTemporarily]);

  React.useEffect(() => {
    const draftSnapshot = state.draft;
    if (!draftSnapshot || !draftSnapshot.isDirty || state.status !== 'ready') {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: 'AUTOSAVE_PENDING' });
      sessionBuilderService
        .autosaveDraft(draftSnapshot.sessionId, convertAutosavePayload(draftSnapshot))
        .then((response) => {
          const savedAt = response?.savedAt ?? new Date().toISOString();
          lastSavedRef.current = cloneDraft({
            ...draftSnapshot,
            lastAutosaveAt: savedAt,
            isDirty: false,
          });
          dispatch({ type: 'AUTOSAVE_SUCCESS', payload: savedAt });
          showUndoTemporarily();
        })
        .catch((error: any) => {
          const message = error?.message ?? 'Autosave failed';
          dispatch({ type: 'AUTOSAVE_FAILURE', payload: message });
          publish({
            variant: 'error',
            title: 'Autosave failed',
            description: message,
            actionLabel: 'Retry now',
            onAction: () => void manualAutosave(),
          });
        });
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [state.draft, state.status, publish, manualAutosave, showUndoTemporarily]);

  const updateMetadata = React.useCallback((updates: Partial<ClassicSessionMetadata>) => {
    if (!state.draft) return;
    const nextMetadata = { ...state.draft.metadata, ...updates };
    const nextPrompt = buildPrompt(nextMetadata);
    dispatch({ type: 'UPDATE_METADATA', payload: updates, aiPrompt: nextPrompt });
  }, [state.draft]);

  const updateOutline = React.useCallback((outline: SessionOutline) => {
    dispatch({ type: 'UPDATE_OUTLINE', payload: outline });
  }, []);

  const applyServerOutline = React.useCallback((outline: SessionOutline) => {
    if (!state.draft) {
      return;
    }

    const savedAt = new Date().toISOString();
    const updatedDraft: ClassicSessionDraft = {
      ...state.draft,
      outline,
      lastAutosaveAt: savedAt,
      isDirty: false,
    };

    lastSavedRef.current = cloneDraft(updatedDraft);
    dispatch({ type: 'UPDATE_OUTLINE', payload: outline });
    dispatch({ type: 'AUTOSAVE_SUCCESS', payload: savedAt });
  }, [state.draft]);

  const addOutlineSection = React.useCallback(async (sectionType: SectionType, position?: number) => {
    if (!state.draft) {
      return;
    }

    try {
      const updatedOutline = await sessionBuilderService.addSection(state.draft.sessionId, sectionType, position);
      applyServerOutline(updatedOutline);
    } catch (error) {
      handleOutlineError('Unable to add section', error);
    }
  }, [state.draft, applyServerOutline, handleOutlineError]);

  const updateOutlineSection = React.useCallback(async (sectionId: string, updates: Partial<FlexibleSessionSection>) => {
    if (!state.draft) {
      return;
    }

    try {
      const updatedOutline = await sessionBuilderService.updateSection(state.draft.sessionId, sectionId, updates);
      applyServerOutline(updatedOutline);
    } catch (error) {
      handleOutlineError('Unable to update section', error);
    }
  }, [state.draft, applyServerOutline, handleOutlineError]);

  const removeOutlineSection = React.useCallback(async (sectionId: string) => {
    if (!state.draft) {
      return;
    }

    try {
      const updatedOutline = await sessionBuilderService.removeSection(state.draft.sessionId, sectionId);
      applyServerOutline(updatedOutline);
    } catch (error) {
      handleOutlineError('Unable to remove section', error);
    }
  }, [state.draft, applyServerOutline, handleOutlineError]);

  const moveOutlineSection = React.useCallback(async (sectionId: string, direction: 'up' | 'down') => {
    if (!state.draft?.outline) {
      return;
    }

    const sections = [...state.draft.outline.sections];
    const index = sections.findIndex((section) => section.id === sectionId);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) {
      return;
    }

    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    const orderedIds = sections.map((section) => section.id);

    try {
      const updatedOutline = await sessionBuilderService.reorderSections(state.draft.sessionId, orderedIds);
      applyServerOutline(updatedOutline);
    } catch (error) {
      handleOutlineError('Unable to reorder sections', error);
    }
  }, [state.draft, applyServerOutline, handleOutlineError]);

  const duplicateOutlineSection = React.useCallback(async (sectionId: string) => {
    if (!state.draft) {
      return;
    }

    try {
      const updatedOutline = await sessionBuilderService.duplicateSection(state.draft.sessionId, sectionId);
      applyServerOutline(updatedOutline);
    } catch (error) {
      handleOutlineError('Unable to duplicate section', error);
    }
  }, [state.draft, applyServerOutline, handleOutlineError]);

  const publishSession = React.useCallback(async () => {
    if (!state.draft || !state.draft.outline) {
      publish({
        variant: 'error',
        title: 'Outline required',
        description: 'Add at least one section before publishing.',
      });
      return;
    }

    if (state.publishStatus === 'pending' || state.publishStatus === 'success') {
      return;
    }

    if (!state.draft.metadata.sessionType) {
      publish({
        variant: 'error',
        title: 'Session type required',
        description: 'Select a session type before publishing your session.',
      });
      return;
    }

    const requiredComplete = areClassicRequiredItemsComplete(state.draft);
    if (!requiredComplete) {
      publish({
        variant: 'error',
        title: 'Complete required fields',
        description: 'Fill in the required fields and outline before publishing.',
      });
      return;
    }

    dispatch({ type: 'PUBLISH_SESSION_START' });

    try {
      const session = await sessionBuilderService.createSessionFromOutline({
        outline: state.draft.outline,
        input: metadataToInput(state.draft.metadata),
        readinessScore: state.draft.readinessScore,
      });

      const createdSessionId = session?.id || state.draft.sessionId;

      if (createdSessionId && createdSessionId !== 'new') {
        try {
          await sessionBuilderService.autosaveDraft(createdSessionId, convertAutosavePayload(state.draft));
        } catch (draftError) {
          console.warn('Failed to sync builder draft after publish', draftError);
        }
      }

      const snapshot: ClassicSessionDraft = {
        ...state.draft,
        sessionId: createdSessionId,
        isDirty: false,
      };
      lastSavedRef.current = cloneDraft(snapshot);

      dispatch({ type: 'PUBLISH_SESSION_SUCCESS', payload: { sessionId: createdSessionId } });

      publish({
        variant: 'success',
        title: 'Session saved',
        description: session?.title
          ? `${session.title} is now available in Sessions.`
          : 'Your session is now saved in Sessions.',
        actionLabel: createdSessionId && createdSessionId !== 'new' ? 'View session' : undefined,
        onAction: createdSessionId && createdSessionId !== 'new'
          ? () => {
              window.open(`/sessions/${createdSessionId}`, '_blank');
            }
          : undefined,
      });
    } catch (error: any) {
      const responseMessage = error?.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join('\n')
        : responseMessage || error?.message || 'Failed to publish session';

      dispatch({ type: 'PUBLISH_SESSION_FAILURE', payload: message });

      publish({
        variant: 'error',
        title: 'Publish failed',
        description: message,
      });
    }
  }, [state.draft, state.publishStatus, publish]);

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  const value = React.useMemo<ClassicSessionBuilderContextValue>(() => ({
    state,
    updateMetadata,
    updateOutline,
    addOutlineSection,
    updateOutlineSection,
    removeOutlineSection,
    moveOutlineSection,
    duplicateOutlineSection,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
  }), [
    state,
    updateMetadata,
    updateOutline,
    addOutlineSection,
    updateOutlineSection,
    removeOutlineSection,
    moveOutlineSection,
    duplicateOutlineSection,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
  ]);

  return (
    <ClassicSessionBuilderContext.Provider value={value}>
      {children}
    </ClassicSessionBuilderContext.Provider>
  );
};

export const useClassicSessionBuilder = (): ClassicSessionBuilderContextValue => {
  const context = React.useContext(ClassicSessionBuilderContext);
  if (!context) {
    throw new Error('useClassicSessionBuilder must be used within a ClassicSessionBuilderProvider');
  }
  return context;
};
