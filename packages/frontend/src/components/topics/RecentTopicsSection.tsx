import React, { useState, useEffect } from 'react';
import { Topic } from '@leadership-training/shared';
import { topicService } from '../../services/topic.service';

interface RecentTopicsSectionProps {
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onStatusChange?: (topic: Topic, isActive: boolean) => Promise<void>;
  refreshTrigger?: number;
  includeInactive?: boolean;
}

export const RecentTopicsSection: React.FC<RecentTopicsSectionProps> = ({
  onEdit,
  onDelete,
  onStatusChange,
  refreshTrigger = 0,
  includeInactive = false
}) => {
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<Set<number>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

  const fetchRecentTopics = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const topics = await topicService.getRecentTopics(5, { includeInactive });
      setRecentTopics(topics);
    } catch (err) {
      setError('Failed to load recent topics');
      console.error('Error fetching recent topics:', err);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchRecentTopics();
  }, [fetchRecentTopics, refreshTrigger]);

  const handleStatusToggle = async (topic: Topic) => {
    if (togglingStatus.has(topic.id)) return;

    try {
      setTogglingStatus(prev => new Set([...prev, topic.id]));

      if (onStatusChange) {
        await onStatusChange(topic, !topic.isActive);
      } else {
        await topicService.updateTopic(topic.id, { isActive: !topic.isActive });
        setRecentTopics(prev => prev.map(t =>
          t.id === topic.id ? { ...t, isActive: !topic.isActive } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle topic status:', error);
    } finally {
      setTogglingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(topic.id);
        return newSet;
      });
    }
  };

  const toggleTopicDetails = (topicId: number) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const formatMultiline = (value?: string | null) =>
    value ? value.trim().replace(/\n{3,}/g, '\n\n') : '';

  if (loading) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
          <button
            onClick={fetchRecentTopics}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (recentTopics.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h2>
        <div className="text-center py-8 text-gray-500">
          No recent topics found.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Topics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {recentTopics.map((topic) => {
          const hasOptionalDetails = Boolean(
            topic.learningOutcomes ||
            topic.trainerNotes ||
            topic.materialsNeeded ||
            topic.deliveryGuidance ||
            (topic.sessions && topic.sessions.length > 0)
          );

          const isTopicExpanded = expandedTopics.has(topic.id);
          const createdAt = new Date(topic.createdAt);
          const updatedAt = topic.updatedAt ? new Date(topic.updatedAt) : createdAt;

          return (
            <div
              key={topic.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                  {topic.name}
                </h3>
                <div className="ml-2 flex-shrink-0">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={topic.isActive}
                      onChange={() => handleStatusToggle(topic)}
                      disabled={togglingStatus.has(topic.id)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      topic.isActive ? 'bg-green-600' : 'bg-gray-200'
                    } ${togglingStatus.has(topic.id) ? 'opacity-50' : ''}`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        topic.isActive ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </div>
                    {togglingStatus.has(topic.id) && (
                      <div className="ml-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {topic.description && (
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-line">
                  {formatMultiline(topic.description)}
                </p>
              )}

              {topic.category && (
                <div className="mb-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {topic.category.name}
                  </span>
                </div>
              )}

              {isTopicExpanded && (
                <div className="space-y-4 text-sm text-gray-600 mb-4">
                  {hasOptionalDetails && (
                    <>
                      {topic.learningOutcomes && (
                        <div>
                          <span className="font-medium text-gray-700">Learning Outcomes</span>
                          <p className="mt-1 whitespace-pre-line">{formatMultiline(topic.learningOutcomes)}</p>
                        </div>
                      )}
                      {topic.trainerNotes && (
                        <div>
                          <span className="font-medium text-gray-700">Trainer Notes</span>
                          <p className="mt-1 whitespace-pre-line">{formatMultiline(topic.trainerNotes)}</p>
                        </div>
                      )}
                      {topic.materialsNeeded && (
                        <div>
                          <span className="font-medium text-gray-700">Materials Needed</span>
                          <p className="mt-1 whitespace-pre-line">{formatMultiline(topic.materialsNeeded)}</p>
                        </div>
                      )}
                      {topic.deliveryGuidance && (
                        <div>
                          <span className="font-medium text-gray-700">Delivery Guidance</span>
                          <p className="mt-1 whitespace-pre-line">{formatMultiline(topic.deliveryGuidance)}</p>
                        </div>
                      )}
                      {topic.sessions && topic.sessions.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Usage</span>
                          <p className="mt-1">
                            Used in {topic.sessions.length} session{topic.sessions.length === 1 ? '' : 's'}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Topic Metadata</span>
                    <ul className="mt-1 space-y-1 text-sm text-gray-600">
                      <li>Status: {topic.isActive ? 'Active' : 'Inactive'}</li>
                      <li>Created: {createdAt.toLocaleString()}</li>
                      <li>Updated: {updatedAt.toLocaleString()}</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => toggleTopicDetails(topic.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    {isTopicExpanded ? 'Show less' : 'Show more'}
                  </button>
                  <span>{createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onEdit(topic)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit topic"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(topic)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete topic"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
