import * as React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ToastProvider, Button } from '../ui';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import {
  AutosaveIndicator,
  SessionMetadataForm,
  SessionSectionEditor,
  StepIndicator,
  QuickAddModal,
  UnifiedClassicEditor,
  UnifiedReviewEditor,
} from '../features/session-builder/components';
import type { BuilderStepConfig } from '../features/session-builder/components';
import { useBuilderSteps } from '../features/session-builder/components/StepIndicator';
import { cn } from '../lib/utils';
import {
  ClassicSessionBuilderProvider,
  useClassicSessionBuilder,
} from '../features/classic-session-builder/state';
import { areClassicRequiredItemsComplete } from '../features/classic-session-builder/utils/readiness';
import { sessionBuilderService, SectionType, FlexibleSessionSection, SessionOutline } from '../services/session-builder.service';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
    <p className="text-sm text-slate-500">{message}</p>
  </div>
);

const classicSteps: BuilderStepConfig[] = [
  {
    key: 'setup',
    label: 'Session Details',
    description: 'Pick topics and session logistics',
  },
  {
    key: 'generate',
    label: 'Assign Trainers',
    description: 'Match each topic with the right trainer',
  },
  {
    key: 'review',
    label: 'Review & Edit',
    description: 'Confirm you are happy with what you built',
  },
  {
    key: 'finalize',
    label: 'Publish',
    description: 'Publish to make it live!',
  },
];

