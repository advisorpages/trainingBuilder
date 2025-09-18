import React from 'react';

export enum SessionStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface SessionStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

interface SessionStatusIndicatorProps {
  status: SessionStatus;
  showLabel?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SessionStatusIndicator: React.FC<SessionStatusIndicatorProps> = ({
  status,
  showLabel = true,
  showDescription = false,
  size = 'md',
  className = ''
}) => {
  const statusConfig: Record<SessionStatus, SessionStatusConfig> = {
    [SessionStatus.DRAFT]: {
      label: 'Draft',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '📝',
      description: 'Session is being created and edited'
    },
    [SessionStatus.PUBLISHED]: {
      label: 'Published',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: '🟢',
      description: 'Session is live and available for registration'
    },
    [SessionStatus.COMPLETED]: {
      label: 'Completed',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '✅',
      description: 'Session has finished'
    },
    [SessionStatus.CANCELLED]: {
      label: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌',
      description: 'Session has been cancelled'
    }
  };

  const config = statusConfig[status];
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <span
        className={`
          inline-flex items-center rounded-full font-medium
          ${config.color} ${config.bgColor} ${sizeClasses[size]}
        `}
        title={config.description}
      >
        <span className="mr-1">{config.icon}</span>
        {showLabel && config.label}
      </span>
      {showDescription && (
        <span className="ml-2 text-sm text-gray-600">
          {config.description}
        </span>
      )}
    </div>
  );
};

export const getStatusConfig = (status: SessionStatus): SessionStatusConfig => {
  const statusConfig: Record<SessionStatus, SessionStatusConfig> = {
    [SessionStatus.DRAFT]: {
      label: 'Draft',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '📝',
      description: 'Session is being created and edited'
    },
    [SessionStatus.PUBLISHED]: {
      label: 'Published',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: '🟢',
      description: 'Session is live and available for registration'
    },
    [SessionStatus.COMPLETED]: {
      label: 'Completed',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '✅',
      description: 'Session has finished'
    },
    [SessionStatus.CANCELLED]: {
      label: 'Cancelled',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌',
      description: 'Session has been cancelled'
    }
  };

  return statusConfig[status];
};

export const getAvailableStatuses = (): SessionStatus[] => {
  return Object.values(SessionStatus);
};

export const getStatusTransitions = (currentStatus: SessionStatus): SessionStatus[] => {
  const transitions: Record<SessionStatus, SessionStatus[]> = {
    [SessionStatus.DRAFT]: [SessionStatus.PUBLISHED, SessionStatus.CANCELLED],
    [SessionStatus.PUBLISHED]: [SessionStatus.COMPLETED, SessionStatus.CANCELLED],
    [SessionStatus.COMPLETED]: [], // No transitions from completed
    [SessionStatus.CANCELLED]: [] // No transitions from cancelled
  };

  return transitions[currentStatus] || [];
};