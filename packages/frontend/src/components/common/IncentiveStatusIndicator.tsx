import React from 'react';
import { IncentiveStatus } from '@leadership-training/shared';

interface IncentiveStatusIndicatorProps {
  status: IncentiveStatus;
  showDescription?: boolean;
}

export const IncentiveStatusIndicator: React.FC<IncentiveStatusIndicatorProps> = ({
  status,
  showDescription = false
}) => {
  const getStatusConfig = (status: IncentiveStatus) => {
    switch (status) {
      case IncentiveStatus.DRAFT:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: '📝',
          label: 'Draft',
          description: 'Incentive is being developed'
        };
      case IncentiveStatus.PUBLISHED:
        return {
          color: 'bg-green-100 text-green-800',
          icon: '✅',
          label: 'Published',
          description: 'Incentive is active and available'
        };
      case IncentiveStatus.EXPIRED:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: '⏰',
          label: 'Expired',
          description: 'Incentive period has ended'
        };
      case IncentiveStatus.CANCELLED:
        return {
          color: 'bg-red-100 text-red-800',
          icon: '❌',
          label: 'Cancelled',
          description: 'Incentive was cancelled'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: '❓',
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
      {showDescription && (
        <span className="text-xs text-gray-500">
          {config.description}
        </span>
      )}
    </div>
  );
};