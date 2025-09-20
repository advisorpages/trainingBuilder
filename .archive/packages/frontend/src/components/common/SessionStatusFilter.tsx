import React from 'react';
import { SessionStatus, getStatusConfig } from './SessionStatusIndicator';

interface SessionStatusFilterProps {
  selectedStatus: SessionStatus | 'all';
  onStatusChange: (status: SessionStatus | 'all') => void;
  sessionCounts?: Record<SessionStatus | 'all', number>;
  className?: string;
}

export const SessionStatusFilter: React.FC<SessionStatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
  sessionCounts,
  className = ''
}) => {
  const statusOptions: Array<{ value: SessionStatus | 'all'; label: string; icon?: string }> = [
    { value: 'all', label: 'All Sessions', icon: '📊' },
    { value: SessionStatus.DRAFT, label: 'Draft', icon: '📝' },
    { value: SessionStatus.PUBLISHED, label: 'Published', icon: '🟢' },
    { value: SessionStatus.COMPLETED, label: 'Completed', icon: '✅' },
    { value: SessionStatus.CANCELLED, label: 'Cancelled', icon: '❌' }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statusOptions.map((option) => {
        const isSelected = selectedStatus === option.value;
        const count = sessionCounts?.[option.value];

        let buttonClasses = 'inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors';

        if (isSelected) {
          if (option.value === 'all') {
            buttonClasses += ' bg-blue-100 text-blue-800 border border-blue-200';
          } else {
            const config = getStatusConfig(option.value as SessionStatus);
            buttonClasses += ` ${config.bgColor} ${config.color} border border-current border-opacity-20`;
          }
        } else {
          buttonClasses += ' bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
        }

        return (
          <button
            key={option.value}
            onClick={() => onStatusChange(option.value)}
            className={buttonClasses}
          >
            <span className="mr-2">{option.icon}</span>
            {option.label}
            {count !== undefined && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-50">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Hook for managing status filter state
export const useSessionStatusFilter = (initialStatus: SessionStatus | 'all' = 'all') => {
  const [selectedStatus, setSelectedStatus] = React.useState<SessionStatus | 'all'>(initialStatus);

  const filterSessions = React.useCallback((sessions: any[]) => {
    if (selectedStatus === 'all') {
      return sessions;
    }
    return sessions.filter(session => session.status === selectedStatus);
  }, [selectedStatus]);

  const getSessionCounts = React.useCallback((sessions: any[]) => {
    const counts: Record<SessionStatus | 'all', number> = {
      all: sessions.length,
      [SessionStatus.DRAFT]: 0,
      [SessionStatus.PUBLISHED]: 0,
      [SessionStatus.COMPLETED]: 0,
      [SessionStatus.CANCELLED]: 0
    };

    sessions.forEach(session => {
      if (session.status in counts) {
        counts[session.status as SessionStatus]++;
      }
    });

    return counts;
  }, []);

  return {
    selectedStatus,
    setSelectedStatus,
    filterSessions,
    getSessionCounts
  };
};