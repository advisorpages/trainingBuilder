import React, { useState, useEffect } from 'react';
import { aiIntegrationService, AIContentIntegrationRequest, SessionPreviewResponse } from '../../services/ai-integration.service';
import { AIContentResponse } from '../../services/ai-content.service';
import { SessionDraftPreview } from './SessionDraftPreview';

interface AIContentIntegrationProps {
  isOpen: boolean;
  sessionId: string;
  generatedContent: AIContentResponse | null;
  onClose: () => void;
  onContentIntegrated: () => void;
}

export const AIContentIntegration: React.FC<AIContentIntegrationProps> = ({
  isOpen,
  sessionId,
  generatedContent,
  onClose,
  onContentIntegrated
}) => {
  const [selectedContent, setSelectedContent] = useState<{
    headline?: string;
    description?: string;
    keyBenefits?: string;
    callToAction?: string;
    socialMedia?: string;
    emailCopy?: string;
  }>({});

  const [options, setOptions] = useState({
    overrideExistingTitle: false,
    overrideExistingDescription: false,
    preserveAIContent: true
  });

  const [sessionPreview, setSessionPreview] = useState<SessionPreviewResponse | null>(null);
  const [isIntegrating, setIsIntegrating] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDraftPreview, setShowDraftPreview] = useState(false);

  const contentTypeConfig = {
    headline: { label: 'Headlines', icon: '📰', color: 'blue' },
    description: { label: 'Description', icon: '📝', color: 'green' },
    social_media: { label: 'Social Media', icon: '📱', color: 'purple' },
    email_copy: { label: 'Email Copy', icon: '📧', color: 'yellow' },
    key_benefits: { label: 'Key Benefits', icon: '⭐', color: 'red' },
    call_to_action: { label: 'Call to Action', icon: '🎯', color: 'indigo' }
  };

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionPreview();
    }
  }, [isOpen, sessionId]);

  const loadSessionPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const preview = await aiIntegrationService.getSessionPreview(sessionId);
      setSessionPreview(preview);
    } catch (error) {
      console.error('Error loading session preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleContentSelection = (contentType: string, content: string) => {
    setSelectedContent(prev => ({
      ...prev,
      [contentType]: content
    }));
  };

  const handleIntegrateContent = async () => {
    if (Object.keys(selectedContent).length === 0) {
      alert('Please select at least one content item to integrate');
      return;
    }

    setIsIntegrating(true);
    try {
      const request: AIContentIntegrationRequest = {
        selectedHeadline: selectedContent.headline,
        selectedDescription: selectedContent.description,
        selectedKeyBenefits: selectedContent.keyBenefits,
        selectedCallToAction: selectedContent.callToAction,
        selectedSocialMedia: selectedContent.socialMedia,
        selectedEmailCopy: selectedContent.emailCopy,
        overrideExistingTitle: options.overrideExistingTitle,
        overrideExistingDescription: options.overrideExistingDescription,
        preserveAIContent: options.preserveAIContent
      };

      await aiIntegrationService.integrateAIContentToDraft(sessionId, request);
      onContentIntegrated();
      onClose();
    } catch (error) {
      console.error('Error integrating content:', error);
      alert('Failed to integrate content. Please try again.');
    } finally {
      setIsIntegrating(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Integrate AI Content to Session Draft
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select which AI-generated content to integrate into your session
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex h-96">
            {/* Content Selection */}
            <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
              <div className="p-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Select Content to Integrate</h4>

                {generatedContent?.contents.map((content) => {
                  const config = contentTypeConfig[content.type as keyof typeof contentTypeConfig] || {
                    label: content.type,
                    icon: '📄',
                    color: 'gray'
                  };

                  const mappedType = content.type === 'social_media' ? 'socialMedia' :
                                  content.type === 'email_copy' ? 'emailCopy' :
                                  content.type === 'key_benefits' ? 'keyBenefits' :
                                  content.type === 'call_to_action' ? 'callToAction' :
                                  content.type;

                  return (
                    <div key={content.type} className="mb-4 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="mr-2">{config.icon}</span>
                          <h5 className="font-medium text-gray-900">{config.label}</h5>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedContent[mappedType as keyof typeof selectedContent] === content.content}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleContentSelection(mappedType, content.content);
                            } else {
                              setSelectedContent(prev => {
                                const newSelected = { ...prev };
                                delete newSelected[mappedType as keyof typeof selectedContent];
                                return newSelected;
                              });
                            }
                          }}
                          className="mr-2"
                        />
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {content.content.substring(0, 150)}...
                      </p>
                      <div className="mt-2 text-xs text-gray-500">
                        {content.metadata?.length} characters
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview Panel */}
            <div className="w-1/2 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">Preview Integration</h4>
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </button>
                </div>

                {showPreview && (
                  <div className="space-y-4">
                    {isLoadingPreview ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : sessionPreview ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Session Title</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                            {options.overrideExistingTitle && selectedContent.headline
                              ? selectedContent.headline
                              : sessionPreview.previewData.title}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                            {options.overrideExistingDescription && selectedContent.description
                              ? selectedContent.description
                              : sessionPreview.previewData.description}
                          </p>
                        </div>

                        {selectedContent.headline && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Promotional Headline</label>
                            <p className="mt-1 text-sm text-gray-900 bg-blue-50 p-2 rounded">
                              {selectedContent.headline}
                            </p>
                          </div>
                        )}

                        {selectedContent.keyBenefits && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Key Benefits</label>
                            <p className="mt-1 text-sm text-gray-900 bg-green-50 p-2 rounded">
                              {selectedContent.keyBenefits}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Unable to load preview</p>
                    )}
                  </div>
                )}

                {/* Integration Options */}
                <div className="mt-6 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Integration Options</h5>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.overrideExistingTitle}
                      onChange={(e) => setOptions(prev => ({...prev, overrideExistingTitle: e.target.checked}))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Replace session title with AI headline</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.overrideExistingDescription}
                      onChange={(e) => setOptions(prev => ({...prev, overrideExistingDescription: e.target.checked}))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Replace session description with AI content</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.preserveAIContent}
                      onChange={(e) => setOptions(prev => ({...prev, preserveAIContent: e.target.checked}))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Keep AI content for future use</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDraftPreview(true)}
                className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100"
              >
                Preview Final Session
              </button>
            </div>
            <button
              onClick={handleIntegrateContent}
              disabled={Object.keys(selectedContent).length === 0 || isIntegrating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isIntegrating ? 'Integrating...' : 'Integrate Selected Content'}
            </button>
          </div>
        </div>
      </div>

      {/* Session Draft Preview Modal */}
      <SessionDraftPreview
        isOpen={showDraftPreview}
        sessionId={sessionId}
        onClose={() => setShowDraftPreview(false)}
        onFinalizeDraft={() => {
          setShowDraftPreview(false);
          onContentIntegrated();
        }}
      />
    </div>
  );
};