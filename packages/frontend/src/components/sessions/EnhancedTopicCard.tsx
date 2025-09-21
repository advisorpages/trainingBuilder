import React from 'react';
import { Topic, Trainer } from '../../../../shared/src/types';

export interface SessionTopicDetail {
  topicId: number;
  sequenceOrder: number;
  durationMinutes: number;
  assignedTrainerId?: number;
  notes?: string;
}

interface EnhancedTopicCardProps {
  topic: Topic;
  trainers: Trainer[];
  isSelected: boolean;
  sessionTopicDetail?: SessionTopicDetail;
  onSelect: (selected: boolean) => void;
  onDetailChange: (detail: SessionTopicDetail) => void;
  sequenceOrder: number;
}

export const EnhancedTopicCard: React.FC<EnhancedTopicCardProps> = ({
  topic,
  trainers,
  isSelected,
  sessionTopicDetail,
  onSelect,
  onDetailChange,
  sequenceOrder
}) => {
  // Use props directly instead of local state to prevent sync issues
  const durationMinutes = sessionTopicDetail?.durationMinutes || 30;
  const assignedTrainerId = sessionTopicDetail?.assignedTrainerId || '';
  const notes = sessionTopicDetail?.notes || '';

  const handleSelectionChange = (checked: boolean) => {
    onSelect(checked);
    if (checked) {
      // When selected, provide default values
      onDetailChange({
        topicId: topic.id,
        sequenceOrder,
        durationMinutes,
        assignedTrainerId: assignedTrainerId ? Number(assignedTrainerId) : undefined,
        notes
      });
    }
  };

  const handleDurationChange = (newDuration: number) => {
    if (isSelected) {
      onDetailChange({
        topicId: topic.id,
        sequenceOrder,
        durationMinutes: newDuration,
        assignedTrainerId: assignedTrainerId ? Number(assignedTrainerId) : undefined,
        notes
      });
    }
  };

  const handleTrainerChange = (trainerId: string) => {
    if (isSelected) {
      onDetailChange({
        topicId: topic.id,
        sequenceOrder,
        durationMinutes,
        assignedTrainerId: trainerId ? Number(trainerId) : undefined,
        notes
      });
    }
  };

  const handleNotesChange = (newNotes: string) => {
    if (isSelected) {
      onDetailChange({
        topicId: topic.id,
        sequenceOrder,
        durationMinutes,
        assignedTrainerId: assignedTrainerId ? Number(assignedTrainerId) : undefined,
        notes: newNotes
      });
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 ${
      isSelected
        ? 'border-blue-500 bg-blue-50 shadow-md'
        : 'border-gray-300 bg-white hover:border-gray-400'
    }`}>
      {/* Header with selection checkbox */}
      <div className="flex items-start space-x-3 mb-3">
        <div className="flex items-center h-5 mt-1">
          <input
            type="checkbox"
            id={`topic-${topic.id}`}
            checked={isSelected}
            onChange={(e) => handleSelectionChange(e.target.checked)}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>
        <div className="flex-1">
          <label htmlFor={`topic-${topic.id}`} className="block">
            <div className="flex items-start justify-between">
              <h4 className="text-sm font-medium text-gray-900 cursor-pointer">
                {topic.name}
              </h4>
              {!topic.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inactive
                </span>
              )}
            </div>
            {topic.description && (
              <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
            )}

            {/* Topic metadata */}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>ID: {topic.id}</span>
              <span>•</span>
              <span title={new Date(topic.createdAt).toLocaleString()}>
                Created: {new Date(topic.createdAt).toLocaleDateString()}
              </span>
              {topic.updatedAt !== topic.createdAt && (
                <>
                  <span>•</span>
                  <span title={new Date(topic.updatedAt).toLocaleString()}>
                    Updated: {new Date(topic.updatedAt).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Configuration section - only show when selected */}
      {isSelected && (
        <div className="mt-4 space-y-4 border-t border-blue-200 pt-4">
          {/* Duration Slider */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Duration: {formatDuration(durationMinutes)}
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500">15m</span>
              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={durationMinutes}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-500">3h</span>
            </div>
          </div>

          {/* Trainer Assignment */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assigned Trainer (Optional)
            </label>
            <select
              value={assignedTrainerId}
              onChange={(e) => handleTrainerChange(e.target.value)}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select trainer...</option>
              {trainers.map((trainer) => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.firstName} {trainer.lastName}
                  {trainer.expertise && ` - ${trainer.expertise}`}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Special instructions, materials needed, etc..."
              rows={2}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Order indicator */}
      {isSelected && (
        <div className="mt-3 flex items-center justify-between text-xs text-blue-600">
          <span>Session order: #{sequenceOrder}</span>
          <span className="bg-blue-100 px-2 py-1 rounded">Selected</span>
        </div>
      )}
    </div>
  );
};