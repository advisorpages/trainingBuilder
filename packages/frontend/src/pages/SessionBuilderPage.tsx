import * as React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { ToastProvider, Button } from '../ui';
import { BuilderLayout } from '../layouts/BuilderLayout';
import {
  AutosaveIndicator,
  AIComposer,
  QuickAddModal,
  SessionMetadataForm,
  StepIndicator,
  useBuilderSteps,
  VersionComparison,
  DebugPanel,
  useApiDebugger,
  SessionSectionEditor,
  SessionPreview
} from '../features/session-builder/components';
import { VariantSelector } from '../components/session-builder/VariantSelector';
import { SessionBuilderProvider, useSessionBuilder } from '../features/session-builder/state/SessionBuilderContext';
import { sessionBuilderService, SectionType, FlexibleSessionSection } from '../services/session-builder.service';
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

const SessionBuilderScreen: React.FC<{ routeSessionId: string; prefilledTopics?: any[] | null }> = ({ routeSessionId, prefilledTopics }) => {
  const {
    state,
    updateMetadata,
    updatePrompt,
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

  // Step management
  const {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev
  } = useBuilderSteps('setup');

  const [isQuickAddOpen, setQuickAddOpen] = React.useState(false);
  const [isVersionCompareOpen, setIsVersionCompareOpen] = React.useState(false);
  const [compareVersionIds, setCompareVersionIds] = React.useState<[string, string]>(['', '']);
  const [isDebugOpen, setIsDebugOpen] = React.useState(false);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(undefined);
  const hasBootstrappedVariants = React.useRef(false);
  const hasRedirectedAfterPublish = React.useRef(false);

  // Enable API debugging
  useApiDebugger();

  const draft = state.draft;
  const publishStatus = state.publishStatus;
  const isPublishing = publishStatus === 'pending';
  const readinessItems = React.useMemo(() => getDraftReadinessItems(draft ?? null), [draft]);
  const canPublish = !!draft && areRequiredItemsComplete(readinessItems);

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

  // Auto-complete steps only when users move forward
  // This prevents confusing auto-completion while users are still working on a step
  React.useEffect(() => {
    if (!draft) return;

    // Only mark generate as complete when a version is accepted
    // This ensures users have selected an outline before proceeding
    if (draft.acceptedVersionId && !completedSteps.includes('generate')) {
      completeStep('generate');
    }
  }, [draft?.acceptedVersionId, completedSteps, completeStep]);

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

  // Trigger AI generation when entering the generate step for the first time
  React.useEffect(() => {
    if (!draft || state.status !== 'ready') {
      return;
    }

    if (draft.aiVersions.length > 0) {
      hasBootstrappedVariants.current = true;
      return;
    }

    if (currentStep !== 'generate') {
      return;
    }

    if (!draft.metadata.desiredOutcome) {
      return;
    }

    if (variantsStatus === 'pending') {
      return;
    }

    if (variantsStatus === 'error') {
      return;
    }

    if (variantsStatus === 'success' && variants.length > 0) {
      hasBootstrappedVariants.current = true;
      return;
    }

    if (hasBootstrappedVariants.current) {
      return;
    }

    void (async () => {
      await startVariantGeneration();
    })();
  }, [
    currentStep,
    draft,
    state.status,
    variantsStatus,
    variants.length,
    startVariantGeneration,
  ]);

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

  const handleVariantSelect = React.useCallback(async (variantId: string) => {
    setSelectedVariantId(variantId);
    await selectVariant(variantId);
    // Don't auto-jump to review - let user click Next when ready
  }, [selectVariant]);

  const handleSaveVariantForLater = React.useCallback((variantId: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Session Builder v2] Save for later requested', { variantId });
    }
  }, []);

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
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-600">
              We couldn&rsquo;t build outlines this time. Try again to fetch fresh ideas.
            </p>
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void startVariantGeneration()}>
                Regenerate Variants
              </Button>
            </div>
          </div>
        );
      }

      const lastSelectionSeconds =
        variantSelectionTime > 0 ? (variantSelectionTime / 1000).toFixed(1) : null;

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Choose a session outline</h3>
              {lastSelectionSeconds && (
                <p className="text-xs text-slate-500">
                  Last selection in {lastSelectionSeconds}s — feel free to explore additional options.
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => void startVariantGeneration()}>
              Regenerate
            </Button>
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
      <div className="space-y-3 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Generate multiple session outlines</h3>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Compare four AI-crafted variants — including RAG-powered blends — so you can pick the best starting point.
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button
            onClick={() => void startVariantGeneration()}
            disabled={!hasRequiredSetupFields}
          >
            Generate Variants
          </Button>
          {!hasRequiredSetupFields && (
            <span className="text-xs text-slate-500">
              Add the desired outcome, category, and location to enable variant generation.
            </span>
          )}
        </div>
      </div>
    );
  };

  const primaryButtonLabel = React.useMemo(() => {
    switch (currentStep) {
      case 'setup': return 'Continue to Generate Outline';
      case 'generate': return 'Continue to Review';
      case 'review': return 'Continue to Finalize';
      case 'finalize':
        if (publishStatus === 'success') return 'Published';
        if (isPublishing) return 'Publishing...';
        return 'Publish Session';
      default: return 'Continue';
    }
  }, [currentStep, isPublishing, publishStatus]);

  const primaryButtonDisabled = React.useMemo(() => {
    if (currentStep === 'setup') {
      return !hasRequiredSetupFields;
    }

    if (currentStep === 'generate') {
      return !draft?.acceptedVersionId;
    }

    if (currentStep === 'review') {
      return !canGoNext;
    }

    if (currentStep === 'finalize') {
      return isPublishing || publishStatus === 'success' || !canPublish;
    }

    return false;
  }, [currentStep, hasRequiredSetupFields, draft?.acceptedVersionId, canGoNext, isPublishing, publishStatus, canPublish]);

  const handlePrimaryAction = React.useCallback(() => {
    if (currentStep === 'finalize') {
      void publishSession();
      return;
    }

    nextStep();
  }, [currentStep, publishSession, nextStep]);

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

  if (state.status === 'loading' || !draft) {
    return (
      <BuilderLayout
        title="AI Session Builder"
        subtitle="Launching workspace..."
        statusSlot={<AutosaveIndicator status="pending" onManualSave={manualAutosave} />}
      >
        <EmptyState message="Loading builder experience…" />
      </BuilderLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <BuilderLayout
        title="AI Session Builder"
        subtitle="Something went wrong"
        statusSlot={<AutosaveIndicator status="error" onManualSave={manualAutosave} />}
      >
        <EmptyState message={state.error ?? 'We could not load the builder right now.'} />
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
                      Your outline is ready. Click "Next" to review and refine the content, or regenerate to see new options.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'review':
        return draft.outline ? (
          <SessionSectionEditor
            outline={draft.outline}
            onUpdateSection={handleUpdateSection}
            onAddSection={handleAddSection}
            onDeleteSection={handleDeleteSection}
            onMoveSection={handleMoveSection}
            onDuplicateSection={handleDuplicateSection}
            metadata={draft.metadata}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
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
          <SessionPreview
            outline={draft.outline}
            metadata={draft.metadata}
            readinessScore={draft.readinessScore}
            onEdit={() => goToStep('review')}
            isPublishing={isPublishing}
            isPublished={publishStatus === 'success'}
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
    switch (currentStep) {
      case 'setup': return 'Session Details';
      case 'generate': return 'Create Outline';
      case 'review': return 'Review & Edit';
      case 'finalize': return 'Publish Session';
      default: return 'AI Session Builder';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'setup': return 'Define your session information and learning goals';
      case 'generate': return 'Generate AI-powered outlines and select your favorite';
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
                  className="w-full sm:w-auto"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
              )}

              {/* Right: Primary Action */}
              <Button
                onClick={handlePrimaryAction}
                disabled={primaryButtonDisabled}
                className="w-full sm:w-auto sm:ml-auto"
                size="lg"
              >
                {primaryButtonLabel}
                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>

            {/* Validation message for disabled state */}
            {currentStep === 'setup' && !hasRequiredSetupFields && (
              <div className="mt-3 text-center">
                <p className="text-sm text-amber-600">
                  Please fill in all required fields to continue
                </p>
              </div>
            )}
            {currentStep === 'generate' && !draft.acceptedVersionId && (
              <div className="mt-3 text-center">
                <p className="text-sm text-amber-600">
                  Please select an outline to continue
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

  const prefilledTopics = getPrefilledTopics();

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
      navigate(`/sessions/builder/${response.draftId}`, {
        replace: true,
        state: prefilledTopics ? { prefilledTopics } : undefined
      });
    } catch (error) {
      console.error('Failed to create builder draft', error);
      const message = error instanceof Error ? error.message : 'Failed to create session draft';
      setDraftCreationError(message);
    } finally {
      setIsCreatingDraft(false);
    }
  }, [navigate, prefilledTopics]);

  React.useEffect(() => {
    if (sessionId === 'new') {
      void beginDraftCreation();
    }
  }, [beginDraftCreation, sessionId]);

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

  if (sessionId === 'new' || isCreatingDraft) {
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
      <SessionBuilderProvider sessionId={sessionId} prefilledTopics={prefilledTopics}>
        <SessionBuilderScreen routeSessionId={sessionId} prefilledTopics={prefilledTopics} />
      </SessionBuilderProvider>
    </ToastProvider>
  );
};
