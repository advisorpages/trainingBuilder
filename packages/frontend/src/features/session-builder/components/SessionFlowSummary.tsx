import React from 'react';
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
}) => {
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

                    {/* Topic Card */}
                    <div className="relative z-10 flex items-start gap-4">
                      {/* Drag Handle & Step Number */}
                      <div className="flex flex-col items-center gap-1">
                        {onReorder && (
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center justify-center w-6 h-6 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                            </svg>
                          </div>
                        )}
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                      </div>

                      {/* Topic Content */}
                      <div className={`flex-1 bg-white rounded-lg p-4 border transition-all ${
                        snapshot.isDragging
                          ? 'border-blue-300 shadow-lg scale-105'
                          : 'border-slate-200 hover:shadow-md'
                      } ${!topic ? 'border-red-200 bg-red-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">
                              {topic ? topic.name : `Topic #${topicDetail.topicId} (Loading...)`}
                            </h4>
                            {!topic && (
                              <p className="text-sm text-red-600 mt-1">
                                ⚠️ Topic details are loading. If this persists, try refreshing the page.
                              </p>
                            )}
                            {topic?.description && (
                              <p className="text-sm text-slate-500 mt-1">
                                {topic.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                              <span>Duration: {formatDuration(topicDetail.durationMinutes || 30)}</span>
                              {trainer && (
                                <>
                                  <span>•</span>
                                  <span>Trainer: {trainer.name}</span>
                                </>
                              )}
                              {topicDetail.assignedTrainerId && !trainer && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600">Trainer ID {topicDetail.assignedTrainerId} (Not found)</span>
                                </>
                              )}
                            </div>
                            {topicDetail.notes && (
                              <p className="text-sm text-slate-500 mt-2 italic">
                                Notes: {topicDetail.notes}
                              </p>
                            )}
                          </div>

                          {/* Topic Actions */}
                          <div className="flex gap-2 ml-4">
                            {onEditTopic && (
                              <button
                                type="button"
                                onClick={() => onEditTopic(topicDetail.topicId)}
                                className="p-1 text-slate-400 hover:text-slate-600"
                                title="Edit topic"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                            )}
                            {onRemoveTopic && (
                              <button
                                type="button"
                                onClick={() => onRemoveTopic(topicDetail.topicId)}
                                className="p-1 text-slate-400 hover:text-red-600"
                                title="Remove topic"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
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
