import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button, Card, CardContent, Progress } from '../../../ui';
import { Trainer } from '@leadership-training/shared';
import { FlexibleSessionSection, SectionType, SessionOutline, sessionBuilderService } from '../../../services/session-builder.service';
import { SessionMetadata, SessionTopicDraft } from '../state/types';
import { cn } from '../../../lib/utils';

interface UnifiedReviewEditorProps {
  outline: SessionOutline;
  topics: SessionTopicDraft[];
  metadata: SessionMetadata;
  readinessScore: number;
  onEdit: () => void;
  onPublish?: () => void;
  onUpdateSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => void;
  onAddSection: (type: SectionType) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicateSection: (sectionId: string) => void;
  onUpdateMetadata: (updates: Partial<SessionMetadata>) => void;
  onOpenQuickAdd?: () => void;
  onTopicsChange: (topics: SessionTopicDraft[]) => void;
  isPublishing?: boolean;
  isPublished?: boolean;
  isFinalStep?: boolean;
}

interface TopicWithSection {
  topic: SessionTopicDraft;
  topicIndex: number;
  section?: FlexibleSessionSection;
  trainerId?: number;
  trainerName?: string;
  isAssigned: boolean;
  isComplete: boolean;
}

const getDurationLabel = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Duration TBD';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainder} min`;
};

