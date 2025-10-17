import * as React from 'react';
import { Button, Card, CardContent, Progress } from '../../../ui';
import { Trainer } from '@leadership-training/shared';
import { FlexibleSessionSection, SectionType, SessionOutline } from '../../../services/session-builder.service';
import { trainerService } from '../../../services/trainer.service';
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
  onTopicsChange: (topics: SessionTopicDraft[]) => Promise<void> | void;
  isPublishing?: boolean;
  isPublished?: boolean;
  isFinalStep?: boolean;
  primaryActionLabel?: string;
  primaryActionBusyLabel?: string;
  primaryActionSuccessLabel?: string;
  isPrimaryActionBusy?: boolean;
  isPrimaryActionComplete?: boolean;
  disablePrimaryAction?: boolean;
  requireTopicsForPrimaryAction?: boolean;
  primaryActionClassName?: string;
}

interface TopicWithSection {
  topic: SessionTopicDraft;
  topicIndex: number;
  section?: FlexibleSessionSection;
  trainerId?: number; // Legacy single trainer
  trainerIds?: number[]; // New multiple trainers
  trainerName?: string; // Legacy single trainer name
  trainerNames?: string[]; // New multiple trainer names
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
  primaryActionLabel,
  primaryActionBusyLabel,
  primaryActionSuccessLabel,
  isPrimaryActionBusy,
  isPrimaryActionComplete,
  disablePrimaryAction,
  requireTopicsForPrimaryAction = true,
  primaryActionClassName,
}) => {
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set());
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const trainerCache = React.useRef(new Map<number, any>());
  const [resolvedTrainerNames, setResolvedTrainerNames] = React.useState<Record<number, string>>({});

  const handleQuickAdd = React.useMemo(() => onOpenQuickAdd || (() => undefined), [onOpenQuickAdd]);

  const sectionsById = React.useMemo(() => {
    const map = new Map<string, FlexibleSessionSection>();
    outline.sections.forEach(section => {
      if (section?.id) {
        map.set(section.id, section);
      }
    });
    return map;
  }, [outline.sections]);

  // Combine topics with their corresponding sections
  const topicsWithSections = React.useMemo<TopicWithSection[]>(() => {
    return (topics ?? []).map((topic, index) => {
      const normalizedTitle = topic.title?.trim().toLowerCase();
      let associatedSection: FlexibleSessionSection | undefined =
        (topic.sectionId ? sectionsById.get(topic.sectionId) : undefined) ?? undefined;

      if (!associatedSection) {
        associatedSection = outline.sections.find((section) => {
          if (section.type !== 'topic') return false;
          if (topic.topicId && section.associatedTopic?.id) {
            return section.associatedTopic.id === topic.topicId;
          }
          if (!normalizedTitle) {
            return false;
          }
          const associatedTitle = section.associatedTopic?.name?.trim().toLowerCase();
          const sectionTitle = section.title?.trim().toLowerCase();
          return associatedTitle === normalizedTitle || sectionTitle === normalizedTitle;
        });
      }

      // Support both legacy single trainer and new multiple trainers
      const trainerIds = topic.trainerIds || [];
      const trainerId = topic.trainerId ?? associatedSection?.trainerId ?? undefined;

      // If using legacy single trainer, convert to array
      const allTrainerIds = trainerIds.length > 0 ? trainerIds : (trainerId ? [trainerId] : []);

      const trainerNames = allTrainerIds.map(id => resolvedTrainerNames[id]).filter(Boolean);
      const trainerName = topic.trainerName
        ?? associatedSection?.trainerName
        ?? (trainerId ? resolvedTrainerNames[trainerId] : undefined);

      // Check if topic is complete (has description, duration, and trainer)
      // Note: Trainer assignment is nice to have but not required for completion
      const isComplete = !!(
        topic.description?.trim() &&
        topic.durationMinutes &&
        topic.durationMinutes > 0
      );

      return {
        topic,
        topicIndex: index,
        section: associatedSection,
        trainerId, // Legacy single trainer
        trainerIds: allTrainerIds, // New multiple trainers
        trainerName, // Legacy single trainer name
        trainerNames, // New multiple trainer names
        isAssigned: allTrainerIds.length > 0,
        isComplete,
      };
    });
  }, [topics, outline.sections, resolvedTrainerNames]);

  // Resolve trainer names (same as step 2)
  React.useEffect(() => {
    const missingIds = new Set<number>();

    topicsWithSections.forEach((item) => {
      if (item.trainerIds) {
        item.trainerIds.forEach(id => {
          if (!resolvedTrainerNames[id] && !trainerCache.current.has(id)) {
            missingIds.add(id);
          }
        });
      } else if (item.trainerId && !item.trainerName && !trainerCache.current.has(item.trainerId)) {
        missingIds.add(item.trainerId);
      }
    });

    if (!missingIds.size) {
      return;
    }

    let cancelled = false;

    const loadMissing = async () => {
      await Promise.all(Array.from(missingIds).map(async (trainerId) => {
        try {
          // Use the proper trainerService to get individual trainer
          const trainer = await trainerService.getTrainer(trainerId);
          if (trainer && !cancelled) {
            trainerCache.current.set(trainer.id, trainer);
            setResolvedTrainerNames((prev) => {
              if (prev[trainer.id] === trainer.name) {
                return prev;
              }
              return {
                ...prev,
                [trainer.id]: trainer.name,
              };
            });
          }
        } catch (error) {
          console.error('UnifiedReviewEditor: failed to resolve trainer', error);
        }
      }));
    };

    void loadMissing();
    return () => {
      cancelled = true;
    };
  }, [topicsWithSections]);

  // Calculate statistics
  const totalTopics = topicsWithSections.length;
  const assignedCount = topicsWithSections.filter(item => item.isAssigned).length;
  const completedCount = topicsWithSections.filter(item => item.isComplete).length;
  const completionProgress = totalTopics > 0 ? (completedCount / totalTopics) * 100 : 0;
  const topicsComplete = totalTopics === 0 || completedCount === totalTopics;
  const primaryBusy = isPrimaryActionBusy ?? isPublishing;
  const primaryComplete = isPrimaryActionComplete ?? isPublished;
  const primaryDisabledExplicit = disablePrimaryAction ?? false;
  const topicsGateFailed = requireTopicsForPrimaryAction && !topicsComplete;
  const primaryDisabled =
    primaryDisabledExplicit || primaryBusy || primaryComplete || topicsGateFailed;
  const showActiveStyle = topicsComplete && !primaryDisabledExplicit && !primaryBusy && !primaryComplete;

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
  }> = ({ topicWithSection }) => {
    const { topic, topicIndex, section, trainerId, trainerIds, trainerName, trainerNames, isComplete, isAssigned } = topicWithSection;
    const isExpanded = expandedTopics.has(topicIndex);

    const parseBulletList = (value?: string | string[] | null): string[] => {
      if (!value) {
        return [];
      }

      if (Array.isArray(value)) {
        return value
          .map((item) => String(item || '').replace(/^•\s*/, '').trim())
          .filter(Boolean);
      }

      return String(value || '')
        .split('\n')
        .map((item) => item.replace(/^•\s*/, '').trim())
        .filter(Boolean);
    };

    const trainerTasks = parseBulletList(section?.trainerNotes || topic.trainerNotes);
    const materials = parseBulletList(section?.materialsNeeded || topic.materialsNeeded);

    return (
      <div className="space-y-4">
        {/* Topic Number Badge */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {topicIndex + 1}
          </div>
        </div>

        {/* Topic Card */}
        <div className="rounded-lg border-2 border-slate-300 bg-white shadow-md hover:shadow-lg hover:border-blue-400 transition-all">
          {/* Main Content Grid - 80/20 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
            {/* Left Column - Topic Content (80%) */}
            <div className="lg:col-span-4 p-5">
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
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    )}>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isComplete ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {isComplete ? 'Complete' : 'Incomplete'}
                    </span>
                    {isAssigned && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {trainerNames?.length || 1} trainer{(trainerNames?.length || 1) > 1 ? 's' : ''}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">{getDurationLabel(topic.durationMinutes)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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

    
              {/* Incomplete Topic Indicator */}
              {!isComplete && (
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">
                      {!topic.description?.trim() && 'Needs description'}
                      {(!topic.durationMinutes || topic.durationMinutes <= 0) && topic.description?.trim() && 'Needs duration'}
                      {!topic.description?.trim() && (!topic.durationMinutes || topic.durationMinutes <= 0) && 'Needs description and duration'}
                    </span>
                  </div>
                </div>
              )}

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
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4 bg-slate-50 lg:col-span-4">
                {/* Learning Objectives */}
                {section?.learningObjectives && section.learningObjectives.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h5 className="text-xs font-semibold text-blue-900 mb-2">Learning Objectives</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      {section.learningObjectives.map((obj, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Materials Needed */}
                {materials.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                    <h5 className="text-xs font-semibold text-amber-900 mb-2">Materials Needed</h5>
                    <ul className="text-xs text-amber-800 space-y-1">
                      {materials.map((material, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-amber-600">•</span>
                          <span>{material}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trainer Notes */}
                {trainerTasks.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3">
                    <h5 className="text-xs font-semibold text-emerald-900 mb-2">Trainer Notes</h5>
                    <ul className="text-xs text-emerald-800 space-y-1">
                      {trainerTasks.map((task, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-emerald-600">•</span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Topic Details Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {topic.learningOutcomes && (
                    <div>
                      <span className="font-semibold text-slate-500">Desired Outcome:</span>
                      <p className="text-slate-700 mt-1">{topic.learningOutcomes}</p>
                    </div>
                  )}
                  {topic.callToAction && (
                    <div>
                      <span className="font-semibold text-slate-500">Activities:</span>
                      <p className="text-slate-700 mt-1">{topic.callToAction}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Column - Trainer Assignment (20%) */}
            <div className="lg:col-span-1 border-l border-slate-200 bg-slate-50 p-4">
              <div className="h-fit">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="h-4 w-4 flex-shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Trainer Assignment
                  </h4>
                </div>

                {(trainerNames?.length > 0 || trainerName) && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-emerald-800">
                          {trainerNames?.length > 0
                            ? `${trainerNames.length} trainer${trainerNames.length > 1 ? 's' : ''} assigned`
                            : trainerName
                          }
                        </span>
                      </div>
                      {trainerNames && trainerNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {trainerNames.map((name, index) => (
                            <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded">
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isAssigned && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-600">
                        No trainer assigned
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
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
              {isFinalStep ? 'Final Review & Publish' : 'Session Summary'}
            </h2>
            <p className="text-sm text-slate-700 mb-4">
              {isFinalStep
                ? 'Review your complete session before publishing. Make sure everything looks correct.'
                : 'Here\'s a summary of your session. Review all details before proceeding.'
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
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {completedCount < totalTopics && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">Topic Completion</span>
              <span className="text-sm text-slate-600">{completedCount}/{totalTopics} topics complete</span>
            </div>
            <Progress value={completionProgress} className="h-2" />
          </div>
        )}
      </div>

  
    
      {/* Topic Cards */}
      <div className="space-y-4">
        {topicsWithSections.length > 0 ? (
          topicsWithSections.map((topicWithSection) => (
            <TopicCard
              key={topicWithSection.topicIndex}
              topicWithSection={topicWithSection}
            />
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
      </div>

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
            disabled={primaryDisabled}
            size="lg"
            className={cn(
              'w-full sm:w-auto',
              showActiveStyle
                ? 'bg-green-600 hover:bg-green-700 text-lg px-8'
                : 'bg-slate-400 cursor-not-allowed',
              primaryActionClassName
            )}
          >
            {primaryBusy ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                {primaryActionBusyLabel ??
                  (isFinalStep ? 'Publishing...' : 'Saving...')}
              </>
            ) : primaryComplete ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {primaryActionSuccessLabel ??
                  (isFinalStep ? 'Published' : 'Saved')}
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {primaryActionLabel ??
                  (isFinalStep ? 'Publish Session' : 'Continue to Finalize')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
