import React, { useState, useEffect } from 'react';
import { Topic, Trainer } from '../../../../shared/src/types';
import { EnhancedTopicCard, SessionTopicDetail } from './EnhancedTopicCard';
import { DraggableSessionFlow } from './DraggableSessionFlow';

interface EnhancedTopicSelectionProps {
  topics: Topic[];
  trainers: Trainer[];
  initialSelectedTopics?: number[];
  onSelectionChange: (selectedTopicDetails: SessionTopicDetail[]) => void;
}

export const EnhancedTopicSelection: React.FC<EnhancedTopicSelectionProps> = ({
  topics,
  trainers,
  initialSelectedTopics = [],
  onSelectionChange
}) => {
  const [selectedTopicDetails, setSelectedTopicDetails] = useState<SessionTopicDetail[]>([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'recent'>('name');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Initialize selected topics (only once)
  useEffect(() => {
    if (initialSelectedTopics.length > 0 && selectedTopicDetails.length === 0) {
      const initialDetails = initialSelectedTopics.map((topicId, index) => ({
        topicId,
        sequenceOrder: index + 1,
        durationMinutes: 30, // default duration
        assignedTrainerId: undefined,
        notes: ''
      }));
      setSelectedTopicDetails(initialDetails);
    }
  }, [initialSelectedTopics]);

  // Calculate total duration whenever selection changes
  useEffect(() => {
    const total = selectedTopicDetails.reduce((sum, detail) => sum + detail.durationMinutes, 0);
    setTotalDuration(total);
    onSelectionChange(selectedTopicDetails);
  }, [selectedTopicDetails]);

  const isTopicSelected = (topicId: number) => {
    return selectedTopicDetails.some(detail => detail.topicId === topicId);
  };

  const getTopicDetail = (topicId: number) => {
    return selectedTopicDetails.find(detail => detail.topicId === topicId);
  };

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

  // Filter and sort topics
  const filteredAndSortedTopics = React.useMemo(() => {
    let filtered = topics.filter(topic => {
      // Filter by active status
      if (showActiveOnly && !topic.isActive) return false;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          topic.name.toLowerCase().includes(searchLower) ||
          (topic.description && topic.description.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Sort topics
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'usage':
          // For now, sort by name as we don't have usage data yet
          // TODO: Implement usage-based sorting when backend provides usage stats
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [topics, searchTerm, sortBy, showActiveOnly]);

  return (
    <div className="space-y-6">
      {/* Header with summary */}
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium text-gray-900">Session Topics</h3>
        {selectedTopicDetails.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedTopicDetails.length} topics selected</span>
            <span className="ml-2">• Total duration: {formatTotalDuration(totalDuration)}</span>
          </div>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search topics by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
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

          {/* Active Filter Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showActiveOnly"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="showActiveOnly" className="text-sm font-medium text-gray-700">
              Active topics only
            </label>
          </div>

          {/* Results count */}
          <div className="text-sm text-gray-500 ml-auto">
            {filteredAndSortedTopics.length} topic{filteredAndSortedTopics.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          Select topics for your session. For each selected topic, you can specify the duration,
          assign a trainer, and add notes. Once selected, you can drag and drop items in the Session Flow Summary to reorder them.
        </p>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-1.294-5.647-3.379m-.353-1.621A7.963 7.963 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8c0 2.152-.851 4.12-2.264 5.621m-7.736 2.379A7.962 7.962 0 0112 21c2.34 0 4.5-1.294 5.647-3.379" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No topics found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? `No topics match "${searchTerm}". Try adjusting your search terms.`
                : 'No topics available with the current filters.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-sm text-blue-600 hover:text-blue-500"
              >
                Clear search
              </button>
            )}
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

      {/* Draggable Session Flow Summary */}
      <DraggableSessionFlow
        selectedTopicDetails={selectedTopicDetails}
        topics={topics}
        trainers={trainers}
        onReorder={handleReorder}
      />

      {/* Validation warnings */}
      {totalDuration > 480 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Long session warning:</strong> Total duration ({formatTotalDuration(totalDuration)})
                exceeds 8 hours. Consider breaking this into multiple sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};