const ClassicSessionBuilderScreen: React.FC = () => {
  const {
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
  } = useClassicSessionBuilder();

  const {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    canGoPrev,
  } = useBuilderSteps('setup');

  const [isQuickAddOpen, setQuickAddOpen] = React.useState(false);

  const navigate = useNavigate();
  const draft = state.draft;
  const publishStatus = state.publishStatus;
  const isPublishing = publishStatus === 'pending';

  // Redirect to sessions page after successful publish
  React.useEffect(() => {
    if (publishStatus === 'success') {
      const timer = setTimeout(() => {
        navigate('/sessions');
      }, 1500); // Wait 1.5 seconds to show the success message
      return () => clearTimeout(timer);
    }
  }, [publishStatus, navigate]);

  const readinessScore = draft?.readinessScore ?? 0;
  const canPublish = !!draft && areClassicRequiredItemsComplete(draft) && readinessScore >= 60;

  const hasRequiredSetupFields = React.useMemo(() => {
    if (!draft) return false;
    const { desiredOutcome, category, sessionType, locationId } = draft.metadata;
    return !!(desiredOutcome?.trim() && category?.trim() && sessionType && locationId);
  }, [draft]);

  const hasOutline = React.useMemo(() => {
    return !!draft?.outline && draft.outline.sections.length > 0;
  }, [draft?.outline]);

  const draftOutline = draft?.outline;
  const metadataTitle = draft?.metadata.title ?? '';
  const metadataDesiredOutcome = draft?.metadata.desiredOutcome ?? '';

  const resolvedOutline = React.useMemo<SessionOutline>(() => {
    if (draftOutline) {
      return draftOutline;
    }
    return {
      sections: [],
      totalDuration: 0,
      suggestedSessionTitle: metadataTitle,
      suggestedDescription: metadataDesiredOutcome,
      difficulty: 'Intermediate',
      recommendedAudienceSize: '10-25',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };
  }, [draftOutline, metadataTitle, metadataDesiredOutcome]);

  React.useEffect(() => {
    if (!draft) return;

    if (hasOutline && !completedSteps.includes('generate')) {
      completeStep('generate');
    }
  }, [draft, hasOutline, completedSteps, completeStep]);

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

  const handleTopicsChange = React.useCallback((topics: any[]) => {
    if (!draft) return;
    updateMetadata({ topics });
  }, [draft, updateMetadata]);

  const handleAssignTrainer = React.useCallback(async (topicIndex: number, trainer: { id: number; name: string } | null) => {
    if (!draft) return;

    const topics = draft.metadata.topics ?? [];
    if (!topics[topicIndex]) {
      return;
    }

    const updatedTopics = [...topics];
    updatedTopics[topicIndex] = {
      ...updatedTopics[topicIndex],
      trainerId: trainer?.id ?? undefined,
      trainerName: trainer?.name ?? undefined,
    };
    updateMetadata({ topics: updatedTopics });

    if (!draft.outline) {
      return;
    }

    const targetTopic = updatedTopics[topicIndex];

    let sectionsToUpdate: FlexibleSessionSection[] = [];
    if (targetTopic.sectionId) {
      const matchedSection = draft.outline.sections.find(section => section.id === targetTopic.sectionId);
      if (matchedSection) {
        sectionsToUpdate = [matchedSection];
      }
    }

    if (sectionsToUpdate.length === 0) {
      sectionsToUpdate = draft.outline.sections.filter((section) => {
        if (section.type !== 'topic') return false;
        if (targetTopic.topicId && section.associatedTopic?.id) {
          return section.associatedTopic.id === targetTopic.topicId;
        }
        if (targetTopic.title) {
          const normalizedTitle = targetTopic.title.trim().toLowerCase();
          if (section.associatedTopic?.name) {
            return section.associatedTopic.name.trim().toLowerCase() === normalizedTitle;
          }
          if (section.title) {
            return section.title.trim().toLowerCase() === normalizedTitle;
          }
        }
        return false;
      });
    }

    if (sectionsToUpdate.length === 0) {
      return;
    }

    await Promise.all(
      sectionsToUpdate.map((section) =>
        updateOutlineSection(section.id, {
          trainerId: trainer?.id ?? undefined,
          trainerName: trainer?.name ?? undefined,
        }),
      ),
    );
  }, [draft, updateMetadata, updateOutlineSection]);

  const primaryButtonLabel = React.useMemo(() => {
    switch (currentStep) {
      case 'setup': return 'Build Your Outline →';
      case 'generate': return 'Continue to Review';
      case 'review': return 'Continue to Finalize';
      case 'finalize':
        if (publishStatus === 'success') return 'Saved';
        if (isPublishing) return 'Saving…';
        return 'Publish Session';
      default: return 'Continue';
    }
  }, [currentStep, isPublishing, publishStatus]);

  const primaryButtonDisabled = React.useMemo(() => {
    if (currentStep === 'setup') {
      return !hasRequiredSetupFields;
    }
    if (currentStep === 'generate') {
      return !hasOutline;
    }
    if (currentStep === 'review') {
      return !hasOutline;
    }
    if (currentStep === 'finalize') {
      return isPublishing || publishStatus === 'success' || !canPublish;
    }
    return false;
  }, [currentStep, hasRequiredSetupFields, hasOutline, isPublishing, publishStatus, canPublish]);

  const parseBulletList = React.useCallback((value?: string | null): string[] => (
    (value || '')
      .split('\n')
      .map((item) => item.replace(/^•\s*/, '').trim())
      .filter(Boolean)
  ), []);

  const syncTopicsToOutline = React.useCallback(async () => {
    if (!draft) return;

    const topics = draft.metadata.topics ?? [];
    if (!topics.length) {
      return;
    }

    const outline = draft.outline ?? {
      sections: [],
      totalDuration: 0,
      suggestedSessionTitle: draft.metadata.title || '',
      suggestedDescription: draft.metadata.desiredOutcome || '',
      difficulty: 'Intermediate',
      recommendedAudienceSize: '10-25',
      fallbackUsed: false,
      generatedAt: new Date().toISOString(),
    };

    const existingSections = outline.sections ?? [];
    const sections = [...existingSections];

    const topicKeyMap = new Map<string, FlexibleSessionSection>();
    existingSections.forEach((section) => {
      if (section.type !== 'topic') return;
      const key = section.associatedTopic?.id
        ? `id-${section.associatedTopic.id}`
        : section.title.trim().toLowerCase();
      if (key) {
        topicKeyMap.set(key, section);
      }
    });

    // Get all unique trainer IDs to fetch trainer names
    const trainerIds = new Set<number>();
    topics.forEach((topic) => {
      if (topic.trainerId) {
        trainerIds.add(topic.trainerId);
      }
    });

    // Fetch trainer names for all trainers
    const trainerMap = new Map<number, string>();
    if (trainerIds.size > 0) {
      try {
        const trainers = await sessionBuilderService.getTrainers('', 100);
        trainers.forEach((trainer) => {
          if (trainer.id && trainer.name) {
            trainerMap.set(trainer.id, trainer.name);
          }
        });
      } catch (error) {
        console.warn('Failed to fetch trainer names:', error);
      }
    }

    let changed = false;
    let topicsUpdated = false;
    const topicsWithSectionIds = topics.map(topic => ({ ...topic }));
    let nextPosition = sections.length;

    topics.forEach((topic, index) => {
      const normalizedTitle = topic.title?.trim().toLowerCase();
      const key = topic.topicId ? `id-${topic.topicId}` : (normalizedTitle ? `title-${normalizedTitle}` : `index-${index}`);

      if (key) {
        const matchedSection = topicKeyMap.get(key);
        if (matchedSection) {
          const sectionIndex = sections.findIndex((s) => s.id === matchedSection.id);
          if (sectionIndex >= 0) {
            const existing = sections[sectionIndex];
            const updates: Partial<FlexibleSessionSection> = {};
            let needsUpdate = false;

            const durationMinutes = topic.durationMinutes && topic.durationMinutes > 0 ? topic.durationMinutes : 0;
            if (durationMinutes > 0 && existing.duration !== durationMinutes) {
              updates.duration = durationMinutes;
              needsUpdate = true;
            }

            if (!existing.description && topic.description) {
              updates.description = topic.description;
              needsUpdate = true;
            }

            if (!existing.associatedTopic && topic.topicId) {
              updates.associatedTopic = {
                id: topic.topicId,
                name: topic.title ?? '',
                description: topic.description ?? '',
              };
              needsUpdate = true;
            }

            if (topic.trainerId && trainerMap.has(topic.trainerId)) {
              const trainerId = topic.trainerId;
              const trainerName = trainerMap.get(trainerId);
              if (existing.trainerId !== trainerId || existing.trainerName !== trainerName) {
                updates.trainerId = trainerId;
                updates.trainerName = trainerName;
                needsUpdate = true;
              }
              if (topicsWithSectionIds[index].trainerName !== trainerName) {
                topicsWithSectionIds[index].trainerName = trainerName;
                topicsUpdated = true;
              }
            } else if (!topic.trainerId && (existing.trainerId || existing.trainerName)) {
              updates.trainerId = undefined;
              updates.trainerName = undefined;
              needsUpdate = true;
              if (topicsWithSectionIds[index].trainerName) {
                topicsWithSectionIds[index].trainerName = undefined;
                topicsUpdated = true;
              }
            } else if (existing.trainerId || existing.trainerName) {
              updates.trainerId = undefined;
              updates.trainerName = undefined;
              needsUpdate = true;
            }

            if (needsUpdate) {
              sections[sectionIndex] = {
                ...existing,
                ...updates,
              };
              changed = true;
            }

            if (topicsWithSectionIds[index].sectionId !== existing.id) {
              topicsWithSectionIds[index].sectionId = existing.id;
              topicsUpdated = true;
            }

            return;
          }

          return;
        }
      }

      const duration = topic.durationMinutes && topic.durationMinutes > 0
        ? topic.durationMinutes
        : 20;

      const learningObjectives = parseBulletList(topic.learningOutcomes);
      const materialsNeeded = parseBulletList(topic.materialsNeeded);
      const trainerNotesList = parseBulletList(topic.trainerNotes);
      const activities = parseBulletList(topic.callToAction);
      const trainerNotesValue = topic.trainerNotes && topic.trainerNotes.trim()
        ? topic.trainerNotes
        : (trainerNotesList.length ? trainerNotesList.map(item => `• ${item}`).join('\n') : undefined);

      const id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? `classic-${crypto.randomUUID()}`
          : `classic-${Date.now()}-${Math.random()}`;

      const newSection: FlexibleSessionSection = {
        id,
        type: 'topic',
        position: nextPosition++,
        title: topic.title || `Topic ${index + 1}`,
        duration,
        description: topic.description || '',
        learningObjectives: learningObjectives.length ? learningObjectives : undefined,
        materialsNeeded: materialsNeeded.length ? materialsNeeded : undefined,
        trainerNotes: trainerNotesValue,
        suggestedActivities: activities.length ? activities : undefined,
        associatedTopic: topic.topicId
          ? {
              id: topic.topicId,
              name: topic.title ?? '',
              description: topic.description ?? '',
            }
          : undefined,
      };

      if (topic.trainerId && trainerMap.has(topic.trainerId)) {
        newSection.trainerId = topic.trainerId;
        newSection.trainerName = trainerMap.get(topic.trainerId);
      }

      sections.push(newSection);
      changed = true;

      if (topicsWithSectionIds[index].sectionId !== newSection.id) {
        topicsWithSectionIds[index].sectionId = newSection.id;
        topicsUpdated = true;
      }

      if (topicsWithSectionIds[index].trainerId && trainerMap.has(topicsWithSectionIds[index].trainerId!)) {
        const resolvedName = trainerMap.get(topicsWithSectionIds[index].trainerId!);
        if (resolvedName && topicsWithSectionIds[index].trainerName !== resolvedName) {
          topicsWithSectionIds[index].trainerName = resolvedName;
          topicsUpdated = true;
        }
      }
    });

    if (!changed) {
      return;
    }

    const sortedSections = sessionBuilderService.sortSectionsByPosition(sections).map((section, index) => ({
      ...section,
      position: index,
    }));

    const totalDuration = sessionBuilderService.calculateTotalDuration(sortedSections);

    updateOutline({
      ...outline,
      sections: sortedSections,
      totalDuration,
      suggestedSessionTitle: outline.suggestedSessionTitle || draft.metadata.title || '',
      suggestedDescription: outline.suggestedDescription || draft.metadata.desiredOutcome || '',
    });

    if (topicsUpdated) {
      updateMetadata({ topics: topicsWithSectionIds });
    }
  }, [draft, parseBulletList, updateOutline, updateMetadata]);

  React.useEffect(() => {
    if (currentStep === 'generate') {
      syncTopicsToOutline();
    }
  }, [currentStep, syncTopicsToOutline]);

  const handlePrimaryAction = React.useCallback(() => {
    if (currentStep === 'finalize') {
      void publishSession();
      return;
    }
    if (currentStep === 'setup') {
      syncTopicsToOutline();
    }
    nextStep();
  }, [currentStep, publishSession, nextStep, syncTopicsToOutline]);

  const handleSecondaryAction = React.useCallback(() => {
    if (currentStep === 'setup') return;
    prevStep();
  }, [currentStep, prevStep]);

  const handleStepNavigation = (step: any) => {
    if (completedSteps.includes(step) || step === currentStep) {
      goToStep(step);
    }
  };

  if (state.status === 'loading' || !draft) {
    return (
      <BuilderLayout
        title="Classic Session Builder"
        subtitle="Preparing workspace..."
        statusSlot={
          <AutosaveIndicator
            status={state.autosaveStatus}
            onManualSave={() => Promise.resolve()}
          />
        }
      >
        <EmptyState message="Loading builder experience…" />
      </BuilderLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <BuilderLayout
        title="Classic Session Builder"
        subtitle="Something went wrong"
        statusSlot={
          <AutosaveIndicator
            status="error"
            onManualSave={() => Promise.resolve()}
          />
        }
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
            mode="classic"
          />
        );
      case 'generate':
        return (
          <div className="space-y-6">
            <UnifiedClassicEditor
              outline={resolvedOutline}
              topics={draft.metadata.topics ?? []}
              onUpdateSection={handleUpdateSection}
              onAddSection={handleAddSection}
              onDeleteSection={handleDeleteSection}
              onMoveSection={handleMoveSection}
              onDuplicateSection={handleDuplicateSection}
              onUpdateMetadata={updateMetadata}
              onOpenQuickAdd={() => setQuickAddOpen(true)}
              onAssignTrainer={handleAssignTrainer}
              onTopicsChange={handleTopicsChange}
            />
          </div>
        );
      case 'review':
        return draft.outline ? (
          <div className="space-y-6">
            <UnifiedReviewEditor
              outline={resolvedOutline}
              topics={draft.metadata.topics ?? []}
              metadata={draft.metadata}
              readinessScore={readinessScore}
              onEdit={() => goToStep('generate')}
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
          </div>
        ) : (
          <EmptyState message="Add sections to build an outline before reviewing." />
        );
      case 'finalize':
        return draft.outline ? (
          <div className="space-y-6">
            <UnifiedReviewEditor
              outline={resolvedOutline}
              topics={draft.metadata.topics ?? []}
              metadata={draft.metadata}
              readinessScore={readinessScore}
              onEdit={() => goToStep('generate')}
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
          </div>
        ) : (
          <EmptyState message="Your outline is empty. Add sections to finalize the session." />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <BuilderLayout
        title="Classic Session Builder"
        subtitle="Manually craft training sessions using your existing topics"
        statusSlot={
          <AutosaveIndicator
            status={state.autosaveStatus}
            lastSavedAt={draft.lastAutosaveAt}
            onManualSave={() => manualAutosave()}
            canUndo={canUndoAutosave}
            onUndo={canUndoAutosave ? undoAutosave : undefined}
          />
        }
      >
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={handleStepNavigation}
              steps={classicSteps}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            {currentStepContent()}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                currentStep === 'finalize' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-slate-100 text-slate-500'
              )}>
                {Math.min(4, ['setup', 'generate', 'review', 'finalize'].indexOf(currentStep) + 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {currentStep === 'finalize' ? 'Ready to publish' : 'Progress'}
                </p>
                <p className="text-xs text-slate-500">
                  Keep going—your manual session outline is just a few steps away.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleSecondaryAction}
                disabled={!canGoPrev}
              >
                Back
              </Button>
              <Button
                onClick={handlePrimaryAction}
                disabled={primaryButtonDisabled}
              >
                {primaryButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </BuilderLayout>

      <QuickAddModal
        open={isQuickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onAdd={handleAddSection}
      />
    </>
  );
};

export const ClassicSessionBuilderPage: React.FC = () => {
  const { sessionId = 'new' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCreatingDraft, setIsCreatingDraft] = React.useState(sessionId === 'new');
  const [draftCreationError, setDraftCreationError] = React.useState<string | null>(null);

  const getPrefilledTopics = React.useCallback(() => {
    const stateTopics = (location.state as any)?.prefilledTopics;
    if (stateTopics && Array.isArray(stateTopics) && stateTopics.length > 0) {
      return stateTopics;
    }

    try {
      const storedTopics = sessionStorage.getItem('sessionBuilder_prefilledTopics');
      const timestamp = sessionStorage.getItem('sessionBuilder_prefilledTopics_timestamp');

      if (storedTopics) {
        const topics = JSON.parse(storedTopics);
        const age = timestamp ? Date.now() - parseInt(timestamp, 10) : 0;

        if (age < 5 * 60 * 1000) {
          return topics;
        }

        sessionStorage.removeItem('sessionBuilder_prefilledTopics');
        sessionStorage.removeItem('sessionBuilder_prefilledTopics_timestamp');
      }
    } catch {
      // ignore storage errors
    }

    return null;
  }, [location.state]);

  const prefilledTopics = getPrefilledTopics();

  const beginDraftCreation = React.useCallback(async () => {
    try {
      setDraftCreationError(null);
      setIsCreatingDraft(true);
      const response = await sessionBuilderService.createDraft();
      navigate(`/sessions/builder/classic/${response.draftId}`, {
        replace: true,
        state: prefilledTopics ? { prefilledTopics } : undefined,
      });
    } catch (error) {
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
            You need Content Developer or Broker permissions to open the Classic Session Builder.
          </p>
        </div>
      </div>
    );
  }

  if (isCreatingDraft) {
    return (
      <BuilderLayout
        title="Classic Session Builder"
        subtitle="Preparing a fresh draft..."
      >
        <EmptyState message="Creating a new session draft. Hang tight!" />
      </BuilderLayout>
    );
  }

  if (draftCreationError) {
    return (
      <BuilderLayout
        title="Classic Session Builder"
        subtitle="Unable to start"
      >
        <div className="max-w-xl mx-auto">
          <div className="rounded-lg border border-red-200 bg-red-50 p-5">
            <h3 className="text-base font-semibold text-red-700 mb-1">Draft creation failed</h3>
            <p className="text-sm text-red-600 mb-4">{draftCreationError}</p>
            <Button onClick={() => void beginDraftCreation()}>
              Try again
            </Button>
          </div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <ToastProvider>
      <ClassicSessionBuilderProvider sessionId={sessionId} prefilledTopics={prefilledTopics}>
        <ClassicSessionBuilderScreen />
      </ClassicSessionBuilderProvider>
    </ToastProvider>
  );
};

export default ClassicSessionBuilderPage;
