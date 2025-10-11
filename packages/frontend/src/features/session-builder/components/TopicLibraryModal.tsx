import * as React from 'react';
import { Button } from '../../../ui';
import { sessionBuilderService, TopicSuggestion } from '../../../services/session-builder.service';

interface TopicLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (topic: TopicSuggestion) => void;
  category?: string;
}

export const TopicLibraryModal: React.FC<TopicLibraryModalProps> = ({
  open,
  onClose,
  onSelect,
  category,
}) => {
  const [topics, setTopics] = React.useState<TopicSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>(category ?? '');

  const fetchTopics = React.useCallback(async (search?: string) => {
    try {
      console.log('🚀 TopicLibraryModal: fetchTopics called with search:', search);
      setLoading(true);
      setError(null);
      const suggestions = await sessionBuilderService.getPastTopics(search);
      console.log('📋 TopicLibraryModal: received suggestions:', suggestions);
      setTopics(suggestions);
    } catch (err) {
      console.error('💥 TopicLibraryModal: error fetching topics:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    console.log('🚪 TopicLibraryModal useEffect triggered:', { open, category });
    if (!open) {
      return;
    }

    console.log('📖 TopicLibraryModal opening, fetching topics...');
    // Prefill search with session category on first open
    setSearchTerm((prev) => (prev || category || '').trim());
    void fetchTopics(category);

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, category, fetchTopics, onClose]);

  if (!open) {
    console.log('🚪 TopicLibraryModal: modal closed, not rendering');
    return null;
  }

  console.log('🎨 TopicLibraryModal: rendering modal with topics:', topics.length);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('🔍 TopicLibraryModal: search submitted with term:', searchTerm.trim());
    void fetchTopics(searchTerm.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Topic Library</h2>
            <p className="text-sm text-slate-500">
              Reuse topics captured from past sessions. Selecting a topic will add it to your list.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close topic library"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by keyword or category"
            className="h-10 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm(category ?? '');
                void fetchTopics(category);
              }}
            >
              Reset
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              Loading topics…
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No topics found yet. Publish sessions to grow your library.
            </div>
          ) : (
            topics.map((topic) => {
              const duration = topic.defaultDurationMinutes ?? 30;
              return (
                <div
                  key={topic.id}
                  className="rounded-lg border border-slate-200 px-4 py-3 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{topic.name}</p>
                      <p className="text-xs text-slate-500">
                        {topic.category || 'Uncategorized'} • {duration} min
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelect(topic);
                        onClose();
                      }}
                    >
                      Use Topic
                    </Button>
                  </div>
                  {topic.description && (
                    <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">{topic.description}</p>
                  )}
                  {(topic.learningOutcomes || topic.trainerNotes || topic.materialsNeeded) && (
                    <div className="mt-2 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                      {topic.learningOutcomes && (
                        <div>
                          <span className="font-semibold text-slate-600">Learning outcomes:</span>{' '}
                          {topic.learningOutcomes}
                        </div>
                      )}
                      {topic.trainerNotes && (
                        <div>
                          <span className="font-semibold text-slate-600">Trainer notes:</span>{' '}
                          {topic.trainerNotes}
                        </div>
                      )}
                      {topic.materialsNeeded && (
                        <div>
                          <span className="font-semibold text-slate-600">Materials:</span>{' '}
                          {topic.materialsNeeded}
                        </div>
                      )}
                      {topic.deliveryGuidance && (
                        <div>
                          <span className="font-semibold text-slate-600">Delivery tips:</span>{' '}
                          {topic.deliveryGuidance}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
