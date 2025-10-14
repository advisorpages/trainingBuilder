import * as React from 'react';
import {
  sessionBuilderService,
  SessionBuilderInput,
  SessionOutline,
  MultiVariantResponse,
  SectionType,
  FlexibleSessionSection,
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
  variants: MultiVariantResponse['variants'];
  variantsStatus: 'idle' | 'pending' | 'success' | 'error';
  variantsError: string | null;
  variantSelectionTime: number;
  generateMultipleVariants: () => Promise<boolean>;
  selectVariant: (variantId: string) => Promise<void>;
  addOutlineSection: (sectionType: SectionType, position?: number) => Promise<void>;
  updateOutlineSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => Promise<void>;
  removeOutlineSection: (sectionId: string) => Promise<void>;
  moveOutlineSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;
  duplicateOutlineSection: (sectionId: string) => Promise<void>;
}

const SessionBuilderContext =
  React.createContext<SessionBuilderContextValue | undefined>(undefined);

const AUTOSAVE_DEBOUNCE_MS = 1500;
const DEFAULT_TIMEZONE = 'America/New_York';
const SESSION_TYPE_VALUES = ['event', 'training', 'workshop', 'webinar'] as const;

type SessionTypeValue = (typeof SESSION_TYPE_VALUES)[number];

