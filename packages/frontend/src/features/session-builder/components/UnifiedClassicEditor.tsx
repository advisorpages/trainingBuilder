import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button, Card, CardContent, Progress } from '../../../ui';
import { TrainerSelect } from '../../../components/ui/TrainerSelect';
import { MultiTrainerSelect } from '../../../components/ui/MultiTrainerSelect';
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
  onTopicsChange: (topics: SessionTopicDraft[]) => Promise<void> | void;
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
  onTopicsChange,
}) => {
  const [editingSection, setEditingSection] = React.useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set());
  const trainerCache = React.useRef(new Map<number, Trainer>());
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

      return {
        topic,
        topicIndex: index,
        section: associatedSection,
        trainerId, // Legacy single trainer
        trainerIds: allTrainerIds, // New multiple trainers
        trainerName, // Legacy single trainer name
        trainerNames, // New multiple trainer names
        isAssigned: allTrainerIds.length > 0,
      };
    });
  }, [topics, outline.sections, sectionsById, resolvedTrainerNames]);

  // Calculate assignment statistics
  const totalTopics = topicsWithSections.length;
  const assignedCount = topicsWithSections.filter(item => item.isAssigned).length;
  const unassignedCount = totalTopics - assignedCount;
  const assignmentProgress = totalTopics > 0 ? (assignedCount / totalTopics) * 100 : 0;

  // Resolve trainer names
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
          const trainer = await trainerService.getTrainer(trainerId);
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

  const handleMultipleTrainerChange = React.useCallback(async (topicIndex: number, trainers: Trainer[]) => {
    // Update cache and resolved names for all selected trainers
    trainers.forEach(trainer => {
      trainerCache.current.set(trainer.id, trainer);
      setResolvedTrainerNames((prev) => ({
        ...prev,
        [trainer.id]: trainer.name,
      }));
    });

    const primaryTrainer = trainers[0] ?? null;
    const trainerIds = trainers.map(t => t.id);

    // Update the topic with multiple trainer IDs
    const updatedTopics = [...topics];
    if (updatedTopics[topicIndex]) {
      updatedTopics[topicIndex] = {
        ...updatedTopics[topicIndex],
        trainerIds,
        trainerId: primaryTrainer?.id ?? undefined, // Maintain primary trainer for compatibility
        trainerName: primaryTrainer?.name ?? undefined,
      };
      void Promise.resolve(onTopicsChange(updatedTopics));

      // Update associated outline sections so primary trainer persists server-side
      const targetTopic = updatedTopics[topicIndex];
      let matchingSections: FlexibleSessionSection[] = [];
      if (targetTopic.sectionId) {
        const matched = outline.sections.find(section => section.id === targetTopic.sectionId);
        if (matched) {
          matchingSections = [matched];
        }
      }

      if (matchingSections.length === 0) {
        matchingSections = outline.sections.filter((section) => {
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

      matchingSections.forEach((section) => {
        onUpdateSection(section.id, {
          trainerId: primaryTrainer?.id ?? undefined,
          trainerName: primaryTrainer?.name ?? undefined,
        });
      });
    }
  }, [topics, outline.sections, onTopicsChange, onUpdateSection]);

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

    void Promise.resolve(onTopicsChange(items));
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

  const TopicCard: React.FC<{
    topicWithSection: TopicWithSection;
    provided: any;
    snapshot: any;
  }> = ({ topicWithSection, provided, snapshot }) => {
    const { topic, topicIndex, section, trainerId, trainerIds, trainerName, trainerNames, isAssigned } = topicWithSection;
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
                        isAssigned
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      )}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isAssigned ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
                          )}
                        </svg>
                        {isAssigned
                          ? `${trainerNames?.length || 1} trainer${(trainerNames?.length || 1) > 1 ? 's' : ''} assigned`
                          : 'Trainer Optional'
                        }
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
                    <button
                      type="button"
                      onClick={() => setEditingSection(section?.id || '')}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-md transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
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

                {/* Expanded View */}
                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 bg-slate-50">
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
                      <div className="space-y-4">
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
                )}
              </div>

              {/* Right Column - Trainer Assignment (20%) */}
              <div className="lg:col-span-1 border-l border-slate-200 bg-slate-50 p-4">
                <div className="h-fit sticky top-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="h-4 w-4 flex-shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Trainer Assignment
                    </h4>
                  </div>

                  {(trainerNames?.length > 0 || trainerName) && (
                    <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMultipleTrainerChange(topicIndex, [])}
                            className="text-rose-500 hover:text-rose-700 h-6 px-2 text-xs"
                          >
                            Clear All
                          </Button>
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

                  {/* Trainer Assignment */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Assign Trainers (Optional)
                    </label>
                    <MultiTrainerSelect
                      value={trainerIds || []}
                      onChange={(trainers) => handleMultipleTrainerChange(topicIndex, trainers)}
                      placeholder="Select one or more trainers..."
                      className="w-full text-sm"
                      allowUnassigned={true}
                      maxSelections={5} // Limit to 5 trainers per topic
                    />
                    <p className="text-xs text-slate-500">
                      Assign multiple trainers to collaborate on this topic (max 5)
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Edit Content & Assign Trainers</h2>
            <p className="text-sm text-slate-700 mb-4">
              Edit your topic content and optionally assign trainers to each topic.
              Trainer assignment is optional and can be done later.
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
                unassignedCount === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              )}>
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">
                  {unassignedCount === 0 ? 'All assigned' : `${assignedCount} assigned`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Trainer Assignment</span>
            <span className="text-sm text-slate-600">{assignedCount}/{totalTopics} assigned</span>
          </div>
          <Progress value={assignmentProgress} className="h-2" />
        </div>
      </div>

      {/* Info Box */}
      {unassignedCount > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-slate-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">Trainer Assignment</h4>
              <p className="text-xs text-slate-700">
                {unassignedCount} topic{unassignedCount === 1 ? '' : 's'} don't have trainers assigned yet.
                You can proceed without assigning trainers or assign them now for better organization.
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
          Drag topics to reorder them
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
                  <p className="text-sm text-slate-600 mb-4">No topics added yet</p>
                  <Button onClick={handleQuickAdd}>
                    Add Your First Topic
                  </Button>
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

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
