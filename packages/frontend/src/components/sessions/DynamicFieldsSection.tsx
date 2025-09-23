import React, { useState } from 'react';
import { DynamicFieldEditor } from '../forms/DynamicFieldEditor';
import { ArrayEditor } from '../forms/ArrayEditor';
import { HeadlineSelector } from '../forms/HeadlineSelector';
import { EmailEditor } from '../forms/EmailEditor';
import {
  getCuratedFields,
  getDynamicFields,
  CURATED_FIELDS,
  getFieldPriority
} from '../../utils/dynamicFormUtils';

interface DynamicFieldsSectionProps {
  aiContent: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  className?: string;
}

export const DynamicFieldsSection: React.FC<DynamicFieldsSectionProps> = ({
  aiContent = {},
  onFieldChange,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'curated' | 'dynamic' | 'raw'>('curated');
  const [jsonError, setJsonError] = useState<string>('');

  const curatedFields = getCuratedFields(aiContent);
  const dynamicFields = getDynamicFields(aiContent);

  // Sort curated fields by priority
  const sortedCuratedFields = Object.entries(curatedFields).sort(
    ([a], [b]) => getFieldPriority(a) - getFieldPriority(b)
  );

  const handleRawJsonChange = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError('');
      return;
    }

    try {
      const parsed = JSON.parse(jsonString);
      setJsonError('');

      // Update all fields from the parsed JSON
      Object.keys(parsed).forEach(key => {
        onFieldChange(key, parsed[key]);
      });

      // Remove fields that are no longer in the JSON
      Object.keys(aiContent).forEach(key => {
        if (!(key in parsed)) {
          onFieldChange(key, undefined);
        }
      });
    } catch (error) {
      setJsonError('Invalid JSON format. Please check your syntax.');
    }
  };

  const renderCuratedField = (fieldName: string, value: any) => {
    const config = CURATED_FIELDS[fieldName];

    switch (config.component) {
      case 'HeadlineSelector':
        return (
          <HeadlineSelector
            label={config.label}
            value={Array.isArray(value) ? value : [value].filter(Boolean)}
            onChange={(newValue) => onFieldChange(fieldName, newValue)}
          />
        );

      case 'ArrayEditor':
        return (
          <ArrayEditor
            label={config.label}
            value={Array.isArray(value) ? value : []}
            onChange={(newValue) => onFieldChange(fieldName, newValue)}
            placeholder={config.placeholder}
          />
        );

      case 'EmailEditor':
        return (
          <EmailEditor
            label={config.label}
            value={value || ''}
            onChange={(newValue) => onFieldChange(fieldName, newValue)}
            placeholder={config.placeholder}
          />
        );

      case 'TextArea':
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {config.label}
            </label>
            <textarea
              value={value || ''}
              onChange={(e) => onFieldChange(fieldName, e.target.value)}
              rows={config.isMultiline ? 4 : 2}
              maxLength={config.maxLength}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder={config.placeholder}
            />
            {config.maxLength && (
              <div className="text-xs text-gray-500">
                {(value || '').length} / {config.maxLength} characters
              </div>
            )}
          </div>
        );

      case 'TextInput':
      default:
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {config.label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onFieldChange(fieldName, e.target.value)}
              maxLength={config.maxLength}
              className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              placeholder={config.placeholder}
            />
            {config.maxLength && (
              <div className="text-xs text-gray-500">
                {(value || '').length} / {config.maxLength} characters
              </div>
            )}
          </div>
        );
    }
  };

  const tabClasses = (tabName: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tabName
        ? 'bg-blue-100 text-blue-700 border border-blue-200'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('curated')}
          className={tabClasses('curated')}
        >
          Key Content
          {Object.keys(curatedFields).length > 0 && (
            <span className="ml-1 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
              {Object.keys(curatedFields).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dynamic')}
          className={tabClasses('dynamic')}
        >
          Additional Fields
          {Object.keys(dynamicFields).length > 0 && (
            <span className="ml-1 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
              {Object.keys(dynamicFields).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raw')}
          className={tabClasses('raw')}
        >
          Raw JSON
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'curated' && (
        <div className="space-y-6">
          <div className="text-sm text-gray-600 mb-4">
            These are the most important AI-generated content fields with optimized editing interfaces.
          </div>

          {sortedCuratedFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No curated content available</div>
              <div className="text-sm">Generate AI content to see enhanced editing options</div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedCuratedFields.map(([fieldName, value]) => (
                <div key={fieldName} className="border border-gray-200 rounded-lg p-4">
                  {renderCuratedField(fieldName, value)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dynamic' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Additional AI-generated fields that don't have specialized editors yet.
          </div>

          {Object.keys(dynamicFields).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-lg mb-2">No additional fields found</div>
              <div className="text-sm">All available content is shown in the Key Content tab</div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(dynamicFields).map(([fieldName, value]) => (
                <DynamicFieldEditor
                  key={fieldName}
                  fieldName={fieldName}
                  value={value}
                  onChange={onFieldChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'raw' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Edit the complete AI-generated content as JSON. Changes here will update the other tabs.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complete AI Content (JSON)
            </label>
            <textarea
              value={JSON.stringify(aiContent, null, 2)}
              onChange={(e) => handleRawJsonChange(e.target.value)}
              rows={15}
              className={`w-full text-sm border rounded px-3 py-2 font-mono focus:ring-blue-500 ${
                jsonError ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
              }`}
            />

            {jsonError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-sm text-red-700">{jsonError}</div>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              {Object.keys(aiContent).length} fields • {JSON.stringify(aiContent).length} characters
            </div>
          </div>
        </div>
      )}
    </div>
  );
};