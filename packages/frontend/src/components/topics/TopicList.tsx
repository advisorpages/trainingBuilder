import React, { useState, useEffect } from 'react';
import { Topic } from '@leadership-training/shared';
import { topicService, TopicQueryParams, UpdateTopicRequest } from '../../services/topic.service';

interface TopicListProps {
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onStatusChange?: (topic: Topic, isActive: boolean) => Promise<void>;
  refreshTrigger?: number;
}

export const TopicList: React.FC<TopicListProps> = ({
  onEdit,
  onDelete,
  onStatusChange,
  refreshTrigger = 0
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<Set<number>>(new Set());
  const parseBulletList = (value?: string | null): string[] =>
    (value || '')
      .split('\n')
      .map(item => item.replace(/^•\s*/, '').trim())
      .filter(Boolean);

  const fetchTopics = async (params?: TopicQueryParams) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: TopicQueryParams = {
        page: currentPage,
        limit: 20,
        ...params,
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      if (!showInactive) {
        queryParams.isActive = true;
      }

      const response = await topicService.getTopics(queryParams);
      setTopics(response.topics);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load topics');
      console.error('Error fetching topics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [currentPage, searchTerm, showInactive, refreshTrigger]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTopics();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (column: 'name' | 'createdAt' | 'status') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectTopic = (topicId: number, selected: boolean) => {
    const newSelected = new Set(selectedTopics);
    if (selected) {
      newSelected.add(topicId);
    } else {
      newSelected.delete(topicId);
    }
    setSelectedTopics(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTopics(new Set(topics.map(t => t.id)));
    } else {
      setSelectedTopics(new Set());
    }
  };

  const handleStatusToggle = async (topic: Topic) => {
    if (togglingStatus.has(topic.id)) return;

    try {
      setTogglingStatus(prev => new Set([...prev, topic.id]));

      if (onStatusChange) {
        await onStatusChange(topic, !topic.isActive);
      } else {
        // Fallback to direct API call
        await topicService.updateTopic(topic.id, { isActive: !topic.isActive });
        // Update local state
        setTopics(prev => prev.map(t =>
          t.id === topic.id ? { ...t, isActive: !t.isActive } : t
        ));
      }
    } catch (error) {
      console.error('Failed to toggle topic status:', error);
    } finally {
      setTogglingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(topic.id);
        return newSet;
      });
    }
  };

  const toggleRowExpansion = (topicId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedRows(newExpanded);
  };

  const handleDropdownClick = (e: React.MouseEvent, topicId: number) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === topicId ? null : topicId);
  };

  const getSortIcon = (column: 'name' | 'createdAt' | 'status') => {
    if (sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 12l5-5 5 5H5z" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5 12l5-5 5 5H5z" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
        <path d="M15 8l-5 5-5-5h10z" />
      </svg>
    );
  };

  const sortedTopics = React.useMemo(() => {
    return [...topics].sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [topics, sortBy, sortOrder]);

  const isAllSelected = topics.length > 0 && selectedTopics.size === topics.length;
  const isIndeterminate = selectedTopics.size > 0 && selectedTopics.size < topics.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={() => fetchTopics()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex items-center space-x-4 flex-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show inactive</span>
            </label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedTopics.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedTopics.size} topic{selectedTopics.size === 1 ? '' : 's'} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // TODO: Implement bulk activate
                    console.log('Bulk activate:', Array.from(selectedTopics));
                  }}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Activate
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement bulk deactivate
                    console.log('Bulk deactivate:', Array.from(selectedTopics));
                  }}
                  className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement bulk delete
                    console.log('Bulk delete:', Array.from(selectedTopics));
                  }}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
                <button
                  onClick={() => setSelectedTopics(new Set())}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600">
        Showing {topics.length} of {total} topics
      </div>

      {/* Topics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                {/* Expand column */}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {getSortIcon('createdAt')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTopics.map((topic) => (
              <React.Fragment key={topic.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTopics.has(topic.id)}
                      onChange={(e) => handleSelectTopic(topic.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRowExpansion(topic.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg
                        className={`w-4 h-4 transform transition-transform ${
                          expandedRows.has(topic.id) ? 'rotate-90' : ''
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{topic.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {topic.description || 'No description provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={topic.isActive}
                        onChange={() => handleStatusToggle(topic)}
                        disabled={togglingStatus.has(topic.id)}
                        className="sr-only"
                      />
                      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        topic.isActive ? 'bg-green-600' : 'bg-gray-200'
                      } ${togglingStatus.has(topic.id) ? 'opacity-50' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          topic.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </div>
                      {togglingStatus.has(topic.id) && (
                        <div className="ml-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="relative">
                      <button
                        onClick={(e) => handleDropdownClick(e, topic.id)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span>Actions</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {openDropdown === topic.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onEdit(topic);
                                setOpenDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit Topic
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement view details in modal
                                console.log('View details:', topic);
                                setOpenDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                // TODO: Implement duplicate
                                console.log('Duplicate:', topic);
                                setOpenDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Duplicate
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                onDelete(topic);
                                setOpenDropdown(null);
                              }}
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              {topic.isActive ? 'Deactivate' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded row content */}
                {expandedRows.has(topic.id) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">Overview:</span>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                              {topic.description || 'No description provided'}
                            </p>
                          </div>
                          {topic.aiGeneratedContent?.enhancedContent?.callToAction && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Call to Action:</span>
                              <p className="text-sm text-gray-600 mt-1">
                                {topic.aiGeneratedContent.enhancedContent.callToAction}
                              </p>
                            </div>
                          )}
                          {topic.learningOutcomes && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Trainer Objective:</span>
                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                                {topic.learningOutcomes}
                              </p>
                            </div>
                          )}
                          {parseBulletList(topic.trainerNotes).length > 0 && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Trainer Tasks:</span>
                              <ul className="mt-1 space-y-1 text-sm text-gray-600 list-disc list-inside">
                                {parseBulletList(topic.trainerNotes).map((task, index) => (
                                  <li key={index}>{task}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {topic.sessions && (
                          <div>
                            <span className="text-sm font-medium text-gray-700">Usage:</span>
                            <p className="text-sm text-gray-600">
                              Used in {topic.sessions.length} session{topic.sessions.length === 1 ? '' : 's'}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>Created: {new Date(topic.createdAt).toLocaleString()}</span>
                          <span>Updated: {new Date(topic.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {sortedTopics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No topics found. {searchTerm && 'Try adjusting your search criteria.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 border rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
