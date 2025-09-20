import React, { useState, useEffect } from 'react';
import { aiContentService } from '../../services/ai-content.service';

interface ContentVersion {
  index: number;
  contents: Array<{
    type: string;
    content: string;
    metadata?: {
      length: number;
      timestamp: Date;
      model?: string;
    };
  }>;
  generatedAt: Date;
  version?: number;
  versionTimestamp?: Date;
}

interface ContentVersionComparisonProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onRestoreVersion?: (versionIndex: number) => Promise<void>;
}

export const ContentVersionComparison: React.FC<ContentVersionComparisonProps> = ({
  isOpen,
  sessionId,
  onClose,
  onRestoreVersion
}) => {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<string>('all');
  const [isRestoring, setIsRestoring] = useState(false);

  const contentTypeConfig = {
    headline: { label: 'Headlines', icon: '📰', color: 'blue' },
    description: { label: 'Description', icon: '📝', color: 'green' },
    social_media: { label: 'Social Media', icon: '📱', color: 'purple' },
    email_copy: { label: 'Email Copy', icon: '📧', color: 'yellow' },
    key_benefits: { label: 'Key Benefits', icon: '⭐', color: 'red' },
    call_to_action: { label: 'Call to Action', icon: '🎯', color: 'indigo' }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, sessionId]);

  const loadVersions = async () => {
    setLoading(true);
    try {
      const result = await aiContentService.getContentVersions(sessionId);
      setVersions(result.versions);
    } catch (error) {
      console.error('Error loading content versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreVersion = async (versionIndex: number) => {
    if (!onRestoreVersion) return;

    setIsRestoring(true);
    try {
      await onRestoreVersion(versionIndex);
      onClose();
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const getContentByType = (version: ContentVersion, contentType: string) => {
    return version.contents.find(content => content.type === contentType);
  };

  const getAvailableContentTypes = () => {
    if (versions.length === 0) return [];

    const contentTypes = new Set<string>();
    versions.forEach(version => {
      version.contents.forEach(content => {
        contentTypes.add(content.type);
      });
    });

    return Array.from(contentTypes);
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

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Content Version History
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Compare and restore previous content versions
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

          {/* Content Type Filter */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <select
                value={selectedContentType}
                onChange={(e) => setSelectedContentType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Content Types</option>
                {getAvailableContentTypes().map(type => {
                  const config = contentTypeConfig[type as keyof typeof contentTypeConfig];
                  return (
                    <option key={type} value={type}>
                      {config?.label || type}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : versions.length === 0 ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No versions found</h3>
                  <p className="mt-1 text-sm text-gray-500">No previous content versions available.</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-6">
                  {versions.map((version) => (
                    <div
                      key={version.index}
                      className={`border rounded-lg p-4 ${
                        selectedVersion === version.index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="versionSelection"
                            checked={selectedVersion === version.index}
                            onChange={() => setSelectedVersion(version.index)}
                            className="mr-3"
                          />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              Version from {new Date(version.versionTimestamp || version.generatedAt).toLocaleString()}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {version.contents.length} content types
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(version.index)}
                          disabled={isRestoring}
                          className="px-3 py-1 text-sm border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                        >
                          {isRestoring ? 'Restoring...' : 'Restore'}
                        </button>
                      </div>

                      {/* Content Preview */}
                      <div className="space-y-3">
                        {selectedContentType === 'all' ? (
                          // Show all content types
                          version.contents.map((content) => {
                            const config = contentTypeConfig[content.type as keyof typeof contentTypeConfig];
                            return (
                              <div key={content.type} className="border border-gray-100 rounded p-3">
                                <div className="flex items-center mb-2">
                                  <span className="mr-2">{config?.icon || '📄'}</span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {config?.label || content.type}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {content.content.substring(0, 150)}...
                                </p>
                                <div className="mt-1 text-xs text-gray-500">
                                  {content.metadata?.length} characters
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // Show specific content type
                          (() => {
                            const content = getContentByType(version, selectedContentType);
                            if (!content) return <p className="text-sm text-gray-500">No content for this type</p>;

                            return (
                              <div className="border border-gray-100 rounded p-3">
                                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                  {content.content}
                                </p>
                                <div className="mt-2 text-xs text-gray-500">
                                  {content.metadata?.length} characters
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {selectedVersion !== null && (
              <button
                onClick={() => handleRestoreVersion(selectedVersion)}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isRestoring ? 'Restoring Selected Version...' : 'Restore Selected Version'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};