export const UnifiedReviewEditor: React.FC<UnifiedReviewEditorProps> = ({
  outline,
  topics,
  metadata,
  readinessScore,
  onEdit,
  onPublish,
  onUpdateSection,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  onUpdateMetadata,
  onOpenQuickAdd,
  onTopicsChange,
  isPublishing = false,
  isPublished = false,
  isFinalStep = false,
}) => {
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set());
  const [editingSection, setEditingSection] = React.useState<string | null>(null);

  const handleQuickAdd = React.useMemo(() => onOpenQuickAdd || (() => undefined), [onOpenQuickAdd]);

  // Combine topics with their corresponding sections
  const topicsWithSections = React.useMemo<TopicWithSection[]>(() => {
    return (topics ?? []).map((topic, index) => {
      const associatedSection = outline.sections.find((section) => {
        if (section.type !== 'topic') return false;
        if (topic.topicId && section.associatedTopic?.id) {
          return section.associatedTopic.id === topic.topicId;
        }
        if (section.associatedTopic?.name && topic.title) {
          return section.associatedTopic.name.trim().toLowerCase() === topic.title.trim().toLowerCase();
        }
        if (section.title && topic.title) {
          return section.title.trim().toLowerCase() === topic.title.trim().toLowerCase();
        }
        return false;
      });

      const trainerId = topic.trainerId ?? associatedSection?.trainerId ?? undefined;
      const trainerName = associatedSection?.trainerName;

      // Check if topic is complete (has description, duration, and trainer)
      const isComplete = !!(
        topic.description?.trim() &&
        topic.durationMinutes &&
        topic.durationMinutes > 0 &&
        trainerId &&
        trainerName
      );

      return {
        topic,
        topicIndex: index,
        section: associatedSection,
        trainerId,
        trainerName,
        isAssigned: Boolean(trainerId),
        isComplete,
      };
    });
  }, [topics, outline.sections]);

  // Calculate statistics
  const totalTopics = topicsWithSections.length;
  const assignedCount = topicsWithSections.filter(item => item.isAssigned).length;
  const completedCount = topicsWithSections.filter(item => item.isComplete).length;
  const completionProgress = totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const items = Array.from(topics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onTopicsChange(items);
  };

  const toggleTopicExpansion = (topicIndex: number) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicIndex)) {
        newSet.delete(topicIndex);
      } else {
        newSet.add(topicIndex);
      }
      return newSet;
    });
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

  const getReadinessColor = () => {
    if (readinessScore >= 90) return 'text-green-700 bg-green-100 border-green-200';
    if (readinessScore >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-orange-700 bg-orange-100 border-orange-200';
  };

  const getReadinessMessage = () => {
    if (readinessScore >= 90) return 'Ready to Publish';
    if (readinessScore >= 70) return 'Almost Ready';
    return 'Needs Attention';
  };

  const TopicCard: React.FC<{
    topicWithSection: TopicWithSection;
    provided: any;
    snapshot: any;
  }> = ({ topicWithSection, provided, snapshot }) => {
    const { topic, topicIndex, section, trainerName, isComplete } = topicWithSection;
    const isExpanded = expandedTopics.has(topicIndex);

    const parseBulletList = (value?: string | null): string[] => (
      (String(value || '') || '')
        .split('\n')
        .map((item) => item.replace(/^•\s*/, '').trim())
        .filter(Boolean)
    );

    const trainerTasks = parseBulletList(section?.trainerNotes || topic.trainerNotes);
    const materials = parseBulletList(section?.materialsNeeded || topic.materialsNeeded);

    return (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        className={cn(
          'flex items-start gap-3 transition-all',
          snapshot.isDragging ? 'opacity-50' : ''
        )}
      >
        {/* Drag Handle and Number Badge */}
        <div className="flex flex-col items-center gap-2 pt-4">
          <div
            {...provided.dragHandleProps}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 cursor-grab active:cursor-grabbing transition-colors"
            title="Drag to reorder"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
            </svg>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {topicIndex + 1}
          </div>
        </div>

        {/* Topic Card */}
        <div className="flex-1">
          <div className="space-y-3 rounded-lg border-2 border-slate-300 bg-white shadow-md hover:shadow-lg hover:border-blue-400 transition-all">
            {/* Main Content */}
            <div className="p-5">
              {/* Header with Title, Status, Duration and Actions */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    {topic.title || <span className="text-slate-400 italic">Untitled Topic</span>}
                  </h4>
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      isComplete
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    )}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isComplete ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                        )}
                      </svg>
                      {isComplete ? 'Complete' : 'Needs Review'}
                    </span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{getDurationLabel(topic.durationMinutes)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isFinalStep && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-md transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTopicExpansion(topicIndex)}
                    className="text-slate-400 hover:text-slate-600 p-2"
                  >
                    <svg
                      className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Topic Description */}
              {topic.description && (
                <div className="mb-3">
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {topic.description}
                  </p>
                </div>
              )}

              {/* Trainer Assignment Display */}
              {trainerName && (
                <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-emerald-800">{trainerName}</span>
                  </div>
                </div>
              )}

              {/* Review Checklist */}
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-amber-800">Review Status</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <svg className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      topic.description?.trim() ? 'text-emerald-600' : 'text-slate-300'
                    )} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={topic.description?.trim() ? 'text-slate-700' : 'text-slate-400'}>
                      Has Description
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      topic.durationMinutes && topic.durationMinutes > 0 ? 'text-emerald-600' : 'text-slate-300'
                    )} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={topic.durationMinutes && topic.durationMinutes > 0 ? 'text-slate-700' : 'text-slate-400'}>
                      Duration Set
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className={cn(
                      'h-3.5 w-3.5 flex-shrink-0',
                      trainerName ? 'text-emerald-600' : 'text-slate-300'
                    )} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className={trainerName ? 'text-slate-700' : 'text-slate-400'}>
                      Trainer Assigned
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                type="button"
                onClick={() => toggleTopicExpansion(topicIndex)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <svg
                  className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {isExpanded ? 'Hide' : 'Show'} details
              </button>
            </div>

            {/* Expanded View */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4 bg-slate-50">
                {/* Section Details */}
                {section && (
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold text-slate-900">{section.title}</h4>
                      <p className="text-sm text-slate-600 whitespace-pre-line mt-1">{section.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {section.type}
                      </span>
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {sessionBuilderService.formatDuration(section.duration)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Trainer Tasks */}
                {trainerTasks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-slate-700">
                      Trainer Tasks ({trainerTasks.length})
                    </h5>
                    <ul className="space-y-1.5">
                      {trainerTasks.map((task, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Learning Objectives */}
                {section?.learningObjectives && section.learningObjectives.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h5 className="text-xs font-semibold text-blue-900 mb-1">Learning Objectives:</h5>
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

                {/* Materials */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-slate-700">
                      Materials Needed ({materials.length})
                    </h5>
                    <ul className="space-y-1.5">
                      {materials.map((material, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Additional Details */}
                <div className="space-y-3">
                  {topic.learningOutcomes && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                        Trainer Goal
                      </h5>
                      <p className="text-sm text-slate-700">{topic.learningOutcomes}</p>
                    </div>
                  )}

                  {topic.callToAction && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                        Call to Action
                      </h5>
                      <p className="text-sm text-slate-700">{topic.callToAction}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onDuplicateSection(section?.id || `topic-${topicIndex}`)}
          className="mt-4 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
          title="Duplicate topic"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              {isFinalStep ? 'Final Review & Publish' : 'Review Your Session'}
            </h2>
            <p className="text-sm text-slate-700 mb-4">
              {isFinalStep
                ? 'Review your complete session one final time before publishing. All topics should be complete with trainers assigned.'
                : 'Review each topic to ensure completeness. Expand topics to check detailed content and trainer assignments.'
              }
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-slate-700">
                  {topicsWithSections.length} topic{topicsWithSections.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-md',
                completedCount === totalTopics ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              )}>
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">
                  {completedCount === totalTopics ? 'All complete' : `${completedCount}/${totalTopics} complete`}
                </span>
              </div>

              <div className={cn(
                'flex items-center gap-2 px-3 py-1 rounded-md',
                getReadinessColor()
              )}>
                <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-medium">
                  {readinessScore}% {getReadinessMessage()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Completion Progress</span>
            <span className="text-sm text-slate-600">{completedCount}/{totalTopics} topics complete</span>
          </div>
          <Progress value={completionProgress} className="h-2" />
        </div>
      </div>

      {/* Priority Alert */}
      {completedCount < totalTopics && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Topics Need Attention</h4>
              <p className="text-xs text-amber-800">
                {totalTopics - completedCount} topic{totalTopics - completedCount === 1 ? '' : 's'} still need review.
                {isFinalStep ? ' Complete all topics before publishing.' : ' Ensure all topics are complete before proceeding to publish.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Drag Instructions */}
      {topicsWithSections.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
          </svg>
          Drag topics to reorder them for final review
        </div>
      )}

      {/* Topic Cards */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topics-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50/50 rounded-lg p-2' : ''
              }`}
            >
              {topicsWithSections.length > 0 ? (
                topicsWithSections.map((topicWithSection, index) => (
                  <Draggable
                    key={topicWithSection.topicIndex}
                    draggableId={`topic-${topicWithSection.topicIndex}`}
                    index={index}
                  >
                    {(providedDraggable, snapshotDraggable) => (
                      <TopicCard
                        topicWithSection={topicWithSection}
                        provided={providedDraggable}
                        snapshot={snapshotDraggable}
                      />
                    )}
                  </Draggable>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
                  <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-slate-600 mb-4">No topics to review</p>
                  <Button onClick={handleQuickAdd}>
                    Add Topics
                  </Button>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Section Button */}
      {topicsWithSections.length > 0 && !isFinalStep && (
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2">
        <Button
          onClick={onEdit}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Edit
        </Button>
        {onPublish && (
          <Button
            onClick={onPublish}
            disabled={isPublishing || isPublished || completedCount < totalTopics}
            size="lg"
            className={cn(
              'w-full sm:w-auto',
              completedCount === totalTopics
                ? 'bg-green-600 hover:bg-green-700 text-lg px-8'
                : 'bg-slate-400 cursor-not-allowed'
            )}
          >
            {isPublishing ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Publishing...
              </>
            ) : isPublished ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Published
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isFinalStep ? 'Publish Session' : 'Continue to Finalize'}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};