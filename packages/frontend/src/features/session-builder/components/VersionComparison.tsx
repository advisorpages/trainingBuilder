import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../../../ui';
import { AIContentVersion } from '../state/types';
import { cn } from '../../../lib/utils';

interface VersionComparisonProps {
  versions: AIContentVersion[];
  selectedVersionIds: [string, string];
  onVersionSelect: (index: 0 | 1, versionId: string) => void;
  onAcceptVersion: (versionId: string) => void;
  onClose: () => void;
  acceptedVersionId?: string;
}

interface DiffHighlight {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

// Simple diff algorithm for highlighting changes
const createSimpleDiff = (text1: string, text2: string): [DiffHighlight[], DiffHighlight[]] => {
  // For simplicity, we'll do a word-based comparison
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const diff1: DiffHighlight[] = [];
  const diff2: DiffHighlight[] = [];

  let i = 0, j = 0;

  while (i < words1.length || j < words2.length) {
    if (i >= words1.length) {
      // Remaining words in text2 are additions
      while (j < words2.length) {
        diff2.push({ type: 'added', text: words2[j] });
        j++;
      }
      break;
    }

    if (j >= words2.length) {
      // Remaining words in text1 are removals
      while (i < words1.length) {
        diff1.push({ type: 'removed', text: words1[i] });
        i++;
      }
      break;
    }

    if (words1[i] === words2[j]) {
      diff1.push({ type: 'unchanged', text: words1[i] });
      diff2.push({ type: 'unchanged', text: words2[j] });
      i++;
      j++;
    } else {
      // Look ahead to find matching words
      let found = false;
      for (let k = j + 1; k < Math.min(j + 5, words2.length); k++) {
        if (words1[i] === words2[k]) {
          // Words j to k-1 in text2 are additions
          while (j < k) {
            diff2.push({ type: 'added', text: words2[j] });
            j++;
          }
          found = true;
          break;
        }
      }

      if (!found) {
        for (let k = i + 1; k < Math.min(i + 5, words1.length); k++) {
          if (words1[k] === words2[j]) {
            // Words i to k-1 in text1 are removals
            while (i < k) {
              diff1.push({ type: 'removed', text: words1[i] });
              i++;
            }
            found = true;
            break;
          }
        }
      }

      if (!found) {
        diff1.push({ type: 'removed', text: words1[i] });
        diff2.push({ type: 'added', text: words2[j] });
        i++;
        j++;
      }
    }
  }

  return [diff1, diff2];
};

const DiffText: React.FC<{ diff: DiffHighlight[] }> = ({ diff }) => (
  <div className="whitespace-pre-wrap">
    {diff.map((item, index) => (
      <span
        key={index}
        className={cn(
          'mr-1',
          item.type === 'added' && 'bg-green-100 text-green-800 px-1 rounded',
          item.type === 'removed' && 'bg-red-100 text-red-800 px-1 rounded line-through',
          item.type === 'unchanged' && 'text-slate-700'
        )}
      >
        {item.text}
      </span>
    ))}
  </div>
);

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  versions,
  selectedVersionIds,
  onVersionSelect,
  onAcceptVersion,
  onClose,
  acceptedVersionId
}) => {
  const [compareMode, setCompareMode] = React.useState<'side-by-side' | 'diff'>('side-by-side');

  const version1 = versions.find(v => v.id === selectedVersionIds[0]);
  const version2 = versions.find(v => v.id === selectedVersionIds[1]);

  if (!version1 || !version2) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-slate-500">Select two versions to compare</p>
        </CardContent>
      </Card>
    );
  }

  const summaryDiff = createSimpleDiff(version1.summary, version2.summary);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Version Comparison</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 p-1">
                <button
                  onClick={() => setCompareMode('side-by-side')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    compareMode === 'side-by-side'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setCompareMode('diff')}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    compareMode === 'diff'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  Differences
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Version Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-700">
                  Version {index + 1}
                </div>
                <select
                  value={selectedVersionIds[index]}
                  onChange={(e) => onVersionSelect(index as 0 | 1, e.target.value)}
                  className="text-sm border border-slate-200 rounded px-2 py-1"
                >
                  {versions.map((version, versionIndex) => (
                    <option key={version.id} value={version.id}>
                      Version {versions.length - versionIndex} ({new Date(version.createdAt).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Comparison Content */}
      {compareMode === 'side-by-side' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[version1, version2].map((version, index) => (
            <Card key={version.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Version {versions.findIndex(v => v.id === version.id) + 1}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {acceptedVersionId === version.id && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                        Accepted
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant={acceptedVersionId === version.id ? "outline" : "default"}
                      onClick={() => onAcceptVersion(version.id)}
                      disabled={acceptedVersionId === version.id}
                    >
                      {acceptedVersionId === version.id ? 'Accepted' : 'Accept'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Summary</h4>
                  <p className="text-sm text-slate-600">{version.summary}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-900">Outline</h4>
                  {version.blocks.map((block, blockIndex) => (
                    <div key={block.id} className="border border-slate-200 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-slate-900 mb-1">
                        {blockIndex + 1}. {block.heading}
                      </h5>
                      <p className="text-sm text-slate-600">{block.body}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Differences</CardTitle>
            <p className="text-sm text-slate-500">
              <span className="inline-block w-3 h-3 bg-red-100 rounded mr-2"></span>
              Removed from Version 1
              <span className="inline-block w-3 h-3 bg-green-100 rounded mx-2 ml-4"></span>
              Added in Version 2
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Diff */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Summary Changes</h4>
              <div className="space-y-2 text-sm">
                <div className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="font-medium text-slate-700 mb-2">Version 1 → Version 2</p>
                  <DiffText diff={summaryDiff[1]} />
                </div>
              </div>
            </div>

            {/* Block-by-block comparison */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">Outline Changes</h4>
              <div className="space-y-4">
                {Math.max(version1.blocks.length, version2.blocks.length) > 0 &&
                  Array.from({ length: Math.max(version1.blocks.length, version2.blocks.length) }, (_, i) => {
                    const block1 = version1.blocks[i];
                    const block2 = version2.blocks[i];

                    if (!block1 && block2) {
                      return (
                        <div key={`added-${i}`} className="border border-green-200 rounded-lg p-3 bg-green-50">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            ✓ Section {i + 1} Added: {block2.heading}
                          </p>
                          <p className="text-sm text-green-700">{block2.body}</p>
                        </div>
                      );
                    }

                    if (block1 && !block2) {
                      return (
                        <div key={`removed-${i}`} className="border border-red-200 rounded-lg p-3 bg-red-50">
                          <p className="text-sm font-medium text-red-800 mb-1">
                            ✗ Section {i + 1} Removed: {block1.heading}
                          </p>
                          <p className="text-sm text-red-700 line-through">{block1.body}</p>
                        </div>
                      );
                    }

                    if (block1 && block2) {
                      const titleDiff = createSimpleDiff(block1.heading, block2.heading);
                      const bodyDiff = createSimpleDiff(block1.body, block2.body);
                      const hasChanges = titleDiff[0].some(d => d.type !== 'unchanged') ||
                                       bodyDiff[0].some(d => d.type !== 'unchanged');

                      if (!hasChanges) {
                        return (
                          <div key={`unchanged-${i}`} className="border border-slate-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-slate-900 mb-1">
                              Section {i + 1}: {block1.heading}
                            </p>
                            <p className="text-sm text-slate-600">No changes</p>
                          </div>
                        );
                      }

                      return (
                        <div key={`changed-${i}`} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Section {i + 1} Modified
                          </p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-slate-600 mb-1">Title:</p>
                              <DiffText diff={titleDiff[1]} />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-600 mb-1">Description:</p>
                              <DiffText diff={bodyDiff[1]} />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};