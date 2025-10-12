import React, { useState, useEffect } from 'react';
import { Topic, Trainer } from '@leadership-training/shared';
import { EnhancedTopicCard, SessionTopicDetail } from './EnhancedTopicCard';
import { DraggableSessionFlow } from './DraggableSessionFlow';

interface EnhancedTopicSelectionProps {
  topics: Topic[];
  trainers: Trainer[];
  initialSelectedTopics?: number[];
  initialTopicDetails?: SessionTopicDetail[];
  onSelectionChange: (selectedTopicDetails: SessionTopicDetail[]) => void;
}

export const EnhancedTopicSelection: React.FC<EnhancedTopicSelectionProps> = ({
  topics,
  trainers,
  initialSelectedTopics = [],
  initialTopicDetails,
  onSelectionChange
}) => {
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<SessionTopicDetail[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showRecentlyUpdated, setShowRecentlyUpdated] = useState(false);
  const [showHighUsageOnly, setShowHighUsageOnly] = useState(false);

  useEffect(() => {
    if (
      initialTopicDetails &&
      initialTopicDetails.length > 0 &&
      selectedTopicDetails.length === 0
    ) {
      const normalized = initialTopicDetails
        .map((detail, index) => ({
          topicId: detail.topicId,
          sequenceOrder: detail.sequenceOrder ?? index + 1,
          durationMinutes: detail.durationMinutes ?? 30,
          assignedTrainerId: detail.assignedTrainerId ?? undefined,
          notes: detail.notes ?? '',
        }))
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder);

      setSelectedTopicDetails(normalized);
    }
  }, [initialTopicDetails, selectedTopicDetails.length]);

  // Initialize selected topics (only once)
