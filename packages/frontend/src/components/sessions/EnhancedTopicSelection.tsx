import React, { useState, useEffect } from 'react';
import { Topic, Trainer } from '../../../../shared/src/types';
import { EnhancedTopicCard, SessionTopicDetail } from './EnhancedTopicCard';

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

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          Select topics for your session. For each selected topic, you can specify the duration,
          assign a trainer, and add notes. Topics will be arranged in the order you select them.
        </p>
      </div>

      {/* Topic Cards Grid */}
      <div className="grid grid-cols-1 gap-4">
        {topics.map((topic) => (
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
        ))}
      </div>

      {/* Selected Topics Summary */}
      {selectedTopicDetails.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Session Flow Summary</h4>
          <div className="space-y-2">
            {selectedTopicDetails
              .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
              .map((detail, index) => {
                const topic = topics.find(t => t.id === detail.topicId);
                const trainer = detail.assignedTrainerId
                  ? trainers.find(t => t.id === detail.assignedTrainerId)
                  : null;

                return (
                  <div key={detail.topicId} className="flex items-center text-sm">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{topic?.name}</span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-600">{formatTotalDuration(detail.durationMinutes)}</span>
                    {trainer && (
                      <>
                        <span className="mx-2 text-gray-400">•</span>
                        <span className="text-gray-600">{trainer.firstName} {trainer.lastName}</span>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

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