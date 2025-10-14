import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Category, Topic } from '@leadership-training/shared';
import { topicService } from '../../services/topic.service';
import { RecentTopicsSection } from './RecentTopicsSection';
import { CategorySection } from './CategorySection';
import { attributesService } from '../../services/attributes.service';

interface TopicListProps {
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onBulkDelete?: (topicIds: number[]) => void;
  onStatusChange?: (topic: Topic, isActive: boolean) => Promise<void>;
  onAddNew?: () => void;
  refreshTrigger?: number;
}

type GroupedTopics = Record<string, Topic[]>;

export const TopicList: React.FC<TopicListProps> = ({
  onEdit,
  onDelete,
  onBulkDelete,
  onStatusChange,
  onAddNew,
  refreshTrigger = 0
}) => {
  const [groupedTopics, setGroupedTopics] = useState<GroupedTopics>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(new Set());

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await topicService.getTopicsGroupedByCategory({
        includeInactive: showInactive
      });
      setGroupedTopics(data);
    } catch (err) {
      setError('Failed to load topics');
      console.error('Error fetching grouped topics:', err);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    void loadTopics();
  }, [loadTopics, refreshTrigger]);

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      setCategoriesError(null);
      const data = await attributesService.getCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const seen = new Set<string>();
    const orderedCategories: Array<[string, Topic[]]> = [];

    categories.forEach(category => {
      const categoryName = category.name;
      seen.add(categoryName);
      seen.add(categoryName);
      orderedCategories.push([categoryName, groupedTopics[categoryName] ?? []]);
    });

    Object.entries(groupedTopics).forEach(([categoryName, topics]) => {
      if (!seen.has(categoryName)) {
        seen.add(categoryName);
        orderedCategories.push([categoryName, topics]);
      }
    });

    if (!seen.has('Uncategorized')) {
      const uncategorizedTopics = groupedTopics['Uncategorized'] ?? [];
      if (uncategorizedTopics.length > 0 || term.length > 0) {
        seen.add('Uncategorized');
        orderedCategories.push(['Uncategorized', uncategorizedTopics]);
      }
    }

    return orderedCategories
      .map(([categoryName, topics]) => {
        const filteredTopics = term
          ? topics.filter(topic => {
              const nameMatch = topic.name.toLowerCase().includes(term);
              const descMatch = topic.description
                ? topic.description.toLowerCase().includes(term)
                : false;
              const categoryMatch = categoryName.toLowerCase().includes(term);
              return nameMatch || descMatch || categoryMatch;
            })
          : topics;

        return [categoryName, filteredTopics] as [string, Topic[]];
      })
      .filter(([categoryName, topics]) => {
        if (term) {
          const categoryMatches = categoryName.toLowerCase().includes(term);
          return categoryMatches || topics.length > 0;
        }
        return true;
      })
      .sort(([, topicsA], [, topicsB]) => {
        const latestA = topicsA.length > 0 ? new Date(topicsA[0].createdAt).getTime() : 0;
        const latestB = topicsB.length > 0 ? new Date(topicsB[0].createdAt).getTime() : 0;
        return latestB - latestA;
      });
  }, [categories, groupedTopics, searchTerm]);

  const totalTopics = useMemo(() => {
    return Object.values(groupedTopics).reduce((sum, topics) => sum + topics.length, 0);
  }, [groupedTopics]);

  const filteredTotal = useMemo(() => {
    return filteredGroups.reduce((sum, [, topics]) => sum + topics.length, 0);
  }, [filteredGroups]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  const handleRefresh = () => {
    void loadTopics();
  };

  const allTopicIds = useMemo(() => {
    return filteredGroups.flatMap(([, topics]) => topics.map(t => t.id));
  }, [filteredGroups]);

  const handleToggleSelection = (topicId: number) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTopicIds.size === allTopicIds.length) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(allTopicIds));
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedTopicIds.size > 0) {
      onBulkDelete(Array.from(selectedTopicIds));
      setSelectedTopicIds(new Set());
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-lg items-center space-x-2">
            <input
              type="text"
              placeholder="Search by topic, description, or category"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 md:justify-end">
            {allTopicIds.length > 0 && (
              <label className="flex items-center space-x-2 text-sm text-gray-700 font-medium">
                <input
                  type="checkbox"
                  checked={selectedTopicIds.size === allTopicIds.length && allTopicIds.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Select All</span>
              </label>
            )}

            {selectedTopicIds.size > 0 && (
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Selected ({selectedTopicIds.size})
              </button>
            )}

            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Include inactive topics</span>
            </label>

            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>

            {onAddNew && (
              <button
                type="button"
                onClick={onAddNew}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add new topic
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredTotal} of {totalTopics}{' '}
          {showInactive ? 'topics (including inactive)' : 'active topics'}
          {searchTerm && ' matching the current search'}
        </div>
      </div>

      {(error || categoriesError) && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-start justify-between gap-4">
            <span>{error || categoriesError}</span>
            <button
              type="button"
              onClick={() => {
                handleRefresh();
                void loadCategories();
              }}
              className="text-sm font-medium text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <RecentTopicsSection
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        refreshTrigger={refreshTrigger}
        includeInactive={showInactive}
      />

      <div className="space-y-6">
        {loading || loadingCategories ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            {searchTerm
              ? 'No topics found for the current search. Try adjusting your keywords.'
              : showInactive
                ? 'No topics available. Try refreshing or creating a new topic.'
                : 'No active topics available. Try showing inactive topics or creating a new topic.'}
          </div>
        ) : (
          filteredGroups.map(([categoryName, topics]) => (
            <CategorySection
              key={categoryName}
              categoryName={categoryName}
              topics={topics}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              selectedTopicIds={selectedTopicIds}
              onToggleSelection={handleToggleSelection}
            />
          ))
        )}
      </div>
    </div>
  );
};
