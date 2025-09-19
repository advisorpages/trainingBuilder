import React, { useState, useEffect } from 'react';
import { Incentive } from '../../../../shared/src/types';
import { IncentiveStatusIndicator } from '../common/IncentiveStatusIndicator';
import { incentiveService } from '../../services/incentive.service';

interface IncentiveDraftsListProps {
  onEditDraft: (incentive: Incentive) => void;
  onDeleteDraft: (incentive: Incentive) => void;
  onPublishIncentive?: (incentive: Incentive) => void;
  onUnpublishIncentive?: (incentive: Incentive) => void;
  onCloneIncentive?: (incentive: Incentive) => void;
  refreshTrigger: number;
}

export const IncentiveDraftsList: React.FC<IncentiveDraftsListProps> = ({
  onEditDraft,
  onDeleteDraft,
  onPublishIncentive,
  onUnpublishIncentive,
  onCloneIncentive,
  refreshTrigger
}) => {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const loadIncentives = async () => {
      try {
        setIsLoading(true);

        // Load all incentives by the current user, not just drafts
        const response = await incentiveService.getIncentivesByAuthor('me');
        setIncentives(response);
      } catch (error) {
        console.error('Failed to load incentives:', error);
        setIncentives([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadIncentives();
  }, [refreshTrigger]);

  const filteredIncentives = incentives.filter(incentive => {
    const matchesSearch = incentive.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (incentive.description && incentive.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || incentive.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canPublish = (incentive: Incentive): boolean => {
    return incentive.status === 'draft' &&
           !!incentive.title?.trim() &&
           !!incentive.description?.trim() &&
           !!incentive.rules?.trim() &&
           !!incentive.startDate &&
           !!incentive.endDate &&
           new Date(incentive.endDate) > new Date();
  };

  const canUnpublish = (incentive: Incentive): boolean => {
    return incentive.status === 'published';
  };

  const isExpired = (incentive: Incentive): boolean => {
    return incentive.status === 'expired' || new Date(incentive.endDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-lg font-medium text-gray-900">My Incentives</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your incentives - publish, unpublish, edit, and track their status
            </p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search incentives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        {filteredIncentives.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No incentives found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first incentive.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncentives.map((incentive) => (
              <div
                key={incentive.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {incentive.title || 'Untitled Incentive'}
                      </h3>
                      <IncentiveStatusIndicator status={incentive.status} />
                    </div>

                    {incentive.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {incentive.description}
                      </p>
                    )}

                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Starts: {formatDate(incentive.startDate)}
                      </span>
                      <span>
                        Ends: {formatDate(incentive.endDate)}
                      </span>
                      <span>
                        Created: {formatDate(incentive.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {/* Publishing Controls for Story 6.4 */}
                    {canPublish(incentive) && onPublishIncentive && (
                      <button
                        onClick={() => onPublishIncentive(incentive)}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Publish incentive to make it publicly visible"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        Publish
                      </button>
                    )}

                    {canUnpublish(incentive) && onUnpublishIncentive && (
                      <button
                        onClick={() => onUnpublishIncentive(incentive)}
                        className="inline-flex items-center px-3 py-1.5 border border-orange-300 shadow-sm text-xs font-medium rounded text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        title="Unpublish incentive to return it to draft status"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        Unpublish
                      </button>
                    )}

                    {/* Clone Button for Story 6.5 */}
                    {onCloneIncentive && (
                      <button
                        onClick={() => onCloneIncentive(incentive)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Create a copy of this incentive"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Clone
                      </button>
                    )}

                    {!isExpired(incentive) && (
                      <button
                        onClick={() => onEditDraft(incentive)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}

                    {incentive.status === 'draft' && (
                      <button
                        onClick={() => onDeleteDraft(incentive)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}

                    {!canPublish(incentive) && incentive.status === 'draft' && (
                      <span className="inline-flex items-center px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded" title="Complete all required fields to publish">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Incomplete
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};