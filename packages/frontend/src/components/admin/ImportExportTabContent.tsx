import React, { useMemo, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { importExportService } from '../../services/import-export.service';

interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  errors: string[];
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

export const ImportExportTabContent: React.FC = () => {
  const [sessionsSummary, setSessionsSummary] = useState<ImportSummary>(initialSummary);
  const [topicsSummary, setTopicsSummary] = useState<ImportSummary>(initialSummary);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetStatus = () => {
    setMessage(null);
    setError(null);
  };

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
      const formatLabel = format.toUpperCase();

      if (type === 'sessions') {
        const response = await importExportService.exportSessions(format);

        if (format === 'csv') {
          const blob = response.data as Blob;
          downloadBlob(blob, 'sessions-export', 'csv');
          const countHeader = response.headers?.['x-export-count'];
          const parsedCount = countHeader ? Number.parseInt(String(countHeader), 10) : NaN;
          const countMessage = Number.isFinite(parsedCount) && !Number.isNaN(parsedCount) ? parsedCount : null;
          setMessage(
            countMessage !== null
              ? `Exported ${countMessage} sessions as ${formatLabel}.`
              : `Exported sessions as ${formatLabel}.`,
          );
        } else {
          const data = response.data as any[];
          downloadJson(data, 'sessions-export');
          setMessage(`Exported ${data.length} sessions as ${formatLabel}.`);
        }
      } else {
        const response = await importExportService.exportTopics(format);

        if (format === 'csv') {
          const blob = response.data as Blob;
          downloadBlob(blob, 'topics-export', 'csv');
          const countHeader = response.headers?.['x-export-count'];
          const parsedCount = countHeader ? Number.parseInt(String(countHeader), 10) : NaN;
          const countMessage = Number.isFinite(parsedCount) && !Number.isNaN(parsedCount) ? parsedCount : null;
          setMessage(
            countMessage !== null
              ? `Exported ${countMessage} topics as ${formatLabel}.`
              : `Exported topics as ${formatLabel}.`,
          );
        } else {
          const data = response.data as any[];
          downloadJson(data, 'topics-export');
          setMessage(`Exported ${data.length} topics as ${formatLabel}.`);
        }
      }
    } catch (err) {
      setError((err as Error).message || `Failed to export ${type}.`);
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async (type: EntityType, file: File | null) => {
    if (!file) {
      setError('Please choose a JSON file before importing.');
      return;
    }

    resetStatus();
    setLoading(`${type}-import` as LoadingState);

    try {
      const text = await file.text();
      const payload = JSON.parse(text);

      let summary: ImportSummary;
      if (type === 'sessions') {
        if (!Array.isArray(payload.sessions)) {
          throw new Error('Expected JSON with a "sessions" array.');
        }
        summary = await importExportService.importSessions({ sessions: payload.sessions });
        setSessionsSummary(summary);
        setMessage(`Processed ${summary.total} sessions. Created ${summary.created}, updated ${summary.updated}.`);
      } else {
        if (!Array.isArray(payload.topics)) {
          throw new Error('Expected JSON with a "topics" array.');
        }
        summary = await importExportService.importTopics({ topics: payload.topics });
        setTopicsSummary(summary);
        setMessage(`Processed ${summary.total} topics. Created ${summary.created}, updated ${summary.updated}.`);
      }
    } catch (err) {
      setError((err as Error).message || `Failed to import ${type}.`);
    } finally {
      setLoading(null);
    }
  };

  const summaries = useMemo(
    () => ({
      sessions: sessionsSummary,
      topics: topicsSummary,
    }),
    [sessionsSummary, topicsSummary],
  );

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
              {summary.errors.map((errMsg, index) => (
                <li key={`${type}-error-${index}`}>{errMsg}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {(message || error) && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            error
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {error || message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Export all sessions (including scheduling data and content versions) or import a JSON file to perform bulk
            updates.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleExport('sessions', 'json')}
              disabled={loading === 'sessions-export-json'}
            >
              {loading === 'sessions-export-json' ? 'Exporting…' : 'Export Sessions (JSON)'}
            </Button>
            <Button
              onClick={() => void handleExport('sessions', 'csv')}
              disabled={loading === 'sessions-export-csv'}
              variant="outline"
            >
              {loading === 'sessions-export-csv' ? 'Exporting…' : 'Export Sessions (CSV)'}
            </Button>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap font-medium text-slate-700">Import JSON</span>
              <input
                type="file"
                accept="application/json"
                onChange={(event) =>
                  void handleImport('sessions', event.target.files?.[0] ?? null)
                }
                className="text-xs"
              />
            </label>
          </div>
          {renderSummary('sessions')}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Export the full topic library (including metadata captured from sessions) or import edited entries to
            refresh the catalog.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => void handleExport('topics', 'json')}
              disabled={loading === 'topics-export-json'}
            >
              {loading === 'topics-export-json' ? 'Exporting…' : 'Export Topics (JSON)'}
            </Button>
            <Button
              onClick={() => void handleExport('topics', 'csv')}
              disabled={loading === 'topics-export-csv'}
              variant="outline"
            >
              {loading === 'topics-export-csv' ? 'Exporting…' : 'Export Topics (CSV)'}
            </Button>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <span className="whitespace-nowrap font-medium text-slate-700">Import JSON</span>
              <input
                type="file"
                accept="application/json"
                onChange={(event) =>
                  void handleImport('topics', event.target.files?.[0] ?? null)
                }
                className="text-xs"
              />
            </label>
          </div>
          {renderSummary('topics')}
        </CardContent>
      </Card>
    </div>
  );
};
