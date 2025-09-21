import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Topic, Trainer } from '../../../../shared/src/types';
import { SessionTopicDetail } from './EnhancedTopicCard';

interface DraggableSessionFlowProps {
  selectedTopicDetails: SessionTopicDetail[];
  topics: Topic[];
  trainers: Trainer[];
  onReorder: (reorderedDetails: SessionTopicDetail[]) => void;
}

export const DraggableSessionFlow: React.FC<DraggableSessionFlowProps> = ({
  selectedTopicDetails,
  topics,
  trainers,
  onReorder
}) => {
  const formatDuration = (minutes: number) => {
    if (minutes === 0) return '0 minutes';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(selectedTopicDetails);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence orders
    const reorderedDetails = items.map((detail, index) => ({
      ...detail,
      sequenceOrder: index + 1
    }));

    onReorder(reorderedDetails);
  };

  // Sort by current sequence order
  const sortedDetails = selectedTopicDetails
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

  if (selectedTopicDetails.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Session Flow Summary</h4>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C2.077 13.509 2 14.097 2 14.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5c0-.403-.077-.991-.707-1.621l-1.793-1.793 1.793-1.793c.63-.63.707-1.218.707-1.621V4.414l.707-.707A1 1 0 007 2zM17 6a1 1 0 00-1 1v3.758l-.293-.707-4-4C11.077 5.421 10.489 5.344 10.086 5.344c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5c.403 0 .991-.077 1.621-.707l1.793-1.793 1.793 1.793c.63.63 1.218.707 1.621.707V11a1 1 0 002 0V7a1 1 0 00-1-1z"/>
          </svg>
          Drag to reorder
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="session-flow">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-2 transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50' : ''
              }`}
            >
              {sortedDetails.map((detail, index) => {
                const topic = topics.find(t => t.id === detail.topicId);
                const trainer = detail.assignedTrainerId
                  ? trainers.find(t => t.id === detail.assignedTrainerId)
                  : null;

                return (
                  <Draggable
                    key={detail.topicId}
                    draggableId={detail.topicId.toString()}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center text-sm p-3 rounded-md border transition-all ${
                          snapshot.isDragging
                            ? 'bg-white border-blue-300 shadow-lg'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Drag Handle */}
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center justify-center w-8 h-8 mr-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z"/>
                          </svg>
                        </div>

                        {/* Sequence Number */}
                        <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
                          {index + 1}
                        </span>

                        {/* Topic Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium text-gray-900 truncate">
                              {topic?.name || `Topic ${detail.topicId}`}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 whitespace-nowrap">
                              {formatDuration(detail.durationMinutes)}
                            </span>
                            {trainer && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-600 truncate">
                                  {trainer.firstName} {trainer.lastName}
                                </span>
                              </>
                            )}
                          </div>

                          {detail.notes && (
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              {detail.notes}
                            </div>
                          )}
                        </div>

                        {/* Drag Indicator */}
                        {snapshot.isDragging && (
                          <div className="ml-2 text-blue-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
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
    </div>
  );
};