import React, { useState } from 'react';
import { incentiveAIService, IncentiveAIData, IncentiveGeneratedContent } from '../../services/incentive-ai.service';

interface IncentiveAIContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyContent: (content: IncentiveGeneratedContent) => void;
  incentiveData: Partial<IncentiveAIData>;
  isSubmitting?: boolean;
}

export const IncentiveAIContentGenerator: React.FC<IncentiveAIContentGeneratorProps> = ({
  isOpen,
  onClose,
  onApplyContent,
  incentiveData,
  isSubmitting = false
}) => {
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<IncentiveGeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<Record<string, boolean>>({
    title: true,
    shortDescription: true,
    longDescription: true,
    rulesText: true,
    socialCopy: true,
    emailCopy: true
  });

  const handleGenerateContent = async () => {
    try {
      setGeneratingContent(true);
      setError(null);

      // Validate required fields
      const validation = await incentiveAIService.validateForAI(incentiveData);
      if (!validation.isValid) {
        const missingFieldNames = validation.missingFields.map(field =>
          incentiveAIService.formatFieldName(field)
        ).join(', ');
        throw new Error(`Please fill in the following required fields first: ${missingFieldNames}`);
      }

      // Generate content
      const response = await incentiveAIService.generateContent(incentiveData as IncentiveAIData);
      setGeneratedContent(response.content);
    } catch (error: any) {
      console.error('Failed to generate content:', error);
      setError(error.message || 'Failed to generate AI content');
    } finally {
      setGeneratingContent(false);
    }
  };

  const handleApplySelected = () => {
    if (!generatedContent) return;

    // Create content object with only selected fields
    const contentToApply: Partial<IncentiveGeneratedContent> = {};

    Object.entries(selectedContent).forEach(([key, isSelected]) => {
      if (isSelected) {
        contentToApply[key as keyof IncentiveGeneratedContent] = generatedContent[key as keyof IncentiveGeneratedContent];
      }
    });

    onApplyContent(contentToApply as IncentiveGeneratedContent);
    onClose();
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedContent).every(Boolean);
    const newSelection = Object.keys(selectedContent).reduce((acc, key) => {
      acc[key] = !allSelected;
      return acc;
    }, {} as Record<string, boolean>);
    setSelectedContent(newSelection);
  };

  const handleRegenerateContent = () => {
    setGeneratedContent(null);
    handleGenerateContent();
  };

  if (!isOpen) return null;

  const contentLabels = {
    title: 'Enhanced Title',
    shortDescription: 'Short Description',
    longDescription: 'Detailed Description',
    rulesText: 'Rules & Terms',
    socialCopy: 'Social Media Copy',
    emailCopy: 'Email Marketing Copy'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Content Generation</h2>
              <p className="text-sm text-gray-500">Generate promotional content for your incentive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!generatedContent ? (
            // Generation Phase
            <div className="text-center">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Generation Error</h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>

                <h3 className="text-lg font-medium text-gray-900 mb-2">Generate AI Content</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Create compelling promotional content based on your incentive details in a single step.
                </p>

                {/* Incentive preview */}
                <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Incentive Summary:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><strong>Title:</strong> {incentiveData.title || 'Not specified'}</li>
                    <li><strong>Duration:</strong> {
                      incentiveData.startDate && incentiveData.endDate
                        ? `${new Date(incentiveData.startDate).toLocaleDateString()} - ${new Date(incentiveData.endDate).toLocaleDateString()}`
                        : 'Not specified'
                    }</li>
                    {incentiveData.audience && (
                      <li><strong>Audience:</strong> {incentiveData.audience.name}</li>
                    )}
                    {incentiveData.tone && (
                      <li><strong>Tone:</strong> {incentiveData.tone.name}</li>
                    )}
                    {incentiveData.category && (
                      <li><strong>Category:</strong> {incentiveData.category.name}</li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={handleGenerateContent}
                  disabled={generatingContent || isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingContent ? (
                    <>
                      <svg className="w-4 h-4 mr-2 animate-spin inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate AI Content
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Review Phase
            <div>
              {/* Controls */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Generated Content</h3>
                  <p className="text-sm text-gray-500">Review and select the content you want to use</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {Object.values(selectedContent).every(Boolean) ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleRegenerateContent}
                    disabled={generatingContent}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                </div>
              </div>

              {/* Generated content items */}
              <div className="space-y-4">
                {Object.entries(contentLabels).map(([key, label]) => (
                  <div key={key} className="border border-gray-200 rounded-lg">
                    <div className="flex items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedContent[key]}
                        onChange={(e) => setSelectedContent(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <h4 className="font-medium text-gray-900">{label}</h4>
                    </div>
                    <div className="p-4">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {generatedContent[key as keyof IncentiveGeneratedContent]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>

          {generatedContent && (
            <button
              onClick={handleApplySelected}
              disabled={isSubmitting || !Object.values(selectedContent).some(Boolean)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Selected Content
            </button>
          )}
        </div>
      </div>
    </div>
  );
};