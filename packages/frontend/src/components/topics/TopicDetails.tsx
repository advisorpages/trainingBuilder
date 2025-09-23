import React from 'react';
import { Topic } from '@leadership-training/shared';

interface TopicDetailsProps {
  topic: Topic;
  onBack: () => void;
}

export const TopicDetails: React.FC<TopicDetailsProps> = ({
  topic,
  onBack,
}) => {
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        Topic Details
      </h3>

      <div className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
            {topic.name}
          </div>
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 min-h-[100px]">
            {topic.description || (
              <span className="text-gray-400 italic">No description provided</span>
            )}
          </div>
        </div>

        {/* Active Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              topic.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {topic.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {topic.isActive
              ? 'This topic is available for new sessions'
              : 'This topic is not available for new sessions'
            }
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
              {formatDate(topic.createdAt)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
              {formatDate(topic.updatedAt)}
            </div>
          </div>
        </div>

        {/* Session Count (if available) */}
        {topic.sessions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Associated Sessions
            </label>
            <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900">
              {topic.sessions.length === 0 ? (
                <span className="text-gray-400 italic">No sessions using this topic</span>
              ) : (
                `${topic.sessions.length} session${topic.sessions.length === 1 ? '' : 's'} using this topic`
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to List
        </button>
      </div>
    </div>
  );
};