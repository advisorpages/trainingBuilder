import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { ToastProvider } from '../ui';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { AutosaveIndicator, AIComposer, ArtifactsPreview, QuickAddModal, SessionMetadataForm } from '../features/session-builder/components';
import { SessionBuilderProvider, useSessionBuilder } from '../features/session-builder/state/SessionBuilderContext';
import { SessionOutline, sessionBuilderService, SectionType } from '../services/session-builder.service';

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

  const [isQuickAddOpen, setQuickAddOpen] = React.useState(false);
  const hasBootstrappedAI = React.useRef(false);

  const draft = state.draft;

  React.useEffect(() => {
    if (!draft || state.status !== 'ready') return;
    if (hasBootstrappedAI.current) return;
    if (draft.aiVersions.length > 0) {
      hasBootstrappedAI.current = true;
      return;
    }
    hasBootstrappedAI.current = true;
    void generateAIContent();
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

  const activeVersion = draft.aiVersions.find(
    (version) => version.id === (draft.selectedVersionId || draft.acceptedVersionId)
  );

  return (
    <>
      <QuickAddModal
        open={isQuickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAdd={handleAddSection}
      />

      <BuilderLayout
        title="AI Session Builder"
        subtitle="Design, iterate, and preview training sessions with AI assist."
        statusSlot={
          <AutosaveIndicator
            status={state.autosaveStatus}
            lastSavedAt={draft.lastAutosaveAt}
            onManualSave={manualAutosave}
          />
        }
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <SessionMetadataForm
              metadata={draft.metadata}
              onChange={updateMetadata}
              onTriggerAI={() => generateAIContent()}
              onAutosave={manualAutosave}
              isAutosaving={state.autosaveStatus === 'pending'}
            />

            <AIComposer
              prompt={draft.aiPrompt}
              onPromptChange={updatePrompt}
              onGenerate={generateAIContent}
              aiVersions={draft.aiVersions}
              selectedVersionId={draft.selectedVersionId}
              acceptedVersionId={draft.acceptedVersionId}
              aiStatus={state.aiStatus}
              onSelectVersion={selectVersion}
              onAcceptVersion={acceptVersion}
              onRejectVersion={rejectAcceptedVersion}
            />
          </div>

          <ArtifactsPreview
            metadata={draft.metadata}
            outline={draft.outline}
            readinessScore={draft.readinessScore}
            activeVersion={activeVersion}
            onOpenQuickAdd={() => setQuickAddOpen(true)}
          />
        </div>
      </BuilderLayout>
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
