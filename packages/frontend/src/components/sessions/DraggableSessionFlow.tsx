import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Topic, Trainer } from '@leadership-training/shared';
import { SessionTopicDetail } from './EnhancedTopicCard';
import { TopicDetailSections } from '@/features/session-builder/components/SessionFlowSummary';

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
  const sortedDetails = useMemo(
    () => [...selectedTopicDetails].sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [selectedTopicDetails]
  );

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

  if (selectedTopicDetails.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-base font-semibold text-slate-900">Session Flow Summary</h4>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C2.077 13.509 2 14.097 2 14.5c0 .828.672 1.5 1.5 1.5s1.5-.672 1.5-1.5c0-.403-.077-.991-.707-1.621l-1.793-1.793 1.793-1.793c.63-.63.707-1.218.707-1.621V4.414l.707-.707A1 1 0 007 2zM17 6a1 1 0 00-1 1v3.758l-.293-.707-4-4C11.077 5.421 10.489 5.344 10.086 5.344c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5c.403 0 .991-.077 1.621-.707l1.793-1.793 1.793 1.793c.63.63 1.218.707 1.621.707V11a1 1 0 002 0V7a1 1 0 00-1-1z"/>
          </svg>
          Drag topics to adjust sequence
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="session-flow">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 transition-colors ${
                snapshot.isDraggingOver ? 'rounded-lg bg-blue-50/50 p-2' : ''
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
                    {(providedDraggable, snapshotDraggable) => (
                      <div
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        className={`relative rounded-lg border bg-white transition-all ${
                          snapshotDraggable.isDragging
                            ? 'border-blue-300 shadow-lg'
                            : 'border-slate-200 hover:shadow-md'
                        } ${!topic ? 'border-red-200 bg-red-50' : ''}`}
                      >
                        <div className="grid gap-4 md:grid-cols-[auto,1fr] p-4 md:p-5">
                          <div className="flex flex-col items-start gap-3 md:items-center">
                            <div
                              {...providedDraggable.dragHandleProps}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 cursor-grab active:cursor-grabbing"
                              title="Drag to reorder"
                            >
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                              </svg>
                            </div>
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {index + 1}
                            </div>
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <h5 className="font-medium text-slate-900">
                                    {topic?.name || `Topic #${detail.topicId}`}
                                  </h5>
                                  {!topic && (
                                    <p className="text-sm text-red-600">
                                      ⚠️ Topic details are loading. If this persists, refresh the page.
                                    </p>
                                  )}
                                  {topic && (
                                    <>
                                      <p className="text-sm text-slate-600">
                                        {topic.aiGeneratedContent?.enhancedContent?.enhancedDescription ||
                                          topic.description ||
                                          'No description provided yet.'}
                                      </p>
                                      <div className="flex flex-wrap gap-2 pt-1">
                                        {renderMetaChip(`Duration: ${formatDuration(detail.durationMinutes)}`)}
                                        {trainer && renderMetaChip(`Trainer: ${trainer.name}`)}
                                        {detail.assignedTrainerId && !trainer && renderMetaChip('Trainer missing', 'danger')}
                                        {topic?.aiGeneratedContent?.enhancedContent?.trainerSection?.recommendedActivities?.length
                                          ? renderMetaChip(
                                              `${topic.aiGeneratedContent.enhancedContent.trainerSection.recommendedActivities.length} recommended task${topic.aiGeneratedContent.enhancedContent.trainerSection.recommendedActivities.length > 1 ? 's' : ''}`,
                                            )
                                          : null}
                                        {detail.notes && renderMetaChip('Custom notes added')}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              {detail.notes && (
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                  <span className="font-medium text-slate-700">Facilitator Notes:</span>{' '}
                                  {detail.notes}
                                </div>
                              )}
                            </div>

                            {topic && <TopicDetailSections topic={topic} />}
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
    </div>
  );
};
