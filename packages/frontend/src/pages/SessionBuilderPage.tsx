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
import { SessionTopicDraft } from '../features/session-builder/state/types';
import { cn } from '../lib/utils';
import {
  areRequiredItemsComplete,
  getDraftReadinessItems,
} from '../features/session-builder/utils/readiness';

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

// Utility function to transform flexible sections to topic-based structure for UnifiedReviewEditor
const transformFlexibleSectionsToTopics = (outline: any, metadata: any): SessionTopicDraft[] => {
  if (!outline?.sections || !Array.isArray(outline.sections)) {
    return [];
  }

  const metadataTopics: SessionTopicDraft[] = Array.isArray(metadata?.topics)
    ? metadata.topics
    : [];

  const topicBySectionId = new Map<string, SessionTopicDraft>();
  const topicByTopicId = new Map<number, SessionTopicDraft>();

  metadataTopics.forEach((topic) => {
    if (topic.sectionId) {
      topicBySectionId.set(topic.sectionId, topic);
    }
    if (typeof topic.topicId === 'number') {
      topicByTopicId.set(topic.topicId, topic);
    }
  });

  const topics: SessionTopicDraft[] = [];
  const sortedSections = sessionBuilderService.sortSectionsByPosition(outline.sections);

  sortedSections.forEach((section: FlexibleSessionSection, index: number) => {
    const fallbackPosition = section.position ?? index + 1;
    const metadataTopic =
      topicBySectionId.get(section.id) ||
      (section.associatedTopic?.id ? topicByTopicId.get(section.associatedTopic.id) : undefined);

    // Transform each section into a topic structure
    const topic: SessionTopicDraft = {
      sectionId: section.id,
      title: metadataTopic?.title ?? section.title ?? `Section ${index + 1}`,
      description: metadataTopic?.description ?? section.description ?? '',
      durationMinutes: metadataTopic?.durationMinutes ?? section.duration ?? 15,
      learningOutcomes:
        metadataTopic?.learningOutcomes ??
        section.learningObjectives?.join('\n') ??
        '',
      trainerNotes: metadataTopic?.trainerNotes ?? section.trainerNotes ?? '',
      materialsNeeded:
        metadataTopic?.materialsNeeded ??
        section.materialsNeeded?.join('\n') ??
        '',
      deliveryGuidance:
        metadataTopic?.deliveryGuidance ?? section.deliveryGuidance ?? '',
      callToAction:
        metadataTopic?.callToAction ??
        section.suggestedActivities?.join('\n') ??
        '',
      trainerName: metadataTopic?.trainerName ?? section.trainerName,
      position: metadataTopic?.position ?? fallbackPosition,
    };

    // Add topic ID if available
    if (typeof metadataTopic?.topicId === 'number') {
      topic.topicId = metadataTopic.topicId;
    } else if (section.associatedTopic?.id) {
      topic.topicId = section.associatedTopic.id;
    }

    // Add trainer assignment if available
    if (typeof metadataTopic?.trainerId === 'number') {
      topic.trainerId = metadataTopic.trainerId;
    } else if (section.trainerId) {
      topic.trainerId = section.trainerId;
    }

    topics.push(topic);
  });

  return topics;
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
    manualAutosave,
    publishSession,
    canUndoAutosave,
    undoAutosave,
    variants,
    variantsStatus,
    variantsError,
    variantSelectionTime,
  } = useSessionBuilder();
  const navigate = useNavigate();
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

        // Update metadata
        await updateMetadata(builderData.metadata);

        // Preserve topic snapshot for quick access during edits
        latestTopicsRef.current = builderData.topics ?? [];

        // Create outline from existing session topics
        const currentDraft = state.draft;
        if (builderData.outline && !currentDraft?.outline) {
          await updateOutline(builderData.outline);
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

  // Enable API debugging
  useApiDebugger();

  const draft = state.draft;
  const publishStatus = state.publishStatus;
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
    if (isEditMode) {
      switch (currentStep) {
        case 'trainers-topics': return 'Continue to Review Changes';
        case 'review': return 'Continue to Update Session';
        case 'finalize':
          if (publishStatus === 'success') return 'Updated';
          if (isPublishing) return 'Updating...';
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
  }, [currentStep, isEditMode, isPublishing, publishStatus]);

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
      return isPublishing || publishStatus === 'success' || !canPublish;
    }

    return false;
  }, [currentStep, hasRequiredSetupFields, draft?.acceptedVersionId, hasChosenCreateOwn, canGoNext, isPublishing, publishStatus, canPublish]);

  const handlePrimaryAction = React.useCallback(() => {
    if (currentStep === 'finalize') {
      if (isEditMode && existingSessionId) {
        // In edit mode, update the existing session instead of publishing
        void updateExistingSession();
      } else {
        void publishSession();
      }
      return;
    }

    nextStep();
  }, [currentStep, isEditMode, existingSessionId, publishSession, nextStep]);

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
        status: 'DRAFT', // Keep current status
        readinessScore: draft.readinessScore || 0,
        sessionTopics: sessionTopicsPayload,
      };

      await sessionService.updateSession(existingSessionId, updateData);

      console.log('[SessionBuilder Edit Mode] Session updated successfully');

      // Navigate back to sessions list after successful update
      navigate('/sessions', { replace: true });

    } catch (error) {
      console.error('[SessionBuilder Edit Mode] Failed to update session:', error);
      // Could show error toast here
    }
  }, [existingSessionId, draft, navigate]);

  if (state.status === 'loading' || !draft) {
    return (
      <BuilderLayout
        title={isEditMode ? "Edit Session" : "AI Session Builder"}
        subtitle={isEditMode ? "Loading session for editing..." : "Launching workspace..."}
        statusSlot={<AutosaveIndicator status="pending" onManualSave={manualAutosave} />}
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
        statusSlot={<AutosaveIndicator status="error" onManualSave={manualAutosave} />}
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
            topics={transformFlexibleSectionsToTopics(draft.outline, draft.metadata)}
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
            topics={transformFlexibleSectionsToTopics(draft.outline, draft.metadata)}
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
            topics={transformFlexibleSectionsToTopics(draft.outline, draft.metadata)}
            metadata={draft.metadata}
            readinessScore={draft.readinessScore}
            onEdit={() => goToStep('review')}
            onPublish={() => void publishSession()}
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

  const getStepTitle = () => {
    if (isEditMode) {
      switch (currentStep) {
        case 'trainers-topics': return 'Edit Session - Assign Trainers & Refine Topics';
        case 'review': return 'Edit Session - Review Changes';
        case 'finalize': return 'Edit Session - Update Session';
        default: return 'Edit Session';
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
    if (isEditMode) {
      switch (currentStep) {
        case 'trainers-topics': return 'Manage topic assignments and trainer assignments for your existing session.';
        case 'review': return 'Review your changes before updating the session.';
        case 'finalize': return 'Finalize your changes and update the session.';
        default: return 'Edit your existing session using the builder interface.';
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
            status={state.autosaveStatus}
            lastSavedAt={draft.lastAutosaveAt}
            onManualSave={manualAutosave}
            canUndo={canUndoAutosave}
            onUndo={undoAutosave}
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
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={variantsStatus === 'pending'}
                  className="w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
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
                  <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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

  // Determine if this is edit mode from URL pattern
  const isEditMode = location.pathname.includes('/edit/');
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(sessionId === 'new');
  const [draftCreationError, setDraftCreationError] = React.useState<string | null>(null);

  // Extract prefilled topics from navigation state OR sessionStorage
  const getPrefilledTopics = React.useCallback(() => {
    // First try location state
    const stateTopics = (location.state as any)?.prefilledTopics;
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
  }, [location.state]);

  // Extract saved variant from navigation state
  const getSavedVariant = React.useCallback(() => {
    const stateSavedVariant = (location.state as any)?.savedVariant;
    if (stateSavedVariant) {
      console.log('[Session Builder Page] Found saved variant in location.state:', stateSavedVariant);
      return stateSavedVariant;
    }
    return null;
  }, [location.state]);

  const prefilledTopics = getPrefilledTopics();
  const savedVariant = getSavedVariant();
  const initialStep = (location.state as any)?.initialStep as BuilderStep | undefined;
  const isEditingSavedVariant = (location.state as any)?.isEditing;

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
    </ToastProvider>
  );
};
