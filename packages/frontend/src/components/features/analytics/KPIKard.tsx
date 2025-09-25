import React from 'react';

interface KPIKardProps {
  title?: string;
  value?: number | string;
  change?: number | string;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  loading?: boolean;
}

const KPIKard: React.FC<KPIKardProps> = ({ title, value, change, trend = 'stable', icon, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="mt-4 h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="mt-4 h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    );
  }

  const formatValue = (input?: number | string) => {
    if (typeof input === 'number') {
      return input.toLocaleString('en-US');
    }
    return input ?? '—';
  };

  const formatChange = (input?: number | string) => {
    if (input === undefined || input === null || input === '') {
      return '—';
    }

    if (typeof input === 'number') {
      const formatted = Math.abs(input).toLocaleString('en-US', {
        maximumFractionDigits: 1,
        minimumFractionDigits: Number.isInteger(input) ? 0 : 1,
      });
      const prefix = input < 0 ? '-' : '';
      return `${prefix}${formatted}%`;
    }

    return input;
  };

  const getTrendGlyph = () => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getChangeTextColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const arrow = getTrendGlyph();
  const changeText = formatChange(change);
  const valueText = formatValue(value);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900">
        {icon ? (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        {title}
      </h3>
      <p className="mt-2 text-3xl font-bold" data-testid="kpi-value">{valueText}</p>
      <div className="mt-2 flex items-center">
        <span className="flex items-center text-sm font-medium">
          <span aria-hidden="true" className={`mr-1 ${getChangeTextColor()}`}>
            {arrow}
          </span>
          <span className={getChangeTextColor()}>{changeText}</span>
        </span>
        <span className="ml-2 text-sm text-gray-500">from last month</span>
      </div>
    </div>
  );
};

export default KPIKard;
