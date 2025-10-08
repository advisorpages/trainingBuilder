import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  useApiDebugger
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

const SessionBuilderScreen: React.FC<{ routeSessionId: string }> = ({ routeSessionId }) => {
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
  const hasBootstrappedVariants = React.useRef(false);

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
    const nextSessionId = state.draft?.sessionId;
    if (state.publishStatus === 'success' && nextSessionId && nextSessionId !== routeSessionId) {
      navigate(`/sessions/builder/${nextSessionId}`, { replace: true });
    }
  }, [navigate, routeSessionId, state.draft?.sessionId, state.publishStatus]);

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
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="max-w-2xl mx-auto text-center space-y-3 sm:space-y-4">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-slate-900">Review Your Session Outline</h3>
                <p className="text-sm sm:text-base text-slate-600">
                  Your session outline is displayed in the preview panel{' '}
                  <span className="hidden lg:inline">on the right</span>
                  <span className="lg:hidden">(toggle to view)</span>. You can review all sections, edit content, and make adjustments.
                </p>

                <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8 text-left">
                  <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-center gap-2">
                      <span className="text-blue-600">1.</span> Review Content
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Check the preview panel to see all session sections, timings, and details.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-center gap-2">
                      <span className="text-blue-600">2.</span> Make Edits
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      Use the edit tools in the preview panel to modify sections, update metadata, or add new content.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-slate-50">
                    <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-1 sm:mb-2 flex items-center gap-2">
                      <span className="text-blue-600">3.</span> Generate New Version
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600">
                      If you want a different approach, go back to the previous step to regenerate variants.
                    </p>
                  </div>
                </div>

                {draft.aiVersions.length > 1 && (
                  <div className="pt-4">
                    <Button variant="outline" size="sm" className="sm:size-default" onClick={openVersionComparison}>
                      Compare All Versions
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'finalize':
        return (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <svg className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">Session Ready!</h2>
            <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
              Your session is complete and ready to publish. Use the Export tab in the preview to download or share your session.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-xs sm:max-w-none mx-auto">
              <Button onClick={() => goToStep('review')} variant="outline" className="w-full sm:w-auto">
                Review Content
              </Button>
              <Button
                onClick={() => void publishSession()}
                disabled={!draft || !canPublish || isPublishing || publishStatus === 'success'}
                className="w-full sm:w-auto"
              >
                {isPublishing ? 'Publishing…' : publishStatus === 'success' ? 'Published' : 'Publish Session'}
              </Button>
            </div>
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
                onClick={nextStep}
                disabled={
                  currentStep === 'setup' ? !hasRequiredSetupFields :
                  currentStep === 'generate' ? !draft.acceptedVersionId :
                  !canGoNext
                }
                className="w-full sm:w-auto sm:ml-auto"
                size="lg"
              >
                {currentStep === 'setup' && 'Continue to Generate Outline'}
                {currentStep === 'generate' && 'Continue to Review'}
                {currentStep === 'review' && 'Continue to Finalize'}
                {currentStep === 'finalize' && 'Complete'}
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
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(sessionId === 'new');
  const [draftCreationError, setDraftCreationError] = React.useState<string | null>(null);

  const beginDraftCreation = React.useCallback(async () => {
    try {
      setDraftCreationError(null);
      setIsCreatingDraft(true);
      const response = await sessionBuilderService.createDraft();
      navigate(`/sessions/builder/${response.draftId}`, { replace: true });
    } catch (error) {
      console.error('Failed to create builder draft', error);
      const message = error instanceof Error ? error.message : 'Failed to create session draft';
      setDraftCreationError(message);
    } finally {
      setIsCreatingDraft(false);
    }
  }, [navigate]);

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
      <SessionBuilderProvider sessionId={sessionId}>
        <SessionBuilderScreen routeSessionId={sessionId} />
      </SessionBuilderProvider>
    </ToastProvider>
  );
};
