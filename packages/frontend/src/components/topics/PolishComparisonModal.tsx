import React, { useState, useEffect } from 'react';
import { PolishComparison, topicPolishService } from '../../services/topicPolishService';

interface PolishComparisonModalProps {
  comparison: PolishComparison;
  onApply: (selectedFields: Record<string, boolean>) => Promise<void>;
  onCancel: () => void;
  isApplying?: boolean;
}

export const PolishComparisonModal: React.FC<PolishComparisonModalProps> = ({
  comparison,
  onApply,
  onCancel,
  isApplying = false,
}) => {
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [changedFields, setChangedFields] = useState<string[]>([]);

  useEffect(() => {
    // Identify fields with changes
    const changed = topicPolishService.getChangedFields(comparison);
    setChangedFields(changed);

    // Pre-select all changed fields
    const initialSelection: Record<string, boolean> = {};
    changed.forEach(field => {
      initialSelection[field] = true;
    });
    setSelectedFields(initialSelection);
  }, [comparison]);

  const handleToggleField = (field: string) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSelectAll = () => {
    const allSelected: Record<string, boolean> = {};
    changedFields.forEach(field => {
      allSelected[field] = true;
    });
    setSelectedFields(allSelected);
  };

  const handleDeselectAll = () => {
    setSelectedFields({});
  };

  const handleApply = async () => {
    await onApply(selectedFields);
  };

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;

  const renderFieldComparison = (field: string) => {
    const displayName = topicPolishService.getFieldDisplayName(field);
    const originalValue = comparison.original[field as keyof typeof comparison.original];
    const polishedValue = comparison.polished[field as keyof typeof comparison.polished];
    const hasChange = topicPolishService.hasChanges(originalValue, polishedValue);
    const isSelected = selectedFields[field];

    if (!hasChange) {
      return null;
    }

    return (
      <div key={field} className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">{displayName}</h4>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleField(field)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Apply changes</span>
          </label>
        </div>
        <div className="grid md:grid-cols-2 divide-x divide-gray-200">
          {/* Original Content */}
          <div className="p-4 bg-red-50">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-red-700 bg-red-100 px-2 py-1 rounded">ORIGINAL</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {originalValue || <span className="text-gray-400 italic">No content</span>}
            </div>
          </div>

          {/* Polished Content */}
          <div className="p-4 bg-green-50">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">POLISHED</span>
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {polishedValue}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-6 border w-full max-w-6xl shadow-lg rounded-lg bg-white mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Polish Content Comparison</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review the AI-polished content and select which changes to apply
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            disabled={isApplying}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Banner */}
        {changedFields.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">No Changes Detected</h3>
                <p className="mt-1 text-sm text-blue-700">
                  The content is already well-polished! No improvements were suggested.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">
                  {changedFields.length} Field{changedFields.length === 1 ? '' : 's'} Enhanced
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  {selectedCount} of {changedFields.length} improvement{changedFields.length === 1 ? '' : 's'} selected for application
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {changedFields.length > 0 && (
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={isApplying}
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isApplying}
              >
                Deselect All
              </button>
            </div>
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
          </div>
        )}

        {/* Field Comparisons */}
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
          {['name', 'description', 'learningOutcomes', 'trainerNotes', 'materialsNeeded', 'deliveryGuidance'].map(field =>
            renderFieldComparison(field)
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isApplying}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={selectedCount === 0 || isApplying}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Applying...
              </span>
            ) : (
              `Apply ${selectedCount} Change${selectedCount === 1 ? '' : 's'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
