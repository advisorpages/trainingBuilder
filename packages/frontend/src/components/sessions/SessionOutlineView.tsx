import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { maskTrainerName } from '../../utils/trainerPrivacy';
import { Clock, Users, Target, Package, BookOpen, ClipboardList, UserPlus, Loader2, Check, AlertCircle } from 'lucide-react';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';

interface DisplayTopic {
  id: string;
  topicId?: number | string;
  name: string;
  description?: string;
  sequenceOrder: number;
  trainers: Array<{ id: number | string; name?: string }>;
  durationMinutes?: number;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  callToAction?: string;
}

interface SessionOutlineViewProps {
  topics: DisplayTopic[];
  enableTrainerAssignment?: boolean;
  onTrainerAssignmentChange?: (topicId: string, trainerId: number | null) => Promise<void>;
  readonly?: boolean;
}

export const SessionOutlineView: React.FC<SessionOutlineViewProps> = ({
  topics,
  enableTrainerAssignment = false,
  onTrainerAssignmentChange,
  readonly = false
}) => {
  const [allTrainers, setAllTrainers] = useState<Trainer[]>([]);
  const [isLoadingTrainers, setIsLoadingTrainers] = useState(false);
  const [updatingAssignments, setUpdatingAssignments] = useState<Set<string>>(new Set());
  const [assignmentSuccess, setAssignmentSuccess] = useState<Set<string>>(new Set());

  // Fetch trainers when trainer assignment is enabled
  useEffect(() => {
    if (enableTrainerAssignment && !readonly) {
      const fetchTrainers = async () => {
        setIsLoadingTrainers(true);
        try {
          const response = await trainerService.getTrainers({ limit: 100 });
          setAllTrainers(response.trainers);
        } catch (error) {
          console.error('Failed to fetch trainers:', error);
        } finally {
          setIsLoadingTrainers(false);
        }
      };

      fetchTrainers();
    }
  }, [enableTrainerAssignment, readonly]);

  // Handle trainer assignment change
  const handleTrainerChange = async (topicId: string, trainerId: string) => {
    if (!onTrainerAssignmentChange || readonly) return;

    const newTrainerId = trainerId ? parseInt(trainerId, 10) : null;

    // Add to updating set
    setUpdatingAssignments(prev => new Set(prev).add(topicId));
    setAssignmentSuccess(prev => {
      const newSet = new Set(prev);
      newSet.delete(topicId);
      return newSet;
    });

    try {
      await onTrainerAssignmentChange(topicId, newTrainerId);
      // Show success indicator
      setAssignmentSuccess(prev => new Set(prev).add(topicId));
      setTimeout(() => {
        setAssignmentSuccess(prev => {
          const newSet = new Set(prev);
          newSet.delete(topicId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to update trainer assignment:', error);
    } finally {
      // Remove from updating set
      setUpdatingAssignments(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  // Helper function to parse bullet lists
  const parseBulletList = (value?: string | string[] | null): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || '').replace(/^•\s*/, '').trim())
        .filter(Boolean);
    }

    return String(value || '')
      .split('\n')
      .map((item) => item.replace(/^•\s*/, '').trim())
      .filter(Boolean);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes || minutes <= 0) return 'Duration TBD';
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr ${remainder} min`;
  };

  if (topics.length === 0) {
    return (
      <Card className="border border-slate-200 bg-slate-50">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <div className="h-16 w-16 mx-auto flex items-center justify-center rounded-full bg-slate-100">
              <BookOpen className="h-8 w-8" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Topics Available</h3>
          <p className="text-slate-600 max-w-md mx-auto">
            This session doesn't have any topics assigned yet. Topics will appear here once they are added.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-900">Session Outline</h3>
        <Badge variant="outline" className="text-sm">
          {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
        </Badge>
      </div>

      <div className="space-y-4">
        {topics.map((topic, index) => {
          const learningOutcomes = parseBulletList(topic.learningOutcomes);
          const materials = parseBulletList(topic.materialsNeeded);
          const trainerTasks = parseBulletList(topic.trainerNotes);
          const hasDetails = learningOutcomes.length > 0 || materials.length > 0 ||
                           trainerTasks.length > 0 || topic.deliveryGuidance || topic.callToAction;

          return (
            <Card
              key={topic.id}
              className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                {/* Topic Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 border border-blue-200">
                        {topic.sequenceOrder}
                      </div>
                      <h4 className="text-lg font-semibold text-slate-900 leading-tight">
                        {topic.name}
                      </h4>
                    </div>

                    {/* Duration and Trainer Info */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(topic.durationMinutes)}</span>
                        </div>

                        {/* Current Trainer Display */}
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {topic.trainers && topic.trainers.length > 0 ? (
                            <div className="flex items-center gap-2">
                              {topic.trainers.map((trainer, trainerIndex) => (
                                <span
                                  key={trainer.id || trainerIndex}
                                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                                    enableTrainerAssignment && !readonly
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {maskTrainerName(trainer.name)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-md ${
                              enableTrainerAssignment && !readonly
                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                : 'text-slate-500'
                            }`}>
                              No trainer assigned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Trainer Assignment Control */}
                      {enableTrainerAssignment && !readonly && (
                        <div className="flex items-center gap-2">
                          {assignmentSuccess.has(topic.id) && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-3 w-3" />
                              <span className="text-xs">Updated</span>
                            </div>
                          )}

                          {updatingAssignments.has(topic.id) ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                              <span className="text-xs text-slate-500">Updating...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <select
                                value={topic.trainers?.[0]?.id || ''}
                                onChange={(e) => handleTrainerChange(topic.id, e.target.value)}
                                className="w-40 h-8 px-2 py-1 text-xs bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-300 transition-colors"
                                disabled={isLoadingTrainers}
                              >
                                <option value="">Assign trainer...</option>
                                {allTrainers.map((trainer) => (
                                  <option key={trainer.id} value={trainer.id}>
                                    {trainer.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Topic Description */}
                {topic.description && (
                  <div className="mb-4">
                    <p className="text-slate-700 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                )}

                {/* Expandable Details */}
                {hasDetails && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    {/* Learning Outcomes */}
                    {learningOutcomes.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="h-4 w-4 text-blue-600" />
                          <h5 className="text-sm font-semibold text-blue-900">Learning Outcomes</h5>
                        </div>
                        <ul className="space-y-2">
                          {learningOutcomes.map((outcome, outcomeIndex) => (
                            <li key={outcomeIndex} className="text-sm text-blue-800 leading-relaxed flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Materials Needed */}
                    {materials.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="h-4 w-4 text-amber-600" />
                          <h5 className="text-sm font-semibold text-amber-900">Materials Needed</h5>
                        </div>
                        <ul className="space-y-2">
                          {materials.map((material, materialIndex) => (
                            <li key={materialIndex} className="text-sm text-amber-800 leading-relaxed flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>{material}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Trainer Notes */}
                    {trainerTasks.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <ClipboardList className="h-4 w-4 text-emerald-600" />
                          <h5 className="text-sm font-semibold text-emerald-900">Trainer Notes</h5>
                        </div>
                        <ul className="space-y-2">
                          {trainerTasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="text-sm text-emerald-800 leading-relaxed flex items-start gap-2">
                              <span className="text-emerald-500 mt-1">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Delivery Guidance */}
                    {topic.deliveryGuidance && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-slate-900 mb-2">Delivery Guidance</h5>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {topic.deliveryGuidance}
                        </p>
                      </div>
                    )}

                    {/* Call to Action */}
                    {topic.callToAction && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-purple-900 mb-2">Activities & Follow-up</h5>
                        <p className="text-sm text-purple-700 leading-relaxed">
                          {topic.callToAction}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Session Summary */}
      <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
        <h4 className="font-semibold text-slate-900 mb-4">Session Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-medium text-slate-900 mb-1">Total Duration</div>
            <div className="text-slate-600">
              {(() => {
                const totalMinutes = topics.reduce((sum, topic) => sum + (topic.durationMinutes || 0), 0);
                return formatDuration(totalMinutes);
              })()}
            </div>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Topics</div>
            <div className="text-slate-600">{topics.length} {topics.length === 1 ? 'topic' : 'topics'}</div>
          </div>
          <div>
            <div className="font-medium text-slate-900 mb-1">Assigned Trainers</div>
            <div className="text-slate-600">
              {(() => {
                const uniqueTrainers = new Set();
                topics.forEach(topic => {
                  topic.trainers?.forEach(trainer => {
                    if (trainer.name) uniqueTrainers.add(maskTrainerName(trainer.name));
                  });
                });
                return uniqueTrainers.size > 0 ? `${uniqueTrainers.size} trainer${uniqueTrainers.size > 1 ? 's' : ''}` : 'No trainers assigned';
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};