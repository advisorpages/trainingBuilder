import React, { useMemo, useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/Button';
import { SessionTopicDetail } from '@/components/sessions/EnhancedTopicCard';
import { Topic, Trainer } from '@leadership-training/shared';

interface SessionFlowSummaryProps {
  sessionTitle: string;
  sessionTopics: SessionTopicDetail[];
  totalDuration: number;
  topics: Topic[];
  trainers: Trainer[];
  onAddTopic: () => void;
  onEditTopic?: (topicId: number) => void;
  onRemoveTopic?: (topicId: number) => void;
  onReorder?: (reorderedTopics: SessionTopicDetail[]) => void;
  // New props for enhanced editing functionality
  onUpdateTopic?: (topicId: number, updates: Partial<SessionTopicDetail>) => void;
  onAssignTrainer?: (topicId: number, trainerId: number | null) => void;
  isLoading?: boolean;
  editMode?: 'view' | 'edit';
}

export const SessionFlowSummary: React.FC<SessionFlowSummaryProps> = ({
  sessionTitle,
  sessionTopics,
  totalDuration,
  topics,
  trainers,
  onAddTopic,
  onEditTopic,
  onRemoveTopic,
  onReorder,
  onUpdateTopic,
  onAssignTrainer,
  isLoading = false,
  editMode = 'view',
}) => {
  // State for expanded topics and inline editing
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<SessionTopicDetail | null>(null);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getTopicById = (topicId: number): Topic | undefined => {
    return topics.find(topic => topic.id === topicId);
  };

  const getTrainerById = (trainerId: number | undefined): Trainer | undefined => {
    if (!trainerId) return undefined;
    return trainers.find(trainer => trainer.id === trainerId);
  };

  // Helper functions for topic management
  const toggleTopicExpansion = useCallback((topicId: number) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  }, []);

  const handleEditTopic = useCallback((topicId: number) => {
    const topicDetail = sessionTopics.find(t => t.topicId === topicId);
    if (topicDetail) {
      setEditingTopicId(topicId);
      setEditingTopic({ ...topicDetail });
    }
  }, [sessionTopics]);

  const handleSaveTopic = useCallback(() => {
    if (editingTopicId !== null && editingTopic && onUpdateTopic) {
      onUpdateTopic(editingTopicId, editingTopic);
      setEditingTopicId(null);
      setEditingTopic(null);
    }
  }, [editingTopic, editingTopicId, onUpdateTopic]);

  const handleCancelEdit = useCallback(() => {
    setEditingTopicId(null);
    setEditingTopic(null);
  }, []);

  const handleTopicFieldChange = useCallback((field: keyof SessionTopicDetail, value: any) => {
    if (editingTopic) {
      setEditingTopic({
        ...editingTopic,
        [field]: value,
      });
    }
  }, [editingTopic]);

  const handleTrainerAssignment = useCallback((topicId: number, trainerId: number | null) => {
    if (onAssignTrainer) {
      onAssignTrainer(topicId, trainerId);
    }
  }, [onAssignTrainer]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    const items = Array.from(sessionTopics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence orders
    const reorderedDetails = items.map((detail, index) => ({
      ...detail,
      sequenceOrder: index + 1,
    }));

    onReorder(reorderedDetails);
  };

  const renderMetaChip = (label: string, variant: 'default' | 'danger' = 'default') => {
    const variantClasses =
      variant === 'danger'
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-100 text-slate-700';

    return (
      <span
        key={`${variant}-${label}`}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${variantClasses}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 sm:p-6 shadow-sm border border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Session Overview */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 mb-3">Session Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Duration:</span>
              <span className="font-medium">{formatDuration(totalDuration)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Topics:</span>
              <span className="font-medium">{sessionTopics.length} topics</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Status:</span>
              <span className="font-medium">Draft</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <Button
              type="button"
              onClick={onAddTopic}
              className="w-full"
              size="sm"
            >
              + Add Topic
            </Button>
          </div>
        </div>

        {/* Flow Visualization */}
        <div className="lg:col-span-3">
          <h3 className="font-semibold text-slate-900 mb-4">Session Flow</h3>

          {sessionTopics.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-slate-300">
              <div className="text-slate-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <p className="text-slate-600 mb-4">No topics added yet</p>
              <p className="text-sm text-slate-500">Click "Add Topic" to start building your session</p>
            </div>
          ) : (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="session-topics">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-4 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50 rounded-lg p-2' : ''
                    }`}
                  >
                    {sessionTopics.map((topicDetail, index) => {
                      const topic = getTopicById(topicDetail.topicId);
                      const trainer = getTrainerById(topicDetail.assignedTrainerId);

                      // Log if topic is not found for debugging
                      if (!topic) {
                        console.warn(`[SessionFlowSummary] Topic with ID ${topicDetail.topicId} not found in topics array`);
                        console.log('[SessionFlowSummary] Available topics:', topics.map(t => ({ id: t.id, name: t.name })));
                      }

                      return (
                        <Draggable
                          key={topicDetail.topicId}
                          draggableId={topicDetail.topicId.toString()}
                          index={index}
                          isDragDisabled={!onReorder}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="relative"
                            >
                    {/* Flow Line */}
                    {index < sessionTopics.length - 1 && (
                      <div className="absolute left-4 top-12 bottom-0 w-px bg-slate-300 z-0"></div>
                    )}

                    {/* Enhanced Topic Card */}
                    <div className={`relative z-10 bg-white rounded-lg border-2 transition-all ${
                      snapshot.isDragging
                        ? 'border-blue-400 shadow-lg scale-105'
                        : 'border-slate-300 hover:shadow-lg hover:border-blue-400'
                    } ${!topic ? 'border-red-300 bg-red-50' : ''}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                        {/* Left Column - Topic Content (80%) */}
                        <div className="lg:col-span-4 p-5">
                          {/* Header with Title, Actions and Expand */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {onReorder && (
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 cursor-grab active:cursor-grabbing mt-1"
                                  title="Drag to reorder"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                                  </svg>
                                </div>
                              )}
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold border border-blue-200">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                {editingTopicId === topicDetail.topicId ? (
                                  <input
                                    type="text"
                                    value={editingTopic?.notes || ''}
                                    onChange={(e) => handleTopicFieldChange('notes', e.target.value)}
                                    className="w-full text-lg font-bold text-slate-900 bg-transparent border-b-2 border-blue-400 focus:outline-none focus:border-blue-600"
                                    placeholder="Topic title"
                                    autoFocus
                                  />
                                ) : (
                                  <h4 className="text-lg font-bold text-slate-900">
                                    {topic ? topic.name : `Topic #${topicDetail.topicId} (Loading...)`}
                                  </h4>
                                )}
                                <div className="flex items-center gap-2 text-sm mt-1">
                                  {editingTopicId === topicDetail.topicId ? (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        value={editingTopic?.durationMinutes || 30}
                                        onChange={(e) => handleTopicFieldChange('durationMinutes', parseInt(e.target.value) || 30)}
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
                                      <span className="font-semibold">{formatDuration(topicDetail.durationMinutes || 30)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Topic Actions */}
                            <div className="flex items-center gap-2">
                              {editMode === 'edit' && editingTopicId !== topicDetail.topicId && (
                                <button
                                  type="button"
                                  onClick={() => handleEditTopic(topicDetail.topicId)}
                                  className="p-1 text-slate-400 hover:text-slate-700"
                                  title="Edit topic"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.364 5.636a2 2 0 000-2.828l-1.172-1.172a2 2 0 00-2.828 0L7 9v4h4l7.364-7.364z" />
                                  </svg>
                                </button>
                              )}
                              {editingTopicId === topicDetail.topicId ? (
                                <div className="flex gap-1">
                                  <button
                                    onClick={handleSaveTopic}
                                    className="p-1 text-green-600 hover:text-green-700"
                                    title="Save changes"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-1 text-slate-600 hover:text-slate-700"
                                    title="Cancel editing"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleTopicExpansion(topicDetail.topicId)}
                                  className="text-slate-400 hover:text-slate-600 p-1"
                                >
                                  <svg
                                    className={`h-4 w-4 transition-transform ${expandedTopics.has(topicDetail.topicId) ? 'rotate-180' : ''}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              )}
                              {onRemoveTopic && (
                                <button
                                  type="button"
                                  onClick={() => onRemoveTopic(topicDetail.topicId)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Remove topic"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Topic Description */}
                          {editingTopicId === topicDetail.topicId ? (
                            <textarea
                              value={editingTopic?.notes || ''}
                              onChange={(e) => handleTopicFieldChange('notes', e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                              placeholder="Topic description or notes"
                              rows={3}
                            />
                          ) : (
                            topic && (
                              <div className="mb-3">
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  {topic.aiGeneratedContent?.enhancedContent?.enhancedDescription ||
                                    topic.description ||
                                    'No description provided yet.'}
                                </p>
                              </div>
                            )
                          )}

                          {/* Expanded View */}
                          {expandedTopics.has(topicDetail.topicId) && editingTopicId !== topicDetail.topicId && topic && (
                            <div className="pt-3 border-t border-slate-200">
                              <TopicDetailSections topic={topic} />
                            </div>
                          )}

                          {/* Show Details Button */}
                          {!expandedTopics.has(topicDetail.topicId) && editingTopicId !== topicDetail.topicId && topic && (
                            <button
                              type="button"
                              onClick={() => toggleTopicExpansion(topicDetail.topicId)}
                              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                              <svg
                                className={`h-4 w-4 transition-transform`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Show details
                            </button>
                          )}
                        </div>

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

                            {editMode === 'edit' ? (
                              <select
                                value={topicDetail.assignedTrainerId ?? ''}
                                onChange={(e) => {
                                  const trainerId = e.target.value ? parseInt(e.target.value) : null;
                                  handleTrainerAssignment(topicDetail.topicId, trainerId);
                                }}
                                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">
                                  {topicDetail.assignedTrainerId ? 'Remove trainer...' : 'Select a trainer...'}
                                </option>
                                {trainers.map((trainer) => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="text-sm">
                                {trainer ? (
                                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="font-medium text-emerald-800">
                                        {trainer.name}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-md">
                                    <div className="flex items-center gap-2">
                                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="font-medium text-slate-600">
                                        No trainer assigned
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

              {/* Add Break Indicator */}
              {sessionTopics.length > 0 && (
                <div className="relative">
                  <div className="absolute left-4 top-6 bottom-0 w-px bg-slate-300"></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm">
                      ☕
                    </div>
                    <div className="flex-1 bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-orange-900">Break</h4>
                          <p className="text-sm text-orange-700 mt-1">Coffee and networking</p>
                        </div>
                        <span className="text-sm font-medium text-orange-700">10 min</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface TopicDetailSectionsProps {
  topic: Topic;
}

const splitToList = (value?: string | string[] | null): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map(item => item.trim()).filter(Boolean);
  }
  const trimmed = value.trim();
  if (!trimmed) return [];
  const parts = trimmed
    .split(/\r?\n/)
    .map(part => part.replace(/^[•\-\*\s]+/, '').trim())
    .filter(Boolean);
  return parts.length ? parts : [trimmed];
};

export const TopicDetailSections: React.FC<TopicDetailSectionsProps> = ({ topic }) => {
  const learningOutcomesList = useMemo(() => {
    const manual = splitToList(topic.learningOutcomes);
    const aiKeyTakeaways = topic.aiGeneratedContent?.enhancedContent?.attendeeSection?.keyTakeaways ?? [];
    return manual.length ? manual : aiKeyTakeaways;
  }, [topic]);

  const learningNarrative = topic.aiGeneratedContent?.enhancedContent?.attendeeSection?.whatYoullLearn;

  const recommendedActivities = topic.aiGeneratedContent?.enhancedContent?.trainerSection?.recommendedActivities ?? [];

  const trainerGuidanceList = useMemo(() => {
    const manualNotes = splitToList(topic.trainerNotes);
    const deliveryGuidance = splitToList(topic.deliveryGuidance);
    const aiTeachingPoints = topic.aiGeneratedContent?.enhancedContent?.trainerSection?.keyTeachingPoints ?? [];
    const aiChallenges = topic.aiGeneratedContent?.enhancedContent?.trainerSection?.commonChallenges ?? [];
    return Array.from(new Set([...manualNotes, ...deliveryGuidance, ...aiTeachingPoints, ...aiChallenges])).filter(Boolean);
  }, [topic]);

  const materialsList = useMemo(() => {
    const manualMaterials = splitToList(topic.materialsNeeded);
    const aiMaterials = topic.aiGeneratedContent?.enhancedContent?.trainerSection?.materialsNeeded ?? [];
    const prepGuidance = splitToList(topic.aiGeneratedContent?.enhancedContent?.trainerSection?.preparationGuidance);
    return Array.from(new Set([...manualMaterials, ...aiMaterials, ...prepGuidance])).filter(Boolean);
  }, [topic]);

  const callToActionList = splitToList(topic.aiGeneratedContent?.enhancedContent?.callToAction);

  const sections = useMemo(() => [
    {
      title: 'Learning Outcomes',
      description: learningNarrative,
      items: learningOutcomesList,
    },
    {
      title: 'Key Tasks',
      items: recommendedActivities,
    },
    {
      title: 'Trainer Guidance',
      items: trainerGuidanceList,
    },
    {
      title: 'Materials & Preparation',
      items: materialsList,
    },
    {
      title: 'Call To Action',
      items: callToActionList,
    },
  ].filter(section => (section.items && section.items.length > 0) || section.description), [
    learningNarrative,
    learningOutcomesList,
    recommendedActivities,
    trainerGuidanceList,
    materialsList,
    callToActionList,
  ]);

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 grid gap-3 md:grid-cols-2">
      {sections.map(section => (
        <div key={section.title} className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <h5 className="text-sm font-semibold text-slate-800">{section.title}</h5>
          {section.description && (
            <p className="mt-2 text-sm text-slate-600">{section.description}</p>
          )}
          {section.items && section.items.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {section.items.map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};
