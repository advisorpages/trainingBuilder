import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { SessionStatus } from '@leadership-training/shared';
import { maskTrainerName, getTrainerDisplayString } from '../../utils/trainerPrivacy';
import { transformLocationName, getShortLocationDisplay } from '../../utils/locationPrivacy';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { Calendar, Clock, MapPin, Users, Edit, Eye } from 'lucide-react';

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
  categoryId?: string | number;
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

interface SessionCardProps {
  session: SessionWithRelations;
  orderedTopicsWithTrainers?: DisplayTopic[];
  isSelected?: boolean;
  onSelectionChange?: (sessionId: string) => void;
  onEditSession?: (sessionId: string) => void;
  onViewDetails?: (sessionId: string) => void;
  availableCategories?: Array<{ id: string; name: string }>;
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

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  orderedTopicsWithTrainers = [],
  isSelected = false,
  onSelectionChange,
  onEditSession,
  onViewDetails,
  availableCategories = []
}) => {
  const breakpoint = useBreakpoint();

  // Helper: Format duration from minutes
  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes || durationMinutes <= 0) {
      return null;
    }

    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Helper: Format date and time with null safety
  const formatDateTime = (dateTime?: Date | string | null) => {
    if (!dateTime) {
      return {
        date: null,
        time: null,
        relativeTime: null
      };
    }

    const date = new Date(dateTime);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        date: null,
        time: null,
        relativeTime: null
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
        month: 'short',
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

  // Get primary trainer
  const getPrimaryTrainer = () => {
    if (orderedTopicsWithTrainers.length === 0) {
      return null;
    }

    // Find first topic with assigned trainer
    for (const topic of orderedTopicsWithTrainers) {
      if (topic.trainers && topic.trainers.length > 0) {
        return maskTrainerName(topic.trainers[0].name);
      }
    }

    return null;
  };

  // Get all trainers for display
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

  // Get category name
  const getCategoryName = () => {
    if (session.category?.name) {
      return session.category.name;
    }
    if (session.categoryId) {
      const category = availableCategories.find(cat => cat.id === String(session.categoryId));
      return category?.name || 'Unknown';
    }
    return 'General';
  };

  const { date, time, relativeTime } = formatDateTime(session.scheduledAt);
  const primaryTrainer = getPrimaryTrainer();
  const allTrainers = getAllTrainers();
  const duration = formatDuration(session.durationMinutes);
  const categoryName = getCategoryName();
  const locationName = session.location ? transformLocationName(session.location.name) : null;

  const isMobile = breakpoint === 'mobile';

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-lg h-full
        ${isSelected ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50/50' : 'hover:bg-slate-50'}
        ${isMobile ? 'mb-3' : 'mb-4'}
      `}
      onClick={() => onSelectionChange?.(session.id)}
    >
      <CardContent className={`p-4 ${isMobile ? 'p-3' : 'p-4'} flex flex-col h-full`}>
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          {/* Title and Status */}
          <div className="flex-1 min-w-0 mr-3">
            <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-1 line-clamp-2">
              {session.title}
            </h3>
            {session.subtitle && !isMobile && (
              <p className="text-xs text-slate-600 line-clamp-1">
                {session.subtitle}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <StatusBadge status={session.status} />
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-2 mb-3 text-xs">
          {/* Date and Time - Always show */}
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            {date ? (
              <span>{relativeTime || date}</span>
            ) : (
              <span className="text-slate-400 italic">No date set</span>
            )}
            {time && <span className="text-slate-400 ml-1">• {time}</span>}
          </div>

          {/* Duration */}
          {duration && (
            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>{duration}</span>
            </div>
          )}

          {/* Location */}
          {locationName && (
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span className="truncate">{isMobile ? getShortLocationDisplay(locationName) : locationName}</span>
            </div>
          )}
        </div>

        {/* Category and Readiness */}
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {categoryName}
          </Badge>
          {session.readinessScore !== undefined && (
            <div className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full ${
                session.readinessScore >= 80 ? 'bg-green-500' :
                session.readinessScore >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}></div>
              <span className="text-xs text-slate-600">{session.readinessScore}%</span>
            </div>
          )}
        </div>

  
        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(session.id);
            }}
            className="flex-1 h-9 text-xs font-medium bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 transition-all duration-200"
          >
            <Eye className="h-3 w-3 mr-1.5" />
            View Details
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEditSession(session.id);
            }}
            className="h-9 px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 transition-all duration-200 shadow-sm hover:shadow"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionCard;
