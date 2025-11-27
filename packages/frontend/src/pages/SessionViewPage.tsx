import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { sessionService } from '../services/session.service';
import { SessionStatus } from '@leadership-training/shared';
import { maskTrainerName, getTrainerDisplayString } from '../utils/trainerPrivacy';
import { transformLocationName } from '../utils/locationPrivacy';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Download,
  Eye,
  Edit,
  UserPlus,
  FileEdit,
  Loader2,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { SessionOutlineView } from '../components/sessions/SessionOutlineView';
import { TrainerReassignmentComponent } from '../components/sessions/TrainerReassignmentComponent';

interface SessionWithRelations {
  id: string;
  title: string;
  subtitle?: string;
  status: SessionStatus;
  readinessScore?: number;
  scheduledAt?: Date | string | null;
  durationMinutes?: number;
  location?: {
    name: string;
    locationType: string;
  };
  categoryId?: string;
  category?: {
    name: string;
  };
  topics?: any[];
  sessionTopics?: any[];
  objective?: string;
  audienceId?: string;
  toneId?: string;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
}

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

const StatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const statusConfig = {
    [SessionStatus.PUBLISHED]: {
      label: 'Published',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    [SessionStatus.COMPLETED]: {
      label: 'Completed',
      variant: 'secondary' as const,
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    [SessionStatus.CANCELLED]: {
      label: 'Cancelled',
      variant: 'outline' as const,
      className: 'bg-gray-50 text-gray-600 border-gray-200'
    },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700'
  };

  return (
    <Badge
      variant={config.variant}
      className={`text-sm font-medium px-3 py-1 ${config.className}`}
    >
      {config.label}
    </Badge>
  );
};

export const SessionViewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderedTopics, setOrderedTopics] = useState<DisplayTopic[]>([]);
  const [showTrainerReassignment, setShowTrainerReassignment] = useState(false);
  const [statusToggleDialogOpen, setStatusToggleDialogOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        setLoading(true);
        const sessionData = await sessionService.getSession(sessionId);
        setSession(sessionData);

        // Process topics for display
        const topics = processTopicsForDisplay(sessionData);
        setOrderedTopics(topics);
      } catch (err) {
        console.error('Failed to fetch session:', err);
        setError('Failed to load session. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const processTopicsForDisplay = (sessionData: SessionWithRelations): DisplayTopic[] => {
    if (!sessionData.sessionTopics || sessionData.sessionTopics.length === 0) {
      return [];
    }

    return sessionData.sessionTopics
      .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
      .map((sessionTopic, index) => {
        const trainers = sessionTopic.trainers || [];

        return {
          id: sessionTopic.topicId?.toString() || `topic-${index}`,
          topicId: sessionTopic.topicId,
          name: sessionTopic.topic?.name || `Topic ${index + 1}`,
          description: sessionTopic.topic?.description || sessionTopic.notes || '',
          sequenceOrder: sessionTopic.sequenceOrder || index + 1,
          trainers: trainers.map((trainer: any) => ({
            id: trainer.id,
            name: trainer.name
          })),
          durationMinutes: sessionTopic.durationMinutes,
          learningOutcomes: sessionTopic.topic?.learningOutcomes,
          trainerNotes: sessionTopic.notes,
          materialsNeeded: sessionTopic.topic?.materialsNeeded,
          deliveryGuidance: sessionTopic.topic?.deliveryGuidance,
          callToAction: sessionTopic.topic?.callToAction,
        };
      });
  };

  const handleTrainerAssignmentChange = async (topicId: string, trainerId: number | null) => {
    if (!session) return;

    try {
      // Find the session topic to update using topicId
      const sessionTopic = session.sessionTopics?.find(st => st.topicId?.toString() === topicId);
      if (!sessionTopic) return;

      // Update the trainer assignment using the topicId
      await sessionService.updateSessionTopic(session.id, topicId, {
        trainerId,
        notes: sessionTopic.notes
      });

      // Refresh session data
      const updatedSession = await sessionService.getSession(session.id);
      setSession(updatedSession);
      const topics = processTopicsForDisplay(updatedSession);
      setOrderedTopics(topics);
    } catch (error) {
      console.error('Failed to update trainer assignment:', error);
      // You could show a toast notification here
    }
  };

  const handleStatusToggle = async () => {
    if (!session) return;

    setIsTogglingStatus(true);
    try {
      const updatedSession = await sessionService.toggleSessionStatus(session.id, session.status);
      setSession(updatedSession);

      // If the session was moved to draft, redirect to edit mode
      if (updatedSession.status === SessionStatus.DRAFT) {
        navigate(`/sessions/builder/edit/${session.id}`);
      } else {
        // Refresh the topics display
        const topics = processTopicsForDisplay(updatedSession);
        setOrderedTopics(topics);
      }
    } catch (error) {
      console.error('Failed to toggle session status:', error);
      // You could show a toast notification here
    } finally {
      setIsTogglingStatus(false);
      setStatusToggleDialogOpen(false);
    }
  };

  const formatDateTime = (dateTime?: Date | string | null) => {
    if (!dateTime) return null;

    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return null;

    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let relativeTime = '';
    if (diffInDays === 0) {
      relativeTime = 'Today';
    } else if (diffInDays === 1) {
      relativeTime = 'Tomorrow';
    } else if (diffInDays === -1) {
      relativeTime = 'Yesterday';
    } else if (diffInDays > 0 && diffInDays <= 7) {
      relativeTime = `In ${diffInDays} days`;
    } else if (diffInDays < 0 && diffInDays >= -7) {
      relativeTime = `${Math.abs(diffInDays)} days ago`;
    }

    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      relativeTime
    };
  };

  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes || durationMinutes <= 0) return null;

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <BuilderLayout
        title="Loading Session..."
        subtitle="Please wait while we load the session details."
        statusSlot={null}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </BuilderLayout>
    );
  }

  if (error || !session) {
    return (
      <BuilderLayout
        title="Session Not Found"
        subtitle="We couldn't find the session you're looking for."
        statusSlot={null}
      >
        <div className="text-center py-12">
          <div className="text-slate-500 mb-4">
            <div className="h-16 w-16 mx-auto mb-4">📋</div>
            <p className="text-lg">{error || 'Session not found'}</p>
          </div>
          <Button onClick={() => navigate('/sessions')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Button>
        </div>
      </BuilderLayout>
    );
  }

  const dateTimeInfo = formatDateTime(session.scheduledAt || session.startTime);
  const duration = formatDuration(session.durationMinutes);
  const locationName = session.location ? transformLocationName(session.location.name) : null;

  // Check if session can be edited (only drafts can be edited)
  const canEdit = session.status === SessionStatus.DRAFT;
  const canToggleStatus = session.status === SessionStatus.PUBLISHED || session.status === SessionStatus.DRAFT;
  const isPublished = session.status === SessionStatus.PUBLISHED;

  return (
    <BuilderLayout
      title={session.title}
      subtitle={session.subtitle}
      statusSlot={<StatusBadge status={session.status} />}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/sessions')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                onClick={() => navigate(`/sessions/builder/edit/${session.id}`)}
                variant="outline"
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Session
              </Button>
            )}
            {canToggleStatus && (
              <Button
                onClick={() => setStatusToggleDialogOpen(true)}
                variant={isPublished ? "secondary" : "default"}
                size="sm"
              >
                {isPublished ? (
                  <>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Return to Draft
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Publish Session
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={() => setShowTrainerReassignment(!showTrainerReassignment)}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {showTrainerReassignment ? 'Hide' : 'Assign'} Trainers
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Session Overview Card */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Session Overview</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date and Time */}
              {dateTimeInfo && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">
                      {dateTimeInfo.relativeTime || dateTimeInfo.date}
                    </div>
                    <div className="text-sm text-slate-600">{dateTimeInfo.time}</div>
                  </div>
                </div>
              )}

              {/* Duration */}
              {duration && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                  <span className="font-medium text-slate-900">{duration}</span>
                </div>
              )}

              {/* Location */}
              {locationName && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <span className="font-medium text-slate-900">{locationName}</span>
                </div>
              )}

              {/* Category */}
              {session.category?.name && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 text-slate-400 mt-0.5">📋</div>
                  <Badge variant="outline" className="text-sm">
                    {session.category.name}
                  </Badge>
                </div>
              )}
            </div>

            {/* Session Objective */}
            {session.objective && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="font-medium text-slate-900 mb-2">Objective</h4>
                <p className="text-slate-700 leading-relaxed">{session.objective}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainer Assignment Summary */}
        <Card className="border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Trainer Assignments</h3>
                  <p className="text-sm text-slate-600">
                    {(() => {
                      const assignedCount = orderedTopics.filter(topic =>
                        topic.trainers && topic.trainers.length > 0
                      ).length;
                      const totalCount = orderedTopics.length;
                      return `${assignedCount} of ${totalCount} topics assigned`;
                    })()}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setShowTrainerReassignment(!showTrainerReassignment)}
                variant="outline"
                size="sm"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
              >
                {showTrainerReassignment ? 'Hide Details' : 'Manage Trainers'}
              </Button>
            </div>

            {/* Quick Assignment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-green-800">
                    {orderedTopics.filter(topic =>
                      topic.trainers && topic.trainers.length > 0
                    ).length} Assigned
                  </div>
                  <div className="text-xs text-green-600">Topics with trainers</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-amber-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <UserPlus className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-800">
                    {orderedTopics.filter(topic =>
                      !topic.trainers || topic.trainers.length === 0
                    ).length} Need Assignment
                  </div>
                  <div className="text-xs text-amber-600">Topics without trainers</div>
                </div>
              </div>
            </div>

            {/* Current Assignments Preview */}
            {orderedTopics.length > 0 && (
              <div className="mt-4 p-3 bg-white/70 rounded-lg border border-indigo-100">
                <div className="text-xs font-medium text-indigo-700 mb-2">Current Assignments:</div>
                <div className="flex flex-wrap gap-2">
                  {orderedTopics.slice(0, 4).map((topic) => (
                    <div key={topic.id} className="flex items-center gap-1 text-xs">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                        {topic.sequenceOrder}
                      </div>
                      {topic.trainers && topic.trainers.length > 0 ? (
                        <span className="text-green-700">{maskTrainerName(topic.trainers[0].name)}</span>
                      ) : (
                        <span className="text-amber-600 italic">Unassigned</span>
                      )}
                    </div>
                  ))}
                  {orderedTopics.length > 4 && (
                    <span className="text-xs text-slate-500">+{orderedTopics.length - 4} more</span>
                  )}
                </div>
              </div>
            )}

            {orderedTopics.some(topic => !topic.trainers || topic.trainers.length === 0) && (
              <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">
                  Some topics still need trainer assignments. Click "Manage Trainers" to complete assignments.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Trainer Management Section */}
        {showTrainerReassignment && (
          <Card className="border border-blue-200 bg-blue-50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Detailed Trainer Management</h3>
                <Button
                  onClick={() => setShowTrainerReassignment(false)}
                  variant="ghost"
                  size="sm"
                >
                  ×
                </Button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Assign trainers to specific topics. This will update who facilitates each session topic.
              </p>
              <TrainerReassignmentComponent
                topics={orderedTopics}
                onTrainerAssignmentChange={handleTrainerAssignmentChange}
              />
            </CardContent>
          </Card>
        )}

        {/* Session Outline */}
        <SessionOutlineView
          topics={orderedTopics}
          enableTrainerAssignment={true}
          onTrainerAssignmentChange={handleTrainerAssignmentChange}
          readonly={false}
        />
      </div>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={statusToggleDialogOpen} onOpenChange={setStatusToggleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPublished ? 'Return to Draft?' : 'Publish Session?'}
            </DialogTitle>
            <DialogDescription>
              {isPublished ? (
                <>
                  This will return the session to draft status, allowing you to make edits.
                  The session will no longer be visible to participants until you publish it again.
                </>
              ) : (
                <>
                  This will publish the session, making it visible to participants.
                  You can still make trainer assignments, but other edits will require returning to draft status.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setStatusToggleDialogOpen(false)}
              disabled={isTogglingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusToggle}
              disabled={isTogglingStatus}
              variant={isPublished ? "secondary" : "default"}
            >
              {isTogglingStatus && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isPublished ? 'Return to Draft' : 'Publish Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </BuilderLayout>
  );
};

export default SessionViewPage;