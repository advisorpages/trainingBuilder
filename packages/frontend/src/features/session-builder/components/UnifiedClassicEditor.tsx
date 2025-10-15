import * as React from 'react';
import { Button, Card, CardContent, Progress } from '../../../ui';
import { TrainerSelect } from '../../../components/ui/TrainerSelect';
import { TrainerGridSelector } from '../../../components/ui/TrainerGridSelector';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../../services/trainer.service';
import { FlexibleSessionSection, SectionType, SessionOutline, sessionBuilderService } from '../../../services/session-builder.service';
import { SessionMetadata, SessionTopicDraft } from '../state/types';
import { cn } from '../../../lib/utils';

interface UnifiedClassicEditorProps {
  outline: SessionOutline;
  topics: SessionTopicDraft[];
  onUpdateSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => void;
  onAddSection: (type: SectionType) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onDuplicateSection: (sectionId: string) => void;
  onUpdateMetadata: (updates: Partial<SessionMetadata>) => void;
  onOpenQuickAdd?: () => void;
  onAssignTrainer: (topicIndex: number, trainer: { id: number; name: string } | null) => Promise<void> | void;
}

interface TopicWithSection {
  topic: SessionTopicDraft;
  topicIndex: number;
  section?: FlexibleSessionSection;
  trainerId?: number;
  trainerName?: string;
  isAssigned: boolean;
}

const getDurationLabel = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Duration TBD';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainder} min`;
};

