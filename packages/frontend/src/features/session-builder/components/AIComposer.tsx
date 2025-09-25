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
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);
  const [isCustomPrompt, setIsCustomPrompt] = React.useState(false);
  const [localPrompt, setLocalPrompt] = React.useState(prompt);

  React.useEffect(() => {
    if (!isCustomPrompt) {
      setLocalPrompt(prompt);
    }
  }, [prompt, isCustomPrompt]);

  const activeVersion = aiVersions.find((version) => version.id === (selectedVersionId || acceptedVersionId));
  const hasGeneratedContent = aiVersions.length > 0;
  const isGenerating = aiStatus === 'pending';
  const hasAcceptedVersion = !!acceptedVersionId;

  const handleGenerate = React.useCallback(() => {
    if (isCustomPrompt) {
      onGenerate({ prompt: localPrompt });
    } else {
      onGenerate();
    }
  }, [onGenerate, isCustomPrompt, localPrompt]);

  const getGenerateButtonText = () => {
    if (isGenerating) return 'Generating...';
    if (!hasGeneratedContent) return 'Generate Outline';
    if (hasMetadataChanged) return 'Generate New Version';
    return 'Regenerate';
  };

  const getGenerateButtonDescription = () => {
    if (!hasGeneratedContent) return 'Create your first AI-generated session outline';
    if (hasMetadataChanged) return 'Your session details have changed. Generate a new version to reflect updates.';
    return 'Create another version with the current settings';
  };

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setIsCustomPrompt(true);
    setLocalPrompt(value);
    onPromptChange(value);
  };

  const resetToAutoPrompt = () => {
    setIsCustomPrompt(false);
    setLocalPrompt(prompt);
    onPromptChange(prompt);
  };

  return (
    <div className="space-y-4">
      {/* Primary Generation Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">AI Content Generation</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {getGenerateButtonDescription()}
              </p>
            </div>
            {hasMetadataChanged && (
              <div className="flex items-center gap-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Content needs update
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Generation Status Indicator */}
          {(lastGenerationSource === 'template' || lastGenerationSource === 'mock' || lastGenerationError) && (
            <div className={cn(
              'rounded-lg border p-3 text-sm',
              lastGenerationError
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-yellow-200 bg-yellow-50 text-yellow-800'
            )}>
              <div className="flex items-start gap-2">
                <svg className={cn('h-4 w-4 mt-0.5 flex-shrink-0',
                  lastGenerationError ? 'text-red-600' : 'text-yellow-600'
                )} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  {lastGenerationError ? (
                    <>
                      <p className="font-medium">AI Generation Failed</p>
                      <p className="text-xs mt-1">{lastGenerationError}</p>
                      <p className="text-xs mt-1 opacity-75">Using fallback template content instead.</p>
                    </>
                  ) : lastGenerationSource === 'template' ? (
                    <>
                      <p className="font-medium">Using Template Content</p>
                      <p className="text-xs mt-1">Your backend is generating structured content based on your inputs, not OpenAI.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Using Mock Content</p>
                      <p className="text-xs mt-1">Displaying placeholder content for development.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Primary Generate Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={cn(
                'flex-1 h-12 text-base font-medium',
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

            <Button
              variant="outline"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              disabled={isGenerating}
              className="h-12"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              {showAdvancedOptions ? 'Hide' : 'Show'} Options
            </Button>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-slate-700">
                    Custom Prompt
                  </label>
                  {isCustomPrompt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetToAutoPrompt}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Reset to Auto
                    </Button>
                  )}
                </div>
                <textarea
                  className="h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  value={localPrompt}
                  onChange={handlePromptChange}
                  placeholder="Customize the AI prompt to generate specific content..."
                  rows={4}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {isCustomPrompt
                    ? 'Using custom prompt. Click "Reset to Auto" to use the generated prompt based on your session details.'
                    : 'This prompt is automatically generated from your session details. Edit to customize the AI output.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Versions History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Generated Versions</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {aiVersions.length === 0
                  ? 'Your AI-generated versions will appear here'
                  : `${aiVersions.length} version${aiVersions.length === 1 ? '' : 's'} available`
                }
              </p>
            </div>
            {aiVersions.length > 1 && (
              <Button variant="ghost" size="sm" className="text-xs">
                Compare Versions
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiVersions.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
              <svg className="mx-auto h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="text-sm text-slate-500 mb-2">No versions generated yet</p>
              <p className="text-xs text-slate-400">Click "Generate Outline" to create your first AI-powered session outline</p>
            </div>
          ) : (
            <div className="space-y-3">
              {aiVersions.slice().reverse().map((version, index) => {
                const isAccepted = acceptedVersionId === version.id;
                const isSelected = selectedVersionId === version.id || (!selectedVersionId && isAccepted);
                const isLatest = index === 0;

                return (
                  <div
                    key={version.id}
                    className={cn(
                      'rounded-lg border transition-all',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <button
                      className="w-full px-4 py-3 text-left"
                      onClick={() => onSelectVersion(version.id)}
                    >
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
                            {isAccepted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                ✓ Accepted
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
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Version Preview */}
      {activeVersion && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Preview Content</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {activeVersion === aiVersions.find(v => v.id === acceptedVersionId)
                    ? 'This version is accepted and will be used for your session'
                    : 'Preview this version before accepting'
                  }
                </p>
              </div>
              <div className="flex gap-2">
                {acceptedVersionId === activeVersion.id ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRejectVersion}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => onAcceptVersion(activeVersion.id)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Version
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900 mb-2">Session Summary</h4>
              <p className="text-sm text-slate-600">{activeVersion.summary}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Session Outline</h4>
              {activeVersion.blocks.map((block, index) => (
                <div key={block.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-slate-900 mb-1">{block.heading}</h5>
                    <p className="text-sm text-slate-600">{block.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {!hasAcceptedVersion && activeVersion && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Ready to accept?</p>
                    <p className="text-sm text-blue-600 mt-1">
                      Accepting this version will make it available for your session outline and enable the next steps in the builder.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
