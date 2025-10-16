import React, { useState, useEffect } from 'react';
import { Session, Trainer, Location, Audience, Tone, Category, Topic } from '@leadership-training/shared';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { trainerService } from '../../services/trainer.service';
import { locationService } from '../../services/location.service';
import { attributesService } from '../../services/attributes.service';
import { topicService } from '../../services/topic.service';
import { sessionService } from '../../services/session.service';

interface SessionDetailsProps {
  session: Session;
  onBack: () => void;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({
  session,
  onBack,
}) => {
  // State for loading reference data
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tones, setTones] = useState<Tone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setIsLoadingData(true);
        const [
          trainersResponse,
          locationsResponse,
          audiencesResponse,
          tonesResponse,
          categoriesResponse,
          topicsResponse
        ] = await Promise.all([
          trainerService.getActiveTrainers(),
          locationService.getActiveLocations(),
          attributesService.getAudiences(),
          attributesService.getTones(),
          attributesService.getCategories(),
          topicService.getActiveTopics()
        ]);

        setTrainers(trainersResponse);
        setLocations(locationsResponse);
        setAudiences(audiencesResponse);
        setTones(tonesResponse);
        setCategories(categoriesResponse);
        setTopics(topicsResponse);
      } catch (error) {
        console.error('Failed to load reference data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadReferenceData();
  }, []);

  const formatDateTime = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getTrainerName = (trainerId?: number) => {
    if (!trainerId) return 'Not assigned';
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? `${trainer.name}${trainer.expertiseTags?.length ? ' - ' + trainer.expertiseTags.join(', ') : ''}` : 'Not found';
  };

  const getLocationName = (locationId?: number) => {
    if (!locationId) return 'Not assigned';
    const location = locations.find(l => l.id === locationId);
    return location ? `${location.name} - ${location.address}` : 'Not found';
  };

  const getAudienceName = (audienceId?: number) => {
    if (!audienceId) return 'Not specified';
    const audience = audiences.find(a => a.id === audienceId);
    return audience?.name || 'Not found';
  };

  const getToneName = (toneId?: number) => {
    if (!toneId) return 'Not specified';
    const tone = tones.find(t => t.id === toneId);
    return tone?.name || 'Not found';
  };

  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return 'Not specified';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Not found';
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes || minutes === 0) return 'Not set';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getOrderedSessionTopics = () => {
    if (!session.sessionTopics || session.sessionTopics.length === 0) {
      return [];
    }
    return [...session.sessionTopics].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  };

  const handleTopicReorder = async (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const orderedTopics = getOrderedSessionTopics();
    const items = Array.from(orderedTopics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sequence orders
    const updatedSessionTopics = items.map((item, index) => ({
      topicId: item.topicId,
      sequenceOrder: index + 1,
      durationMinutes: item.durationMinutes,
      trainerId: item.trainerId,
      notes: item.notes,
    }));

    try {
      setIsReordering(true);
      await sessionService.updateSessionTopics(session.id, updatedSessionTopics);
      // Refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Failed to reorder topics:', error);
      alert('Failed to update topic order. Please try again.');
    } finally {
      setIsReordering(false);
    }
  };

  const getAssignedTrainersSummary = () => {
    const sessionTopics = session.sessionTopics ?? [];
    if (sessionTopics.length === 0) {
      return 'Not assigned';
    }

    const uniqueTrainerIds = Array.from(
      new Set(
        sessionTopics
          .map(topic => topic.trainerId)
          .filter((id): id is number => typeof id === 'number' && !Number.isNaN(id)),
      ),
    );

    if (uniqueTrainerIds.length === 0) {
      return 'Not assigned';
    }

    const names = uniqueTrainerIds.map(getTrainerName);
    return names.join(', ');
  };

  const renderAIContent = () => {
    if (!session.aiGeneratedContent) return null;

    const content: Record<string, any> =
      typeof session.aiGeneratedContent === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(session.aiGeneratedContent);
              return typeof parsed === 'object' && parsed !== null ? parsed : {};
            } catch {
              return {};
            }
          })()
        : session.aiGeneratedContent;

    return (
      <div className="space-y-4">
        {content.headlines && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Headlines</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              {Array.isArray(content.headlines) ? (
                <ul className="space-y-1">
                  {content.headlines.map((headline: string, index: number) => (
                    <li key={index} className="text-gray-900">• {headline}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-900">{content.headlines}</span>
              )}
            </div>
          </div>
        )}

        {content.description && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Description</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
              {content.description}
            </div>
          </div>
        )}

        {content.keyBenefits && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Key Benefits</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              {Array.isArray(content.keyBenefits) ? (
                <ul className="space-y-1">
                  {content.keyBenefits.map((benefit: string, index: number) => (
                    <li key={index} className="text-gray-900">• {benefit}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-900">{content.keyBenefits}</span>
              )}
            </div>
          </div>
        )}

        {content.callToAction && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Call to Action</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
              {content.callToAction}
            </div>
          </div>
        )}

        {content.socialMedia && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Content</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              {Array.isArray(content.socialMedia) ? (
                <div className="space-y-2">
                  {content.socialMedia.map((post: string, index: number) => (
                    <div key={index} className="text-gray-900 border-l-2 border-blue-200 pl-3">
                      {post}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-900">{content.socialMedia}</span>
              )}
            </div>
          </div>
        )}

        {content.emailCopy && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Marketing Content</label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
              {content.emailCopy}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoadingData) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Session Details
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          View session information and configuration
        </p>
      </div>

      <div className="px-6 py-6 space-y-8">
        {/* Basic Information Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Session Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Title
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.title || 'No title provided'}
              </div>
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900 min-h-[100px]">
                {session.description || (
                  <span className="text-gray-400 italic">No description provided</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scheduling Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Scheduling</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.startTime ? formatDateTime(session.startTime) : 'Not set'}
              </div>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.endTime ? formatDateTime(session.endTime) : 'Not set'}
              </div>
            </div>

            {/* Max Registrations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Registrations
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.maxRegistrations || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Resources</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getLocationName(session.locationId)}
              </div>
            </div>

            {/* Trainers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Trainers
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getAssignedTrainersSummary()}
              </div>
            </div>
          </div>
        </div>

        {/* Content Attributes Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Content Attributes</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getAudienceName(session.audienceId)}
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getToneName(session.toneId)}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getCategoryName(session.categoryId)}
              </div>
            </div>
          </div>
        </div>

        {/* Topics Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-medium text-gray-900">Session Topics</h3>
            {getOrderedSessionTopics().length > 0 && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                </svg>
                Drag to reorder
              </span>
            )}
          </div>

          {getOrderedSessionTopics().length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
              <p className="text-gray-500 italic">No topics assigned to this session</p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleTopicReorder}>
              <Droppable droppableId="session-topics">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 transition-colors ${
                      snapshot.isDraggingOver ? 'rounded-lg bg-blue-50/50 p-2' : ''
                    }`}
                  >
                    {getOrderedSessionTopics().map((sessionTopic, index) => {
                      const topic = topics.find(t => t.id === sessionTopic.topicId);
                      const trainer = sessionTopic.trainerId
                        ? trainers.find(t => t.id === sessionTopic.trainerId)
                        : null;

                      const uniqueKey = `${sessionTopic.topicId ?? 'session-topic'}-${index}`;

                      return (
                        <Draggable
                          key={uniqueKey}
                          draggableId={uniqueKey}
                          index={index}
                          isDragDisabled={isReordering}
                        >
                          {(providedDraggable, snapshotDraggable) => (
                            <div
                              ref={providedDraggable.innerRef}
                              {...providedDraggable.draggableProps}
                              className={`bg-white border rounded-lg transition-all ${
                                snapshotDraggable.isDragging
                                  ? 'border-blue-300 shadow-lg'
                                  : 'border-gray-200 hover:shadow-md'
                              }`}
                            >
                              <div className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Drag Handle and Sequence Number */}
                                  <div className="flex flex-col items-center gap-2">
                                    <div
                                      {...providedDraggable.dragHandleProps}
                                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors ${
                                        isReordering ? 'cursor-not-allowed opacity-50' : 'cursor-grab active:cursor-grabbing'
                                      }`}
                                      title={isReordering ? 'Saving...' : 'Drag to reorder'}
                                    >
                                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                                      </svg>
                                    </div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                      {index + 1}
                                    </div>
                                  </div>

                                  {/* Topic Content */}
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <h5 className="font-medium text-gray-900 text-base mb-1">
                                        {topic?.name || `Topic #${sessionTopic.topicId}`}
                                      </h5>
                                      {topic && (
                                        <p className="text-sm text-gray-600">
                                          {topic.aiGeneratedContent?.enhancedContent?.enhancedDescription ||
                                            topic.description ||
                                            'No description available'}
                                        </p>
                                      )}
                                      {!topic && (
                                        <p className="text-sm text-red-600">
                                          Topic details not found
                                        </p>
                                      )}
                                    </div>

                                    {/* Metadata Badges */}
                                    <div className="flex flex-wrap gap-2">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Duration: {formatDuration(sessionTopic.durationMinutes)}
                                      </span>
                                      {trainer && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Trainer: {trainer.name}
                                        </span>
                                      )}
                                      {sessionTopic.trainerId && !trainer && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          Trainer not found
                                        </span>
                                      )}
                                    </div>

                                    {/* Custom Notes */}
                                    {sessionTopic.notes && (
                                      <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                                        <span className="font-medium">Notes:</span> {sessionTopic.notes}
                                      </div>
                                    )}
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
          )}

          {isReordering && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-600">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving new order...
            </div>
          )}
        </div>

        {/* AI Generated Content Section */}
        {session.aiGeneratedContent && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">AI-Generated Content</h3>
            {renderAIContent()}
          </div>
        )}

        {/* Status Section */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Session Status</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publishing Status
              </label>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  session.publishingStatus === 'PUBLISHED'
                    ? 'bg-green-100 text-green-800'
                    : session.publishingStatus === 'DRAFT'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {session.publishingStatus || 'DRAFT'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.createdAt ? formatDateTime(session.createdAt) : 'Unknown'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Updated
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {session.updatedAt ? formatDateTime(session.updatedAt) : 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    </div>
  );
};
