import * as React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { ToastProvider, Button } from '../ui';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { sessionService } from '../services/session.service';
import { transformSessionToBuilderData, resolveTopicNames } from '../utils/sessionEditTransform';
import {
  AutosaveIndicator,
  AIComposer,
  QuickAddModal,
  SessionMetadataForm,
  StepIndicator,
  BuilderStep,
  useBuilderSteps,
  VersionComparison,
  DebugPanel,
  useApiDebugger,
  UnifiedReviewEditor,
  TrainerAndTopicAssignmentStep
} from '../features/session-builder/components';
import { VariantSelector } from '../components/session-builder/VariantSelector';
import { SessionBuilderProvider, useSessionBuilder } from '../features/session-builder/state/SessionBuilderContext';
import { sessionBuilderService, SectionType, FlexibleSessionSection } from '../services/session-builder.service';
import { savedVariantsService } from '../services/saved-variants.service';
import { SessionTopicDraft, SessionDraftData } from '../features/session-builder/state/types';
import { cn } from '../lib/utils';
import {
  areRequiredItemsComplete,
  getDraftReadinessItems,
} from '../features/session-builder/utils/readiness';
import { SessionStatus } from '@leadership-training/shared';
import { EditModeProvider } from '../contexts/EditModeContext';

type BuilderNavigationState = {
  from?: string;
  prefilledTopics?: SessionTopicDraft[];
  savedVariant?: any;
  isEditing?: boolean;
  initialStep?: BuilderStep;
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

const toNumeric = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

// Simplified function to get topics for UI components - now just returns metadata topics
// since topics are automatically synchronized with outline
const getTopicsForUI = (draft: SessionDraftData): SessionTopicDraft[] => {
  // Primary source: synchronized metadata topics
  if (draft.metadata.topics && Array.isArray(draft.metadata.topics) && draft.metadata.topics.length > 0) {
    return draft.metadata.topics;
  }

  // Fallback: derive directly from outline if metadata topics are empty
  if (draft.outline?.sections && Array.isArray(draft.outline.sections)) {
    console.warn('[SessionBuilder] Metadata topics empty, deriving from outline as fallback');
    return sessionBuilderService.sortSectionsByPosition(draft.outline.sections).map((section: FlexibleSessionSection, index: number) => ({
      id: crypto.randomUUID(), // Generate stable ID for drag-and-drop
      sectionId: section.id,
      title: section.title || `Section ${index + 1}`,
      description: section.description || '',
      durationMinutes: section.duration || 15,
      learningOutcomes: section.learningObjectives?.join('\n') || '',
      trainerNotes: section.trainerNotes || '',
      materialsNeeded: section.materialsNeeded?.join('\n') || '',
      deliveryGuidance: section.deliveryGuidance || '',
      callToAction: section.suggestedActivities?.join('\n') || '',
      trainerName: section.trainerName,
      position: section.position ?? index + 1,
      ...(section.associatedTopic?.id ? { topicId: section.associatedTopic.id } : {}),
      ...(section.trainerId ? { trainerId: section.trainerId } : {}),
    }));
  }

  return [];
};

interface SessionBuilderScreenProps {
  routeSessionId: string;
  prefilledTopics?: any[] | null;
  savedVariant?: any | null;
  initialStep?: BuilderStep;
  isEditMode?: boolean;
  existingSessionId?: string;
}

const SessionBuilderScreen: React.FC<SessionBuilderScreenProps> = ({
  routeSessionId,
  prefilledTopics,
  savedVariant,
  initialStep,
  isEditMode = false,
  existingSessionId,
}) => {
  const {
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
  generateMultipleVariants,
  acceptVersion,
  rejectAcceptedVersion,
    selectVersion,
    selectVariant,
    publishSession,
    variants,
    variantsStatus,
    variantsError,
    variantSelectionTime,
  } = useSessionBuilder();
  const draft = state.draft;
  const publishStatus = state.publishStatus;
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = (location.state ?? {}) as BuilderNavigationState;
  const fromSessionsList = Boolean(navigationState.from === 'sessions-list');
  const {
    prefilledTopics: statePrefilledTopics,
    savedVariant: stateSavedVariant,
    initialStep: stateInitialStep,
    isEditing: stateIsEditingSavedVariant,
  } = navigationState;
  const [showTopicsNotification, setShowTopicsNotification] = React.useState(false);

  // Show notification when topics are pre-filled
  React.useEffect(() => {
    if (prefilledTopics && prefilledTopics.length > 0 && state.status === 'ready') {
      setShowTopicsNotification(true);
      const timer = setTimeout(() => setShowTopicsNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [prefilledTopics, state.status]);

  // Load existing session data when in edit mode
  const hasLoadedExistingSession = React.useRef(false);

  React.useEffect(() => {
    hasLoadedExistingSession.current = false;
  }, [existingSessionId]);

  React.useEffect(() => {
    if (!isEditMode || !existingSessionId || state.status !== 'ready' || hasLoadedExistingSession.current) {
      return;
    }

    hasLoadedExistingSession.current = true;

    const loadExistingSession = async () => {
      try {
        setLoadingExistingSession(true);
        setExistingSessionError(null);

        console.log('[SessionBuilder Edit Mode] Loading existing session:', existingSessionId);
        const session = await sessionService.getSession(existingSessionId);

        // Transform session data to builder format
        const builderData = transformSessionToBuilderData(session);

        // Validate ID consistency between topics and outline sections
        console.log('[SessionBuilder Edit Mode] Validating ID consistency:', {
          sessionId: existingSessionId,
          topicsCount: builderData.topics?.length || 0,
          outlineSectionsCount: builderData.outline?.sections?.length || 0,
          topicSample: builderData.topics?.slice(0, 2).map(t => ({
            id: t.id,
            title: t.title?.substring(0, 30),
            sectionId: t.sectionId
          })),
          sectionSample: builderData.outline?.sections?.slice(0, 2).map(s => ({
            id: s.id,
            title: s.title?.substring(0, 30),
            hasTopic: !!s.associatedTopic
          }))
        });

        // Update metadata first
        await updateMetadata(builderData.metadata);

        // Preserve topic snapshot for quick access during edits
        latestTopicsRef.current = builderData.topics ?? [];

        // Create outline from existing session topics
        const currentDraft = state.draft;
        if (builderData.outline) {
          await updateOutline(builderData.outline);

          // Ensure topics are also populated in metadata from the transformed data
          if (builderData.topics && builderData.topics.length > 0) {
            console.log('[SessionBuilder Edit Mode] Loading topics from transformed data:', builderData.topics.length);

            // Additional validation: ensure all topics have proper IDs and section references
            const validatedTopics = builderData.topics.map(topic => ({
              ...topic,
              // Ensure topic has stable ID if missing
              id: topic.id || crypto.randomUUID(),
              // Ensure sectionId matches outline section
              sectionId: topic.sectionId || builderData.outline.sections.find(s => s.associatedTopic?.id === topic.topicId)?.id
            }));

            console.log('[SessionBuilder Edit Mode] Validated topics:', validatedTopics.map(t => ({
              id: t.id,
              title: t.title?.substring(0, 30),
              sectionId: t.sectionId,
              hasValidId: !!t.id
            })));

            await updateMetadata({ topics: validatedTopics });
          } else {
            // If no topics in transformed data, create them from outline sections
            if (builderData.outline.sections && builderData.outline.sections.length > 0) {
              console.log('[SessionBuilder Edit Mode] Creating topics from outline sections:', builderData.outline.sections.length);
              const topicsFromOutline = sessionBuilderService.sortSectionsByPosition(builderData.outline.sections).map((section: FlexibleSessionSection, index: number) => {
                // Use the section ID as the topic ID for consistency
                const topicId = section.id.startsWith('topic-') ? section.id : `topic-${section.id}`;

                return {
                  id: topicId, // Use section ID for consistency
                  sectionId: section.id,
                  title: section.title || `Topic ${index + 1}`,
                  description: section.description || '',
                  durationMinutes: section.duration || 30,
                  learningOutcomes: section.learningObjectives?.join('\n') || '',
                  trainerNotes: section.trainerNotes || '',
                  materialsNeeded: section.materialsNeeded?.join('\n') || '',
                  deliveryGuidance: section.deliveryGuidance || '',
                  callToAction: section.suggestedActivities?.join('\n') || '',
                  trainerName: section.trainerName,
                  position: section.position ?? index + 1,
                  ...(section.associatedTopic?.id ? { topicId: section.associatedTopic.id } : {}),
                  ...(section.trainerId ? { trainerId: section.trainerId } : {}),
                };
              });

              console.log('[SessionBuilder Edit Mode] Created topics from outline sections:', topicsFromOutline.length);
              await updateMetadata({ topics: topicsFromOutline });
            }
          }

          // Final validation: ensure topics and sections are properly linked
          const finalDraft = state.draft;
          if (finalDraft?.metadata.topics && finalDraft?.outline?.sections) {
            const reconciliationCheck = finalDraft.metadata.topics.map((topic, index) => {
              const matchingSection = finalDraft.outline.sections.find(section => section.id === topic.sectionId);
              return {
                topicId: topic.id,
                topicTitle: topic.title?.substring(0, 30),
                sectionId: topic.sectionId,
                hasMatchingSection: !!matchingSection,
                sectionTitle: matchingSection?.title?.substring(0, 30)
              };
            });

            console.log('[SessionBuilder Edit Mode] Topic-section reconciliation check:', {
              allMatched: reconciliationCheck.every(check => check.hasMatchingSection),
              mismatches: reconciliationCheck.filter(check => !check.hasMatchingSection)
            });
          }
        }

        console.log('[SessionBuilder Edit Mode] Successfully loaded and transformed session data');

      } catch (error) {
        console.error('[SessionBuilder Edit Mode] Failed to load session:', error);
        setExistingSessionError('Failed to load session data. Please try refreshing the page.');
        hasLoadedExistingSession.current = false; // allow retry on error
      } finally {
        setLoadingExistingSession(false);
      }
    };

    void loadExistingSession();
  }, [isEditMode, existingSessionId, state.status, state.draft, updateMetadata, updateOutline]);

  // Step management - modify for edit mode
  const startingStep: BuilderStep = isEditMode ? 'trainers-topics' :
    (savedVariant ? (initialStep ?? 'review') : (initialStep ?? 'setup'));
  const {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev
  } = useBuilderSteps(startingStep);

  // Debug edit mode detection - moved after currentStep is defined
  console.log('[SessionBuilderScreen] Component mounted with:', { isEditMode, existingSessionId, currentStep });

  // Quick save functionality for edit mode
  const [quickSaveStatus, setQuickSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showQuickSaveConfirm, setShowQuickSaveConfirm] = React.useState(false);

  // Quick save handler - saves current changes without navigation
  const handleQuickSave = React.useCallback(async () => {
    if (!isEditMode || !existingSessionId || !draft) return;

    setQuickSaveStatus('saving');
    try {
      console.log('[Quick Save] Saving session changes:', existingSessionId);

      const sections = draft.outline
        ? sessionBuilderService.sortSectionsByPosition(draft.outline.sections ?? [])
        : [];

      const metadataTopicsSource =
        draft.metadata.topics && draft.metadata.topics.length > 0
          ? draft.metadata.topics
          : latestTopicsRef.current;

      const metadataTopicMap = new Map<string, SessionTopicDraft>();
      metadataTopicsSource.forEach((topic) => {
        if (topic.sectionId) {
          metadataTopicMap.set(topic.sectionId, topic);
        } else if (typeof topic.topicId === 'number') {
          metadataTopicMap.set(`topic-${topic.topicId}`, topic);
        }
      });

      const sessionTopicsPayload =
        sections
          .filter((section) => typeof section.associatedTopic?.id === 'number')
          .map((section, index) => {
            const topicDraft =
              metadataTopicMap.get(section.id) ??
              metadataTopicMap.get(section.associatedTopic ? `topic-${section.associatedTopic.id}` : '');

            const durationMinutes = topicDraft?.durationMinutes ?? section.duration ?? 30;
            const trainerId = topicDraft?.trainerId ?? section.trainerId;
            const notesSource = topicDraft?.trainerNotes ?? section.trainerNotes ?? '';

            return {
              topicId: section.associatedTopic!.id,
              sequenceOrder: topicDraft?.position ?? section.position ?? index + 1,
              durationMinutes,
              trainerId,
              notes: notesSource?.trim ? notesSource.trim() : notesSource || undefined,
            };
          })
          .filter((payload) => typeof payload.topicId === 'number');

      const resolvedStatus = draft.metadata.sessionStatus ?? SessionStatus.DRAFT;

      // Prepare update data from draft
      const updateData = {
        title: draft.metadata.title,
        subtitle: '', // Can be added to metadata if needed
        objective: draft.metadata.desiredOutcome,
        locationId: draft.metadata.locationId,
        audienceId: draft.metadata.audienceId,
        toneId: draft.metadata.toneId,
        categoryId: draft.metadata.categoryId,
        startTime: draft.metadata.startTime ? new Date(draft.metadata.startTime) : undefined,
        endTime: draft.metadata.endTime ? new Date(draft.metadata.endTime) : undefined,
        status: resolvedStatus,
        readinessScore: draft.readinessScore || 0,
        sessionTopics: sessionTopicsPayload,
      };

      // Debug logging for prepared updateData
      console.log('[SessionBuilder] Prepared updateData:', {
        context: isEditMode ? 'updateExistingSession' : 'quickSave',
        updateData: {
          ...updateData,
          startTime: updateData.startTime,
          endTime: updateData.endTime,
          startTimeType: typeof updateData.startTime,
          endTimeType: typeof updateData.endTime
        }
      });

      await sessionService.updateSession(existingSessionId, updateData);

      console.log('[Quick Save] Session saved successfully');
      setQuickSaveStatus('success');
      setShowQuickSaveConfirm(true);

      // Hide confirmation after 3 seconds
      setTimeout(() => {
        setShowQuickSaveConfirm(false);
        setQuickSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('[Quick Save] Failed to save session:', error);
      setQuickSaveStatus('error');
      setTimeout(() => setQuickSaveStatus('idle'), 3000);
    }
  }, [isEditMode, existingSessionId, draft]);

  // Determine the most relevant editing step based on session content
  const getOptimalEditStep = React.useCallback((): BuilderStep => {
    if (!draft) return 'trainers-topics';

    // If session has outline but no topics assigned, go to trainers-topics
    if (draft.outline && (!draft.metadata.topics || draft.metadata.topics.length === 0)) {
      return 'trainers-topics';
    }

    // If outline and topics exist and readiness is strong, surface the review step; otherwise stay in trainers-topics
    if (draft.outline && draft.metadata.topics && draft.metadata.topics.length > 0) {
      const readinessScore = typeof draft.readinessScore === 'number' ? draft.readinessScore : 0;
      if (readinessScore >= 80) {
        return 'review';
      }
      return 'trainers-topics';
    }

    // Otherwise go to trainers-topics as default
    return 'trainers-topics';
  }, [draft]);

  // Auto-navigate to optimal edit step when session is loaded
  React.useEffect(() => {
    if (isEditMode && state.status === 'ready' && currentStep === 'trainers-topics') {
      const optimalStep = getOptimalEditStep();
      if (optimalStep !== currentStep) {
        console.log('[Edit Mode] Auto-navigating to optimal step:', optimalStep);
        goToStep(optimalStep);
      }
    }
  }, [isEditMode, state.status, currentStep, getOptimalEditStep, goToStep]);

  // Keyboard shortcut for quick save (Ctrl+S / Cmd+S)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditMode && (event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (quickSaveStatus !== 'saving' && draft) {
          void handleQuickSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, quickSaveStatus, draft, handleQuickSave]);

  const [isQuickAddOpen, setQuickAddOpen] = React.useState(false);
  const [isVersionCompareOpen, setIsVersionCompareOpen] = React.useState(false);
  const [compareVersionIds, setCompareVersionIds] = React.useState<[string, string]>(['', '']);
  const [isDebugOpen, setIsDebugOpen] = React.useState(false);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(undefined);
  const [hasChosenCreateOwn, setHasChosenCreateOwn] = React.useState(false);
  const [hasAppliedSavedVariantSteps, setHasAppliedSavedVariantSteps] = React.useState(false);
  const [loadingExistingSession, setLoadingExistingSession] = React.useState(false);
  const [existingSessionError, setExistingSessionError] = React.useState<string | null>(null);
  const hasBootstrappedVariants = React.useRef(false);
  const hasRedirectedAfterPublish = React.useRef(false);
  const latestTopicsRef = React.useRef<SessionTopicDraft[]>([]);
  const [isUpdatingExistingSession, setIsUpdatingExistingSession] = React.useState(false);
  const [postUpdateNavigation, setPostUpdateNavigation] = React.useState<{ sessionId: string; fromSessionsList: boolean } | null>(null);

  // Enable API debugging
  useApiDebugger();
  const isPublishing = publishStatus === 'pending';
  const readinessItems = React.useMemo(() => getDraftReadinessItems(draft ?? null), [draft]);
  const canPublish = !!draft && areRequiredItemsComplete(readinessItems);

  React.useEffect(() => {
    if (!savedVariant || state.status !== 'ready' || hasAppliedSavedVariantSteps) {
      return;
    }

    const stepOrder: BuilderStep[] = ['setup', 'generate', 'trainers-topics', 'review', 'finalize'];
    const targetStep: BuilderStep = initialStep ?? 'review';

    for (const step of stepOrder) {
      if (step === targetStep) {
        goToStep(step);
        break;
      }
      completeStep(step);
    }

    setHasChosenCreateOwn(true);
    setHasAppliedSavedVariantSteps(true);
  }, [
    savedVariant,
    state.status,
    hasAppliedSavedVariantSteps,
    completeStep,
    goToStep,
    initialStep,
  ]);

  // Check if required setup fields are populated
  const hasRequiredSetupFields = React.useMemo(() => {
    if (!draft) return false;
    const { desiredOutcome, category, sessionType, locationId } = draft.metadata;
    return !!(desiredOutcome?.trim() && category?.trim() && sessionType && locationId);
  }, [draft]);

  // Determine if metadata has changed since last AI generation
  const hasMetadataChanged = React.useMemo(() => {
    if (!draft?.aiVersions.length) return false;
    const lastVersion = draft.aiVersions[draft.aiVersions.length - 1];
    return lastVersion.prompt !== draft.aiPrompt;
  }, [draft?.aiVersions, draft?.aiPrompt]);

  React.useEffect(() => {
    if (state.publishStatus === 'success' && !hasRedirectedAfterPublish.current) {
      hasRedirectedAfterPublish.current = true;
      navigate('/sessions', { replace: true });
    }

    if (state.publishStatus !== 'success' && hasRedirectedAfterPublish.current) {
      hasRedirectedAfterPublish.current = false;
    }
  }, [navigate, state.publishStatus]);

  React.useEffect(() => {
    if (postUpdateNavigation) {
      navigate('/sessions', {
        replace: true,
        state: {
          updatedSessionId: postUpdateNavigation.sessionId,
          fromSessionsList: postUpdateNavigation.fromSessionsList,
        },
      });
      setPostUpdateNavigation(null);
    }
  }, [postUpdateNavigation, navigate]);

  // Auto-complete and advance steps only when users move forward
  // This prevents confusing auto-completion while users are still working on a step
  React.useEffect(() => {
    if (!draft) return;

    // Only mark generate as complete when a version is accepted
    // This ensures users have selected an outline before proceeding
    if (draft.acceptedVersionId && !completedSteps.includes('generate')) {
      console.log('[Auto-advance] Effect triggered, completing generate step', {
        acceptedVersionId: draft.acceptedVersionId,
        completedSteps,
        currentStep
      });
      completeStep('generate');
      // Auto-advance to trainers-topics step when variant is selected
      if (currentStep === 'generate') {
        console.log('[Auto-advance] Moving to trainers-topics step');
        goToStep('trainers-topics');
      }
    }
  }, [draft?.acceptedVersionId, completedSteps, completeStep, currentStep, goToStep]);

  // Define variant generation functions before they are used in effects
  const triggerVariantGeneration = React.useCallback(async () => {
    hasBootstrappedVariants.current = true;
    const success = await generateMultipleVariants();
    if (!success) {
      hasBootstrappedVariants.current = false;
    }
    return success;
  }, [generateMultipleVariants]);

  const startVariantGeneration = React.useCallback(async () => {
    const success = await triggerVariantGeneration();
    if (!success) {
      await generateAIContent();
    }
    return success;
  }, [triggerVariantGeneration, generateAIContent]);

  // Removed automatic variant generation - user now chooses between generating variants or creating own

  React.useEffect(() => {
    if (variantsStatus === 'idle') {
      hasBootstrappedVariants.current = false;
      setSelectedVariantId(undefined); // Clear selection when regenerating
    }
  }, [variantsStatus]);

  const handleAddSection = React.useCallback((type: SectionType) => {
    void addOutlineSection(type);
  }, [addOutlineSection]);

  const handleUpdateSection = React.useCallback((sectionId: string, updates: Partial<FlexibleSessionSection>) => {
    void updateOutlineSection(sectionId, updates);
  }, [updateOutlineSection]);

  const handleDeleteSection = React.useCallback((sectionId: string) => {
    void removeOutlineSection(sectionId);
  }, [removeOutlineSection]);

  const handleMoveSection = React.useCallback((sectionId: string, direction: 'up' | 'down') => {
    void moveOutlineSection(sectionId, direction);
  }, [moveOutlineSection]);

  const handleDuplicateSection = React.useCallback((sectionId: string) => {
    void duplicateOutlineSection(sectionId);
  }, [duplicateOutlineSection]);

  const handleGenerateAI = async () => {
    await startVariantGeneration();

    if (currentStep === 'setup') {
      goToStep('generate');
    }
  };

  const handleCreateOwnOutline = () => {
    console.log('[handleCreateOwnOutline] called', { draft, currentStep });

    // Skip variant generation and go directly to step 3
    // Create a basic empty outline for the user to build upon
    if (!draft) {
      console.log('[handleCreateOwnOutline] No draft available, returning early');
      return;
    }

    const basicOutline = {
      sections: [],
      totalDuration: 0,
      suggestedSessionTitle: draft.metadata.title || 'Custom Session',
      suggestedDescription: '',
      difficulty: 'Intermediate' as const,
      recommendedAudienceSize: '10-25' as const,
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };

    console.log('[handleCreateOwnOutline] Creating basic outline:', basicOutline);

    // Update the outline with the basic structure
    updateOutline(basicOutline);

    // Set flag that user chose to create their own outline
    setHasChosenCreateOwn(true);

    console.log('[handleCreateOwnOutline] About to complete step and navigate');

    // Complete the generate step and advance to trainers-topics
    completeStep('generate');
    goToStep('trainers-topics');

    console.log('[handleCreateOwnOutline] Function completed');
  };

  const handleVariantSelect = React.useCallback(async (variantId: string) => {
    console.log('[handleVariantSelect] Starting variant selection', { variantId });
    setSelectedVariantId(variantId);
    await selectVariant(variantId);
    console.log('[handleVariantSelect] Variant selected, acceptedVersionId should be set');

    // Extract title from the selected variant and update metadata
    const selectedVariant = variants.find(v => v.id === variantId);
    if (selectedVariant) {
      let variantTitle = '';

      // First, try to get the AI-generated title from the variant's outline
      if (selectedVariant.outline?.suggestedSessionTitle) {
        variantTitle = selectedVariant.outline.suggestedSessionTitle;
      }

      // If no suggested title, try to get title from summary
      const summaryText = selectedVariant.summary ?? '';
      if (!variantTitle && summaryText) {
        // Take first sentence or first 60 characters of summary
        const firstSentence = summaryText.split('.')[0];
        variantTitle = firstSentence.length > 60
          ? firstSentence.substring(0, 60).trim() + '...'
          : firstSentence;
      }

      // If still no title, try to generate from first section
      if (!variantTitle && selectedVariant.outline?.sections && selectedVariant.outline.sections.length > 0) {
        const firstSection = selectedVariant.outline.sections[0];
        if (firstSection.title) {
          variantTitle = firstSection.title;
        } else if (firstSection.description) {
          // Take first 60 characters of first section description
          variantTitle = firstSection.description.substring(0, 60).trim() + '...';
        }
      }

      // If still no title, create a default one based on category
      if (!variantTitle && draft?.metadata.category) {
        variantTitle = `${draft.metadata.category} Session`;
      }

      // Update metadata with the variant title
      if (variantTitle) {
        updateMetadata({ title: variantTitle });
        console.log('[handleVariantSelect] Updated session title to:', variantTitle);
      }
    }

    console.log('[handleVariantSelect] Variant selection completed');

    // Auto-advance to trainers-topics step after variant selection
    if (currentStep === 'generate') {
      console.log('[handleVariantSelect] Auto-advancing to trainers-topics step');
      // Small delay to ensure state has updated
      setTimeout(() => {
        completeStep('generate');
        goToStep('trainers-topics');
      }, 100);
    }
  }, [selectVariant, variants, draft?.metadata, updateMetadata, currentStep, completeStep, goToStep]);

  const handleSaveVariantForLater = React.useCallback(async (variantId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session Builder v2] Save for later requested', { variantId });
    }

    const variant = variants.find(v => v.id === variantId);
    if (!variant) {
      console.error('[Session Builder v2] Variant not found:', variantId);
      return;
    }

    try {
      // Create the saved variant data
      const generationSource: 'rag' | 'baseline' | 'ai' = variant.generationSource ?? 'ai';
      const savedVariantData = {
        variantId: variant.id,
        outline: variant.outline,
        title: variant.outline?.suggestedSessionTitle || variant.label || 'Untitled Session',
        description: variant.description || variant.outline?.suggestedDescription || '',
        categoryId: draft?.metadata.categoryId ? draft.metadata.categoryId.toString() : undefined,
        sessionType: draft?.metadata.sessionType ?? undefined,
        totalDuration: toNumeric(variant.outline?.totalDuration),
        ragWeight: toNumeric(variant.ragWeight),
        ragSourcesUsed: Math.max(0, Math.round(toNumeric(variant.ragSourcesUsed))),
        ragSources: variant.ragSources,
        generationSource,
        variantLabel: variant.label,
        metadata: {
          originalGenerationTime: new Date().toISOString(),
          sessionMetadata: draft?.metadata,
        },
        tags: [], // User can add tags later in the management UI
      };

      const savedVariant = await savedVariantsService.createSavedVariant(savedVariantData);

      if (process.env.NODE_ENV === 'development') {
        console.log('[Session Builder v2] Variant saved successfully:', savedVariant);
      }

      // Show success feedback - you could add a toast notification here
      alert(`"${savedVariant.title}" has been saved to your library!`);

    } catch (error) {
      const responseData = (error as any)?.response?.data;
      console.error('[Session Builder v2] Error saving variant:', {
        error,
        responseData,
        status: (error as any)?.response?.status,
      });

      // Show error feedback
      if (error instanceof Error) {
        if (error.message.includes('already saved')) {
          alert('This variant is already in your saved library.');
        } else {
          alert(`Failed to save variant: ${error.message}`);
        }
      } else {
        alert('Failed to save variant. Please try again.');
      }
    }
  }, [variants, draft]);

  // Handlers for UnifiedReviewEditor
  const handleTopicsChange = React.useCallback(async (topics: SessionTopicDraft[]) => {
    if (!draft?.outline) return;

    const existingSections = sessionBuilderService.sortSectionsByPosition(draft.outline.sections ?? []);
    const sectionsById = new Map(existingSections.map(section => [section.id, section]));

    const normalizeList = (value?: string | string[] | null): string[] => {
      if (!value) return [];
      const source = Array.isArray(value) ? value : value.split('\n');
      return source.map(item => String(item || '').replace(/^•\s*/, '').trim()).filter(Boolean);
    };

    const sectionUpdates: Array<{ section: FlexibleSessionSection; updates: Partial<FlexibleSessionSection> }> = [];

    const topicsWithSectionIds = topics.map((topic, index) => {
      const normalizedTitle = topic.title?.trim().toLowerCase();

      let section: FlexibleSessionSection | undefined = topic.sectionId
        ? sectionsById.get(topic.sectionId)
        : undefined;

      if (!section && topic.topicId) {
        section = existingSections.find(s => s.associatedTopic?.id === topic.topicId);
      }

      if (!section && normalizedTitle) {
        section = existingSections.find(s => {
          const sectionTitle = s.title?.trim().toLowerCase();
          const associatedTitle = s.associatedTopic?.name?.trim().toLowerCase();
          return sectionTitle === normalizedTitle || associatedTitle === normalizedTitle;
        });
      }

      if (!section) {
        console.warn('[SessionBuilder] Unable to resolve section for topic update', { topic });
        return { ...topic };
      }

      const learningObjectives = normalizeList(topic.learningOutcomes);
      const materialsNeeded = normalizeList(topic.materialsNeeded);
      const suggestedActivities = normalizeList(topic.callToAction);
      const trainerName = topic.trainerId
        ? topic.trainerName ?? section.trainerName
        : undefined;

      const updates: Partial<FlexibleSessionSection> = {
        title: topic.title,
        description: topic.description ?? '',
        duration: topic.durationMinutes ?? section.duration,
        learningObjectives: learningObjectives.length ? learningObjectives : undefined,
        trainerNotes: topic.trainerNotes,
        materialsNeeded: materialsNeeded.length ? materialsNeeded : undefined,
        suggestedActivities: suggestedActivities.length ? suggestedActivities : undefined,
        deliveryGuidance: topic.deliveryGuidance,
        trainerId: topic.trainerId,
        trainerName,
        position: index + 1,
        associatedTopic: topic.topicId
          ? {
              id: topic.topicId,
              name: topic.title ?? section.associatedTopic?.name ?? '',
              description: topic.description ?? section.associatedTopic?.description,
            }
          : undefined,
      };

      sectionUpdates.push({ section, updates });

      return {
        ...topic,
        sectionId: section.id,
        trainerName,
      };
    });

    latestTopicsRef.current = topicsWithSectionIds;

    for (const { section, updates } of sectionUpdates) {
      await updateOutlineSection(section.id, updates);
    }

    updateMetadata({ topics: topicsWithSectionIds });
  }, [draft, updateOutlineSection, updateMetadata]);

  const renderVariantGenerator = () => {
    if (variantsStatus === 'pending') {
      return (
        <VariantSelector
          variants={variants}
          onSelect={handleVariantSelect}
          onSaveForLater={handleSaveVariantForLater}
          selectedVariantId={selectedVariantId}
          isLoading
        />
      );
    }

    if (variantsStatus === 'success') {
      if (!variants.length) {
        return (
          <div className="space-y-6 text-center">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Create your session outline</h3>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                We couldn't generate variants this time. You can try again or create your own outline from scratch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Retry Generation */}
              <div className="flex flex-col items-center p-6 border border-slate-200 rounded-lg bg-white max-w-sm">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">Try Again</h4>
                <p className="text-sm text-slate-600 mb-4 text-center">
                  Give variant generation another attempt with different AI approaches.
                </p>
                <Button
                  onClick={() => void startVariantGeneration()}
                  disabled={!hasRequiredSetupFields}
                  className="w-full"
                >
                  Regenerate Variants
                </Button>
              </div>

              {/* Create Own Option */}
              <div className="flex flex-col items-center p-6 border border-slate-200 rounded-lg bg-white max-w-sm">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">I'll Create My Own</h4>
                <p className="text-sm text-slate-600 mb-4 text-center">
                  Skip AI generation and build your outline from scratch with full creative control.
                </p>
                <Button
                  onClick={() => {
                    console.log('[Create from Scratch] Button clicked (error state)');
                    handleCreateOwnOutline();
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create from Scratch
                </Button>
              </div>
            </div>
          </div>
        );
      }

      const lastSelectionSeconds =
        variantSelectionTime > 0 ? (variantSelectionTime / 1000).toFixed(1) : null;

      return (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Choose a session outline</h3>
              {lastSelectionSeconds && (
                <p className="text-xs text-slate-500">
                  Last selection in {lastSelectionSeconds}s — feel free to explore additional options.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                console.log('[Create My Own] Button clicked (variant selector)');
                handleCreateOwnOutline();
              }}>
                Create My Own
              </Button>
              <Button variant="outline" size="sm" onClick={() => void startVariantGeneration()}>
                Regenerate
              </Button>
            </div>
          </div>
          <VariantSelector
            variants={variants}
            onSelect={handleVariantSelect}
            onSaveForLater={handleSaveVariantForLater}
            selectedVariantId={selectedVariantId}
          />
        </div>
      );
    }

    if (variantsStatus === 'error') {
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h3 className="text-base font-semibold text-red-700 mb-1">
              We couldn&rsquo;t generate variants
            </h3>
            <p className="text-sm text-red-600">
              {variantsError || 'Please check your session details and try again.'}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button onClick={() => void startVariantGeneration()}>
              Try Again
            </Button>
            <Button variant="ghost" onClick={() => void generateAIContent()}>
              Use Classic Generator
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-900 mb-3">Create your session outline</h3>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Choose how you want to build your session outline. You can generate AI-powered variants to compare different approaches, or create your own from scratch.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Generate Variants Option */}
          <div className="flex flex-col items-center p-6 border border-slate-200 rounded-lg bg-white max-w-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Generate 4 Variants</h4>
            <p className="text-sm text-slate-600 mb-4 text-center">
              Compare four AI-crafted outlines — including RAG-powered blends — to pick the best starting point.
            </p>
            <Button
              onClick={() => void startVariantGeneration()}
              disabled={!hasRequiredSetupFields}
              className="w-full"
            >
              Generate Variants
            </Button>
          </div>

          {/* Create Own Option */}
          <div className="flex flex-col items-center p-6 border border-slate-200 rounded-lg bg-white max-w-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">I'll Create My Own</h4>
            <p className="text-sm text-slate-600 mb-4 text-center">
              Skip AI generation and build your outline from scratch with full creative control.
            </p>
            <Button
              onClick={() => {
                console.log('[Create from Scratch] Button clicked');
                handleCreateOwnOutline();
              }}
              variant="outline"
              className="w-full"
            >
              Create from Scratch
            </Button>
          </div>
        </div>

        {!hasRequiredSetupFields && (
          <div className="mt-4 text-center">
            <p className="text-xs text-amber-600">
              <svg className="inline-block w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Add the desired outcome, category, and location to enable variant generation.
            </p>
          </div>
        )}
      </div>
    );
  };

  const primaryButtonLabel = React.useMemo(() => {
    console.log('[primaryButtonLabel] Computing label:', { isEditMode, currentStep, publishStatus, isUpdatingExistingSession });
    if (isEditMode) {
      switch (currentStep) {
        case 'trainers-topics': return 'Review Changes';
        case 'review': return 'Preview & Update';
        case 'finalize':
          if (publishStatus === 'success') return 'Updated';
          if (isPublishing || isUpdatingExistingSession) return 'Updating...';
          return 'Update Session';
        default: return 'Continue';
      }
    }

    switch (currentStep) {
      case 'setup': return 'Continue to Generate Outline';
      case 'generate': return 'Continue to Trainers & Topics';
      case 'trainers-topics': return 'Continue to Review';
      case 'review': return 'Continue to Finalize';
      case 'finalize':
        if (publishStatus === 'success') return 'Published';
        if (isPublishing) return 'Publishing...';
        return 'Publish Session';
      default: return 'Continue';
    }
  }, [currentStep, isEditMode, isPublishing, publishStatus, isUpdatingExistingSession]);

  const primaryButtonDisabled = React.useMemo(() => {
    if (currentStep === 'setup') {
      return !hasRequiredSetupFields;
    }

    if (currentStep === 'generate') {
      const isDisabled = !draft?.acceptedVersionId && !hasChosenCreateOwn;
      console.log('[primaryButtonDisabled] Generate step check', {
        acceptedVersionId: draft?.acceptedVersionId,
        hasChosenCreateOwn,
        isDisabled
      });
      return isDisabled;
    }

    if (currentStep === 'review') {
      return !canGoNext;
    }

    if (currentStep === 'finalize') {
      return isPublishing || isUpdatingExistingSession || publishStatus === 'success' || !canPublish;
    }

    return false;
  }, [
    currentStep,
    hasRequiredSetupFields,
    draft?.acceptedVersionId,
    hasChosenCreateOwn,
    canGoNext,
    isPublishing,
    isUpdatingExistingSession,
    publishStatus,
    canPublish,
  ]);

  const handleAcceptVersion = (versionId: string) => {
    acceptVersion(versionId);
    // Don't auto-jump - let user navigate with Next button
  };

  const openVersionComparison = () => {
    if (draft && draft.aiVersions.length >= 2) {
      setCompareVersionIds([draft.aiVersions[0].id, draft.aiVersions[1].id]);
      setIsVersionCompareOpen(true);
    }
  };

  const handleStepNavigation = (step: any) => {
    // Allow navigation to completed steps or current step
    if (completedSteps.includes(step) || step === currentStep) {
      goToStep(step);
    }
  };

  const updateExistingSession = React.useCallback(async () => {
    if (!existingSessionId || !draft) return;
    setIsUpdatingExistingSession(true);

    try {
      console.log('[SessionBuilder Edit Mode] Updating session:', existingSessionId);

      const sections = draft.outline
        ? sessionBuilderService.sortSectionsByPosition(draft.outline.sections ?? [])
        : [];

      const metadataTopicsSource =
        draft.metadata.topics && draft.metadata.topics.length > 0
          ? draft.metadata.topics
          : latestTopicsRef.current;

      const metadataTopicMap = new Map<string, SessionTopicDraft>();
      metadataTopicsSource.forEach((topic) => {
        if (topic.sectionId) {
          metadataTopicMap.set(topic.sectionId, topic);
        } else if (typeof topic.topicId === 'number') {
          metadataTopicMap.set(`topic-${topic.topicId}`, topic);
        }
      });

      const sessionTopicsPayload =
        sections
          .filter((section) => typeof section.associatedTopic?.id === 'number')
          .map((section, index) => {
            const topicDraft =
              metadataTopicMap.get(section.id) ??
              metadataTopicMap.get(section.associatedTopic ? `topic-${section.associatedTopic.id}` : '');

            const durationMinutes = topicDraft?.durationMinutes ?? section.duration ?? 30;
            const trainerId = topicDraft?.trainerId ?? section.trainerId;
            const notesSource = topicDraft?.trainerNotes ?? section.trainerNotes ?? '';

            return {
              topicId: section.associatedTopic!.id,
              sequenceOrder: topicDraft?.position ?? section.position ?? index + 1,
              durationMinutes,
              trainerId,
              notes: notesSource?.trim ? notesSource.trim() : notesSource || undefined,
            };
          })
          .filter((payload) => typeof payload.topicId === 'number');

      const resolvedStatus = draft.metadata.sessionStatus ?? SessionStatus.DRAFT;

      // Prepare update data from draft
      const updateData = {
        title: draft.metadata.title,
        subtitle: '', // Can be added to metadata if needed
        objective: draft.metadata.desiredOutcome,
        locationId: draft.metadata.locationId,
        audienceId: draft.metadata.audienceId,
        toneId: draft.metadata.toneId,
        categoryId: draft.metadata.categoryId,
        startTime: draft.metadata.startTime ? new Date(draft.metadata.startTime) : undefined,
        endTime: draft.metadata.endTime ? new Date(draft.metadata.endTime) : undefined,
        status: resolvedStatus,
        readinessScore: draft.readinessScore || 0,
        sessionTopics: sessionTopicsPayload,
      };

      // Debug logging for prepared updateData
      console.log('[SessionBuilder] Prepared updateData:', {
        context: isEditMode ? 'updateExistingSession' : 'quickSave',
        updateData: {
          ...updateData,
          startTime: updateData.startTime,
          endTime: updateData.endTime,
          startTimeType: typeof updateData.startTime,
          endTimeType: typeof updateData.endTime
        }
      });

      await sessionService.updateSession(existingSessionId, updateData);

      console.log('[SessionBuilder Edit Mode] Session updated successfully');

      setPostUpdateNavigation({
        sessionId: existingSessionId,
        fromSessionsList,
      });

    } catch (error) {
      console.error('[SessionBuilder Edit Mode] Failed to update session:', error);
      // Could show error toast here
    } finally {
      setIsUpdatingExistingSession(false);
    }
  }, [existingSessionId, draft, fromSessionsList]);

  const handlePrimaryAction = React.useCallback(() => {
    console.log('[handlePrimaryAction] Called:', { currentStep, isEditMode, existingSessionId, isUpdatingExistingSession });
    if (currentStep === 'finalize') {
      if (isEditMode && existingSessionId) {
        console.log('[handlePrimaryAction] In edit mode, calling updateExistingSession');
        if (isUpdatingExistingSession) {
          console.log('[handlePrimaryAction] Already updating, returning early');
          return;
        }
        // In edit mode, update the existing session instead of publishing
        void updateExistingSession();
      } else {
        console.log('[handlePrimaryAction] In create mode, calling publishSession');
        void publishSession();
      }
      return;
    }

    console.log('[handlePrimaryAction] Not finalize step, calling nextStep');
    nextStep();
  }, [
    currentStep,
    isEditMode,
    existingSessionId,
    publishSession,
    nextStep,
    isUpdatingExistingSession,
    updateExistingSession,
  ]);

  if (state.status === 'loading' || !draft) {
    return (
      <BuilderLayout
        title={isEditMode ? "Edit Session" : "AI Session Builder"}
        subtitle={isEditMode ? "Loading session for editing..." : "Launching workspace..."}
        statusSlot={<AutosaveIndicator />}
      >
        <EmptyState message={isEditMode ? "Loading session data..." : "Loading builder experience…"} />
      </BuilderLayout>
    );
  }

  if (state.status === 'error' || existingSessionError) {
    return (
      <BuilderLayout
        title={isEditMode ? "Edit Session" : "AI Session Builder"}
        subtitle="Something went wrong"
        statusSlot={<AutosaveIndicator />}
      >
        <EmptyState message={existingSessionError || state.error || 'We could not load the builder right now.'} />
      </BuilderLayout>
    );
  }

  const currentStepContent = () => {
    switch (currentStep) {
      case 'setup':
        return (
          <SessionMetadataForm
            metadata={draft.metadata}
            onChange={updateMetadata}
          />
        );
      case 'generate':
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              {renderVariantGenerator()}
            </div>
            {draft.acceptedVersionId && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                    <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-green-900">Outline Selected</h4>
                    <p className="text-xs sm:text-sm text-green-700 mt-1">
                      Your outline is ready. Click "Next" to assign trainers and refine topics.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'trainers-topics':
        return draft.outline ? (
          <TrainerAndTopicAssignmentStep
            topics={getTopicsForUI(draft)}
            sections={draft.outline.sections}
            metadata={draft.metadata}
            onTopicsChange={handleTopicsChange}
            onUpdateSection={handleUpdateSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onUpdateMetadata={updateMetadata}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Outline Selected</h3>
            <p className="text-sm text-slate-600 mb-6">
              Please go back to the Generate step and select an outline to assign trainers.
            </p>
            <Button onClick={() => goToStep('generate')} variant="outline">
              Back to Generate
            </Button>
          </div>
        );
      case 'review':
        return draft.outline ? (
          <UnifiedReviewEditor
            outline={draft.outline}
            topics={getTopicsForUI(draft)}
            metadata={draft.metadata}
            readinessScore={draft.readinessScore}
            onEdit={() => goToStep('trainers-topics')}
            onUpdateSection={handleUpdateSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onDuplicateSection={handleDuplicateSection}
            onUpdateMetadata={updateMetadata}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            onTopicsChange={handleTopicsChange}
            isFinalStep={false}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Outline Selected</h3>
            <p className="text-sm text-slate-600 mb-6">
              Please go back to the Generate step and select an outline to review.
            </p>
            <Button onClick={() => goToStep('generate')} variant="outline">
              Back to Generate
            </Button>
          </div>
        );
      case 'finalize':
        return draft.outline ? (
          <UnifiedReviewEditor
            outline={draft.outline}
            topics={getTopicsForUI(draft)}
            metadata={draft.metadata}
            readinessScore={draft.readinessScore}
            onEdit={() => goToStep('review')}
            onPublish={() =>
              void (isEditMode ? updateExistingSession() : publishSession())
            }
            onUpdateSection={handleUpdateSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onDuplicateSection={handleDuplicateSection}
            onUpdateMetadata={updateMetadata}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
            onTopicsChange={handleTopicsChange}
            isPublishing={isPublishing}
            isPublished={publishStatus === 'success'}
            isFinalStep={true}
            primaryActionLabel={isEditMode ? 'Update Session' : undefined}
            primaryActionBusyLabel={isEditMode ? 'Updating...' : undefined}
            primaryActionSuccessLabel={isEditMode ? 'Updated' : undefined}
            isPrimaryActionBusy={isEditMode ? isUpdatingExistingSession : undefined}
            isPrimaryActionComplete={
              isEditMode ? false : publishStatus === 'success'
            }
            disablePrimaryAction={primaryButtonDisabled}
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Session to Preview</h3>
            <p className="text-sm text-slate-600 mb-6">
              Please go back to the Review step to complete your session.
            </p>
            <Button onClick={() => goToStep('review')} variant="outline">
              Back to Review
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const activeVersion = draft.aiVersions.find(
    (version) => version.id === (draft.selectedVersionId || draft.acceptedVersionId)
  );

  const getSessionDisplayInfo = () => {
    if (!draft?.metadata) return null;

    const { startTime, startDate, title } = draft.metadata;

    // Format date and time for display
    const formatSessionDateTime = () => {
      if (!startTime) return null;

      try {
        const sessionDate = new Date(startTime);
        if (isNaN(sessionDate.getTime())) return null;

        const now = new Date();
        const isToday = sessionDate.toDateString() === now.toDateString();
        const isTomorrow = sessionDate.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

        let dateStr = '';
        if (isToday) {
          dateStr = 'Today';
        } else if (isTomorrow) {
          dateStr = 'Tomorrow';
        } else {
          dateStr = sessionDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: sessionDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
          });
        }

        const timeStr = sessionDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        return { date: dateStr, time: timeStr };
      } catch (error) {
        console.warn('Error formatting session date/time:', error);
        return null;
      }
    };

    const dateTimeInfo = formatSessionDateTime();

    return {
      title: title?.trim() || 'Untitled Session',
      dateTime: dateTimeInfo
    };
  };

  const getStepTitle = () => {
    const sessionInfo = getSessionDisplayInfo();

    if (isEditMode) {
      // Include session title in edit mode
      const baseTitle = sessionInfo?.title ? `Edit: ${sessionInfo.title}` : 'Edit Session';

      switch (currentStep) {
        case 'trainers-topics': return baseTitle;
        case 'review': return baseTitle;
        case 'finalize': return baseTitle;
        default: return baseTitle;
      }
    }

    switch (currentStep) {
      case 'setup': return 'Guided Session Builder ';
      case 'generate': return 'Create Outline';
      case 'trainers-topics': return 'Assign Trainers & Refine Topics';
      case 'review': return 'Review & Edit';
      case 'finalize': return 'Publish Session';
      default: return 'AI Session Builder';
    }
  };

  const getStepSubtitle = () => {
    const sessionInfo = getSessionDisplayInfo();

    if (isEditMode) {
      // Build subtitle with date/time info if available
      let dateTimeStr = '';
      if (sessionInfo?.dateTime) {
        dateTimeStr = `${sessionInfo.dateTime.date} at ${sessionInfo.dateTime.time}`;
        if (currentStep === 'finalize') {
          dateTimeStr += ' • ';
        } else {
          dateTimeStr += ' • ';
        }
      }

      switch (currentStep) {
        case 'trainers-topics': return dateTimeStr + 'Manage topic assignments and trainer assignments for your existing session.';
        case 'review': return dateTimeStr + 'Review your changes before updating the session.';
        case 'finalize': return dateTimeStr + 'Finalize your changes and update the session.';
        default: return dateTimeStr + 'Edit your existing session using the builder interface.';
      }
    }

    switch (currentStep) {
      case 'setup': return 'Instantly generate a complete session outline based on your chosen topic and objectives.';
      case 'generate': return 'Generate AI-powered outlines and select your favorite';
      case 'trainers-topics': return 'Match topics with trainers and fine-tune topic details';
      case 'review': return 'Review and refine your session content';
      case 'finalize': return 'Your session is ready to publish';
      default: return 'Design, iterate, and preview training sessions with AI assist.';
    }
  };

  return (
    <>
      {/* Modals */}
      <QuickAddModal
        open={isQuickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAdd={handleAddSection}
      />

      {isVersionCompareOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 max-h-full overflow-y-auto">
              <VersionComparison
                versions={draft.aiVersions}
                selectedVersionIds={compareVersionIds}
                onVersionSelect={(index, versionId) => {
                  const newIds = [...compareVersionIds] as [string, string];
                  newIds[index] = versionId;
                  setCompareVersionIds(newIds);
                }}
                onAcceptVersion={handleAcceptVersion}
                onClose={() => setIsVersionCompareOpen(false)}
                acceptedVersionId={draft.acceptedVersionId}
              />
            </div>
          </div>
        </div>
      )}

      <BuilderLayout
        title={getStepTitle()}
        subtitle={getStepSubtitle()}
        statusSlot={
          <AutosaveIndicator
            lastSavedAt={draft.lastAutosaveAt}
          />
        }
      >
        {/* Topics Pre-filled Notification */}
        {showTopicsNotification && prefilledTopics && prefilledTopics.length > 0 && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900">Topics Pre-loaded</h3>
                <p className="text-sm text-blue-800 mt-1">
                  {prefilledTopics.length} topic{prefilledTopics.length === 1 ? '' : 's'} from your selection {prefilledTopics.length === 1 ? 'has' : 'have'} been added.
                  Scroll down to the "Plan each topic and trainer task" section to see them.
                </p>
              </div>
              <button
                onClick={() => setShowTopicsNotification(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode Header */}
        {isEditMode && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Edit Mode</h3>
                <p className="text-xs sm:text-sm text-blue-700 mt-1">
                  Make changes to your session and use Quick Save to save progress without leaving the page.
                  <span className="ml-1 text-xs bg-blue-100 px-2 py-0.5 rounded font-mono">Ctrl+S</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleQuickSave}
                  disabled={quickSaveStatus === 'saving' || !draft}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  {quickSaveStatus === 'saving' ? (
                    <>
                      <svg className="h-3 w-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Quick Save
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => navigate('/sessions')}
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                >
                  Exit to Sessions
                </Button>
              </div>
            </div>

            {/* Quick Save Confirmation */}
            {showQuickSaveConfirm && quickSaveStatus === 'success' && (
              <div className="mt-3 rounded bg-green-100 p-2">
                <p className="text-xs text-green-700 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Session saved successfully!
                </p>
              </div>
            )}

            {quickSaveStatus === 'error' && (
              <div className="mt-3 rounded bg-red-100 p-2">
                <p className="text-xs text-red-700 flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Failed to save session
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-6 sm:mb-8">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepNavigation}
          />
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto">
          {currentStepContent()}

          {/* Step Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Previous Button */}
              {canGoPrev && (
                <div className="flex gap-2 w-full sm:w-auto">
                  {isEditMode && (
                    <Button
                      onClick={handleQuickSave}
                      disabled={quickSaveStatus === 'saving' || !draft}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      {quickSaveStatus === 'saving' ? (
                        <>
                          <svg className="h-3 w-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Quick Save
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={variantsStatus === 'pending'}
                    className="flex-1 sm:flex-initial"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </Button>
                </div>
              )}

              {/* Right: Primary Action */}
              {!(currentStep === 'generate' && !draft?.acceptedVersionId && !hasChosenCreateOwn) && (
                <Button
                  onClick={handlePrimaryAction}
                  disabled={primaryButtonDisabled || variantsStatus === 'pending'}
                  className="w-full sm:w-auto sm:ml-auto"
                  size="lg"
                >
                  {primaryButtonLabel}
                  {currentStep !== 'finalize' && (
                    <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Button>
              )}
            </div>

            {/* Validation message for disabled state */}
            {currentStep === 'setup' && !hasRequiredSetupFields && (
              <div className="mt-3 text-center">
                <p className="text-sm text-amber-600">
                  Please fill in all required fields to continue
                </p>
              </div>
            )}
            {currentStep === 'generate' && !draft.acceptedVersionId && !hasChosenCreateOwn && (
              <div className="mt-3 text-center">
                <p className="text-sm text-amber-600">
                  Please select an outline or create your own to continue
                </p>
              </div>
            )}
            {variantsStatus === 'pending' && (
              <div className="mt-3 text-center">
                <p className="text-sm text-blue-600">
                  <svg className="inline-block w-4 h-4 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Generating variants... Navigation is disabled during generation.
                </p>
              </div>
            )}
            {currentStep === 'finalize' && !canPublish && (
              <div className="mt-3 text-center">
                <p className="text-sm text-amber-600">
                  Complete the readiness checklist before publishing.
                </p>
              </div>
            )}
          </div>
        </div>
      </BuilderLayout>

      {/* Debug Panel */}
      <DebugPanel
        isOpen={isDebugOpen}
        onToggle={() => setIsDebugOpen(!isDebugOpen)}
      />
    </>
  );
};

export const SessionBuilderPage: React.FC = () => {
  const { sessionId = 'new' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = (location.state ?? {}) as BuilderNavigationState;
  const {
    prefilledTopics: statePrefilledTopics,
    savedVariant: stateSavedVariant,
    initialStep: stateInitialStep,
    isEditing: stateIsEditingSavedVariant,
  } = navigationState;

  // Determine if this is edit mode from URL pattern
  const isEditMode = location.pathname.includes('/edit/');
  console.log('[SessionBuilderPage] Edit mode detection:', { pathname: location.pathname, isEditMode });
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(sessionId === 'new');
  const [draftCreationError, setDraftCreationError] = React.useState<string | null>(null);

  // Extract prefilled topics from navigation state OR sessionStorage
  const getPrefilledTopics = React.useCallback(() => {
    // First try location state
    const stateTopics = statePrefilledTopics;
    if (stateTopics && Array.isArray(stateTopics) && stateTopics.length > 0) {
      console.log('[Session Builder Page] Found topics in location.state:', stateTopics);
      return stateTopics;
    }

    // Fallback to sessionStorage
    try {
      const storedTopics = sessionStorage.getItem('sessionBuilder_prefilledTopics');
      const timestamp = sessionStorage.getItem('sessionBuilder_prefilledTopics_timestamp');

      if (storedTopics) {
        const topics = JSON.parse(storedTopics);
        const age = timestamp ? Date.now() - parseInt(timestamp, 10) : 0;

        // Only use topics if they're less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          console.log('[Session Builder Page] Found topics in sessionStorage:', topics);
          return topics;
        } else {
          console.log('[Session Builder Page] Stored topics are stale, ignoring');
          // Clear stale data
          sessionStorage.removeItem('sessionBuilder_prefilledTopics');
          sessionStorage.removeItem('sessionBuilder_prefilledTopics_timestamp');
        }
      }
    } catch (error) {
      console.error('[Session Builder Page] Error reading from sessionStorage:', error);
    }

    return null;
  }, [statePrefilledTopics, location.state]);

  // Extract saved variant from navigation state
  const getSavedVariant = React.useCallback(() => {
    if (stateSavedVariant) {
      console.log('[Session Builder Page] Found saved variant in location.state:', stateSavedVariant);
      return stateSavedVariant;
    }
    return null;
  }, [stateSavedVariant, location.state]);

  const prefilledTopics = getPrefilledTopics();
  const savedVariant = getSavedVariant();
  const initialStep = stateInitialStep as BuilderStep | undefined;
  const isEditingSavedVariant = stateIsEditingSavedVariant;

  React.useEffect(() => {
    console.log('[Session Builder Page] Received prefilled topics:', prefilledTopics);
    console.log('[Session Builder Page] Location state:', location.state);
  }, [prefilledTopics, location.state]);

  const beginDraftCreation = React.useCallback(async () => {
    try {
      setDraftCreationError(null);
      setIsCreatingDraft(true);
      const response = await sessionBuilderService.createDraft();
      console.log('[Session Builder Page] Created draft, preserving topics:', prefilledTopics);

      // Keep topics in sessionStorage for the next navigation
      // They will be cleared after successful load in SessionBuilderProvider

      // Preserve the prefilled topics when navigating to the new draft
      const nextState: Record<string, unknown> = {};

      if (prefilledTopics) {
        nextState.prefilledTopics = prefilledTopics;
      }
      if (savedVariant) {
        nextState.savedVariant = savedVariant;
      }
      if (typeof isEditingSavedVariant !== 'undefined') {
        nextState.isEditing = isEditingSavedVariant;
      }
      if (initialStep) {
        nextState.initialStep = initialStep;
      }

      navigate(`/sessions/builder/${response.draftId}`, {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : undefined
      });
    } catch (error) {
      console.error('Failed to create builder draft', error);
      const message = error instanceof Error ? error.message : 'Failed to create session draft';
      setDraftCreationError(message);
    } finally {
      setIsCreatingDraft(false);
    }
  }, [navigate, prefilledTopics, savedVariant, isEditingSavedVariant, initialStep]);

  React.useEffect(() => {
    if (sessionId === 'new' && !isEditMode) {
      void beginDraftCreation();
    }
  }, [beginDraftCreation, sessionId, isEditMode]);

  const userRoleName =
    (user as any)?.role?.name ||
    (user as any)?.roleName ||
    (typeof (user as any)?.role === 'string' ? (user as any).role : undefined);
  const canCreateSessions =
    userRoleName === UserRole.CONTENT_DEVELOPER || userRoleName === UserRole.BROKER;

  if (!canCreateSessions) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800">Access restricted</h2>
          <p className="mt-2 text-sm text-yellow-700">
            You need Content Developer or Broker permissions to open the session builder.
          </p>
        </div>
      </div>
    );
  }

  if ((sessionId === 'new' || isCreatingDraft) && !isEditMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          {draftCreationError ? (
            <>
              <h2 className="text-lg font-semibold text-red-600">Draft creation failed</h2>
              <p className="mt-2 text-sm text-slate-600">
                {draftCreationError}
              </p>
              <div className="mt-4 flex justify-center">
                <Button onClick={() => void beginDraftCreation()}>
                  Try again
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Preparing your workspace</h2>
              <p className="mt-2 text-sm text-slate-600">
                Setting up a draft so you can start building right away…
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <EditModeProvider
        initialSessionId={sessionId}
        initialSessionStatus={isEditMode ? SessionStatus.DRAFT : SessionStatus.DRAFT}
      >
        <SessionBuilderProvider
          sessionId={sessionId}
          prefilledTopics={prefilledTopics}
          savedVariant={savedVariant}
        >
          <SessionBuilderScreen
            routeSessionId={sessionId}
            prefilledTopics={prefilledTopics}
            savedVariant={savedVariant}
            initialStep={initialStep}
            isEditMode={isEditMode}
            existingSessionId={isEditMode ? sessionId : undefined}
          />
        </SessionBuilderProvider>
      </EditModeProvider>
    </ToastProvider>
  );
};
