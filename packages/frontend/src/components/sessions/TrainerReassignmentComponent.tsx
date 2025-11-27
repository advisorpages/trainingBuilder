import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';
import { Users, UserCheck, UserX, Loader2, ChevronDown, ChevronUp, Settings, AlertCircle } from 'lucide-react';

interface DisplayTopic {
  id: string;
  topicId?: number | string;
  name: string;
  sequenceOrder: number;
  trainers: Array<{ id: number | string; name?: string }>;
}

interface TrainerReassignmentComponentProps {
  topics: DisplayTopic[];
  onTrainerAssignmentChange: (topicId: string, trainerId: number | null) => void;
}

export const TrainerReassignmentComponent: React.FC<TrainerReassignmentComponentProps> = ({
  topics,
  onTrainerAssignmentChange
}) => {
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [trainerError, setTrainerError] = useState<string | null>(null);
  const [updatingAssignments, setUpdatingAssignments] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [bulkTrainerId, setBulkTrainerId] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  // Fetch all available trainers
  useEffect(() => {
    const fetchTrainers = async () => {
      setIsLoadingTrainers(true);
      setTrainerError(null);
      try {
        const response = await trainerService.getTrainers({ limit: 100 });
        setAllTrainers(response.trainers);
      } catch (error) {
        console.error('Failed to fetch trainers:', error);
        setTrainerError('Failed to load trainers');
      } finally {
        setIsLoadingTrainers(false);
      }
    };

    fetchTrainers();
  }, []);

  const handleTrainerChange = async (topicId: string, trainerId: string) => {
    const newTrainerId = trainerId ? parseInt(trainerId, 10) : null;

    // Add to updating set to show loading state
    setUpdatingAssignments(prev => new Set(prev).add(topicId));

    try {
      await onTrainerAssignmentChange(topicId, newTrainerId);
    } catch (error) {
      console.error('Failed to update trainer assignment:', error);
      // You could show a toast notification here
    } finally {
      // Remove from updating set
      setUpdatingAssignments(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  const getCurrentTrainer = (topic: DisplayTopic) => {
    return topic.trainers && topic.trainers.length > 0 ? topic.trainers[0] : null;
  };

  const isCurrentlyUpdating = (topicId: string) => {
    return updatingAssignments.has(topicId);
  };

  // Handle topic selection for bulk operations
  const handleTopicSelection = (topicId: string, isSelected: boolean) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(topicId);
      } else {
        newSet.delete(topicId);
      }
      return newSet;
    });
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (selectedTopics.size === topics.length) {
      setSelectedTopics(new Set());
    } else {
      setSelectedTopics(new Set(topics.map(topic => topic.id)));
    }
  };

  // Handle bulk trainer assignment
  const handleBulkAssignment = async () => {
    if (!bulkTrainerId || selectedTopics.size === 0) return;

    setIsBulkUpdating(true);
    const trainerId = parseInt(bulkTrainerId, 10);

    try {
      const promises = Array.from(selectedTopics).map(topicId =>
        onTrainerAssignmentChange(topicId, trainerId)
      );
      await Promise.all(promises);

      // Clear selections after successful bulk assignment
      setSelectedTopics(new Set());
      setBulkTrainerId('');
    } catch (error) {
      console.error('Failed to perform bulk assignment:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Calculate trainer statistics
  const getTrainerStats = () => {
    const assignedCount = topics.filter(topic => getCurrentTrainer(topic)).length;
    const unassignedCount = topics.length - assignedCount;
    const uniqueTrainers = new Set();

    topics.forEach(topic => {
      const trainer = getCurrentTrainer(topic);
      if (trainer) {
        uniqueTrainers.add(trainer.name);
      }
    });

    return {
      assignedCount,
      unassignedCount,
      uniqueTrainerCount: uniqueTrainers.size,
      totalTopics: topics.length
    };
  };

  if (isLoadingTrainers) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
        <span className="text-slate-600">Loading trainers...</span>
      </div>
    );
  }

  if (trainerError) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
          {trainerError}
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="text-center py-8 text-slate-600">
        <Users className="h-12 w-12 mx-auto mb-3 text-slate-400" />
        <p>No topics available for trainer assignment.</p>
      </div>
    );
  }

  const stats = getTrainerStats();

  return (
    <div className="space-y-4">
      {/* Collapsible Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">Trainer Assignment Summary</h4>
          </div>
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 bg-white rounded border border-blue-100">
            <div className="text-lg font-semibold text-blue-900">{stats.assignedCount}</div>
            <div className="text-xs text-blue-600">Assigned</div>
          </div>
          <div className="text-center p-2 bg-white rounded border border-amber-100">
            <div className="text-lg font-semibold text-amber-700">{stats.unassignedCount}</div>
            <div className="text-xs text-amber-600">Unassigned</div>
          </div>
          <div className="text-center p-2 bg-white rounded border border-green-100">
            <div className="text-lg font-semibold text-green-700">{stats.uniqueTrainerCount}</div>
            <div className="text-xs text-green-600">Trainers</div>
          </div>
          <div className="text-center p-2 bg-white rounded border border-slate-100">
            <div className="text-lg font-semibold text-slate-700">{stats.totalTopics}</div>
            <div className="text-xs text-slate-600">Total Topics</div>
          </div>
        </div>

        {/* Status Indicator */}
        {stats.unassignedCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-amber-700">
              {stats.unassignedCount} topic{stats.unassignedCount !== 1 ? 's' : ''} need trainer assignment
            </span>
          </div>
        )}
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Bulk Assignment Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-slate-600" />
              <h5 className="font-medium text-slate-900">Bulk Assignment</h5>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedTopics.size === topics.length && topics.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="selectAll" className="text-sm text-slate-700">
                Select all ({selectedTopics.size} selected)
              </label>

              <select
                value={bulkTrainerId}
                onChange={(e) => setBulkTrainerId(e.target.value)}
                className="w-48 h-9 px-3 py-1 text-sm bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={selectedTopics.size === 0 || isBulkUpdating}
              >
                <option value="">Choose trainer...</option>
                {allTrainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>

              <Button
                onClick={handleBulkAssignment}
                disabled={selectedTopics.size === 0 || !bulkTrainerId || isBulkUpdating}
                size="sm"
                className="text-xs"
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign to Selected'
                )}
              </Button>
            </div>
          </div>

          {/* Individual Topic Assignments */}
          <div className="grid grid-cols-1 gap-3">
            {topics.map((topic) => {
              const currentTrainer = getCurrentTrainer(topic);
              const isUpdating = isCurrentlyUpdating(topic.id);
              const isSelected = selectedTopics.has(topic.id);

              return (
                <div
                  key={topic.id}
                  className={`flex items-center justify-between p-3 bg-white border rounded-lg transition-colors ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  {/* Topic Info and Selection */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleTopicSelection(topic.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-300">
                      {topic.sequenceOrder}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">
                        {topic.name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm">
                        {currentTrainer ? (
                          <div className="flex items-center gap-1 text-green-700">
                            <UserCheck className="h-3 w-3" />
                            <span>{currentTrainer.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <UserX className="h-3 w-3" />
                            <span>No trainer assigned</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual Trainer Selection */}
                  <div className="flex items-center gap-2 min-w-0">
                    <select
                      value={currentTrainer?.id || ''}
                      onChange={(e) => handleTrainerChange(topic.id, e.target.value)}
                      disabled={isUpdating}
                      className="w-40 h-8 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value="">Assign trainer...</option>
                      {allTrainers.map((trainer) => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>

                    {isUpdating && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};