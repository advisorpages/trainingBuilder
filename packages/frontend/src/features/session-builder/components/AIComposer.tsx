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
}) => {
  const [isCustomPrompt, setIsCustomPrompt] = React.useState(false);
  const [localPrompt, setLocalPrompt] = React.useState(prompt);

  React.useEffect(() => {
    if (!isCustomPrompt) {
      setLocalPrompt(prompt);
    }
  }, [prompt, isCustomPrompt]);

  const activeVersion = aiVersions.find((version) => version.id === (selectedVersionId || acceptedVersionId));

  const handleGenerate = React.useCallback(() => onGenerate(), [onGenerate]);
  const handleRegenerate = React.useCallback(
    () => onGenerate({ prompt: localPrompt }),
    [onGenerate, localPrompt]
  );

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsCustomPrompt(true);
    setLocalPrompt(event.target.value);
    onPromptChange(event.target.value);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Prompt Composer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600">Prompt</label>
            <textarea
              className="mt-2 h-32 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={localPrompt}
              onChange={handlePromptChange}
            />
            <p className="mt-1 text-xs text-slate-500">
              Adjust the prompt to test alternative angles. We keep every AI response in version history.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleGenerate} disabled={aiStatus === 'pending'}>
              Generate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleRegenerate}
              disabled={aiStatus === 'pending'}
            >
              Regenerate
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={aiStatus === 'pending'}
            >
              Tweak + Regen
            </Button>
            {aiStatus === 'pending' ? (
              <span className="text-sm text-slate-500">Generating...</span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Versions</CardTitle>
        </CardHeader>
        <CardContent>
          {aiVersions.length === 0 ? (
            <p className="text-sm text-slate-500">
              Generate a version to start comparing AI proposals. Each regeneration is saved here.
            </p>
          ) : (
            <div className="space-y-3">
              {aiVersions.map((version) => {
                const isAccepted = acceptedVersionId === version.id;
                const isSelected = selectedVersionId === version.id || (!selectedVersionId && isAccepted);
                return (
                  <button
                    key={version.id}
                    className={cn(
                      'w-full rounded-lg border px-3 py-3 text-left transition-colors',
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/60'
                    )}
                    onClick={() => onSelectVersion(version.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {new Date(version.createdAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">Prompt length: {version.prompt.length} chars</p>
                      </div>
                      {isAccepted ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Accepted
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{version.summary}</p>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {activeVersion ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Selected Version</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onRejectVersion}
                  disabled={acceptedVersionId !== activeVersion.id}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAcceptVersion(activeVersion.id)}
                  disabled={acceptedVersionId === activeVersion.id}
                >
                  Accept
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">{activeVersion.summary}</p>
            <div className="space-y-3">
              {activeVersion.blocks.map((block) => (
                <div key={block.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-semibold">{block.heading}</h4>
                  <p className="mt-1 text-sm text-slate-600">{block.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
