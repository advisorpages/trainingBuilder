import React, { useState } from 'react';

interface HeadlineSelectorProps {
  label: string;
  value: string[];
  selectedValue?: string;
  onChange: (value: string[]) => void;
  onSelectedChange?: (selected: string) => void;
  className?: string;
}

export const HeadlineSelector: React.FC<HeadlineSelectorProps> = ({
  label,
  value = [],
  selectedValue = '',
  onChange,
  onSelectedChange,
  className = ''
}) => {
  const [newHeadline, setNewHeadline] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(
    selectedValue ? value.indexOf(selectedValue) : 0
  );

  const handleAddHeadline = () => {
    if (newHeadline.trim()) {
      const newHeadlines = [...value, newHeadline.trim()];
      onChange(newHeadlines);
      setNewHeadline('');
    }
  };

  const handleRemoveHeadline = (index: number) => {
    const newHeadlines = value.filter((_, i) => i !== index);
    onChange(newHeadlines);

    // Adjust selected index if needed
    if (index === selectedIndex && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
      onSelectedChange?.(newHeadlines[selectedIndex - 1] || '');
    } else if (index < selectedIndex) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleSelectHeadline = (index: number) => {
    setSelectedIndex(index);
    onSelectedChange?.(value[index] || '');
  };

  const handleEditHeadline = (index: number, newValue: string) => {
    const newHeadlines = [...value];
    newHeadlines[index] = newValue;
    onChange(newHeadlines);

    // Update selected value if this is the selected headline
    if (index === selectedIndex) {
      onSelectedChange?.(newValue);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddHeadline();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Current Headlines */}
      {value.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Generated Headlines
          </div>

          {value.map((headline, index) => (
            <div
              key={index}
              className={`relative border rounded-lg p-3 transition-all ${
                index === selectedIndex
                  ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                {/* Selection Radio */}
                <input
                  type="radio"
                  name="selectedHeadline"
                  checked={index === selectedIndex}
                  onChange={() => handleSelectHeadline(index)}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />

                {/* Headline Text */}
                <div className="flex-1">
                  <textarea
                    value={headline}
                    onChange={(e) => handleEditHeadline(index, e.target.value)}
                    className={`w-full text-sm border-0 bg-transparent resize-none p-0 focus:ring-0 ${
                      index === selectedIndex ? 'text-blue-900' : 'text-gray-900'
                    }`}
                    rows={headline.length > 60 ? 2 : 1}
                  />

                  {/* Character Count */}
                  <div className="mt-1 text-xs text-gray-500">
                    {headline.length} characters
                    {headline.length > 120 && (
                      <span className="text-amber-600 ml-2">• Consider shortening for better impact</span>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveHeadline(index)}
                  className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove headline"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Selected Indicator */}
              {index === selectedIndex && (
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Selected
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Headline */}
      <div className="border-t pt-4">
        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
          Add Custom Headline
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newHeadline}
            onChange={(e) => setNewHeadline(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a custom headline..."
            className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddHeadline}
            disabled={!newHeadline.trim()}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Summary */}
      {value.length > 0 && (
        <div className="bg-gray-50 rounded p-3">
          <div className="text-xs font-medium text-gray-600 mb-1">Selected for Primary Use:</div>
          <div className="text-sm text-gray-900 font-medium">
            {value[selectedIndex] || 'None selected'}
          </div>
        </div>
      )}
    </div>
  );
};