import React, { useState, useEffect } from 'react';
import { Session, Trainer, Location, Audience, Tone, Category, Topic } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';
import { locationService } from '../../services/location.service';
import { attributesService } from '../../services/attributes.service';
import { topicService } from '../../services/topic.service';

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
    return trainer ? `${trainer.name} - ${trainer.specialization}` : 'Not found';
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

  const getTopicNames = () => {
    if (!session.topics || session.topics.length === 0) return 'No topics selected';
    return session.topics.map(topic => topic.name).join(', ');
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

            {/* Trainer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trainer
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
                {getTrainerName(session.trainerId)}
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
          <h3 className="text-md font-medium text-gray-900 mb-4">Session Topics</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Topics
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-900">
              {getTopicNames()}
            </div>
          </div>
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