function normalizeSessionType(value: unknown): SessionMetadata['sessionType'] {
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

function buildDefaultMetadata(): SessionMetadata {
  const today = new Date();
  // Set start time to today at 7:00 PM
  const start = new Date(today);
  start.setHours(19, 0, 0, 0); // 7:00 PM
  // Set end time to 8:30 PM (1.5 hours later)
  const end = new Date(start.getTime() + 90 * 60 * 1000); // 90 minutes

  return {
    title: '',
    sessionType: null, // No default selection
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
  };
}

function metadataToInput(metadata: SessionMetadata): SessionBuilderInput {
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

function inputToMetadata(input: SessionBuilderInput): SessionMetadata {
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

function buildPrompt(metadata: SessionMetadata): string {
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
    .flatMap((section) => (section.associatedTopic ? [section.associatedTopic] : []))
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
  prefilledTopics?: any[] | null;
  children: React.ReactNode;
}> = ({ sessionId = 'new', prefilledTopics = null, children }) => {
  const [state, dispatch] = React.useReducer(builderReducer, initialBuilderState);
  const { publish } = useToast();
  const lastSavedRef = React.useRef<SessionDraftData | null>(null);
  const undoTimerRef = React.useRef<number | null>(null);
  const [canUndoAutosave, setCanUndoAutosave] = React.useState(false);
  const [variants, setVariants] = React.useState<MultiVariantResponse['variants']>([]);
  const [variantsStatus, setVariantsStatus] =
    React.useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [variantsError, setVariantsError] = React.useState<string | null>(null);
  const [variantSelectionTime, setVariantSelectionTime] = React.useState<number>(0);
  const variantGenerationStartRef = React.useRef<number | null>(null);
  const variantReadyAtRef = React.useRef<number | null>(null);

  const handleOutlineError = React.useCallback((title: string, error: unknown) => {
    const message = error instanceof Error ? error.message : (error as any)?.message ?? 'Please try again.';
    publish({
      variant: 'error',
      title,
      description: message,
    });
  }, [publish]);

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
        const serverDraft = await sessionBuilderService.getCompleteSessionData(sessionId);
        if (serverDraft) {
          const draftMetadataInput = serverDraft.builderDraft?.metadata as SessionBuilderInput | undefined;
          const metadataFromDraft = draftMetadataInput ? inputToMetadata(draftMetadataInput) : undefined;

          const metadata: SessionMetadata = {
            title: serverDraft.title ?? metadataFromDraft?.title ?? '',
            sessionType: normalizeSessionType(
              serverDraft.sessionType ?? metadataFromDraft?.sessionType ?? null
            ),
            category: metadataFromDraft?.category ?? serverDraft.category?.name ?? '',
            categoryId: metadataFromDraft?.categoryId ?? serverDraft.category?.id,
            desiredOutcome: serverDraft.desiredOutcome ?? metadataFromDraft?.desiredOutcome ?? '',
            currentProblem: metadataFromDraft?.currentProblem ?? '',
            specificTopics: metadataFromDraft?.specificTopics ?? '',
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
            // If topics aren't in the draft metadata, check if we have prefilled topics
            topics: metadataFromDraft?.topics ?? [],
          };

          // Apply prefilled topics if they exist and metadata doesn't already have topics
          if (prefilledTopics && Array.isArray(prefilledTopics) && prefilledTopics.length > 0) {
            if (!metadata.topics || metadata.topics.length === 0) {
              console.log('[Session Builder Context] Applying prefilled topics to loaded draft:', prefilledTopics);
              metadata.topics = prefilledTopics;
              metadata.specificTopics = prefilledTopics.map(t => t.title).join(', ');

              // If all topics have the same category, set that as the category
              const categories = [...new Set(prefilledTopics.map((t: any) => t.category).filter(Boolean))];
              if (categories.length === 1 && !metadata.category) {
                metadata.category = categories[0];
              }

              // Clear sessionStorage after successfully applying topics
              try {
                sessionStorage.removeItem('sessionBuilder_prefilledTopics');
                sessionStorage.removeItem('sessionBuilder_prefilledTopics_timestamp');
                console.log('[Session Builder Context] Cleared topics from sessionStorage');
              } catch (error) {
                console.error('[Session Builder Context] Failed to clear sessionStorage:', error);
              }
            }
          }

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

    // If prefilled topics are provided, add them to metadata
    if (prefilledTopics && Array.isArray(prefilledTopics) && prefilledTopics.length > 0) {
      console.log('[Session Builder Context] Setting prefilled topics:', prefilledTopics);
      // Topics are already formatted as SessionTopicDraft from ManageTopicsPage
      metadata.topics = prefilledTopics;

      // Also set specificTopics field with topic names
      metadata.specificTopics = prefilledTopics.map(t => t.title).join(', ');

      // If all topics have the same category, set that as the category
      const categories = [...new Set(prefilledTopics.map((t: any) => t.category).filter(Boolean))];
      if (categories.length === 1) {
        metadata.category = categories[0];
      }
      console.log('[Session Builder Context] Metadata after setting topics:', metadata);
      console.log('[Session Builder Context] Topics successfully applied, count:', metadata.topics.length);

      // Clear sessionStorage after successfully loading topics
      try {
        sessionStorage.removeItem('sessionBuilder_prefilledTopics');
        sessionStorage.removeItem('sessionBuilder_prefilledTopics_timestamp');
        console.log('[Session Builder Context] Cleared topics from sessionStorage');
      } catch (error) {
        console.error('[Session Builder Context] Failed to clear sessionStorage:', error);
      }
    }

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
  }, [sessionId, prefilledTopics]);

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
  }, [state.draft]);

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

  const updateMetadata = React.useCallback((updates: Partial<SessionMetadata>) => {
    dispatch({ type: 'UPDATE_METADATA', payload: updates });
    setVariants([]);
    setVariantsStatus('idle');
    setVariantsError(null);
    setVariantSelectionTime(0);
    variantGenerationStartRef.current = null;
    variantReadyAtRef.current = null;
  }, []);

  const updatePrompt = React.useCallback((prompt: string) => {
    dispatch({ type: 'UPDATE_PROMPT', payload: prompt });
  }, []);

  const updateOutline = React.useCallback((outline: SessionOutline) => {
    dispatch({ type: 'UPDATE_OUTLINE', payload: outline });
  }, []);

  const applyServerOutline = React.useCallback((outline: SessionOutline) => {
    if (!state.draft) {
      return;
    }

    const savedAt = new Date().toISOString();
    const updatedDraft: SessionDraftData = {
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

  const generateMultipleVariants = React.useCallback(async (): Promise<boolean> => {
    if (!state.draft) {
      return false;
    }

    const { metadata } = state.draft;
    if (!metadata.desiredOutcome || !metadata.category || !metadata.sessionType || !metadata.locationId) {
      const message = 'Please fill in all required fields (desired outcome, category, session type, and location) before generating variants.';
      setVariantsStatus('error');
      setVariantsError(message);
      publish({
        variant: 'error',
        title: 'More details needed',
        description: message,
      });
      return false;
    }

    setVariants([]);
    setVariantsStatus('pending');
    setVariantsError(null);
    setVariantSelectionTime(0);
    variantReadyAtRef.current = null;
    variantGenerationStartRef.current = Date.now();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Session Builder v2] Generating variants...', {
        category: metadata.category,
        sessionType: metadata.sessionType,
        desiredOutcome: metadata.desiredOutcome,
      });
    }

    try {
      const response = await sessionBuilderService.generateMultipleOutlines(
        metadataToInput(metadata)
      );

      const completedAt = Date.now();
      const generationDuration = variantGenerationStartRef.current
        ? completedAt - variantGenerationStartRef.current
        : response.metadata?.processingTime ?? 0;

      setVariants(response.variants ?? []);
      setVariantsStatus('success');
      setVariantsError(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Session Builder v2] Variant generation complete', {
          generationMs: generationDuration,
          ragAvailable: response.metadata?.ragAvailable,
          totalVariants: response.metadata?.totalVariants,
          averageSimilarity: response.metadata?.averageSimilarity,
        });
        console.table(
          (response.variants ?? []).map((variant) => ({
            Label: variant.label,
            Source: variant.generationSource,
            'RAG Weight': `${Math.round(variant.ragWeight * 100)}%`,
            Sections: variant.outline.sections.length,
            Duration: `${variant.outline.totalDuration}m`,
          }))
        );
      }

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'variant_generation_complete', {
          event_category: 'Session Builder v2',
          event_label: response.metadata?.ragAvailable ? 'rag' : 'baseline',
          value: Math.max(
            0,
            Math.round(response.metadata?.processingTime ?? generationDuration)
          ),
        });
      }

      variantReadyAtRef.current = completedAt;
      variantGenerationStartRef.current = null;
      return true;
    } catch (error: any) {
      const message = error?.message ?? 'Failed to generate session variants.';
      setVariantsStatus('error');
      setVariantsError(message);
      variantGenerationStartRef.current = null;
      variantReadyAtRef.current = null;

      publish({
        variant: 'error',
        title: 'Variant generation failed',
        description: message,
      });

      if (process.env.NODE_ENV === 'development') {
        console.error('[Session Builder v2] Variant generation failed', error);
      }
      return false;
    }
  }, [state.draft, publish]);

  const selectVariant = React.useCallback(
    async (variantId: string) => {
      if (!state.draft) {
        return;
      }
      const selected = variants.find((variant) => variant.id === variantId);
      if (!selected) {
        return;
      }

      const selectionTimestamp = Date.now();
      const timeToSelect = variantReadyAtRef.current
        ? selectionTimestamp - variantReadyAtRef.current
        : 0;
      setVariantSelectionTime(Math.max(0, timeToSelect));
      variantReadyAtRef.current = null;

      const version = outlineToVersion(
        selected.outline,
        state.draft.aiPrompt || buildPrompt(state.draft.metadata)
      );
      const versionWithContext: AIContentVersion = {
        ...version,
        summary: selected.description || version.summary,
        source:
          selected.generationSource === 'rag' ? 'ai' : (version.source ?? 'ai'),
      };

      dispatch({ type: 'AI_REQUEST_SUCCESS', payload: versionWithContext });
      dispatch({ type: 'ACCEPT_AI_VERSION', payload: versionWithContext.id });
      dispatch({ type: 'UPDATE_OUTLINE', payload: selected.outline });

      try {
        await sessionBuilderService.logVariantSelection(state.draft.sessionId, {
          variantId: selected.id,
          generationSource: selected.generationSource,
          ragWeight: selected.ragWeight,
          ragSourcesUsed: selected.ragSourcesUsed,
          category: state.draft.metadata.category || '',
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Session Builder v2] Failed to log variant selection', error);
        }
      }

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'variant_selected', {
          event_category: 'Session Builder v2',
          event_label: selected.label,
          value: Math.round(selected.ragWeight * 100),
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[Session Builder v2] Variant selected', {
          id: selected.id,
          label: selected.label,
          source: selected.generationSource,
          selectionMs: timeToSelect,
        });
      }
    },
    [state.draft, variants]
  );

  const generateAIContent = React.useCallback(
    async (options?: { prompt?: string }) => {
      if (!state.draft) return;
      if (!state.draft.metadata.sessionType) {
        const message = 'Select a session type before generating an outline.';
        publish({
          variant: 'error',
          title: 'Session type required',
          description: message,
        });
        return;
      }
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
        const errorMessage = (error as Error)?.message || 'AI generation failed';
        dispatch({ type: 'AI_REQUEST_FAILURE', payload: errorMessage });
        publish({
          variant: 'error',
          title: 'AI Generation Failed',
          description: errorMessage || 'Unable to generate AI content. Please try again.',
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
    addOutlineSection,
    updateOutlineSection,
    removeOutlineSection,
    moveOutlineSection,
    duplicateOutlineSection,
    generateAIContent,
    acceptVersion,
    rejectAcceptedVersion,
    selectVersion,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
    variants,
    variantsStatus,
    variantsError,
    variantSelectionTime,
    generateMultipleVariants,
    selectVariant,
  }), [
    state,
    updateMetadata,
    updatePrompt,
    updateOutline,
    addOutlineSection,
    updateOutlineSection,
    removeOutlineSection,
    moveOutlineSection,
    duplicateOutlineSection,
    generateAIContent,
    acceptVersion,
    rejectAcceptedVersion,
    selectVersion,
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
    variants,
    variantsStatus,
    variantsError,
    variantSelectionTime,
    generateMultipleVariants,
    selectVariant,
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