export const UnifiedClassicEditor: React.FC<UnifiedClassicEditorProps> = ({
  outline,
  topics,
  onUpdateSection,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  onUpdateMetadata,
  onOpenQuickAdd,
  onAssignTrainer,
}) => {
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set());
  const trainerCache = React.useRef(new Map<number, Trainer>());
  const [resolvedTrainerNames, setResolvedTrainerNames] = React.useState<Record<number, string>>({});

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
      const trainerName = associatedSection?.trainerName ?? (trainerId ? resolvedTrainerNames[trainerId] : undefined);

      return {
        topic,
        topicIndex: index,
        section: associatedSection,
        trainerId,
        trainerName,
        isAssigned: Boolean(trainerId),
      };
    });
  }, [topics, outline.sections, resolvedTrainerNames]);

  // Calculate assignment statistics
  const totalTopics = topicsWithSections.length;
  const assignedCount = topicsWithSections.filter(item => item.isAssigned).length;
  const unassignedCount = totalTopics - assignedCount;
  const assignmentProgress = totalTopics > 0 ? (assignedCount / totalTopics) * 100 : 0;

  // Resolve trainer names
  React.useEffect(() => {
    const missing = topicsWithSections.filter(
      (item) => item.trainerId && !item.trainerName && !trainerCache.current.has(item.trainerId!),
    );
    if (!missing.length) {
      return;
    }

    let cancelled = false;

    const loadMissing = async () => {
      await Promise.all(missing.map(async (item) => {
        if (!item.trainerId) return;
        try {
          const trainer = await trainerService.getTrainer(item.trainerId);
          if (cancelled) return;
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
        } catch (error) {
          console.error('UnifiedClassicEditor: failed to resolve trainer', error);
        }
      }));
    };

    void loadMissing();
    return () => {
      cancelled = true;
    };
  }, [topicsWithSections]);

  const handleTrainerChange = React.useCallback(async (topicIndex: number, trainer: Trainer | null) => {
    if (trainer) {
      trainerCache.current.set(trainer.id, trainer);
      setResolvedTrainerNames((prev) => ({
        ...prev,
        [trainer.id]: trainer.name,
      }));
    }
    const trainerPayload = trainer
      ? { id: trainer.id, name: trainer.name }
      : null;
    await onAssignTrainer(topicIndex, trainerPayload);
  }, [onAssignTrainer]);

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

  const TopicCard: React.FC<{ topicWithSection: TopicWithSection }> = ({ topicWithSection }) => {
    const { topic, topicIndex, section, trainerId, trainerName, isAssigned } = topicWithSection;
    const isExpanded = expandedTopics.has(topicIndex);
    const isEditing = section && editingSection === section.id;

    const [localTitle, setLocalTitle] = React.useState(section?.title || topic.title);
    const [localDescription, setLocalDescription] = React.useState(section?.description || topic.description);
    const [localDuration, setLocalDuration] = React.useState(section?.duration || topic.durationMinutes || 20);

    // Reset local state when data changes
    React.useEffect(() => {
      setLocalTitle(section?.title || topic.title);
      setLocalDescription(section?.description || topic.description);
      setLocalDuration(section?.duration || topic.durationMinutes || 20);
    }, [section?.title, section?.description, section?.duration, topic.title, topic.description, topic.durationMinutes]);

    const handleSave = () => {
      if (!section) return;
      onUpdateSection(section.id, {
        title: localTitle,
        description: localDescription,
        duration: localDuration,
      });
      setEditingSection(null);
    };

    const handleCancel = () => {
      setLocalTitle(section?.title || topic.title);
      setLocalDescription(section?.description || topic.description);
      setLocalDuration(section?.duration || topic.durationMinutes || 20);
      setEditingSection(null);
    };

    return (
      <Card className={cn(
        'border-2 transition-all duration-200',
        isAssigned
          ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white'
          : 'border-rose-200 bg-gradient-to-br from-rose-50/50 to-white',
        !isAssigned && unassignedCount > 0 && 'ring-2 ring-rose-400 ring-opacity-50'
      )}>
        <CardContent className="p-6">
          {/* Main Content Grid - 80/20 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Topic Content (80%) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    {section ? getIconForSection(section) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-lg text-blue-600">📚</span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {topicIndex + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {topic.title || `Topic ${topicIndex + 1}`}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        isAssigned
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-100 text-rose-600 border border-rose-200'
                      )}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isAssigned ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                          )}
                        </svg>
                        {isAssigned ? 'Trainer Assigned' : 'Needs Trainer'}
                      </span>
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {getDurationLabel(topic.durationMinutes)}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleTopicExpansion(topicIndex)}
                  className="text-slate-400 hover:text-slate-600"
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

              {/* Topic Description */}
              {topic.description && (
                <p className="text-sm text-slate-600 line-clamp-2">
                  {topic.description}
                </p>
              )}

              {/* Expandable Content Section */}
              {isExpanded && section && (
                <div className="border-t border-slate-200 pt-4">
                  {isEditing ? (
                    // Edit Mode
                    <div className="space-y-4">
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
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-3">
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

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingSection(section.id)}
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Content
                        </Button>
                      </div>

                      {/* Additional section properties preview */}
                      {section.learningObjectives && section.learningObjectives.length > 0 && (
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
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Trainer Assignment (20%) */}
            <div className="lg:col-span-1">
              <div className={cn(
                'rounded-lg p-4 border-2 h-fit sticky top-6',
                isAssigned
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-rose-200 bg-rose-50/70'
              )}>
                <div className="flex items-center gap-2 mb-3">
                  <svg className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isAssigned ? 'text-emerald-600' : 'text-rose-600'
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-slate-900">
                Assign Trainer
                  </h4>
                </div>

                {!isAssigned && unassignedCount > 0 && (
                  <div className="mb-3 p-2 bg-rose-100 rounded border border-rose-200">
                    <span className="text-xs font-medium text-rose-700 block text-center">
                      Priority Assignment
                    </span>
                  </div>
                )}

                {isAssigned && trainerName && (
                  <div className="mb-3 p-2 bg-white rounded border border-emerald-200">
                    <div className="text-center">
                      <span className="text-sm font-medium text-emerald-800 block truncate">{trainerName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTrainerChange(topicIndex, null)}
                        className="text-rose-500 hover:text-rose-700 h-6 px-2 mt-1 w-full text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                <TrainerSelect
                  value={trainerId || ''}
                  onChange={(trainer) => handleTrainerChange(topicIndex, trainer)}
                  placeholder={isAssigned ? 'Change trainer...' : 'Assign trainer...'}
                  className="w-full text-sm"
                />
              </div>

              {/* Mobile Expand Button */}
              <div className="lg:hidden mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTopicExpansion(topicIndex)}
                  className="w-full"
                >
                  {isExpanded ? 'Collapse Details' : 'Expand Details'}
                  <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 mt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              {section && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDuplicateSection(section.id)}
                    className="text-green-600 hover:text-green-700 text-xs px-2 py-1"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Duplicate</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {topicIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveSection(section.id, 'up')}
                        className="p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </Button>
                    )}
                    {topicIndex < topicsWithSections.length - 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveSection(section.id, 'down')}
                        className="p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>

            {!isExpanded && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleTopicExpansion(topicIndex)}
                className="px-3"
              >
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="hidden sm:inline">Edit Details</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Assign Trainers & Edit Content</h2>
            <p className="text-sm text-slate-700 mb-4">
              Start by assigning trainers to each topic, then expand topics to edit detailed content.
              Cards highlighted in red need trainer assignment.
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
                unassignedCount === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              )}>
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">
                  {unassignedCount === 0 ? 'All assigned' : `${unassignedCount} need${unassignedCount === 1 ? 's' : ''} assignment`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Assignment Progress</span>
            <span className="text-sm text-slate-600">{assignedCount}/{totalTopics} assigned</span>
          </div>
          <Progress value={assignmentProgress} className="h-2" />
        </div>
      </div>

      {/* Priority Alert */}
      {unassignedCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Trainer Assignment Needed</h4>
              <p className="text-xs text-amber-800">
                {unassignedCount} topic{unassignedCount === 1 ? '' : 's'} still need trainer assignments.
                Assign trainers before editing content for the best workflow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Topic Cards */}
      <div className="space-y-4">
        {topicsWithSections.length > 0 ? (
          topicsWithSections.map((topicWithSection) => (
            <TopicCard key={topicWithSection.topicIndex} topicWithSection={topicWithSection} />
          ))
        ) : (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
            <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-slate-600 mb-4">No topics added yet</p>
            <Button onClick={handleQuickAdd}>
              Add Your First Topic
            </Button>
          </div>
        )}
      </div>

      {/* Add Section Button */}
      {topicsWithSections.length > 0 && (
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