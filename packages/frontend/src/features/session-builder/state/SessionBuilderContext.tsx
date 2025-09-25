import * as React from 'react';
import {
  sessionBuilderService,
  SessionBuilderInput,
  SessionOutline,
} from '../../../services/session-builder.service';
import { useToast } from '../../../ui';
import { AIContentVersion, BuilderState, SessionDraftData, SessionMetadata } from './types';
import { builderReducer, initialBuilderState } from './builderReducer';

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
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    title: '',
    sessionType: 'workshop',
    category: 'Leadership',
    desiredOutcome: '',
    currentProblem: '',
    specificTopics: '',
    startDate: start.toISOString().slice(0, 10),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    timezone: DEFAULT_TIMEZONE,
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
  const requiredFields: (keyof SessionMetadata)[] = [
    'title',
    'desiredOutcome',
    'currentProblem',
    'specificTopics',
  ];
  const filled = requiredFields.filter((field) =>
    (draft.metadata[field] ?? '').toString().trim()
  ).length;

  let score = Math.round((filled / requiredFields.length) * 60);
  if (draft.outline && draft.outline.sections.length > 0) {
    score += 20;
  }
  if (draft.acceptedVersionId) {
    score += 20;
  }
  return Math.min(score, 100);
}

function outlineToVersion(outline: SessionOutline, prompt: string): AIContentVersion {
  const blocks = outline.sections.map((section) => ({
    id: section.id,
    heading: section.title,
    body: section.description,
  }));

  return {
    id: `ai-${Date.now()}`,
    prompt,
    summary: outline.suggestedDescription,
    blocks,
    createdAt: outline.generatedAt || new Date().toISOString(),
    status: 'ready',
    source: 'ai',
  };
}

function buildMockVersion(prompt: string, metadata: SessionMetadata): AIContentVersion {
  const createdAt = new Date().toISOString();
  return {
    id: `mock-${Date.now()}`,
    prompt,
    summary: `Proposed outline for ${metadata.title || metadata.category}`,
    blocks: [
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
    ],
    createdAt,
    status: 'ready',
    source: 'ai',
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
  }, [state.draft, publish]);

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
          publish({
            variant: 'info',
            title: 'Draft autosaved',
            description: response?.viaFallback
              ? 'Saved locally while offline. Changes will sync when back online.'
              : 'Changes synced to the builder service.',
            actionLabel: 'Undo',
            onAction: () => {
              if (lastSavedRef.current) {
                const restored = cloneDraft(lastSavedRef.current);
                dispatch({ type: 'RESTORE_DRAFT', payload: restored });
              }
            },
          });
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
  }, [state.draft, state.status, publish, manualAutosave]);

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
  }, []);

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
        const version = response?.outline
          ? outlineToVersion(response.outline, prompt)
          : buildMockVersion(prompt, state.draft.metadata);
        dispatch({ type: 'AI_REQUEST_SUCCESS', payload: version });
        updatePrompt(prompt);
      } catch (error) {
        console.warn('AI generation failed, falling back to mock content', error);
        const version = buildMockVersion(prompt, state.draft.metadata);
        dispatch({ type: 'AI_REQUEST_SUCCESS', payload: version });
        updatePrompt(prompt);
      }
    },
    [state.draft, updatePrompt]
  );

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
