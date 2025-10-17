import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { SessionStatus } from '@leadership-training/shared';
import { maskTrainerName } from '../../utils/trainerPrivacy';
import { transformLocationName } from '../../utils/locationPrivacy';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  X,
  Share2,
  Bookmark,
  CheckCircle,
  Heart
} from 'lucide-react';

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
}

interface DisplayTopic {
  id: string;
  topicId?: number | string;
  name: string;
  description?: string;
  sequenceOrder: number;
  trainers: Array<{ id: number | string; name?: string }>;
}

interface SessionDrawerProps {
  session: SessionWithRelations | null;
  orderedTopicsWithTrainers: DisplayTopic[];
  availableCategories: Array<{ id: string; name: string }>;
  isOpen: boolean;
  onClose: () => void;
  onEditSession: (sessionId: string) => void;
}

const StatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const statusConfig = {
    [SessionStatus.DRAFT]: {
      label: 'Draft',
      variant: 'secondary' as const,
      className: 'bg-gray-100 text-gray-700'
    },
    [SessionStatus.REVIEW]: {
      label: 'Review',
      variant: 'warning' as const,
      className: 'bg-yellow-100 text-yellow-700'
    },
    [SessionStatus.READY]: {
      label: 'Ready',
      variant: 'info' as const,
      className: 'bg-blue-100 text-blue-700'
    },
    [SessionStatus.PUBLISHED]: {
      label: 'Published',
      variant: 'success' as const,
      className: 'bg-green-100 text-green-700'
    },
    [SessionStatus.RETIRED]: {
      label: 'Archived',
      variant: 'secondary' as const,
      className: 'bg-gray-50 text-gray-900'
    },
    [SessionStatus.COMPLETED]: {
      label: 'Completed',
      variant: 'info' as const,
      className: 'bg-purple-100 text-purple-700'
    },
    [SessionStatus.CANCELLED]: {
      label: 'Cancelled',
      variant: 'secondary' as const,
      className: 'bg-gray-50 text-gray-900'
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
      className={`text-xs font-medium ${config.className}`}
    >
      {config.label}
    </Badge>
  );
};

export const SessionDrawer: React.FC<SessionDrawerProps> = ({
  session,
  orderedTopicsWithTrainers,
  availableCategories,
  isOpen,
  onClose,
  onEditSession
}) => {
  const breakpoint = useBreakpoint();

  // Helper: Format duration from minutes
  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes || durationMinutes <= 0) {
      return 'Not specified';
    }

    if (durationMinutes < 60) {
      return `${durationMinutes} minutes`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  };

  // Helper: Format date and time with null safety
  const formatDateTime = (dateTime?: Date | string | null) => {
    if (!dateTime) {
      return {
        date: 'Not scheduled',
        time: '',
        relativeTime: ''
      };
    }

    const date = new Date(dateTime);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid date',
        time: '',
        relativeTime: ''
      };
    }

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
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      relativeTime
    };
  };

  // Get category name
  const getCategoryName = () => {
    if (session?.category?.name) {
      return session.category.name;
    }
    if (session?.categoryId) {
      const category = availableCategories.find(cat => cat.id === session.categoryId);
      return category?.name || 'Unknown';
    }
    return 'General';
  };

  // Get all unique trainers
  const getAllTrainers = () => {
    const allTrainers = new Set<string>();

    orderedTopicsWithTrainers.forEach(topic => {
      if (topic.trainers && topic.trainers.length > 0) {
        topic.trainers.forEach(trainer => {
          if (trainer.name) {
            allTrainers.add(maskTrainerName(trainer.name));
          }
        });
      }
    });

    return Array.from(allTrainers);
  };

  // Handle placeholder actions
  const handleRSVP = () => {
    alert('RSVP functionality coming soon!');
  };

  const handleShare = () => {
    alert('Share functionality coming soon!');
  };

  const handleBookmark = () => {
    alert('Bookmark functionality coming soon!');
  };

  if (!session) {
    return null;
  }

  const { date, time, relativeTime } = formatDateTime(session.scheduledAt);
  const allTrainers = getAllTrainers();
  const duration = formatDuration(session.durationMinutes);
  const categoryName = getCategoryName();
  const locationName = session.location ? transformLocationName(session.location.name) : null;

  const isMobile = breakpoint === 'mobile';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] max-h-[800px] rounded-t-2xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <SheetTitle className="text-xl text-slate-900 leading-tight mb-2 text-left">
                  {session.title}
                </SheetTitle>
                {session.subtitle && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {session.subtitle}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={session.status} />
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => onEditSession(session.id)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Session
              </Button>
            </div>

            {/* Session Overview */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900">Session Overview</h4>

              <div className="grid gap-3 text-sm">
                {/* Date & Time */}
                {date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">{relativeTime || date}</div>
                      {time && <div className="text-slate-600">{time}</div>}
                    </div>
                  </div>
                )}

                {/* Duration */}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-900">{duration}</span>
                </div>

                {/* Location */}
                {locationName && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-900">{locationName}</span>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 text-slate-400">📋</div>
                  <Badge variant="outline" className="text-xs">
                    {categoryName}
                  </Badge>
                </div>

                {/* Readiness Score */}
                {session.readinessScore !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 text-slate-400">📊</div>
                    <span className="text-slate-900">Readiness: {session.readinessScore}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Trainers */}
            {allTrainers.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Assigned Trainers</h4>
                <div className="space-y-2">
                  {allTrainers.map((trainer, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-900">{trainer}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Topics in Order */}
            {orderedTopicsWithTrainers.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">
                  Topics ({orderedTopicsWithTrainers.length})
                </h4>
                <div className="space-y-3">
                  {orderedTopicsWithTrainers.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="bg-slate-50 rounded-lg p-3 border border-slate-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-slate-900 text-sm mb-1">
                            {topic.name}
                          </h5>
                          {topic.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                              {topic.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            {topic.trainers && topic.trainers.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-slate-400" />
                                <span className="text-slate-600">
                                  {maskTrainerName(topic.trainers[0].name)}
                                  {topic.trainers.length > 1 && ` +${topic.trainers.length - 1}`}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Topics */}
            {orderedTopicsWithTrainers.length === 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">Topics</h4>
                <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
                  <div className="text-slate-400 mb-1">
                    <div className="h-8 w-8 mx-auto">📋</div>
                  </div>
                  <p className="text-sm text-slate-600">
                    No topics have been assigned to this session
                  </p>
                </div>
              </div>
            )}

            {/* Session Info */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Session ID: {session.id.slice(-8)}</span>
                {session.scheduledAt && (
                  <span>
                    Created {new Date(session.scheduledAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="border-t border-slate-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={handleRSVP}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs">RSVP</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Share</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleBookmark}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                <Bookmark className="h-5 w-5" />
                <span className="text-xs">Bookmark</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SessionDrawer;