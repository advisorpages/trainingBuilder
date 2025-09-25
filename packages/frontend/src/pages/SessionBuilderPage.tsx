import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { ToastProvider, Button } from '../ui';
import { BuilderLayout } from '../layouts/BuilderLayout';
import {
  AutosaveIndicator,
  AIComposer,
  ArtifactsPreview,
  QuickAddModal,
  SessionMetadataForm,
  StepIndicator,
  useBuilderSteps,
  VersionComparison,
  DebugPanel,
  useApiDebugger
} from '../features/session-builder/components';
import { SessionBuilderProvider, useSessionBuilder } from '../features/session-builder/state/SessionBuilderContext';
import { SessionOutline, sessionBuilderService, SectionType } from '../services/session-builder.service';
import { cn } from '../lib/utils';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

const SessionBuilderScreen: React.FC = () => {
  const {
    state,
    updateMetadata,
    updatePrompt,
    updateOutline,
    generateAIContent,
    acceptVersion,
    rejectAcceptedVersion,
    selectVersion,
    manualAutosave,
  } = useSessionBuilder();

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
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = React.useState(false);
  const [isDebugOpen, setIsDebugOpen] = React.useState(false);
  const hasBootstrappedAI = React.useRef(false);

  // Enable API debugging
  useApiDebugger();

  const draft = state.draft;

  // Determine if metadata has changed since last AI generation
  const hasMetadataChanged = React.useMemo(() => {
    if (!draft?.aiVersions.length) return false;
    const lastVersion = draft.aiVersions[draft.aiVersions.length - 1];
    return lastVersion.prompt !== draft.aiPrompt;
  }, [draft?.aiVersions, draft?.aiPrompt]);

  // Auto-advance steps based on completion
  React.useEffect(() => {
    if (!draft) return;

    // Mark setup as complete when essential metadata is filled
    const hasEssentialData = draft.metadata.title && draft.metadata.desiredOutcome && draft.metadata.category;
    if (hasEssentialData && !completedSteps.includes('setup')) {
      completeStep('setup');
    }

    // Mark generate as complete when we have AI versions
    if (draft.aiVersions.length > 0 && !completedSteps.includes('generate')) {
      completeStep('generate');
    }

    // Mark review as complete when a version is accepted
    if (draft.acceptedVersionId && !completedSteps.includes('review')) {
      completeStep('review');
    }

    // Mark finalize as complete when readiness is high
    if (draft.readinessScore >= 90 && !completedSteps.includes('finalize')) {
      completeStep('finalize');
    }
  }, [draft, completedSteps, completeStep]);

  // Bootstrap AI generation for new sessions
  React.useEffect(() => {
    if (!draft || state.status !== 'ready') return;
    if (hasBootstrappedAI.current) return;
    if (draft.aiVersions.length > 0) {
      hasBootstrappedAI.current = true;
      return;
    }
    // Only auto-generate if we have basic metadata
    if (draft.metadata.title && draft.metadata.desiredOutcome) {
      hasBootstrappedAI.current = true;
      void generateAIContent();
    }
  }, [draft, state.status, generateAIContent]);

  const handleAddSection = (type: SectionType) => {
    if (!draft) return;
    const existingSections = draft.outline?.sections ?? [];
    const nextPosition = existingSections.length + 1;
    const newSection = sessionBuilderService.createDefaultSection(type, nextPosition);
    const outlineBase: SessionOutline = draft.outline ?? {
      sections: [],
      totalDuration: 0,
      suggestedSessionTitle: draft.metadata.title || 'Draft Session',
      suggestedDescription: draft.metadata.desiredOutcome,
      difficulty: 'Intermediate',
      recommendedAudienceSize: '10-25',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };

    const sections = [...outlineBase.sections, newSection].map((section, index) => ({
      ...section,
      position: index + 1,
    }));

    const totalDuration = sessionBuilderService.calculateTotalDuration(sections);

    updateOutline({
      ...outlineBase,
      sections,
      totalDuration,
      suggestedSessionTitle: draft.metadata.title || outlineBase.suggestedSessionTitle,
      suggestedDescription: draft.metadata.desiredOutcome || outlineBase.suggestedDescription,
      generatedAt: new Date().toISOString(),
    });
  };

  const handleGenerateAI = async () => {
    await generateAIContent();
    if (currentStep === 'setup') {
      goToStep('generate');
    }
  };

  const handleAcceptVersion = (versionId: string) => {
    acceptVersion(versionId);
    if (currentStep === 'generate') {
      goToStep('review');
    }
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
            onTriggerAI={handleGenerateAI}
            onAutosave={manualAutosave}
            isAutosaving={state.autosaveStatus === 'pending'}
            showAdvancedOptions={false}
          />
        );
      case 'generate':
        return (
          <AIComposer
            prompt={draft.aiPrompt}
            onPromptChange={updatePrompt}
            onGenerate={generateAIContent}
            aiVersions={draft.aiVersions}
            selectedVersionId={draft.selectedVersionId}
            acceptedVersionId={draft.acceptedVersionId}
            aiStatus={state.aiStatus}
            onSelectVersion={selectVersion}
            onAcceptVersion={handleAcceptVersion}
            onRejectVersion={rejectAcceptedVersion}
            hasMetadataChanged={hasMetadataChanged}
            lastGenerationSource={state.lastGenerationSource}
            lastGenerationError={state.lastGenerationError}
          />
        );
      case 'review':
        return (
          <div className="space-y-4">
            {draft.aiVersions.length > 1 && (
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={openVersionComparison}>
                  Compare Versions
                </Button>
              </div>
            )}
            <AIComposer
              prompt={draft.aiPrompt}
              onPromptChange={updatePrompt}
              onGenerate={generateAIContent}
              aiVersions={draft.aiVersions}
              selectedVersionId={draft.selectedVersionId}
              acceptedVersionId={draft.acceptedVersionId}
              aiStatus={state.aiStatus}
              onSelectVersion={selectVersion}
              onAcceptVersion={handleAcceptVersion}
              onRejectVersion={rejectAcceptedVersion}
              hasMetadataChanged={hasMetadataChanged}
              lastGenerationSource={state.lastGenerationSource}
              lastGenerationError={state.lastGenerationError}
            />
          </div>
        );
      case 'finalize':
        return (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Session Ready!</h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Your session is complete and ready to publish. Use the Export tab in the preview to download or share your session.
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => goToStep('review')} variant="outline">
                Review Content
              </Button>
              <Button>
                Publish Session
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
      case 'setup': return 'Session Setup';
      case 'generate': return 'AI Content Generation';
      case 'review': return 'Review & Refine';
      case 'finalize': return 'Publish & Export';
      default: return 'AI Session Builder';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 'setup': return 'Define your session details and learning objectives';
      case 'generate': return 'Generate AI-powered session outlines and content';
      case 'review': return 'Review generated content and make refinements';
      case 'finalize': return 'Your session is ready for publishing and sharing';
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
          <div className="flex items-center gap-4">
            {/* Mobile Preview Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)}
              className="lg:hidden"
            >
              {isMobilePreviewOpen ? 'Hide' : 'Show'} Preview
            </Button>

            <AutosaveIndicator
              status={state.autosaveStatus}
              lastSavedAt={draft.lastAutosaveAt}
              onManualSave={manualAutosave}
            />
          </div>
        }
      >
        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepNavigation}
          />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1fr,400px] xl:grid-cols-[1fr,480px]">
          {/* Main Content Area */}
          <div className="min-w-0">
            {currentStepContent()}

            {/* Step Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={!canGoPrev}
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Button>

              <div className="text-sm text-slate-500">
                Step {['setup', 'generate', 'review', 'finalize'].indexOf(currentStep) + 1} of 4
              </div>

              <Button
                onClick={nextStep}
                disabled={!canGoNext}
              >
                Next
                <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Preview Sidebar - Desktop */}
          <div className={cn(
            'lg:block',
            isMobilePreviewOpen ? 'block' : 'hidden lg:block'
          )}>
            <div className="sticky top-4">
              <ArtifactsPreview
                metadata={draft.metadata}
                outline={draft.outline}
                readinessScore={draft.readinessScore}
                activeVersion={activeVersion}
                onOpenQuickAdd={() => setQuickAddOpen(true)}
                onUpdateOutline={updateOutline}
                onUpdateMetadata={updateMetadata}
              />
            </div>
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

  return (
    <ToastProvider>
      <SessionBuilderProvider sessionId={sessionId}>
        <SessionBuilderScreen />
      </SessionBuilderProvider>
    </ToastProvider>
  );
};
