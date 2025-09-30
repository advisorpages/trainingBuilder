import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../../ui';
import { AIContentVersion } from '../state/types';
import { cn } from '../../../lib/utils';

interface AIComposerProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: (options?: { prompt?: string }) => Promise<void>;
  aiVersions: AIContentVersion[];
  selectedVersionId?: string;
  acceptedVersionId?: string;
  aiStatus: 'idle' | 'pending' | 'error';
  onSelectVersion: (versionId: string) => void;
  onAcceptVersion: (versionId: string) => void;
  onRejectVersion: () => void;
  hasMetadataChanged?: boolean;
  lastGenerationSource?: 'ai' | 'template' | 'mock';
  lastGenerationError?: string;
}

export const AIComposer: React.FC<AIComposerProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  aiVersions,
  selectedVersionId,
  acceptedVersionId,
  aiStatus,
  onSelectVersion,
  onAcceptVersion,
  onRejectVersion,
  hasMetadataChanged = false,
  lastGenerationSource,
  lastGenerationError,
}) => {
  const activeVersion = aiVersions.find((version) => version.id === (selectedVersionId || acceptedVersionId));
  const hasGeneratedContent = aiVersions.length > 0;
  const isGenerating = aiStatus === 'pending';
  const hasAcceptedVersion = !!acceptedVersionId;

  const handleGenerate = React.useCallback(() => {
    onGenerate();
  }, [onGenerate]);

  const getGenerateButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (!hasGeneratedContent) return 'Generate Outline';
    if (hasMetadataChanged) return 'Generate New Version';
    return 'Regenerate';
  };

  // Auto-accept the selected version
  React.useEffect(() => {
    if (selectedVersionId && selectedVersionId !== acceptedVersionId) {
      onAcceptVersion(selectedVersionId);
    }
  }, [selectedVersionId, acceptedVersionId, onAcceptVersion]);

  return (
    <div className="space-y-4">
      {/* Session Outline Header */}
      <Card>
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-base">Session Outline</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Review the content below and use the accept button at the bottom when ready
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Session Outline Content */}
      {activeVersion ? (
        <Card>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Session Summary</h4>
              <p className="text-sm text-slate-600">{activeVersion.summary}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Session Topics</h4>
              {activeVersion.sections && activeVersion.sections.length > 0 ? (
                // New topic-based display with trainer assignment
                activeVersion.sections.map((section, index) => (
                  <div key={section.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h5 className="text-sm font-semibold text-slate-900">{section.title}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                              {section.type}
                            </span>
                            <span className="text-xs text-slate-500">{section.duration} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Trainer Assignment */}
                      <div className="flex items-center gap-2">
                        <select className="text-xs border border-slate-200 rounded px-2 py-1 bg-white">
                          <option value="">Assign Trainer</option>
                          <option value="trainer1">John Smith</option>
                          <option value="trainer2">Jane Doe</option>
                          <option value="trainer3">Mike Johnson</option>
                        </select>

                        {/* Edit/Delete buttons */}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>

                      {section.associatedTopic && (
                        <div className="flex items-center gap-1 text-xs">
                          <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700">Topic Match</span>
                        </div>
                      )}
                      {section.isTopicSuggestion && (
                        <div className="flex items-center gap-1 text-xs">
                          <svg className="h-3 w-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span className="text-yellow-700">New Topic</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{section.description}</p>

                    {section.associatedTopic && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h6 className="text-sm font-medium text-green-800 mb-1">
                              Matched Topic: {section.associatedTopic.name}
                            </h6>
                            {section.associatedTopic.description && (
                              <p className="text-xs text-green-700">{section.associatedTopic.description}</p>
                            )}
                          </div>
                          {section.associatedTopic.matchScore && (
                            <span className="text-xs text-green-600 font-medium">
                              {Math.round(section.associatedTopic.matchScore * 100)}% match
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {section.learningObjectives && section.learningObjectives.length > 0 && (
                      <div className="mb-2">
                        <h6 className="text-xs font-medium text-slate-700 mb-1">Learning Objectives:</h6>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {section.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-slate-400">•</span>
                              <span>{objective}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {section.suggestedActivities && section.suggestedActivities.length > 0 && (
                      <div>
                        <h6 className="text-xs font-medium text-slate-700 mb-1">Suggested Activities:</h6>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {section.suggestedActivities.map((activity, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="text-slate-400">•</span>
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Fallback to blocks display for backward compatibility
                activeVersion.blocks.map((block, index) => (
                  <div key={block.id} className="flex gap-3 border border-slate-200 rounded-lg p-4 bg-white">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-slate-900 mb-1">{block.heading}</h5>
                      <p className="text-sm text-slate-600">{block.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Action buttons moved to bottom of topics */}
            <div className="flex justify-center gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" size="sm">
                Add Section/Topic
              </Button>
              {aiVersions.length > 1 && (
                <Button variant="outline" size="sm">
                  Compare Versions
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : hasGeneratedContent ? (
        // Show version selection if no active version
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Select a Version</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Choose a version to review and accept
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiVersions.slice().reverse().map((version, index) => {
                const isSelected = selectedVersionId === version.id;
                const isLatest = index === 0;

                return (
                  <div
                    key={version.id}
                    className={cn(
                      'rounded-lg border transition-all cursor-pointer',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                    onClick={() => onSelectVersion(version.id)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-slate-900">
                              Version {aiVersions.length - index}
                            </p>
                            {isLatest && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mb-2">
                            {new Date(version.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {version.summary}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Initial empty state
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-sm font-medium text-slate-900 mb-2">No session outline yet</h3>
              <p className="text-sm text-slate-500 mb-6">Generate your first AI-powered session outline to get started</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate New Version button - moved to bottom */}
      <div className="flex justify-center">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={cn(
            'h-12 px-8 text-base font-medium',
            hasMetadataChanged ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              {getGenerateButtonText()}
            </div>
          ) : (
            getGenerateButtonText()
          )}
        </Button>
      </div>

      {/* Accept Session Button - moved to bottom */}
      {activeVersion && (
        <div className="flex justify-center pt-4">
          <Button
            size="lg"
            onClick={() => onAcceptVersion(activeVersion.id)}
            className="bg-green-600 hover:bg-green-700 text-white h-12 px-8"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Accept Session Outline
          </Button>
        </div>
      )}
    </div>
  );
};