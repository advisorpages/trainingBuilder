import React from 'react';

interface DateRangeSelectorProps {
  onDateRangeChange: (dateRange: string) => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onDateRangeChange }) => {
  const dateRanges = [
    { value: 'last-7-days', label: 'Last 7 days' },
    { value: 'last-30-days', label: 'Last 30 days' },
    { value: 'last-90-days', label: 'Last 90 days' },
  ];

  return (
    <select
      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      onChange={(e) => onDateRangeChange(e.target.value)}
      defaultValue="last-30-days"
    >
      {dateRanges.map((range) => (
        <option key={range.value} value={range.value}>
          {range.label}
        </option>
      ))}
    </select>
  );
};

export default DateRangeSelector;
