import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger, Input } from '../../../ui';
import { SessionOutline, FlexibleSessionSection } from '../../../services/session-builder.service';
import { AIContentVersion, SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';
import { ReadinessIndicator } from './ReadinessIndicator';

interface ArtifactsPreviewProps {
  metadata: SessionMetadata;
  outline: SessionOutline | null;
  readinessScore: number;
  activeVersion?: AIContentVersion;
  onOpenQuickAdd: () => void;
  onUpdateOutline?: (outline: SessionOutline) => void;
  onUpdateMetadata?: (updates: Partial<SessionMetadata>) => void;
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
}

const EditableSection: React.FC<EditableSectionProps> = ({
  section,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(section.title);
  const [editedDescription, setEditedDescription] = React.useState(section.description);
  const [editedDuration, setEditedDuration] = React.useState(section.duration.toString());

  const handleSave = () => {
    onUpdate({
      title: editedTitle,
      description: editedDescription,
      duration: parseInt(editedDuration) || section.duration
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(section.title);
    setEditedDescription(section.description);
    setEditedDuration(section.duration.toString());
    setIsEditing(false);
  };

  if (isEditing) {
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
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {section.duration} min
            </span>
          </div>
          <p className="text-sm text-slate-600">{section.description}</p>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
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
            onClick={onMoveUp}
            disabled={isFirst}
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
            onClick={onMoveDown}
            disabled={isLast}
            className="h-8 w-8 p-0"
            title="Move down"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete section"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
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
  onUpdateOutline,
  onUpdateMetadata,
}) => {
  const [tab, setTab] = React.useState('readiness');
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(metadata.title);

  // Update local state when metadata changes
  React.useEffect(() => {
    setEditedTitle(metadata.title);
  }, [metadata.title]);

  const handleUpdateSection = (sectionId: string, updates: Partial<FlexibleSessionSection>) => {
    if (!outline || !onUpdateOutline) return;

    const updatedSections = outline.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );

    const totalDuration = updatedSections.reduce((sum, section) => sum + section.duration, 0);

    onUpdateOutline({
      ...outline,
      sections: updatedSections,
      totalDuration
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!outline || !onUpdateOutline) return;

    const updatedSections = outline.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({ ...section, position: index + 1 }));

    const totalDuration = updatedSections.reduce((sum, section) => sum + section.duration, 0);

    onUpdateOutline({
      ...outline,
      sections: updatedSections,
      totalDuration
    });
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!outline || !onUpdateOutline) return;

    const sections = [...outline.sections];
    const sectionIndex = sections.findIndex(s => s.id === sectionId);

    if (sectionIndex === -1) return;

    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

    if (newIndex < 0 || newIndex >= sections.length) return;

    // Swap sections
    [sections[sectionIndex], sections[newIndex]] = [sections[newIndex], sections[sectionIndex]];

    // Update positions
    const updatedSections = sections.map((section, index) => ({
      ...section,
      position: index + 1
    }));

    onUpdateOutline({
      ...outline,
      sections: updatedSections
    });
  };

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
                readinessScore={readinessScore}
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
                        {onUpdateOutline ? 'Click to edit, drag to reorder' : 'Read-only preview'} • {outline.sections.length} sections • {outline.totalDuration} minutes
                      </p>
                    </div>
                    {onUpdateOutline && (
                      <div className="text-xs text-slate-500">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Hover sections to edit
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {outline.sections.map((section, index) => (
                      onUpdateOutline ? (
                        <EditableSection
                          key={section.id}
                          section={section}
                          onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                          onDelete={() => handleDeleteSection(section.id)}
                          onMoveUp={() => handleMoveSection(section.id, 'up')}
                          onMoveDown={() => handleMoveSection(section.id, 'down')}
                          isFirst={index === 0}
                          isLast={index === outline.sections.length - 1}
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

                  {onUpdateOutline && (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Export Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                      <span className="ml-auto text-xs text-slate-400">Coming Soon</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export to Word
                      <span className="ml-auto text-xs text-slate-400">Coming Soon</span>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" disabled>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share Link
                      <span className="ml-auto text-xs text-slate-400">Coming Soon</span>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Publishing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-slate-600">
                      <p className="mb-2">Readiness Score: <span className={cn('font-semibold', readinessScore >= 90 ? 'text-green-600' : readinessScore >= 70 ? 'text-yellow-600' : 'text-red-600')}>{readinessScore}%</span></p>
                      <p className="text-xs text-slate-500">Sessions with 90%+ readiness can be published</p>
                    </div>
                    <Button
                      className="w-full"
                      disabled={readinessScore < 90}
                    >
                      {readinessScore >= 90 ? 'Publish Session' : `${90 - readinessScore}% to publish`}
                    </Button>
                    <Button variant="outline" className="w-full">
                      Save as Template
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Session Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <h3 className="text-base font-semibold mb-2">{sessionTitle}</h3>
                    <p className="text-slate-600 mb-4">{sessionSummary}</p>

                    {hasOutline && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Session Outline ({outline.totalDuration} minutes)</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                          {outline.sections.map((section) => (
                            <li key={section.id}>
                              {section.title} ({section.duration} min)
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
