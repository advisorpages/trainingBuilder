import * as React from 'react';
import {
  sessionBuilderService,
  SessionBuilderInput,
  SessionOutline,
} from '../../../services/session-builder.service';
import { useToast } from '../../../ui';
import { AIContentVersion, BuilderState, SessionDraftData, SessionMetadata } from './types';
import { builderReducer, initialBuilderState } from './builderReducer';
import {
  calculateReadinessScore,
  getDraftReadinessItems,
} from '../utils/readiness';

interface SessionBuilderContextValue {
  state: BuilderState;
  updateMetadata: (updates: Partial<SessionMetadata>) => void;
  updatePrompt: (prompt: string) => void;
  updateOutline: (outline: SessionOutline) => void;
  generateAIContent: (options?: { prompt?: string }) => Promise<void>;
  acceptVersion: (versionId: string) => void;
  rejectAcceptedVersion: () => void;
  selectVersion: (versionId: string) => void;
  manualAutosave: () => Promise<void>;
  publishSession: () => Promise<void>;
  canUndoAutosave: boolean;
  undoAutosave: () => void;
}

const SessionBuilderContext =
  React.createContext<SessionBuilderContextValue | undefined>(undefined);

const AUTOSAVE_DEBOUNCE_MS = 1500;
const DEFAULT_TIMEZONE = 'America/New_York';

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

function buildDefaultMetadata(): SessionMetadata {
  const today = new Date();
  // Set start time to today at 7:00 PM
  const start = new Date(today);
  start.setHours(19, 0, 0, 0); // 7:00 PM
  // Set end time to 8:30 PM (1.5 hours later)
  const end = new Date(start.getTime() + 90 * 60 * 1000); // 90 minutes

  return {
    title: '',
    sessionType: 'workshop',
    category: 'Leadership',
    desiredOutcome: '',
    currentProblem: '',
    specificTopics: '',
    startDate: today.toISOString().slice(0, 10),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    timezone: DEFAULT_TIMEZONE,
    location: '',
    locationId: undefined,
    audienceId: undefined,
    toneId: undefined,
  };
}

function metadataToInput(metadata: SessionMetadata): SessionBuilderInput {
  return {
    title: metadata.title,
    category: metadata.category,
    sessionType: metadata.sessionType,
    desiredOutcome: metadata.desiredOutcome,
    currentProblem: metadata.currentProblem,
    specificTopics: metadata.specificTopics,
    date: metadata.startDate,
    startTime: metadata.startTime,
    endTime: metadata.endTime,
    locationId: metadata.locationId,
    audienceId: metadata.audienceId,
    toneId: metadata.toneId,
  };
}

function inputToMetadata(input: SessionBuilderInput): SessionMetadata {
  const startTime = input.startTime || new Date().toISOString();
  const endTime = input.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    title: input.title ?? '',
    sessionType: input.sessionType,
    category: input.category,
    desiredOutcome: input.desiredOutcome,
    currentProblem: input.currentProblem ?? '',
    specificTopics: input.specificTopics ?? '',
    startDate: input.date,
    startTime,
    endTime,
    timezone: DEFAULT_TIMEZONE,
    location: '',
    locationId: input.locationId,
    audienceId: input.audienceId,
    toneId: input.toneId,
  };
}

