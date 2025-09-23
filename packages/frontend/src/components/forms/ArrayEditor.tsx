import React, { useState } from 'react';

interface ArrayEditorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxItems?: number;
  className?: string;
}

export const ArrayEditor: React.FC<ArrayEditorProps> = ({
  label,
  value = [],
  onChange,
  placeholder = 'Add item',
  maxItems = 10,
  className = ''
}) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = () => {
    if (newItem.trim() && value.length < maxItems) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    const newArray = value.filter((_, i) => i !== index);
    onChange(newArray);
  };

  const handleEditItem = (index: number, newValue: string) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(newArray);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Existing Items */}
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mt-1">
              {index + 1}
            </div>
            <textarea
              value={item}
              onChange={(e) => handleEditItem(index, e.target.value)}
              className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500 resize-none"
              rows={item.length > 80 ? 2 : 1}
            />
            <button
              type="button"
              onClick={() => handleRemoveItem(index)}
              className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 mt-1"
              title="Remove item"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item */}
      {value.length < maxItems && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!newItem.trim()}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      )}

      {/* Item Count */}
      <p className="text-xs text-gray-500">
        {value.length} of {maxItems} items
        {value.length === 0 && ' (No items added yet)'}
      </p>
    </div>
  );
};