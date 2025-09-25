import React from 'react';

interface IncentiveCardProps {
  incentive: {
    id: string;
    title: string;
    description?: string;
    startDate: string | Date;
    endDate: string | Date;
  };
}

const IncentiveCard: React.FC<IncentiveCardProps> = ({ incentive }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {incentive.title}
        </h3>
      </div>

      {incentive.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {incentive.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Start: {new Date(incentive.startDate).toLocaleDateString()}</span>
          <span>End: {new Date(incentive.endDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default IncentiveCard;
