import * as React from 'react';
import { Button } from '../../../ui';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Trainer } from '@leadership-training/shared';
import type { SessionTopicDraft, SessionMetadata } from '../state/types';
import { FlexibleSessionSection } from '../../../services/session-builder.service';
import { trainerService } from '../../../services/trainer.service';
import { cn } from '../../../lib/utils';
import type { DropResult, DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';
import { SessionDetailsSection } from './SessionDetailsSection';
import { EditModeGuard, useCanEdit } from '../../../components/EditModeGuard';

interface TrainerAndTopicAssignmentStepProps {
  topics: SessionTopicDraft[];
  sections: FlexibleSessionSection[];
  metadata: SessionMetadata;
  onTopicsChange: (topics: SessionTopicDraft[]) => Promise<void> | void;
  onUpdateSection: (sectionId: string, updates: Partial<FlexibleSessionSection>) => void;
  onAddSection: (type: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onUpdateMetadata: (updates: Partial<SessionMetadata>) => void;
}

const getDurationLabel = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Duration TBD';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainder} min`;
};

export const TrainerAndTopicAssignmentStep: React.FC<TrainerAndTopicAssignmentStepProps> = ({
  topics,
  sections,
  metadata,
  onTopicsChange,
  onUpdateSection,
  onAddSection,
  onDeleteSection,
  onMoveSection,
  onUpdateMetadata,
}) => {
  const canEdit = useCanEdit();
  const [editingTopicIndex, setEditingTopicIndex] = React.useState<number | null>(null);
  const [editingTopic, setEditingTopic] = React.useState<SessionTopicDraft | null>(null);
  const [expandedTopics, setExpandedTopics] = React.useState<Set<number>>(new Set());
  const trainerCache = React.useRef(new Map<number, any>());
  const [resolvedTrainerNames, setResolvedTrainerNames] = React.useState<Record<number, string>>({});

  // Simplified trainer selection state
  const [allTrainers, setAllTrainers] = React.useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = React.useState(false);
  const [trainerError, setTrainerError] = React.useState<string | null>(null);

  // Local state to hold topic trainers to prevent parent overrides
  const [topicTrainers, setTopicTrainers] = React.useState<Record<string, number>>({});

  const getTopicStateKey = React.useCallback((topic: SessionTopicDraft | undefined, index: number) => {
    if (!topic) {
      return `index-${index}`;
    }
    if (topic.sectionId) {
      return `section-${topic.sectionId}`;
    }
    if (topic.topicId) {
      return `topic-${topic.topicId}-${index}`;
    }
    if (topic.title) {
      return `title-${topic.title.trim().toLowerCase()}-${index}`;
    }
    return `index-${index}`;
  }, []);

  // Simplified trainer fetching function using the proper trainerService
  const fetchAllTrainers = React.useCallback(async () => {
    setIsLoadingTrainers(true);
    setTrainerError(null);
    try {
      const response = await trainerService.getTrainers({ limit: 100 });
      const trainers = response.trainers;

      setAllTrainers(trainers);

      // Update trainer cache and resolved names
      const newResolvedNames: Record<number, string> = {};
      trainers.forEach(trainer => {
        trainerCache.current.set(trainer.id, trainer);
        newResolvedNames[trainer.id] = trainer.name;
      });
      setResolvedTrainerNames(prev => ({ ...prev, ...newResolvedNames }));
    } catch (error) {
      console.error('Failed to fetch trainers:', error);
      setTrainerError('Failed to load trainers');
    } finally {
      setIsLoadingTrainers(false);
    }
  }, []);

  // Fetch trainers on component mount
  React.useEffect(() => {
    void fetchAllTrainers();
  }, [fetchAllTrainers]);

  const handleAssignTrainer = React.useCallback((topicIndex: number, trainer: Trainer | null) => {
    const run = async () => {
      const topic = topics[topicIndex];
      const stateKey = getTopicStateKey(topic, topicIndex);

      if (!topic) {
        console.warn('TrainerAndTopicAssignmentStep: topic not found at index', topicIndex);
        return;
      }

      if (trainer) {
        setTopicTrainers(prev => ({ ...prev, [stateKey]: trainer.id }));
        trainerCache.current.set(trainer.id, trainer);
        setResolvedTrainerNames(prev => ({ ...prev, [trainer.id]: trainer.name }));
      } else {
        setTopicTrainers(prev => {
          const newTopicTrainers = { ...prev };
          delete newTopicTrainers[stateKey];
          return newTopicTrainers;
        });
      }

      const updatedTopics = topics.map((currentTopic, index) => {
        if (index === topicIndex) {
          return {
            ...currentTopic,
            trainerId: trainer ? trainer.id : undefined,
            trainerName: trainer ? trainer.name : undefined,
          };
        }
        return currentTopic;
      });

      await Promise.resolve(onTopicsChange(updatedTopics));

      // Also update the corresponding section in the outline if the topic has a sectionId
      if (topic.sectionId) {
        try {
          onUpdateSection(topic.sectionId, {
            trainerId: trainer?.id,
            trainerName: trainer?.name,
          });
        } catch (error) {
          console.error('Failed to update section with trainer assignment:', error);
        }
      }
    };

    void run();
  }, [topics, onTopicsChange, onUpdateSection, getTopicStateKey]);

  const handleTopicEdit = (topicIndex: number) => {
    setEditingTopicIndex(topicIndex);
    setEditingTopic({ ...topics[topicIndex] });
  };

  const handleTopicSave = React.useCallback(() => {
    if (editingTopicIndex !== null && editingTopic) {
      const updatedTopics = [...topics];
      updatedTopics[editingTopicIndex] = editingTopic;
      void Promise.resolve(onTopicsChange(updatedTopics));

      // Also update the corresponding section in the outline if the topic has a sectionId
      // and trainer information has changed
      const originalTopic = topics[editingTopicIndex];
      if (editingTopic.sectionId && (
        originalTopic.trainerId !== editingTopic.trainerId ||
        originalTopic.trainerName !== editingTopic.trainerName
      )) {
        try {
          onUpdateSection(editingTopic.sectionId, {
            trainerId: editingTopic.trainerId,
            trainerName: editingTopic.trainerName,
          });
        } catch (error) {
          console.error('Failed to update section with edited topic trainer info:', error);
        }
      }

      setEditingTopicIndex(null);
      setEditingTopic(null);
    }
  }, [editingTopic, editingTopicIndex, topics, onTopicsChange, onUpdateSection]);

  const handleTopicCancel = () => {
    setEditingTopicIndex(null);
    setEditingTopic(null);
  };

  const handleTopicFieldChange = (field: keyof SessionTopicDraft, value: any) => {
    if (editingTopic) {
      setEditingTopic({
        ...editingTopic,
        [field]: value,
      });
    }
  };

  const handleTopicReorder = React.useCallback(async (fromIndex: number, toIndex: number) => {
    // Prevent reordering if not in edit mode
    if (!canEdit) {
      console.warn('[TrainerAndTopicAssignmentStep] Reorder blocked - not in edit mode');
      return;
    }

    if (fromIndex === toIndex) {
      return;
    }

    console.log('🔄 [TrainerAndTopicAssignmentStep] Starting topic reorder:', { fromIndex, toIndex, canEdit });

    const updatedTopics = [...topics];
    const [movedTopic] = updatedTopics.splice(fromIndex, 1);
    updatedTopics.splice(toIndex, 0, movedTopic);

    if (movedTopic?.sectionId) {
      const steps = Math.abs(toIndex - fromIndex);
      const direction: 'up' | 'down' = toIndex > fromIndex ? 'down' : 'up';
      for (let step = 0; step < steps; step += 1) {
        try {
          await Promise.resolve(onMoveSection(movedTopic.sectionId!, direction));
        } catch (error) {
          console.error('[TrainerAndTopicAssignmentStep] Failed to reorder section', { error, movedTopic, direction });
          break;
        }
      }
    } else {
      console.warn('[TrainerAndTopicAssignmentStep] Topic missing sectionId during reorder', { movedTopic });
    }

    const realignedTopics = updatedTopics.map((topic, index) => ({
      ...topic,
      position: index + 1,
    }));

    await Promise.resolve(onTopicsChange(realignedTopics));
    console.log('✅ [TrainerAndTopicAssignmentStep] Topic reorder completed successfully');
  }, [topics, onMoveSection, onTopicsChange, canEdit]);

  const handleDragEnd = React.useCallback((result: DropResult) => {
    // Block drag operations if not in edit mode
    if (!canEdit) {
      console.warn('🚫 [TrainerAndTopicAssignmentStep] Drag operation blocked - not in edit mode');
      return;
    }

    console.log('🎯 Drag end triggered:', {
      source: { index: result.source.index, droppableId: result.source.droppableId },
      destination: result.destination ? { index: result.destination.index, droppableId: result.destination.droppableId } : null,
      draggableId: result.draggableId,
      canEdit
    });

    const { destination, source } = result;

    // Validate drag result
    if (!destination) {
      console.warn('🚫 Drag cancelled - no destination');
      return;
    }

    if (destination.index === source.index) {
      console.log('🚫 Drag cancelled - no movement needed (same index)');
      return;
    }

    if (destination.droppableId !== source.droppableId) {
      console.warn('🚫 Drag cancelled - different droppable containers');
      return;
    }

    // Validate indices are within bounds
    if (source.index < 0 || source.index >= topics.length ||
        destination.index < 0 || destination.index >= topics.length) {
      console.error('❌ Invalid drag indices:', {
        sourceIndex: source.index,
        destinationIndex: destination.index,
        topicsLength: topics.length
      });
      return;
    }

    console.log('📦 Reordering topic from', source.index, 'to', destination.index);
    console.log('📊 Topic being moved:', {
      topicId: topics[source.index]?.id,
      title: topics[source.index]?.title?.substring(0, 30),
      sectionId: topics[source.index]?.sectionId
    });

    try {
      void handleTopicReorder(source.index, destination.index);
    } catch (error) {
      console.error('❌ Error during topic reordering:', error);
      // Optional: Show user feedback about the error
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
    }
  }, [handleTopicReorder, topics.length, canEdit]);

  const handleTopicDelete = (topicIndex: number) => {
    const updatedTopics = topics.filter((_, index) => index !== topicIndex);
    void Promise.resolve(onTopicsChange(updatedTopics));
  };

  // Helper function to ensure topics have stable IDs
  const ensureTopicHasStableId = React.useCallback((topic: SessionTopicDraft): SessionTopicDraft => {
    if (!topic.id) {
      console.log('🔧 Assigning stable ID to topic:', topic.title);
      return {
        ...topic,
        id: crypto.randomUUID()
      };
    }
    return topic;
  }, []);

  // Comprehensive topic validation on mount and when topics change
  React.useEffect(() => {
    console.log('🔍 [TopicValidation] Starting comprehensive topic validation...');

    const validationResults = {
      totalTopics: topics.length,
      topicsWithoutIds: 0,
      topicsWithoutSectionIds: 0,
      duplicateIds: [] as string[],
      orphanedTopics: [] as number[],
      idSectionMismatch: [] as number[]
    };

    const idMap = new Map<string, number>();
    const sectionIdMap = new Map<string, number>();

    topics.forEach((topic, index) => {
      // Check for missing ID
      if (!topic.id) {
        validationResults.topicsWithoutIds++;
        console.warn(`⚠️ Topic at index ${index} missing ID:`, topic.title);
      } else {
        // Check for duplicate IDs
        if (idMap.has(topic.id)) {
          validationResults.duplicateIds.push(topic.id);
          console.warn(`⚠️ Duplicate ID found: ${topic.id} at indices ${idMap.get(topic.id)} and ${index}`);
        } else {
          idMap.set(topic.id, index);
        }
      }

      // Check for missing sectionId
      if (!topic.sectionId) {
        validationResults.topicsWithoutSectionIds++;
        console.warn(`⚠️ Topic at index ${index} missing sectionId:`, topic.title);
      } else {
        // Check for duplicate sectionIds
        if (sectionIdMap.has(topic.sectionId)) {
          console.warn(`⚠️ Duplicate sectionId found: ${topic.sectionId} at indices ${sectionIdMap.get(topic.sectionId)} and ${index}`);
        } else {
          sectionIdMap.set(topic.sectionId, index);
        }
      }

      // Check ID/sectionId consistency (both should be present for existing topics)
      if (topic.id && topic.sectionId) {
        const expectedSectionId = topic.id;
        const hasMatchingSectionId = topic.sectionId === expectedSectionId ||
                                    topic.sectionId === `existing-topic-${topic.topicId}`;

        if (!hasMatchingSectionId) {
          validationResults.idSectionMismatch.push(index);
          console.warn(`⚠️ ID/sectionId mismatch at index ${index}:`, {
            topicId: topic.id,
            sectionId: topic.sectionId,
            topicDbId: topic.topicId,
            title: topic.title?.substring(0, 50)
          });
        }
      }
    });

    console.log('📊 [TopicValidation] Validation results:', validationResults);

    // Auto-fix topics without IDs
    if (validationResults.topicsWithoutIds > 0) {
      console.log('🔧 Auto-fixing topics without stable IDs...');
      const updatedTopics = topics.map(topic => ensureTopicHasStableId(topic));
      void Promise.resolve(onTopicsChange(updatedTopics));
    }

    // Report critical issues
    if (validationResults.duplicateIds.length > 0) {
      console.error('❌ Critical: Duplicate topic IDs found - drag and drop may not work correctly');
    }

    if (validationResults.idSectionMismatch.length > 0) {
      console.warn('⚠️ Warning: Topics with ID/sectionId mismatches detected - reordering may have issues');
    }

    // Log success if everything looks good
    if (validationResults.topicsWithoutIds === 0 &&
        validationResults.duplicateIds.length === 0 &&
        validationResults.idSectionMismatch.length === 0) {
      console.log('✅ [TopicValidation] All topics passed validation - drag and drop should work correctly');
    }
  }, [topics.length]); // Re-run when topic count changes

  const handleAddTopic = () => {
    const newTopic: SessionTopicDraft = {
      id: crypto.randomUUID(),
      title: 'New Topic',
      description: '',
      durationMinutes: 30,
      learningOutcomes: '',
      trainerNotes: '',
      materialsNeeded: '',
      deliveryGuidance: '',
      callToAction: '',
    };
    console.log('➕ Adding new topic with ID:', newTopic.id);
    void Promise.resolve(onTopicsChange([...topics, newTopic]));
  };

  // Resolve trainer names
  React.useEffect(() => {
    const missingIds = new Set<number>();

    topics.forEach((topic) => {
      if (topic.trainerId && !resolvedTrainerNames[topic.trainerId] && !trainerCache.current.has(topic.trainerId)) {
        missingIds.add(topic.trainerId);
      }
    });

    if (!missingIds.size) {
      return;
    }

    let cancelled = false;

    const loadMissing = async () => {
      await Promise.all(Array.from(missingIds).map(async (trainerId) => {
        try {
          // Use trainerService to get individual trainer
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
          console.error('TrainerAndTopicAssignmentStep: failed to resolve trainer', error);
        }
      }));
    };

    void loadMissing();
    return () => {
      cancelled = true;
    };
  }, [topics, resolvedTrainerNames, onTopicsChange, ensureTopicHasStableId]);

  // Toggle topic expansion
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

  // Helper to parse bullet lists
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

  const totalTopics = topics.length;
  const assignedCount = topics.filter(topic => topic.trainerId).length;
  const completionProgress = totalTopics > 0 ? (assignedCount / totalTopics) * 100 : 0;

  // Helper function to generate stable keys for topics with enhanced legacy support
  const getTopicKey = React.useCallback((topic: SessionTopicDraft, index: number) => {
    // Debug logging to track key generation
    console.log('🔍 getTopicKey called:', {
      topicId: topic.id,
      sectionId: topic.sectionId,
      topicDbId: topic.topicId,
      title: topic.title?.substring(0, 30),
      index
    });

    // Priority 1: Use the stable topic ID if available (most reliable)
    if (topic.id) {
      // Check if this looks like a UUID or deterministic ID
      const isUuidLike = topic.id.includes('-') && topic.id.length > 20;
      const isDeterministic = topic.id.startsWith('topic-') && topic.id.includes('-');

      if (isUuidLike || isDeterministic) {
        const key = `topic-${topic.id}`;
        console.log('✅ Using stable topic.id:', key);
        return key;
      } else {
        console.warn('⚠️ Topic.id present but not in expected format:', topic.id);
      }
    }

    // Priority 2: Try to match deterministic ID patterns from session transformation
    if (topic.sectionId && topic.sectionId.startsWith('existing-topic-')) {
      const key = `section-${topic.sectionId}`;
      console.log('✅ Using sectionId (existing topic pattern):', key);
      return key;
    }

    // Priority 3: Fall back to sectionId for backward compatibility
    if (topic.sectionId) {
      const key = `section-${topic.sectionId}`;
      console.log('⚠️ Using sectionId (fallback):', key);
      return key;
    }

    // Priority 4: Legacy deterministic ID pattern matching
    if (topic.topicId) {
      // Try to generate a consistent deterministic ID
      const fallbackKey = `legacy-topic-${topic.topicId}-${index}`;
      console.log('⚠️ Using legacy topicId fallback:', fallbackKey);
      return fallbackKey;
    }

    // Priority 5: Title-based key with sanitization
    if (topic.title) {
      const sanitizedTitle = topic.title
        .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .toLowerCase()
        .substring(0, 30); // Limit length
      const key = `title-${sanitizedTitle}-${index}`;
      console.log('⚠️ Using sanitized title-based key:', key);
      return key;
    }

    // Priority 6: Last resort - index-based key
    const key = `topic-${index}`;
    console.log('🚨 Using index fallback (last resort):', key);
    return key;
  }, []);

interface TopicCardProps {
  topic: SessionTopicDraft;
  topicIndex: number;
  topicKey: string;
  isExpanded: boolean;
  isEditing: boolean;
  trainerName: string | undefined;
  currentTrainerId: number | undefined;
  localTrainerId: number | undefined;
  isAssigned: boolean;
  onToggleExpansion: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onAssignTrainer: (index: number, trainer: Trainer | null) => void;
  onTopicFieldChange: (field: keyof SessionTopicDraft, value: any) => void;
  onTopicSave: () => void;
  onTopicCancel: () => void;
  editingTopic: SessionTopicDraft | null;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  isDragging?: boolean;
}

const TopicCardComponent: React.FC<TopicCardProps> = ({
  topic,
  topicIndex,
  topicKey,
  isExpanded,
  isEditing,
    trainerName,
    currentTrainerId,
    localTrainerId,
    isAssigned,
    onToggleExpansion,
    onEdit,
    onDelete,
    onAssignTrainer,
    onTopicFieldChange,
    onTopicSave,
    onTopicCancel,
    editingTopic,
    dragHandleProps,
    isDragging
  }) => {
    // Use the passed isAssigned prop instead of recalculating
    const isComplete = !!(
      topic.description?.trim() &&
      topic.durationMinutes &&
      topic.durationMinutes > 0
    );

    const trainerTasks = parseBulletList(topic.trainerNotes);
    const materials = parseBulletList(topic.materialsNeeded);

    return (
      <div className="space-y-4">
        <div className="flex items-stretch gap-3">
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 self-stretch rounded-lg border border-slate-200 bg-slate-50 px-3',
              isDragging && 'border-blue-300 bg-blue-50 text-blue-600'
            )}
          >
            {dragHandleProps && (
              <button
                type="button"
                className={cn(
                  'p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white transition-colors',
                  canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-50',
                  isDragging && 'text-blue-600 bg-white shadow-sm'
                )}
                aria-label={canEdit ? "Drag to reorder topic" : "Reordering disabled - session is published"}
                {...(canEdit ? dragHandleProps : {})}
                disabled={!canEdit}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 5h6M7 9h6M7 13h6M7 17h6" />
                </svg>
              </button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 border border-blue-200">
              {topicIndex + 1}
            </div>
          </div>

          <div
            className={cn(
              'flex-1 rounded-lg border-2 border-slate-300 bg-white shadow-md hover:shadow-lg hover:border-blue-400 transition-all',
              isDragging && 'border-blue-400 shadow-lg ring-2 ring-blue-200 ring-offset-1'
            )}
          >
            {/* Main Content Grid - 80/20 Split */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
              {/* Left Column - Topic Content (80%) */}
              <div className="lg:col-span-4 p-5">
                {/* Header with Title, Status, Duration and Actions */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTopic?.title || ''}
                        onChange={(e) => onTopicFieldChange('title', e.target.value)}
                        className="w-full text-lg font-bold text-slate-900 bg-transparent border-b-2 border-blue-400 focus:outline-none focus:border-blue-600"
                        placeholder="Topic title"
                        autoFocus
                      />
                    ) : (
                      <h4 className="text-lg font-bold text-slate-900 mb-2">
                        {topic.title || <span className="text-slate-400 italic">Untitled Topic</span>}
                      </h4>
                    )}
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editingTopic?.durationMinutes || 30}
                            onChange={(e) => onTopicFieldChange('durationMinutes', parseInt(e.target.value) || 30)}
                            className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="5"
                            max="180"
                          />
                          <span className="text-sm text-slate-600">min</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{getDurationLabel(topic.durationMinutes)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(topicIndex)}
                        className="p-1 text-slate-500 hover:text-slate-700"
                        title="Edit topic details"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.364 5.636a2 2 0 000-2.828l-1.172-1.172a2 2 0 00-2.828 0L7 9v4h4l7.364-7.364z" />
                        </svg>
                      </Button>
                    )}
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button size="sm" onClick={onTopicSave} className="p-1 text-green-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onTopicCancel} className="p-1 text-slate-600">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleExpansion(topicIndex)}
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
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(topicIndex)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Topic Description */}
                {isEditing ? (
                  <textarea
                    value={editingTopic?.description || ''}
                    onChange={(e) => onTopicFieldChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                    placeholder="Topic description"
                    rows={3}
                  />
                ) : (
                  topic.description && (
                    <div className="mb-3">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {topic.description}
                      </p>
                    </div>
                  )
                )}

                {isEditing && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Learning Outcomes
                        </label>
                        <textarea
                          value={editingTopic?.learningOutcomes || ''}
                          onChange={(e) => onTopicFieldChange('learningOutcomes', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="List each outcome on a new line or use bullets"
                          rows={4}
                        />
                        <p className="mt-1 text-xs text-slate-500">Use a new line for each bullet point.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Materials Needed
                        </label>
                        <textarea
                          value={editingTopic?.materialsNeeded || ''}
                          onChange={(e) => onTopicFieldChange('materialsNeeded', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="List materials (one per line)"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Trainer Notes
                        </label>
                        <textarea
                          value={editingTopic?.trainerNotes || ''}
                          onChange={(e) => onTopicFieldChange('trainerNotes', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Notes, reminders, or talking points"
                          rows={4}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                          Delivery Guidance
                        </label>
                        <textarea
                          value={editingTopic?.deliveryGuidance || ''}
                          onChange={(e) => onTopicFieldChange('deliveryGuidance', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Share facilitation guidance or setup tips"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                        Activities & Call To Action
                      </label>
                      <textarea
                        value={editingTopic?.callToAction || ''}
                        onChange={(e) => onTopicFieldChange('callToAction', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Outline follow-up activities or participant actions"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

              {/* Incomplete Topic Indicator */}
              {!isComplete && !isEditing && (
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
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => onToggleExpansion(topicIndex)}
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
              )}
            </div>

            {/* Expanded View */}
            {isExpanded && !isEditing && (
              <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4 bg-slate-50 lg:col-span-4">
                {/* Learning Outcomes */}
                {topic.learningOutcomes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <h5 className="text-xs font-semibold text-blue-900 mb-2">Learning Outcomes</h5>
                    <p className="text-xs text-blue-800">{topic.learningOutcomes}</p>
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
                  {topic.deliveryGuidance && (
                    <div>
                      <span className="font-semibold text-slate-500">Delivery Guidance:</span>
                      <p className="text-slate-700 mt-1">{topic.deliveryGuidance}</p>
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
                    Assign Trainer
                  </h4>
                </div>

                {isLoadingTrainers ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-slate-600">Loading trainers...</span>
                  </div>
                ) : trainerError ? (
                  <div className="space-y-2">
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                      {trainerError}
                    </div>
                    <button
                      onClick={fetchAllTrainers}
                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={currentTrainerId ?? ''}
                      onChange={(e) => {
                        const trainerId = e.target.value;
                        const trainer = trainerId ? allTrainers.find(t => t.id === parseInt(trainerId)) || null : null;
                        onAssignTrainer(topicIndex, trainer);
                      }}
                      className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">
                        {isAssigned ? 'Remove trainer...' : 'Select a trainer...'}
                      </option>
                      {allTrainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>

                    </div>
                )}

                {trainerName && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-emerald-800">
                        {trainerName}
                      </span>
                    </div>
                  </div>
                )}

                {!isAssigned && (
                  <div className="mt-3 p-3 bg-slate-100 border border-slate-200 rounded-md">
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
      </div>
    );
  }; // Temporarily removed React.memo comparison function to debug

const TopicCard = React.memo(TopicCardComponent);
TopicCard.displayName = 'TopicCard';

  return (
    <EditModeGuard
      showCreateVersionButton={true}
      onCreateVersion={() => {
        // TODO: Implement create new version functionality
        console.log('Create new version functionality not yet implemented');
      }}
    >
      <div className="space-y-6">
        {/* Session Details Section */}
        <SessionDetailsSection
          metadata={metadata}
          topics={topics}
          onUpdateMetadata={onUpdateMetadata}
        />

        {/* Topic Cards */}
        <div className="space-y-6">
          {topics.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg bg-slate-50">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm text-slate-600 mb-4">No topics yet</p>
              <Button onClick={handleAddTopic} disabled={!canEdit}>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Topic
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={canEdit ? handleDragEnd : undefined}>
              <Droppable droppableId="trainer-topics">
                {(droppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    {...droppableProvided.droppableProps}
                    className="space-y-6"
                  >
                    {topics.map((topic, index) => {
                      const topicKey = getTopicKey(topic, index);
                      const stateKey = getTopicStateKey(topic, index);
                      const isExpanded = expandedTopics.has(index);
                      const isEditing = editingTopicIndex === index;
                      // Get trainer ID from local state first, then fall back to topic state
                      const storedTrainerId = topicTrainers[stateKey];
                      const currentTrainerId = storedTrainerId ?? topic.trainerId;

                      // Get trainer name from topic metadata, resolved names cache, or simplified trainer list
                      const trainerName = topic.trainerName ?? (
                        currentTrainerId
                          ? resolvedTrainerNames[currentTrainerId] ||
                            allTrainers.find(t => t.id === currentTrainerId)?.name
                          : undefined
                      );

                      // Update isAssigned based on currentTrainerId
                      const isAssigned = Boolean(currentTrainerId);

                      // Debug logging for each topic rendering
                      console.log(`🏷️ Rendering topic ${index}:`, {
                        topicKey,
                        draggableId: topicKey,
                        topicId: topic.id,
                        sectionId: topic.sectionId,
                        title: topic.title,
                        canEdit
                      });

                      return (
                        <Draggable
                          key={topicKey}
                          draggableId={topicKey}
                          index={index}
                          isDragDisabled={!canEdit}
                        >
                          {(draggableProvided, snapshot) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              style={draggableProvided.draggableProps.style as React.CSSProperties}
                            >
                              <TopicCard
                                topic={topic}
                                topicIndex={index}
                                topicKey={topicKey}
                                isExpanded={isExpanded}
                                isEditing={isEditing}
                                trainerName={trainerName}
                                currentTrainerId={currentTrainerId}
                                localTrainerId={storedTrainerId}
                                isAssigned={isAssigned}
                                onToggleExpansion={toggleTopicExpansion}
                                onEdit={canEdit ? handleTopicEdit : undefined}
                                onDelete={canEdit ? handleTopicDelete : undefined}
                                onAssignTrainer={canEdit ? handleAssignTrainer : undefined}
                                onTopicFieldChange={handleTopicFieldChange}
                                onTopicSave={handleTopicSave}
                                onTopicCancel={handleTopicCancel}
                                editingTopic={editingTopic}
                                dragHandleProps={draggableProvided.dragHandleProps}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>

        {/* Add Topic Button */}
        {topics.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleAddTopic}
              variant="outline"
              size="lg"
              className="gap-2"
              disabled={!canEdit}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Topic
            </Button>
          </div>
        )}
      </div>
    </EditModeGuard>
  );
};
