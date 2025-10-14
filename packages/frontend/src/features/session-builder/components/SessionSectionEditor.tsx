import * as React from 'react';
import { Button, Card, CardContent } from '../../../ui';
import { TrainerGridSelector } from '../../../components/ui/TrainerGridSelector';
import { Trainer } from '@leadership-training/shared';
import { FlexibleSessionSection, SectionType, SessionOutline, sessionBuilderService } from '../../../services/session-builder.service';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';

interface SessionSectionEditorProps {
  outline: SessionOutline;
  onUpdateSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => void;
  onAddSection: (type: SectionType) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicateSection: (sectionId: string) => void;
  metadata: SessionMetadata;
  onOpenQuickAdd?: () => void;
  onUpdateMetadata: (updates: Partial<SessionMetadata>) => void;
  showInlineTrainerSelector?: boolean;
}

export const SessionSectionEditor: React.FC<SessionSectionEditorProps> = ({
  outline,
  onUpdateSection,
  onAddSection: _onAddSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  metadata,
  onOpenQuickAdd,
  onUpdateMetadata,
  showInlineTrainerSelector = true,
}) => {
  const sessionTopics = React.useMemo(() => metadata.topics ?? [], [metadata.topics]);
  const handleQuickAdd = React.useMemo(() => onOpenQuickAdd ?? (() => undefined), [onOpenQuickAdd]);

  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const sessionTitle = React.useMemo(() => {
    return outline.suggestedSessionTitle || metadata.title || '';
  }, [outline.suggestedSessionTitle, metadata.title]);

  const sessionDescription = React.useMemo(() => {
    return outline.suggestedDescription || metadata.desiredOutcome || '';
  }, [outline.suggestedDescription, metadata.desiredOutcome]);

  const sortedSections = React.useMemo(() => {
    return sessionBuilderService.sortSectionsByPosition(outline.sections || []);
  }, [outline.sections]);

  const totalDuration = React.useMemo(() => {
    return sessionBuilderService.calculateTotalDuration(outline.sections || []);
  }, [outline.sections]);

  // Calculate time budget status
  const scheduledDuration = React.useMemo(() => {
    if (metadata.startTime && metadata.endTime) {
      const start = new Date(metadata.startTime);
      const end = new Date(metadata.endTime);
      return Math.floor((end.getTime() - start.getTime()) / 60000);
    }
    return null;
  }, [metadata.startTime, metadata.endTime]);

  const getDurationStatus = () => {
    if (!scheduledDuration) return 'neutral';
    const diff = totalDuration - scheduledDuration;
    if (diff > 15) return 'over';
    if (diff > 5) return 'warning';
    return 'good';
  };

  const getIconForSection = (section: FlexibleSessionSection) => {
    const iconMap: { [key: string]: { emoji: string; bgColor: string; textColor: string } } = {
      opener: { emoji: '🎯', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      topic: { emoji: '📚', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      exercise: { emoji: '🎮', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
      video: { emoji: '🎥', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      discussion: { emoji: '💬', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
      presentation: { emoji: '🎤', bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
      inspiration: { emoji: '✨', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
      break: { emoji: '☕', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
      assessment: { emoji: '📋', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      closing: { emoji: '🏁', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      custom: { emoji: '⚙️', bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
    };

    const config = iconMap[section.type] || iconMap.custom;
    const displayIcon = section.icon || config.emoji;

    return (
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bgColor)}>
        <span className={cn('text-lg', config.textColor)}>{displayIcon}</span>
      </div>
    );
  };

  const SectionCard: React.FC<{ section: FlexibleSessionSection; index: number }> = ({ section, index }) => {
    const isEditing = editingSection === section.id;
    const isFirst = index === 0;
    const isLast = index === sortedSections.length - 1;

    const [localTitle, setLocalTitle] = React.useState(section.title);
    const [localDescription, setLocalDescription] = React.useState(section.description);
    const [localDuration, setLocalDuration] = React.useState(section.duration);

    // Reset local state when section changes
    React.useEffect(() => {
      setLocalTitle(section.title);
      setLocalDescription(section.description);
      setLocalDuration(section.duration);
    }, [section.title, section.description, section.duration]);

    const handleSave = () => {
      onUpdateSection(section.id, {
        title: localTitle,
        description: localDescription,
        duration: localDuration,
      });
      setEditingSection(null);
    };

    const handleCancel = () => {
      setLocalTitle(section.title);
      setLocalDescription(section.description);
      setLocalDuration(section.duration);
      setEditingSection(null);
    };

    let topicTrainerId: number | undefined;
    if (section.type === 'topic') {
      if (section.associatedTopic?.id) {
        const matchingTopic = sessionTopics.find(
          (t) => t.topicId === section.associatedTopic?.id
        );
        if (matchingTopic?.trainerId) {
          topicTrainerId = matchingTopic.trainerId;
        }
      }
      if (topicTrainerId === undefined && section.trainerId) {
        topicTrainerId = section.trainerId;
      }
    }

    const handleTrainerChange = (trainer: Trainer | null) => {
      if (!showInlineTrainerSelector) return;

      if (section.type === 'topic' && section.associatedTopic?.id) {
        const updatedTopics = [...sessionTopics];
        const topicIndex = updatedTopics.findIndex(
          (t) => t.topicId === section.associatedTopic?.id
        );

        if (topicIndex >= 0) {
          updatedTopics[topicIndex] = {
            ...updatedTopics[topicIndex],
            trainerId: trainer?.id ?? undefined,
          };
          onUpdateMetadata({ topics: updatedTopics });
        }
      }

      onUpdateSection(section.id, {
        trainerId: trainer?.id ?? undefined,
        trainerName: trainer?.name ?? undefined,
      });
    };

    return (
      <Card className="relative group">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Section Icon & Number */}
            <div className="flex-shrink-0">
              <div className="relative">
                {getIconForSection(section)}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </div>
              </div>
            </div>

            {/* Section Content */}
            <div className="flex-1 min-w-0 space-y-3">
              {isEditing ? (
                // Edit Mode
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Section Title</label>
                    <input
                      type="text"
                      value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter section title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={localDescription}
                      onChange={(e) => setLocalDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter section description"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Duration (minutes)</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLocalDuration(Math.max(5, localDuration - 5))}
                        className="px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <input
                        type="number"
                        value={localDuration}
                        onChange={(e) => setLocalDuration(Math.max(5, parseInt(e.target.value) || 5))}
                        min="5"
                        step="5"
                        className="w-20 px-3 py-1 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setLocalDuration(localDuration + 5)}
                        className="px-2 py-1 border border-slate-300 rounded-md hover:bg-slate-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <span className="text-xs text-slate-500 ml-2">
                        {sessionBuilderService.formatDuration(localDuration)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave}>
                      Save Changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-semibold text-slate-900 flex-1">{section.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {section.type}
                        </span>
                        <span className="text-sm text-slate-500 whitespace-nowrap">
                          {sessionBuilderService.formatDuration(section.duration)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{section.description}</p>
                  </div>

                  {/* Trainer Assignment */}
                  {section.type === 'topic' && (
                    <div className="rounded-lg border border-purple-200 bg-purple-50/70 px-4 py-3 text-sm text-purple-800">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 font-semibold">
                          <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 18a5.5 5.5 0 1111 0v.5a.5.5 0 01-.5.5h-10a.5.5 0 01-.5-.5V18z" />
                          </svg>
                          Trainer Assignment
                        </div>
                        <div className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                          section.trainerName
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-rose-100 text-rose-600 border-rose-200'
                        )}>
                          {section.trainerName ?? 'Unassigned'}
                        </div>
                      </div>
                      {showInlineTrainerSelector ? (
                        <div className="mt-3">
                          <TrainerGridSelector
                            value={topicTrainerId}
                            onChange={handleTrainerChange}
                            placeholder="Search and select a trainer for this topic..."
                            selectedLabel={section.trainerName}
                          />
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-purple-700/80">
                          Manage trainer assignments from the panel above. Updates appear here automatically.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Additional section properties preview */}
                  {section.learningObjectives && section.learningObjectives.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h4 className="text-xs font-semibold text-blue-900 mb-1">Learning Objectives:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {section.learningObjectives.slice(0, 3).map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                        {section.learningObjectives.length > 3 && (
                          <li className="text-blue-600 italic">+{section.learningObjectives.length - 3} more...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {!isEditing && (
              <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setEditingSection(section.id)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit section"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDuplicateSection(section.id)}
                  className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Duplicate section"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <div className="border-t border-slate-200 my-1"></div>
                {!isFirst && (
                  <button
                    onClick={() => onMoveSection(section.id, 'up')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                    title="Move up"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {!isLast && (
                  <button
                    onClick={() => onMoveSection(section.id, 'down')}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                    title="Move down"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
                <div className="border-t border-slate-200 my-1"></div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${section.title}"?`)) {
                      onDeleteSection(section.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete section"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Session Overview Header */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900 mb-2">{sessionTitle}</h2>
            <p className="text-sm text-slate-700 mb-4">{sessionDescription}</p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-slate-700">
                  Total: {sessionBuilderService.formatDuration(totalDuration)}
                </span>
              </div>

              {scheduledDuration && (
                <div className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded-md',
                  getDurationStatus() === 'good' && 'bg-green-100 text-green-700',
                  getDurationStatus() === 'warning' && 'bg-yellow-100 text-yellow-700',
                  getDurationStatus() === 'over' && 'bg-red-100 text-red-700'
                )}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-medium">
                    {getDurationStatus() === 'over' && `${totalDuration - scheduledDuration} min over`}
                    {getDurationStatus() === 'warning' && `${totalDuration - scheduledDuration} min over`}
                    {getDurationStatus() === 'good' && 'Within budget'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-600">
                  {sortedSections.length} section{sortedSections.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Edit Your Session Sections</h4>
            <p className="text-xs text-blue-800">
              Hover over sections to reveal edit controls. Use the Edit action to modify content, or the other buttons to reorder, duplicate, or remove sections.
            </p>
          </div>
        </div>
      </div>

      {/* Section List */}
      <div className="space-y-4">
        {sortedSections.length > 0 ? (
          sortedSections.map((section, index) => (
            <SectionCard key={section.id} section={section} index={index} />
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-600 mb-4">No sections added yet</p>
            <Button onClick={handleQuickAdd}>
              Add Your First Section
            </Button>
          </div>
        )}
      </div>

      {/* Add Section Button */}
      {sortedSections.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleQuickAdd}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
          </Button>
        </div>
      )}
    </div>
  );
};
