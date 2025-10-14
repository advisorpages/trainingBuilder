import * as React from 'react';
import { Button } from '../../../ui';
import { sessionBuilderService, TopicSuggestion } from '../../../services/session-builder.service';
import { attributesService } from '../../../services/attributes.service';
import type { Category } from '@leadership-training/shared';

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
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const parseBulletList = React.useCallback(
    (value?: string | null): string[] =>
      (value || '')
        .split('\n')
        .map((item) => item.replace(/^•\s*/, '').trim())
        .filter(Boolean),
    []
  );

  const fetchTopics = React.useCallback(async (categoryFilter?: string, textSearch?: string) => {
    try {
      console.log('🚀 TopicLibraryModal: fetchTopics called with:', { categoryFilter, textSearch });
      setLoading(true);
      setError(null);
      const suggestions = await sessionBuilderService.getPastTopics({
        categoryFilter,
        textSearch,
        limit: 50, // Increase limit since we're showing all topics
      });
      console.log('📋 TopicLibraryModal: received suggestions:', suggestions);
      setTopics(suggestions);
    } catch (err) {
      console.error('💥 TopicLibraryModal: error fetching topics:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories on mount
  React.useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await attributesService.getCategories();
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    void loadCategories();
  }, []);

  React.useEffect(() => {
    console.log('🚪 TopicLibraryModal useEffect triggered:', { open, category });
    if (!open) {
      return;
    }

    console.log('📖 TopicLibraryModal opening, fetching all topics...');
    // Show all topics by default - don't pre-filter by category
    void fetchTopics();

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, fetchTopics, onClose]);

  if (!open) {
    console.log('🚪 TopicLibraryModal: modal closed, not rendering');
    return null;
  }

  console.log('🎨 TopicLibraryModal: rendering modal with topics:', topics.length);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('🔍 TopicLibraryModal: search submitted with:', {
      category: selectedCategory,
      search: searchTerm.trim()
    });
    void fetchTopics(
      selectedCategory || undefined,
      searchTerm.trim() || undefined
    );
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('');
    void fetchTopics();
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label htmlFor="topic-search" className="sr-only">Search topics</label>
              <input
                id="topic-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by topic name or description"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <label htmlFor="category-filter" className="sr-only">Filter by category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Searching…' : 'Apply Filters'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
            >
              Clear All
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Active filters indicator */}
        {!loading && (selectedCategory || searchTerm) && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-medium">Active filters:</span>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('');
                    void fetchTopics(undefined, searchTerm.trim() || undefined);
                  }}
                  className="hover:text-blue-900"
                  aria-label="Remove category filter"
                >
                  ×
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                Search: {searchTerm}
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    void fetchTopics(selectedCategory || undefined, undefined);
                  }}
                  className="hover:text-blue-900"
                  aria-label="Remove search filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              Loading topics…
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm text-slate-600 font-medium mb-1">No topics found</p>
              <p className="text-xs text-slate-500">
                {selectedCategory || searchTerm
                  ? 'Try adjusting your filters or clearing them to see all topics.'
                  : 'Publish sessions to grow your library.'}
              </p>
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
                  {(topic.learningOutcomes || topic.trainerNotes || topic.materialsNeeded || topic.aiGeneratedContent?.enhancedContent?.callToAction) && (
                    <div className="mt-2 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2">
                      {topic.learningOutcomes && (
                        <div>
                          <span className="font-semibold text-slate-600">Trainer objective:</span>{' '}
                          {topic.learningOutcomes}
                        </div>
                      )}
                      {parseBulletList(topic.trainerNotes).length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-600">Trainer tasks:</span>
                          <ul className="mt-1 list-disc list-inside space-y-1 text-slate-600">
                            {parseBulletList(topic.trainerNotes).map((task, index) => (
                              <li key={index}>{task}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {topic.materialsNeeded && (
                        <div>
                          <span className="font-semibold text-slate-600">Materials:</span>
                          <ul className="mt-1 list-disc list-inside space-y-1 text-slate-600">
                            {parseBulletList(topic.materialsNeeded).map((material, index) => (
                              <li key={index}>{material}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {topic.deliveryGuidance && (
                        <div>
                          <span className="font-semibold text-slate-600">Delivery tips:</span>{' '}
                          {topic.deliveryGuidance}
                        </div>
                      )}
                      {topic.aiGeneratedContent?.enhancedContent?.callToAction && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-slate-600">Call to action:</span>{' '}
                          {topic.aiGeneratedContent.enhancedContent.callToAction}
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