function buildPrompt(metadata: SessionMetadata): string {
  const segments = [
    `Design a ${metadata.sessionType} session about ${metadata.category}.`,
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
  segments.push(`Session duration: ${Math.round((new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime()) / 60000)} minutes.`);
  return segments.join(' ');
}

const cloneDraft = (draft: SessionDraftData): SessionDraftData =>
  JSON.parse(JSON.stringify(draft));

function calculateReadiness(draft: SessionDraftData): number {
  const items = getDraftReadinessItems(draft);
  return calculateReadinessScore(items);
}

function outlineToVersion(outline: SessionOutline, prompt: string): AIContentVersion {
  const blocks = outline.sections.map((section) => ({
    id: section.id,
    heading: section.title,
    body: section.description,
  }));

  // Convert sections to TopicBasedSections for new format
  const sections = outline.sections.map((section) => ({
    id: section.id,
    type: section.type as 'opener' | 'topic' | 'exercise' | 'closing',
    position: section.position,
    title: section.title,
    duration: section.duration,
    description: section.description,
    learningObjectives: section.learningObjectives,
    suggestedActivities: section.suggestedActivities,
    associatedTopic: section.associatedTopic ? {
      id: section.associatedTopic.id,
      name: section.associatedTopic.name,
      description: section.associatedTopic.description,
      learningOutcomes: section.associatedTopic.learningOutcomes,
      trainerNotes: section.associatedTopic.trainerNotes,
      materialsNeeded: section.associatedTopic.materialsNeeded,
      deliveryGuidance: section.associatedTopic.deliveryGuidance,
    } : undefined,
    isTopicSuggestion: section.isTopicSuggestion,
  }));

  // Extract suggested topics from sections that have associated topics
  const suggestedTopics = sections
    .filter(section => section.associatedTopic)
    .map(section => section.associatedTopic!)
    .filter((topic, index, self) =>
      index === self.findIndex(t => t.id === topic.id) // Remove duplicates
    );

  // Detect if this is template content from backend vs real AI
  const isTemplate = outline.fallbackUsed === false &&
    (outline.suggestedSessionTitle?.includes('Workshop') ||
     outline.suggestedSessionTitle?.includes('Session') ||
     blocks.some(block =>
       block.heading === 'Welcome & Context Setting' ||
       block.heading === 'Core Concepts & Stories'
     ));

  return {
    id: `${isTemplate ? 'template' : 'ai'}-${Date.now()}`,
    prompt,
    summary: outline.suggestedDescription,
    blocks,
    sections,
    suggestedTopics,
    createdAt: outline.generatedAt || new Date().toISOString(),
    status: 'ready',
    source: isTemplate ? 'template' : 'ai',
  };
}

function versionToOutline(version: AIContentVersion): SessionOutline {
  const sections = (version.sections ?? []).map((section, index) => ({
    id: section.id ?? `section-${index + 1}`,
    type: section.type,
    position: section.position ?? index + 1,
    title: section.title,
    duration: section.duration ?? 0,
    description: section.description ?? '',
    learningObjectives: section.learningObjectives,
    suggestedActivities: section.suggestedActivities,
    associatedTopic: section.associatedTopic
      ? {
          id: section.associatedTopic.id,
          name: section.associatedTopic.name,
          description: section.associatedTopic.description,
          learningOutcomes: section.associatedTopic.learningOutcomes,
          trainerNotes: section.associatedTopic.trainerNotes,
          materialsNeeded: section.associatedTopic.materialsNeeded,
          deliveryGuidance: section.associatedTopic.deliveryGuidance,
        }
      : undefined,
    isTopicSuggestion: section.isTopicSuggestion,
  }));

  const totalDuration = sections.reduce((sum, section) => sum + (section.duration ?? 0), 0);

  return {
    sections,
    totalDuration,
    suggestedSessionTitle: version.summary || 'Generated Session',
    suggestedDescription: version.summary || '',
    difficulty: 'Intermediate',
    recommendedAudienceSize: '10-25',
    ragSuggestions: undefined,
    fallbackUsed: version.source === 'mock',
    generatedAt: version.createdAt || new Date().toISOString(),
    convertedFromLegacy: true,
    convertedAt: new Date().toISOString(),
  };
}

function buildMockVersion(prompt: string, metadata: SessionMetadata): AIContentVersion {
  const createdAt = new Date().toISOString();
  const blocks = [
    {
      id: 'intro',
      heading: 'Welcome & Warm-up',
      body: 'Kick off with an energizer that surfaces current leadership challenges.'
    },
    {
      id: 'core',
      heading: 'Core Concepts',
      body: 'Cover the foundational frameworks and illustrate them with real scenarios from the team.'
    },
    {
      id: 'practice',
      heading: 'Applied Practice',
      body: 'Facilitate small-group role plays to practice feedback and alignment conversations.'
    },
  ];

  const sections = [
    {
      id: 'opener-mock',
      type: 'opener' as const,
      position: 0,
      title: 'Welcome & Warm-up',
      duration: 15,
      description: 'Kick off with an energizer that surfaces current leadership challenges.',
      learningObjectives: ['Establish psychological safety', 'Surface current challenges'],
      isTopicSuggestion: false,
    },
    {
      id: 'topic-mock',
      type: 'topic' as const,
      position: 1,
      title: 'Core Concepts',
      duration: 30,
      description: 'Cover the foundational frameworks and illustrate them with real scenarios from the team.',
      learningObjectives: ['Understand key frameworks', 'Apply to real scenarios'],
      isTopicSuggestion: true,
    },
    {
      id: 'exercise-mock',
      type: 'exercise' as const,
      position: 2,
      title: 'Applied Practice',
      duration: 25,
      description: 'Facilitate small-group role plays to practice feedback and alignment conversations.',
      suggestedActivities: ['Role-play scenarios', 'Peer feedback loops'],
      isTopicSuggestion: false,
    },
  ];

  return {
    id: `mock-${Date.now()}`,
    prompt,
    summary: `Proposed outline for ${metadata.title || metadata.category}`,
    blocks,
    sections,
    suggestedTopics: [],
    createdAt,
    status: 'ready',
    source: 'mock',
  };
}

function convertAutosavePayload(draft: SessionDraftData) {
  return {
    metadata: metadataToInput(draft.metadata),
    outline: draft.outline,
    aiPrompt: draft.aiPrompt,
    aiVersions: draft.aiVersions,
    acceptedVersionId: draft.acceptedVersionId,
    readinessScore: draft.readinessScore,
  };
}

export const SessionBuilderProvider: React.FC<{
  sessionId?: string;
  children: React.ReactNode;
}> = ({ sessionId = 'new', children }) => {
  const [state, dispatch] = React.useReducer(builderReducer, initialBuilderState);
  const { publish } = useToast();
  const lastSavedRef = React.useRef<SessionDraftData | null>(null);
  const undoTimerRef = React.useRef<number | null>(null);
  const [canUndoAutosave, setCanUndoAutosave] = React.useState(false);

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
  }, [dispatch]);

  const loadDraft = React.useCallback(async (): Promise<SessionDraftData> => {
    if (sessionId && sessionId !== 'new') {
      try {
        const localDraft = await sessionBuilderService.loadOutlineDraft(sessionId);
        if (localDraft) {
          const metadata = inputToMetadata(localDraft.metadata);
          const aiPrompt = localDraft.aiPrompt || buildPrompt(metadata);
          return {
            sessionId,
            metadata,
            outline: localDraft.outline,
            aiPrompt,
            aiVersions: localDraft.aiVersions || [],
            acceptedVersionId: localDraft.acceptedVersionId,
            selectedVersionId: localDraft.acceptedVersionId,
            readinessScore: localDraft.readinessScore ?? calculateReadiness({
              sessionId,
              metadata,
              outline: localDraft.outline,
              aiPrompt,
              aiVersions: localDraft.aiVersions || [],
              acceptedVersionId: localDraft.acceptedVersionId,
              selectedVersionId: localDraft.acceptedVersionId,
              readinessScore: 0,
              lastAutosaveAt: localDraft.savedAt,
              isDirty: false,
            }),
            lastAutosaveAt: localDraft.savedAt,
            isDirty: false,
          };
        }
      } catch (error) {
        console.warn('Unable to load local draft, falling back to defaults', error);
      }

      try {
        const serverDraft = await sessionBuilderService.getCompleteSessionData(sessionId);
        if (serverDraft) {
          const metadata: SessionMetadata = {
            title: serverDraft.title ?? '',
            sessionType: serverDraft.sessionType ?? 'workshop',
            category: serverDraft.category?.name ?? 'Leadership',
            desiredOutcome: serverDraft.desiredOutcome ?? '',
            currentProblem: serverDraft.currentProblem ?? '',
            specificTopics: serverDraft.specificTopics ?? '',
            startDate: serverDraft.startTime?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
            startTime: serverDraft.startTime ?? new Date().toISOString(),
            endTime: serverDraft.endTime ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            timezone: serverDraft.timezone ?? DEFAULT_TIMEZONE,
            location: serverDraft.location ?? '',
            locationId: serverDraft.locationId,
            audienceId: serverDraft.audienceId,
            toneId: serverDraft.toneId,
          };

          const outline: SessionOutline | null = serverDraft.aiGeneratedContent?.outline ?? createEmptyOutline();

          return {
            sessionId,
            metadata,
            outline,
            aiPrompt: buildPrompt(metadata),
            aiVersions: [],
            acceptedVersionId: undefined,
            selectedVersionId: undefined,
            readinessScore: calculateReadiness({
              sessionId,
              metadata,
              outline,
              aiPrompt: buildPrompt(metadata),
              aiVersions: [],
              acceptedVersionId: undefined,
              selectedVersionId: undefined,
              readinessScore: 0,
              lastAutosaveAt: undefined,
              isDirty: false,
            }),
            lastAutosaveAt: undefined,
            isDirty: false,
          };
        }
      } catch (error) {
        console.warn('Unable to load session from backend', error);
      }
    }

    const metadata = buildDefaultMetadata();
    return {
      sessionId,
      metadata,
      outline: createEmptyOutline(),
      aiPrompt: buildPrompt(metadata),
      aiVersions: [],
      acceptedVersionId: undefined,
      selectedVersionId: undefined,
      readinessScore: 0,
      lastAutosaveAt: undefined,
      isDirty: false,
    };
  }, [sessionId]);

  React.useEffect(() => {
    let isMounted = true;
    dispatch({ type: 'INIT_START' });

    loadDraft()
      .then((draft) => {
        if (!isMounted) return;
        const readiness = calculateReadiness(draft);
        const hydratedDraft = { ...draft, readinessScore: readiness };
        lastSavedRef.current = cloneDraft(hydratedDraft);
        dispatch({ type: 'INIT_SUCCESS', payload: hydratedDraft });
      })
      .catch((error: any) => {
        if (!isMounted) return;
        dispatch({ type: 'INIT_FAILURE', payload: error?.message ?? 'Unable to load session draft' });
      });

    return () => {
      isMounted = false;
    };
  }, [loadDraft]);

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
    const nextReadiness = calculateReadiness(state.draft);
    if (nextReadiness !== state.draft.readinessScore) {
      dispatch({ type: 'UPDATE_READINESS', payload: nextReadiness });
    }
  }, [state.draft?.metadata, state.draft?.outline, state.draft?.acceptedVersionId]);

  const manualAutosave = React.useCallback(async () => {
    if (!state.draft) return;
    dispatch({ type: 'AUTOSAVE_PENDING' });
    try {
      const response = await sessionBuilderService.autosaveDraft(
        state.draft.sessionId,
        convertAutosavePayload(state.draft)
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
    if (!state.draft || !state.draft.isDirty || state.status !== 'ready') {
      return;
    }

    const timer = window.setTimeout(() => {
      dispatch({ type: 'AUTOSAVE_PENDING' });
      sessionBuilderService
        .autosaveDraft(state.draft!.sessionId, convertAutosavePayload(state.draft!))
        .then((response) => {
          const savedAt = response?.savedAt ?? new Date().toISOString();
          lastSavedRef.current = cloneDraft({
            ...state.draft!,
            lastAutosaveAt: savedAt,
            isDirty: false,
          });
          dispatch({ type: 'AUTOSAVE_SUCCESS', payload: savedAt });
          showUndoTemporarily();
          if (response?.viaFallback) {
            publish({
              variant: 'info',
              title: 'Draft saved locally',
              description: 'You are offline. Changes will sync once you are back online.',
            });
          }
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

  const updateMetadata = React.useCallback((updates: Partial<SessionMetadata>) => {
    dispatch({ type: 'UPDATE_METADATA', payload: updates });
  }, []);

  const updatePrompt = React.useCallback((prompt: string) => {
    dispatch({ type: 'UPDATE_PROMPT', payload: prompt });
  }, []);

  const updateOutline = React.useCallback((outline: SessionOutline) => {
    dispatch({ type: 'UPDATE_OUTLINE', payload: outline });
  }, []);

  const acceptVersion = React.useCallback((versionId: string) => {
    dispatch({ type: 'ACCEPT_AI_VERSION', payload: versionId });
    if (!state.draft) {
      return;
    }

    const version = state.draft.aiVersions.find((v) => v.id === versionId);
    if (version && version.sections && version.sections.length > 0) {
      const outline = versionToOutline(version);
      dispatch({ type: 'UPDATE_OUTLINE', payload: outline });
    }
  }, [state.draft]);

  const rejectAcceptedVersion = React.useCallback(() => {
    if (!state.draft?.acceptedVersionId) return;
    dispatch({ type: 'CLEAR_ACCEPTED_VERSION' });
  }, [state.draft?.acceptedVersionId]);

  const selectVersion = React.useCallback((versionId: string) => {
    dispatch({ type: 'SELECT_AI_VERSION', payload: versionId });
  }, []);

  const generateAIContent = React.useCallback(
    async (options?: { prompt?: string }) => {
      if (!state.draft) return;
      dispatch({ type: 'AI_REQUEST_START' });
      const prompt = options?.prompt ?? buildPrompt(state.draft.metadata);

      try {
        const response = await sessionBuilderService.generateSessionOutline(
          metadataToInput(state.draft.metadata)
        );
        const outlineFromResponse = response?.outline ?? null;
        const version = outlineFromResponse
          ? outlineToVersion(outlineFromResponse, prompt)
          : buildMockVersion(prompt, state.draft.metadata);

        const outlineForState = outlineFromResponse ?? versionToOutline(version);
        dispatch({ type: 'UPDATE_OUTLINE', payload: outlineForState });
        dispatch({ type: 'AI_REQUEST_SUCCESS', payload: version });
        updatePrompt(prompt);
      } catch (error) {
        console.error('AI generation failed:', error);
        // Show the actual error to the user instead of silently falling back
        dispatch({ type: 'AI_REQUEST_FAILURE', payload: error.message });
        publish({
          variant: 'error',
          title: 'AI Generation Failed',
          description: error.message || 'Unable to generate AI content. Please try again.',
        });
      }
    },
    [state.draft, updatePrompt, publish]
  );

  const publishSession = React.useCallback(async () => {
    if (!state.draft || !state.draft.outline) {
      publish({
        variant: 'error',
        title: 'Outline required',
        description: 'Generate or build an outline before publishing.',
      });
      return;
    }

    if (state.publishStatus === 'pending') {
      return;
    }

    dispatch({ type: 'PUBLISH_SESSION_START' });

    try {
      const session = await sessionBuilderService.createSessionFromOutline({
        outline: state.draft.outline,
        input: metadataToInput(state.draft.metadata),
        readinessScore: state.draft.readinessScore,
      });

      const sessionId = session?.id || state.draft.sessionId;

      if (sessionId && sessionId !== 'new') {
        try {
          await sessionBuilderService.autosaveDraft(sessionId, convertAutosavePayload(state.draft));
        } catch (draftError) {
          console.warn('Failed to sync builder draft after publish', draftError);
        }
      }

      if (state.draft) {
        const updatedDraftSnapshot: SessionDraftData = {
          ...state.draft,
          sessionId,
          isDirty: false,
        };
        lastSavedRef.current = cloneDraft(updatedDraftSnapshot);
      }

      dispatch({ type: 'PUBLISH_SESSION_SUCCESS', payload: { sessionId } });

      publish({
        variant: 'success',
        title: 'Session published',
        description: session?.title
          ? `${session.title} is now saved in Sessions.`
          : 'Your session is now saved in Sessions.',
        actionLabel: sessionId && sessionId !== 'new' ? 'View session' : undefined,
        onAction: sessionId && sessionId !== 'new'
          ? () => {
              window.open(`/sessions/${sessionId}`, '_blank');
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
        undoTimerRef.current = null;
      }
    };
  }, []);

  const value = React.useMemo<SessionBuilderContextValue>(() => ({
    state,
    updateMetadata,
    updatePrompt,
    updateOutline,
    generateAIContent,
    acceptVersion,
    rejectAcceptedVersion,
    selectVersion,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
  }), [
    state,
    updateMetadata,
    updatePrompt,
    updateOutline,
    generateAIContent,
    acceptVersion,
    rejectAcceptedVersion,
    selectVersion,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
  ]);

  return (
    <SessionBuilderContext.Provider value={value}>
      {children}
    </SessionBuilderContext.Provider>
  );
};

export const useSessionBuilder = () => {
  const context = React.useContext(SessionBuilderContext);
  if (!context) {
    throw new Error('useSessionBuilder must be used within SessionBuilderProvider');
  }
  return context;
};