useEffect(() => {
  if (
    (!initialTopicDetails || initialTopicDetails.length === 0) &&
    initialSelectedTopics.length > 0 &&
    selectedTopicDetails.length === 0
  ) {
    const initialDetails = initialSelectedTopics.map((topicId, index) => {
      const topic = topics.find(t => t.id === topicId);
      const savedPosition = (topic as any)?.aiGeneratedContent?.sectionPosition ?? (index + 1);
      return {
        topicId,
        sequenceOrder: savedPosition,
        durationMinutes: 30, // default duration
        assignedTrainerId: undefined,
        notes: ''
      };
    });
    setSelectedTopicDetails(initialDetails);
  }
  // We only want this to run once on mount when selection is empty.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [initialSelectedTopics, selectedTopicDetails.length, topics]);

// Calculate total duration whenever selection changes
useEffect(() => {
  const total = selectedTopicDetails.reduce((sum, detail) => sum + detail.durationMinutes, 0);
  setTotalDuration(total);
  onSelectionChange(selectedTopicDetails);
}, [selectedTopicDetails, onSelectionChange]);

  const isTopicSelected = (topicId: number) => selectedTopicDetails.some(detail => detail.topicId === topicId);

  const getTopicDetail = (topicId: number) => selectedTopicDetails.find(detail => detail.topicId === topicId);

  const handleTopicSelect = (topicId: number, selected: boolean) => {
    if (selected) {
      // Add topic with default values
      const newDetail: SessionTopicDetail = {
        topicId,
        sequenceOrder: selectedTopicDetails.length + 1,
        durationMinutes: 30,
        assignedTrainerId: undefined,
        notes: ''
      };
      setSelectedTopicDetails(prev => [...prev, newDetail]);
    } else {
      // Remove topic and reorder
      setSelectedTopicDetails(prev => {
        const filtered = prev.filter(detail => detail.topicId !== topicId);
        // Reorder sequence
        return filtered.map((detail, index) => ({
          ...detail,
          sequenceOrder: index + 1
        }));
      });
    }
  };

  const handleTopicDetailChange = (updatedDetail: SessionTopicDetail) => {
    setSelectedTopicDetails(prev =>
      prev.map(detail =>
        detail.topicId === updatedDetail.topicId ? updatedDetail : detail
      )
    );
  };

  const handleReorder = (reorderedDetails: SessionTopicDetail[]) => {
    setSelectedTopicDetails(reorderedDetails);
  };

  const formatTotalDuration = (minutes: number) => {
    if (minutes === 0) return '0 minutes';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSequenceOrder = (topicId: number) => {
    const detail = getTopicDetail(topicId);
    return detail ? detail.sequenceOrder : selectedTopicDetails.length + 1;
  };

  const clearFilters = () => {
    setShowActiveOnly(true);
    setShowRecentlyUpdated(false);
    setShowHighUsageOnly(false);
    setSortBy('name');
    setSearchTerm('');
  };

  const filteredAndSortedTopics = React.useMemo(() => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    const filtered = topics.filter(topic => {
      if (showActiveOnly && !topic.isActive) {
        return false;
      }

      if (showRecentlyUpdated) {
        const updatedAt = topic.updatedAt ? new Date(topic.updatedAt).getTime() : 0;
        if (Number.isNaN(updatedAt) || now - updatedAt > THIRTY_DAYS_MS) {
          return false;
        }
      }

      if (showHighUsageOnly) {
        const usageCount = Array.isArray(topic.sessions) ? topic.sessions.length : 0;
        if (usageCount < 3) {
          return false;
        }
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = topic.name.toLowerCase().includes(searchLower);
        const matchesDescription =
          typeof topic.description === 'string' && topic.description.toLowerCase().includes(searchLower);
        const matchesLearningOutcomes =
          typeof topic.learningOutcomes === 'string' &&
          topic.learningOutcomes.toLowerCase().includes(searchLower);

        if (!(matchesName || matchesDescription || matchesLearningOutcomes)) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'usage': {
          const usageA = Array.isArray(a.sessions) ? a.sessions.length : 0;
          const usageB = Array.isArray(b.sessions) ? b.sessions.length : 0;
          if (usageA === usageB) {
            return a.name.localeCompare(b.name);
          }
          return usageB - usageA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [topics, searchTerm, sortBy, showActiveOnly, showRecentlyUpdated, showHighUsageOnly]);

  const activeFilterCount =
    Number(!showActiveOnly) + Number(showRecentlyUpdated) + Number(showHighUsageOnly) + (sortBy !== 'name' ? 1 : 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(380px,1fr)]">
        <div className="space-y-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900">Session Topics</h3>
              <span className="text-sm text-gray-500">
                {filteredAndSortedTopics.length} topic{filteredAndSortedTopics.length !== 1 ? 's' : ''} available
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by topic name, description, or outcomes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Clear search</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'usage' | 'recent')}
                  className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="recent">Recently Updated</option>
                  <option value="usage">Most Used</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowActiveOnly((prev) => !prev)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition ${
                    showActiveOnly
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {showActiveOnly ? 'Active only' : 'Include inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRecentlyUpdated((prev) => !prev)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition ${
                    showRecentlyUpdated
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  Recently updated
                </button>
                <button
                  type="button"
                  onClick={() => setShowHighUsageOnly((prev) => !prev)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm transition ${
                    showHighUsageOnly
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  Popular topics
                </button>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              Browse topics on the left and build your session flow on the right. Drag selected topics to reorder, adjust
              duration, or assign trainers without leaving this screen.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredAndSortedTopics.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.294-5.647-3.379m-.353-1.621A7.963 7.963 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8c0 2.152-.851 4.12-2.264 5.621m-7.736 2.379A7.962 7.962 0 0112 21c2.34 0 4.5-1.294 5.647-3.379" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or clearing the search.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-500"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredAndSortedTopics.map((topic) => (
                <EnhancedTopicCard
                  key={topic.id}
                  topic={topic}
                  trainers={trainers}
                  isSelected={isTopicSelected(topic.id)}
                  sessionTopicDetail={getTopicDetail(topic.id)}
                  onSelect={(selected) => handleTopicSelect(topic.id, selected)}
                  onDetailChange={handleTopicDetailChange}
                  sequenceOrder={getSequenceOrder(topic.id)}
                />
              ))
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-4 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-gray-200 p-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Selected Topics</h4>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedTopicDetails.length} selected • {formatTotalDuration(totalDuration)}
                </p>
              </div>
              {selectedTopicDetails.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTopicDetails([])}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="p-4">
              {selectedTopicDetails.length === 0 ? (
                <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-600">
                    Select topics from the catalog to build your session agenda. Drag topics to reorder and edit details
                    as you go.
                  </p>
                </div>
              ) : (
                <DraggableSessionFlow
                  selectedTopicDetails={selectedTopicDetails}
                  topics={topics}
                  trainers={trainers}
                  onReorder={handleReorder}
                />
              )}
            </div>

            {totalDuration > 480 && (
              <div className="border-t border-gray-200 bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Long session:</strong> {formatTotalDuration(totalDuration)} scheduled. Consider splitting the flow or
                      trimming durations.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
