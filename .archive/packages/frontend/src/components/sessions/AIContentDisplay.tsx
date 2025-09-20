import React, { useState, useEffect } from 'react';
import { ContentVersionComparison } from './ContentVersionComparison';
import { AIContentIntegration } from './AIContentIntegration';

interface GeneratedContent {
  type: string;
  content: string;
  metadata?: {
    length: number;
    timestamp: Date;
    model?: string;
  };
}

interface AIContentResponse {
  contents: GeneratedContent[];
  prompt: string;
  sessionId?: string;
  generatedAt: Date;
  model?: string;
  totalTokensUsed?: number;
}

interface AIContentDisplayProps {
  isOpen: boolean;
  sessionData: any;
  generatedContent: AIContentResponse | null;
  isGenerating: boolean;
  onClose: () => void;
  onRegenerateContent: () => void;
  onSaveContent: (content: AIContentResponse) => Promise<void>;
  onEditContent?: (contentType: string, content: string) => void;
  onRegenerateSpecific?: (contentTypes: string[], feedback?: string, parameters?: any) => Promise<void>;
  onRestoreVersion?: (versionIndex: number) => Promise<void>;
  onContentIntegrated?: () => void;
}

export const AIContentDisplay: React.FC<AIContentDisplayProps> = ({
  isOpen,
  sessionData,
  generatedContent,
  isGenerating,
  onClose,
  onRegenerateContent,
  onSaveContent,
  onEditContent,
  onRegenerateSpecific,
  onRestoreVersion,
  onContentIntegrated
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [userFeedback, setUserFeedback] = useState('');
  const [regenerationParameters, setRegenerationParameters] = useState({
    tone: '',
    length: 'same' as 'shorter' | 'longer' | 'same',
    focus: '',
    style: ''
  });
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showVersionComparison, setShowVersionComparison] = useState(false);
  const [showContentIntegration, setShowContentIntegration] = useState(false);

  const contentTypeConfig = {
    headline: { label: 'Headlines', icon: '📰', color: 'blue' },
    description: { label: 'Description', icon: '📝', color: 'green' },
    social_media: { label: 'Social Media', icon: '📱', color: 'purple' },
    email_copy: { label: 'Email Copy', icon: '📧', color: 'yellow' },
    key_benefits: { label: 'Key Benefits', icon: '⭐', color: 'red' },
    call_to_action: { label: 'Call to Action', icon: '🎯', color: 'indigo' }
  };

  useEffect(() => {
    if (generatedContent && generatedContent.contents.length > 0) {
      setActiveTab('overview');
    }
  }, [generatedContent]);

  const handleSave = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      await onSaveContent(generatedContent);
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getContentByType = (type: string): GeneratedContent | undefined => {
    return generatedContent?.contents.find(content => content.type === type);
  };

  const handleRegenerateSpecific = async () => {
    if (!onRegenerateSpecific || selectedContentTypes.length === 0) return;

    setIsRegenerating(true);
    try {
      await onRegenerateSpecific(
        selectedContentTypes,
        userFeedback.trim() || undefined,
        Object.keys(regenerationParameters).reduce((acc, key) => {
          if (regenerationParameters[key as keyof typeof regenerationParameters]) {
            acc[key] = regenerationParameters[key as keyof typeof regenerationParameters];
          }
          return acc;
        }, {} as any)
      );
      setShowRegenerateModal(false);
      setSelectedContentTypes([]);
      setUserFeedback('');
      setRegenerationParameters({
        tone: '',
        length: 'same',
        focus: '',
        style: ''
      });
    } catch (error) {
      console.error('Error regenerating content:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const openRegenerateModal = (contentType?: string) => {
    if (contentType) {
      setSelectedContentTypes([contentType]);
    }
    setShowRegenerateModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal positioning */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  AI Generated Content
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {sessionData.title}
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
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <nav className="mt-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium text-left border-r-2 ${
                    activeTab === 'overview'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">📊</span>
                  Overview
                </button>

                {generatedContent?.contents.map((content) => {
                  const config = contentTypeConfig[content.type as keyof typeof contentTypeConfig] || {
                    label: content.type,
                    icon: '📄',
                    color: 'gray'
                  };

                  return (
                    <button
                      key={content.type}
                      onClick={() => setActiveTab(content.type)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium text-left border-r-2 ${
                        activeTab === content.type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{config.icon}</span>
                      {config.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Generating AI content...</p>
                    <p className="text-sm text-gray-500">This may take a few moments</p>
                  </div>
                </div>
              ) : !generatedContent ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No content generated</h3>
                    <p className="mt-1 text-sm text-gray-500">Generate content to see it here.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {activeTab === 'overview' ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Content Overview</h4>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {generatedContent.contents.length}
                            </div>
                            <div className="text-sm text-blue-800">Content Types</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {generatedContent.totalTokensUsed || 'N/A'}
                            </div>
                            <div className="text-sm text-green-800">Tokens Used</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {generatedContent.contents.map((content) => {
                          const config = contentTypeConfig[content.type as keyof typeof contentTypeConfig] || {
                            label: content.type,
                            icon: '📄',
                            color: 'gray'
                          };

                          return (
                            <div key={content.type} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <span className="mr-2">{config.icon}</span>
                                  <h5 className="font-medium text-gray-900">{config.label}</h5>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => copyToClipboard(content.content)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="Copy to clipboard"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => setActiveTab(content.type)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-3">
                                {content.content.substring(0, 200)}...
                              </p>
                              <div className="mt-2 text-xs text-gray-500">
                                {content.metadata?.length} characters
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    // Individual content type view
                    (() => {
                      const content = getContentByType(activeTab);
                      const config = contentTypeConfig[activeTab as keyof typeof contentTypeConfig] || {
                        label: activeTab,
                        icon: '📄',
                        color: 'gray'
                      };

                      if (!content) return null;

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="mr-3 text-2xl">{config.icon}</span>
                              <h4 className="text-lg font-medium text-gray-900">{config.label}</h4>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => copyToClipboard(content.content)}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                              >
                                Copy
                              </button>
                              {onEditContent && (
                                <button
                                  onClick={() => onEditContent(content.type, content.content)}
                                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                  Edit
                                </button>
                              )}
                              {onRegenerateSpecific && (
                                <button
                                  onClick={() => openRegenerateModal(content.type)}
                                  className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                                >
                                  Regenerate
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900">
                              {content.content}
                            </pre>
                          </div>

                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Length: {content.metadata?.length} characters</div>
                            <div>Generated: {content.metadata?.timestamp ? new Date(content.metadata.timestamp).toLocaleString() : 'Unknown'}</div>
                            {content.metadata?.model && <div>Model: {content.metadata.model}</div>}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
              {generatedContent && (
                <div className="flex space-x-2">
                  <button
                    onClick={onRegenerateContent}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
                  >
                    Regenerate All
                  </button>
                  {onRegenerateSpecific && (
                    <button
                      onClick={() => openRegenerateModal()}
                      className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-md hover:bg-indigo-100"
                    >
                      Smart Regenerate
                    </button>
                  )}
                  {onRestoreVersion && sessionData.id && (
                    <button
                      onClick={() => setShowVersionComparison(true)}
                      className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-md hover:bg-purple-100"
                    >
                      Version History
                    </button>
                  )}
                </div>
              )}
            </div>

            {generatedContent && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Content'}
                </button>
                {onContentIntegrated && sessionData.id && (
                  <button
                    onClick={() => setShowContentIntegration(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Integrate to Draft
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Regeneration Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRegenerateModal(false)} />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Regenerate Content</h3>

                {/* Content Type Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Types to Regenerate</label>
                  <div className="space-y-2">
                    {generatedContent?.contents.map((content) => {
                      const config = contentTypeConfig[content.type as keyof typeof contentTypeConfig];
                      return (
                        <label key={content.type} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedContentTypes.includes(content.type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedContentTypes([...selectedContentTypes, content.type]);
                              } else {
                                setSelectedContentTypes(selectedContentTypes.filter(t => t !== content.type));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="mr-2">{config?.icon || '📄'}</span>
                          {config?.label || content.type}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* User Feedback */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback (Optional)</label>
                  <textarea
                    value={userFeedback}
                    onChange={(e) => setUserFeedback(e.target.value)}
                    placeholder="Describe what you'd like to improve or change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                {/* Regeneration Parameters */}
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                    <input
                      type="text"
                      value={regenerationParameters.tone}
                      onChange={(e) => setRegenerationParameters({...regenerationParameters, tone: e.target.value})}
                      placeholder="e.g., more casual, professional, energetic"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
                    <select
                      value={regenerationParameters.length}
                      onChange={(e) => setRegenerationParameters({...regenerationParameters, length: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="same">Keep same length</option>
                      <option value="shorter">Make shorter</option>
                      <option value="longer">Make longer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Focus</label>
                    <input
                      type="text"
                      value={regenerationParameters.focus}
                      onChange={(e) => setRegenerationParameters({...regenerationParameters, focus: e.target.value})}
                      placeholder="e.g., benefits, urgency, social proof"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleRegenerateSpecific}
                  disabled={selectedContentTypes.length === 0 || isRegenerating}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button
                  onClick={() => setShowRegenerateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Version Comparison Modal */}
      {showVersionComparison && sessionData.id && (
        <ContentVersionComparison
          isOpen={showVersionComparison}
          sessionId={sessionData.id}
          onClose={() => setShowVersionComparison(false)}
          onRestoreVersion={onRestoreVersion}
        />
      )}

      {/* AI Content Integration Modal */}
      {showContentIntegration && sessionData.id && (
        <AIContentIntegration
          isOpen={showContentIntegration}
          sessionId={sessionData.id}
          generatedContent={generatedContent}
          onClose={() => setShowContentIntegration(false)}
          onContentIntegrated={() => {
            setShowContentIntegration(false);
            if (onContentIntegrated) onContentIntegrated();
          }}
        />
      )}
    </div>
  );
};