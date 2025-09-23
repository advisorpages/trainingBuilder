import React from 'react';
import { detectFieldType, generateFieldLabel, FieldType } from '../../utils/dynamicFormUtils';
import { ArrayEditor } from './ArrayEditor';
import { HeadlineSelector } from './HeadlineSelector';
import { EmailEditor } from './EmailEditor';

interface DynamicFieldEditorProps {
  fieldName: string;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  className?: string;
}

export const DynamicFieldEditor: React.FC<DynamicFieldEditorProps> = ({
  fieldName,
  value,
  onChange,
  className = ''
}) => {
  const fieldType = detectFieldType(fieldName, value);
  const label = generateFieldLabel(fieldName);

  const handleChange = (newValue: any) => {
    onChange(fieldName, newValue);
  };

  const renderEditor = () => {
    switch (fieldType) {
      case 'array':
        return (
          <ArrayEditor
            label={label}
            value={Array.isArray(value) ? value : []}
            onChange={handleChange}
            placeholder={`Add ${label.toLowerCase()} item`}
          />
        );

      case 'headline':
        return (
          <HeadlineSelector
            label={label}
            value={Array.isArray(value) ? value : [value].filter(Boolean)}
            onChange={(headlines) => {
              // If original was a string, return first item as string
              if (typeof value === 'string') {
                handleChange(headlines[0] || '');
              } else {
                handleChange(headlines);
              }
            }}
          />
        );

      case 'email':
        return (
          <EmailEditor
            label={label}
            value={value || ''}
            onChange={handleChange}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              rows={4}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
            <div className="text-xs text-gray-500">
              {value ? `${value.length} characters` : 'No content yet'}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          </div>
        );

      case 'unknown':
      default:
        // Handle unknown types with a JSON editor
        const isValidJson = (str: string) => {
          try {
            JSON.parse(str);
            return true;
          } catch {
            return false;
          }
        };

        const jsonValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2);

        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {label}
              <span className="ml-2 text-xs text-gray-500 font-normal">
                (Unknown type - JSON editor)
              </span>
            </label>
            <textarea
              value={jsonValue}
              onChange={(e) => {
                const newValue = e.target.value;
                try {
                  // Try to parse as JSON first
                  const parsed = JSON.parse(newValue);
                  handleChange(parsed);
                } catch {
                  // If not valid JSON, treat as string
                  handleChange(newValue);
                }
              }}
              rows={6}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500 font-mono"
              placeholder="Enter JSON or text..."
            />
            <div className="text-xs text-gray-500">
              {typeof value === 'object' ? 'JSON Object' :
               isValidJson(jsonValue) ? 'Valid JSON' : 'Text/String'}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 bg-white ${className}`}>
      {renderEditor()}

      {/* Field Info */}
      <div className="mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Field: {fieldName}</span>
          <span>Type: {fieldType}</span>
        </div>
      </div>
    </div>
  );
};