import React from 'react';

interface KPIKardProps {
  title?: string;
  value?: string;
  change?: string | number;
  changeType?: 'increase' | 'decrease' | 'stable';
  loading?: boolean;
}

const KPIKard: React.FC<KPIKardProps> = ({ title, value, change, changeType, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="mt-4 h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="mt-4 h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return (
          <svg className="h-5 w-5 mr-1 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="h-5 w-5 mr-1 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getChangeTextColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <div className="mt-2 flex items-center">
        <span className={`flex items-center text-sm font-medium ${getChangeTextColor()}`}>
          {getTrendIcon()}
          {change}
        </span>
        <span className="ml-2 text-sm text-gray-500">from last month</span>
      </div>
    </div>
  );
};

export default KPIKard;
