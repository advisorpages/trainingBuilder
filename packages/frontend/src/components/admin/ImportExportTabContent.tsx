import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { importExportService } from '../../services/import-export.service';

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: Array<{ field?: string; message: string; row?: number } | string>;
}

interface ProgressState {
  isLoading: boolean;
  progress: number;
  status: string;
  canCancel: boolean;
}

type EntityType = 'sessions' | 'topics';
type ExportFormat = 'json' | 'csv';
type LoadingState =
  | null
  | 'sessions-export-json'
  | 'sessions-export-csv'
  | 'topics-export-json'
  | 'topics-export-csv'
  | 'sessions-import'
  | 'topics-import';

const initialSummary: ImportSummary = { total: 0, created: 0, updated: 0, errors: [] };
const initialProgress: ProgressState = { isLoading: false, progress: 0, status: '', canCancel: false };

export const ImportExportTabContent: React.FC = () => {
  const [sessionsSummary, setSessionsSummary] = useState<ImportSummary>(initialSummary);
  const [topicsSummary, setTopicsSummary] = useState<ImportSummary>(initialSummary);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [progress, setProgress] = useState<ProgressState>(initialProgress);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ sessions: boolean; topics: boolean }>({ sessions: false, topics: false });

  const resetStatus = () => {
    setMessage(null);
    setError(null);
    setProgress(initialProgress);
  };

  const updateProgress = useCallback((status: string, progressPercent: number, canCancel = false) => {
    setProgress({ isLoading: true, progress: progressPercent, status, canCancel });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, type: EntityType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: true }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, type: EntityType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, type: EntityType) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [type]: false }));

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Only JSON files are supported for import');
        return;
      }

      await handleImport(type, file);
    }
  }, []);

  const downloadJson = (data: unknown, prefix: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prefix}-${timestamp}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadBlob = (blob: Blob, prefix: string, extension: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${prefix}-${timestamp}.${extension}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: EntityType, format: ExportFormat) => {
    resetStatus();
    const loadingKey = `${type}-export-${format}` as LoadingState;
    setLoading(loadingKey);

    try {
      updateProgress(`Preparing ${type} export...`, 10);

      const formatLabel = format.toUpperCase();

      if (type === 'sessions') {
        updateProgress('Fetching sessions data...', 30);
        const response = await importExportService.exportSessions(format);

        updateProgress('Processing export data...', 70);

        if (format === 'csv') {
          const blob = response.data as Blob;
          downloadBlob(blob, 'sessions-export', 'csv');
          const countHeader = response.headers?.['x-export-count'];
          const parsedCount = countHeader ? Number.parseInt(String(countHeader), 10) : NaN;
          const countMessage = Number.isFinite(parsedCount) && !Number.isNaN(parsedCount) ? parsedCount : null;
          setMessage(
            countMessage !== null
              ? `✅ Exported ${countMessage} sessions as ${formatLabel}.`
              : `✅ Exported sessions as ${formatLabel}.`,
          );
        } else {
          const data = response.data as any[];
          downloadJson(data, 'sessions-export');
          setMessage(`✅ Exported ${data.length} sessions as ${formatLabel}.`);
        }
      } else {
        updateProgress('Fetching topics data...', 30);
        const response = await importExportService.exportTopics(format);

        updateProgress('Processing export data...', 70);

        if (format === 'csv') {
          const blob = response.data as Blob;
          downloadBlob(blob, 'topics-export', 'csv');
          const countHeader = response.headers?.['x-export-count'];
          const parsedCount = countHeader ? Number.parseInt(String(countHeader), 10) : NaN;
          const countMessage = Number.isFinite(parsedCount) && !Number.isNaN(parsedCount) ? parsedCount : null;
          setMessage(
            countMessage !== null
              ? `✅ Exported ${countMessage} topics as ${formatLabel}.`
              : `✅ Exported topics as ${formatLabel}.`,
          );
        } else {
          const data = response.data as any[];
          downloadJson(data, 'topics-export');
          setMessage(`✅ Exported ${data.length} topics as ${formatLabel}.`);
        }
      }

      updateProgress('Export completed successfully!', 100);
    } catch (err) {
      const errorMessage = (err as Error).message || `Failed to export ${type}.`;
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(null);
      setTimeout(() => setProgress(initialProgress), 2000);
    }
  };

  const handleImport = async (type: EntityType, file: File | null) => {
    if (!file) {
      setError('Please choose a JSON file before importing.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB. Please use a smaller file or split your data.');
      return;
    }

    resetStatus();
    setLoading(`${type}-import` as LoadingState);

    try {
      updateProgress('Reading file...', 10);

      const text = await file.text();
      updateProgress('Parsing JSON data...', 30);

      const payload = JSON.parse(text);

      updateProgress('Validating data structure...', 50);

      let summary: ImportSummary;
      if (type === 'sessions') {
        if (!Array.isArray(payload.sessions)) {
          throw new Error('Invalid JSON format: Expected a "sessions" array property.');
        }
        if (payload.sessions.length === 0) {
          throw new Error('No sessions found in file. The sessions array is empty.');
        }

        updateProgress('Importing sessions...', 70);
        summary = await importExportService.importSessions({ sessions: payload.sessions });
        setSessionsSummary(summary);

        const successMessage = `✅ Processed ${summary.total} sessions. Created ${summary.created}, updated ${summary.updated}.`;
        setMessage(successMessage);
      } else {
        if (!Array.isArray(payload.topics)) {
          throw new Error('Invalid JSON format: Expected a "topics" array property.');
        }
        if (payload.topics.length === 0) {
          throw new Error('No topics found in file. The topics array is empty.');
        }

        updateProgress('Importing topics...', 70);
        summary = await importExportService.importTopics({ topics: payload.topics });
        setTopicsSummary(summary);

        const successMessage = `✅ Processed ${summary.total} topics. Created ${summary.created}, updated ${summary.updated}.`;
        setMessage(successMessage);
      }

      updateProgress('Import completed successfully!', 100);
    } catch (err) {
      const errorMessage = (err as Error).message || `Failed to import ${type}.`;
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(null);
      setTimeout(() => setProgress(initialProgress), 3000);
    }
  };

  const summaries = useMemo(
    () => ({
      sessions: sessionsSummary,
      topics: topicsSummary,
    }),
    [sessionsSummary, topicsSummary],
  );

  const renderProgressBar = () => {
    if (!progress.isLoading) return null;

    return (
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-700">{progress.status}</span>
          <span className="text-sm text-blue-600">{progress.progress}%</span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        {progress.canCancel && (
          <button
            onClick={() => {
              setLoading(null);
              setProgress(initialProgress);
            }}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cancel
          </button>
        )}
      </div>
    );
  };

  const renderSummary = (type: EntityType) => {
    const summary = summaries[type];
    if (summary.total === 0) return null;

    return (
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <p>
          Processed <strong>{summary.total}</strong> {type}. Created{' '}
          <strong>{summary.created}</strong>, updated <strong>{summary.updated}</strong>.
        </p>
        {summary.errors.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-red-600">
              View {summary.errors.length} error(s)
            </summary>
            <ul className="ml-4 list-disc space-y-1 pt-1 text-red-600">
              {summary.errors.map((error, index) => (
                <li key={`${type}-error-${index}`}>
                  {typeof error === 'string' ? error : `${error.field ? `Field ${error.field}: ` : ''}${error.message}${error.row ? ` (Row ${error.row})` : ''}`}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {renderProgressBar()}

      {(message || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-medium shadow-sm transition-all duration-300 ${
            error
              ? 'border-red-200 bg-red-50 text-red-700 animate-pulse'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{error ? '❌' : '✅'}</span>
            {error || message}
          </div>
        </div>
      )}

      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-slate-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
            <span className="text-xl">📋</span>
            Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-slate-600">
            Export all sessions (including scheduling data and content versions) or import a JSON file to perform bulk
            updates.
          </p>

          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Export Options</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => void handleExport('sessions', 'json')}
                disabled={loading === 'sessions-export-json'}
                className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
              >
                {loading === 'sessions-export-json' ? '📤 Exporting…' : '📄 Export JSON'}
              </Button>
              <Button
                onClick={() => void handleExport('sessions', 'csv')}
                disabled={loading === 'sessions-export-csv'}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
              >
                {loading === 'sessions-export-csv' ? '📊 Exporting…' : '📊 Export CSV'}
              </Button>
            </div>
          </div>

          {/* Import Section with Drag & Drop */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Import Options</h4>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 transform ${
                dragOver.sessions
                  ? 'border-blue-400 bg-blue-50 scale-105 shadow-inner'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 hover:scale-102'
              }`}
              onDragOver={(e) => handleDragOver(e, 'sessions')}
              onDragLeave={(e) => handleDragLeave(e, 'sessions')}
              onDrop={(e) => void handleDrop(e, 'sessions')}
            >
              <div className="space-y-3">
                <div className="text-4xl">
                  {dragOver.sessions ? '📥' : '📋'}
                </div>
                <div className="space-y-2">
                  <p className={`text-sm font-medium transition-colors ${
                    dragOver.sessions ? 'text-blue-700' : 'text-slate-600'
                  }`}>
                    {dragOver.sessions
                      ? 'Drop your sessions file here!'
                      : 'Drag and drop a JSON file here, or click to browse'
                    }
                  </p>
                  <label className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer bg-white px-3 py-2 rounded-md border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <span className="font-medium">📁 Choose File</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(event) =>
                        void handleImport('sessions', event.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Supports JSON files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {renderSummary('sessions')}
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 border-slate-200">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="text-lg flex items-center gap-2 text-green-900">
            <span className="text-xl">🏷️</span>
            Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-slate-600">
            Export the full topic library (including metadata captured from sessions) or import edited entries to
            refresh the catalog.
          </p>

          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Export Options</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => void handleExport('topics', 'json')}
                disabled={loading === 'topics-export-json'}
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
              >
                {loading === 'topics-export-json' ? '📤 Exporting…' : '📄 Export JSON'}
              </Button>
              <Button
                onClick={() => void handleExport('topics', 'csv')}
                disabled={loading === 'topics-export-csv'}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
              >
                {loading === 'topics-export-csv' ? '📊 Exporting…' : '📊 Export CSV'}
              </Button>
            </div>
          </div>

          {/* Import Section with Drag & Drop */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-700">Import Options</h4>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 transform ${
                dragOver.topics
                  ? 'border-green-400 bg-green-50 scale-105 shadow-inner'
                  : 'border-slate-300 hover:border-green-400 hover:bg-slate-50 hover:scale-102'
              }`}
              onDragOver={(e) => handleDragOver(e, 'topics')}
              onDragLeave={(e) => handleDragLeave(e, 'topics')}
              onDrop={(e) => void handleDrop(e, 'topics')}
            >
              <div className="space-y-3">
                <div className="text-4xl">
                  {dragOver.topics ? '📥' : '🏷️'}
                </div>
                <div className="space-y-2">
                  <p className={`text-sm font-medium transition-colors ${
                    dragOver.topics ? 'text-green-700' : 'text-slate-600'
                  }`}>
                    {dragOver.topics
                      ? 'Drop your topics file here!'
                      : 'Drag and drop a JSON file here, or click to browse'
                    }
                  </p>
                  <label className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-800 cursor-pointer bg-white px-3 py-2 rounded-md border border-green-200 hover:border-green-300 hover:bg-green-50 transition-colors">
                    <span className="font-medium">📁 Choose File</span>
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(event) =>
                        void handleImport('topics', event.target.files?.[0] ?? null)
                      }
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Supports JSON files up to 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>

          {renderSummary('topics')}
        </CardContent>
      </Card>
    </div>
  );
};
