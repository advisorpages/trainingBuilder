import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Input } from '../../../ui';
import { SessionOutline, FlexibleSessionSection } from '../../../services/session-builder.service';
import { AIContentVersion, SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';
import { ReadinessIndicator } from './ReadinessIndicator';
import { MIN_PUBLISH_SCORE } from '../utils/readiness';

interface ArtifactsPreviewProps {
  metadata: SessionMetadata;
  outline: SessionOutline | null;
  readinessScore: number;
  activeVersion?: AIContentVersion;
  onOpenQuickAdd: () => void;
  onSectionUpdate?: (sectionId: string, updates: Partial<FlexibleSessionSection>) => void;
  onSectionDelete?: (sectionId: string) => void;
  onSectionMove?: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicateSection?: (sectionId: string) => void;
  onUpdateMetadata?: (updates: Partial<SessionMetadata>) => void;
  onPublish?: () => void;
  publishStatus?: 'idle' | 'pending' | 'success' | 'error';
  canPublish?: boolean;
}

// Editable Section Component
interface EditableSectionProps {
  section: FlexibleSessionSection;
  onUpdate: (updates: Partial<FlexibleSessionSection>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  isEditable: boolean;
  onDuplicate?: () => void;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isEditable,
  onDuplicate,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(section.title);
  const [editedDescription, setEditedDescription] = React.useState(section.description);
  const [editedDuration, setEditedDuration] = React.useState(section.duration.toString());
  const [isPending, setIsPending] = React.useState(false);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await onUpdate({
        title: editedTitle,
        description: editedDescription,
        duration: parseInt(editedDuration) || section.duration
      });
      setIsEditing(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(section.title);
    setEditedDescription(section.description);
    setEditedDuration(section.duration.toString());
    setIsEditing(false);
  };

  if (isEditable && isEditing) {
    return (
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="font-medium"
              placeholder="Section title"
            />
            <Input
              type="number"
              value={editedDuration}
              onChange={(e) => setEditedDuration(e.target.value)}
              className="w-20"
              placeholder="Duration"
            />
            <span className="text-sm text-slate-500">min</span>
          </div>

          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Section description"
            rows={3}
          />

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {section.duration} min
            </span>
            {isPending && (
              <span className="text-xs text-blue-600 animate-pulse">Updating...</span>
            )}
          </div>
          <p className="text-sm text-slate-600">{section.description}</p>
        </div>

        {isEditable && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              className="h-8 w-8 p-0"
              title="Edit section"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                setIsPending(true);
                try {
                  await onMoveUp();
                } finally {
                  setIsPending(false);
                }
              }}
              disabled={isFirst || isPending}
              className="h-8 w-8 p-0"
              title="Move up"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                setIsPending(true);
                try {
                  await onMoveDown();
                } finally {
                  setIsPending(false);
                }
              }}
              disabled={isLast || isPending}
              className="h-8 w-8 p-0"
              title="Move down"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>

            {onDuplicate && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  setIsPending(true);
                  try {
                    await onDuplicate();
                  } finally {
                    setIsPending(false);
                  }
                }}
                disabled={isPending}
                className="h-8 w-8 p-0"
                title="Duplicate section"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8m-6 4h4m-9-8V7a2 2 0 012-2h7l4 4v9a2 2 0 01-2 2h-3" />
                </svg>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                setIsPending(true);
                try {
                  await onDelete();
                } finally {
                  setIsPending(false);
                }
              }}
              disabled={isPending}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete section"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ArtifactsPreview: React.FC<ArtifactsPreviewProps> = ({
  metadata,
  outline,
  readinessScore,
  activeVersion,
  onOpenQuickAdd,
  onSectionUpdate,
  onSectionDelete,
  onSectionMove,
  onDuplicateSection,
  onUpdateMetadata,
  onPublish,
  publishStatus = 'idle',
  canPublish = false,
}) => {
  const [tab, setTab] = React.useState('readiness');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(metadata.title);

  // Update local state when metadata changes
  React.useEffect(() => {
    setEditedTitle(metadata.title);
  }, [metadata.title]);

  const canEditSections = Boolean(outline && onSectionUpdate && onSectionDelete && onSectionMove);

  const handleUpdateSection = React.useCallback((sectionId: string, updates: Partial<FlexibleSessionSection>) => {
    if (!outline || !onSectionUpdate) return;
    onSectionUpdate(sectionId, updates);
  }, [outline, onSectionUpdate]);

  const handleDeleteSection = React.useCallback((sectionId: string) => {
    if (!outline || !onSectionDelete) return;
    onSectionDelete(sectionId);
  }, [outline, onSectionDelete]);

  const handleMoveSection = React.useCallback((sectionId: string, direction: 'up' | 'down') => {
    if (!outline || !onSectionMove) return;
    onSectionMove(sectionId, direction);
  }, [outline, onSectionMove]);

  const handleSaveTitle = () => {
    if (onUpdateMetadata && editedTitle !== metadata.title) {
      onUpdateMetadata({ title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditedTitle(metadata.title);
    setIsEditingTitle(false);
  };

  const sessionTitle = metadata.title || activeVersion?.summary || 'Untitled Session';
  const sessionSummary = activeVersion?.summary || metadata.desiredOutcome || 'Draft summary will appear here once AI content is accepted.';
  const hasOutline = outline && outline.sections.length > 0;
  const hasAcceptedContent = !!activeVersion;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Session Preview</CardTitle>
            <Button size="sm" variant="outline" onClick={onOpenQuickAdd}>
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} defaultValue="readiness" onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="readiness">Readiness</TabsTrigger>
              <TabsTrigger value="landing">Landing</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="readiness" className="mt-4">
              <ReadinessIndicator
                metadata={metadata}
                hasOutline={hasOutline}
                hasAcceptedVersion={hasAcceptedContent}
                onOpenQuickAdd={onOpenQuickAdd}
              />
            </TabsContent>

            <TabsContent value="landing" className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    {isEditingTitle ? (
                      <div className="space-y-2">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-lg font-semibold"
                          placeholder="Session title"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') handleCancelTitleEdit();
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveTitle}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancelTitleEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="group cursor-pointer"
                        onClick={() => onUpdateMetadata && setIsEditingTitle(true)}
                      >
                        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {sessionTitle}
                          {onUpdateMetadata && (
                            <svg className="inline-block ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                        </h2>
                        {onUpdateMetadata && (
                          <p className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Click to edit title</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4">{sessionSummary}</p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-600 mb-2">Key Outcome</p>
                    <p className="text-sm text-blue-900">
                      {metadata.desiredOutcome || 'Define the learner outcome to personalize messaging.'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase text-green-600 mb-2">Focus Areas</p>
                    <p className="text-sm text-green-900">
                      {metadata.specificTopics || 'Specific topics will appear here.'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase text-amber-600 mb-2">Session Type</p>
                    <p className="text-sm text-amber-900 capitalize">
                      {metadata.sessionType} • {metadata.category}
                    </p>
                  </div>
                </div>

                {hasOutline && (
                  <div className="mt-6 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">Session Overview</h3>
                      <span className="text-xs text-slate-500">
                        {outline.totalDuration} minutes total
                      </span>
                    </div>
                    <div className="space-y-2">
                      {outline.sections.slice(0, 3).map((section, index) => (
                        <div key={section.id} className="flex items-center gap-3 text-sm">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="flex-1 text-slate-700">{section.title}</span>
                          <span className="text-xs text-slate-500">{section.duration}min</span>
                        </div>
                      ))}
                      {outline.sections.length > 3 && (
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">
                            +
                          </span>
                          <span>Plus {outline.sections.length - 3} more sections</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="outline" className="space-y-4">
              {hasOutline ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Interactive Outline</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {canEditSections ? 'Click to edit, drag to reorder' : 'Read-only preview'} • {outline.sections.length} sections • {outline.totalDuration} minutes
                      </p>
                    </div>
                    {canEditSections && (
                      <div className="text-xs text-slate-500">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Hover sections to edit
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {outline.sections.map((section, index) => (
                      canEditSections ? (
                        <EditableSection
                          key={section.id}
                          section={section}
                          onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                          onDelete={() => handleDeleteSection(section.id)}
                          onMoveUp={() => handleMoveSection(section.id, 'up')}
                          onMoveDown={() => handleMoveSection(section.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === outline.sections.length - 1}
                          isEditable
                          onDuplicate={onDuplicateSection ? () => onDuplicateSection(section.id) : undefined}
                        />
                      ) : (
                        <div key={section.id} className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {section.duration} min
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{section.description}</p>
                        </div>
                      )
                    ))}
                  </div>

                  {canEditSections && (
                    <div className="border-t border-slate-200 pt-4">
                      <Button
                        variant="outline"
                        onClick={onOpenQuickAdd}
                        className="w-full border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add New Section
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 mb-1">No outline yet</h3>
                  <p className="text-sm text-slate-500 mb-4">Generate AI content or manually add sections to get started</p>
                  <Button onClick={onOpenQuickAdd} size="sm">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add First Section
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Publishing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-slate-600">
                    <p className="mb-2">
                      Readiness Score:{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          readinessScore >= MIN_PUBLISH_SCORE
                            ? 'text-green-600'
                            : readinessScore >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        )}
                      >
                        {readinessScore}%
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Sessions with {MIN_PUBLISH_SCORE}%+ readiness can be published
                    </p>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!canPublish || publishStatus === 'pending' || publishStatus === 'success'}
                    onClick={onPublish}
                  >
                    {publishStatus === 'pending'
                      ? 'Publishing…'
                      : canPublish
                        ? publishStatus === 'success'
                          ? 'Published'
                          : 'Publish Session'
                        : `${Math.max(0, MIN_PUBLISH_SCORE - readinessScore)}% to publish`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
