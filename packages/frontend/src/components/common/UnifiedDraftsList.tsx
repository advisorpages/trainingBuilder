import React, { useState, useEffect } from 'react';
import { Session, Incentive } from '@leadership-training/shared';
import { sessionService } from '../../services/session.service';
import { incentiveService } from '../../services/incentive.service';
import { SessionStatusIndicator, SessionStatus } from './SessionStatusIndicator';
import { IncentiveStatusIndicator } from './IncentiveStatusIndicator';

interface DraftItem {
  id: string;
  title: string;
  description?: string;
  updatedAt: Date;
  type: 'session' | 'incentive';
  originalItem: Session | Incentive;
}

interface UnifiedDraftsListProps {
  onEditSessionDraft: (session: Session) => void;
  onDeleteSessionDraft: (session: Session) => void;
  onEditIncentiveDraft: (incentive: Incentive) => void;
  onDeleteIncentiveDraft: (incentive: Incentive) => void;
  refreshTrigger?: number;
}

export const UnifiedDraftsList: React.FC<UnifiedDraftsListProps> = ({
  onEditSessionDraft,
  onDeleteSessionDraft,
  onEditIncentiveDraft,
  onDeleteIncentiveDraft,
  refreshTrigger = 0
}) => {
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'sessions' | 'incentives'>('all');

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load both session and incentive drafts in parallel
        const [sessionDrafts, incentiveDrafts] = await Promise.all([
          sessionService.getMyDrafts().catch(() => []),
          incentiveService.getMyDrafts().catch(() => [])
        ]);

        // Convert to unified format
        const sessionItems: DraftItem[] = sessionDrafts.map(session => ({
          id: session.id,
          title: session.title || 'Untitled Session',
          description: session.description,
          updatedAt: session.updatedAt,
          type: 'session' as const,
          originalItem: session
        }));

        const incentiveItems: DraftItem[] = incentiveDrafts.map(incentive => ({
          id: incentive.id,
          title: incentive.title || 'Untitled Incentive',
          description: incentive.description,
          updatedAt: incentive.updatedAt,
          type: 'incentive' as const,
          originalItem: incentive
        }));

        // Combine and sort by updated date (most recent first)
        const allDrafts = [...sessionItems, ...incentiveItems]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        setDrafts(allDrafts);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load drafts');
      } finally {
        setIsLoading(false);
      }
    };

    loadDrafts();
  }, [refreshTrigger]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const filteredDrafts = drafts.filter(draft => {
    if (filter === 'sessions') return draft.type === 'session';
    if (filter === 'incentives') return draft.type === 'incentive';
    return true; // 'all'
  });

  const sessionCount = drafts.filter(d => d.type === 'session').length;
  const incentiveCount = drafts.filter(d => d.type === 'incentive').length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading drafts</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by creating a session or incentive to see your drafts here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Your Drafts</h3>
        <p className="mt-1 text-sm text-gray-500">
          Continue working on these unfinished sessions and incentives
        </p>

        {/* Filter Tabs */}
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All ({drafts.length})
            </button>
            <button
              onClick={() => setFilter('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sessions ({sessionCount})
            </button>
            <button
              onClick={() => setFilter('incentives')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'incentives'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Incentives ({incentiveCount})
            </button>
          </nav>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {filteredDrafts.map((draft) => (
          <div key={`${draft.type}-${draft.id}`} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  {/* Type Badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    draft.type === 'session'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {draft.type === 'session' ? '📝 Session' : '🎯 Incentive'}
                  </span>

                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {draft.title}
                  </h4>

                  {/* Status Indicator */}
                  {draft.type === 'session' ? (
                    <SessionStatusIndicator
                      status={(draft.originalItem as Session).status as SessionStatus}
                      size="sm"
                    />
                  ) : (
                    <IncentiveStatusIndicator
                      status={(draft.originalItem as Incentive).status}
                      showDescription={false}
                    />
                  )}
                </div>

                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Modified: {getTimeAgo(draft.updatedAt)}</span>

                  {draft.type === 'session' && (draft.originalItem as Session).startTime && (
                    <>
                      <span>•</span>
                      <span>Scheduled: {formatDate((draft.originalItem as Session).startTime!)}</span>
                    </>
                  )}

                  {draft.type === 'incentive' && (draft.originalItem as Incentive).startDate && (
                    <>
                      <span>•</span>
                      <span>Starts: {formatDate((draft.originalItem as Incentive).startDate)}</span>
                    </>
                  )}
                </div>

                {draft.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {draft.description}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => {
                    if (draft.type === 'session') {
                      onEditSessionDraft(draft.originalItem as Session);
                    } else {
                      onEditIncentiveDraft(draft.originalItem as Incentive);
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    if (draft.type === 'session') {
                      onDeleteSessionDraft(draft.originalItem as Session);
                    } else {
                      onDeleteIncentiveDraft(draft.originalItem as Incentive);
                    }
                  }}
                  className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  title="Delete draft"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
