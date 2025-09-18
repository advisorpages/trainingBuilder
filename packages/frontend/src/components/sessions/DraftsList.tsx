import React, { useState, useEffect } from 'react';
import { Session } from '../../../../shared/src/types';
import { sessionService } from '../../services/session.service';
import { SessionStatusIndicator, SessionStatus } from '../common/SessionStatusIndicator';
import { SessionStatusFilter, useSessionStatusFilter } from '../common/SessionStatusFilter';
import { SessionStatusUpdate } from './SessionStatusUpdate';

interface DraftsListProps {
  onEditDraft: (session: Session) => void;
  onDeleteDraft: (session: Session) => void;
  refreshTrigger?: number;
  showAllSessions?: boolean;
}

export const DraftsList: React.FC<DraftsListProps> = ({
  onEditDraft,
  onDeleteDraft,
  refreshTrigger = 0,
  showAllSessions = false
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { selectedStatus, setSelectedStatus, filterSessions, getSessionCounts } = useSessionStatusFilter('all');

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const sessionList = showAllSessions
          ? await sessionService.getSessions()
          : await sessionService.getMyDrafts();
        setSessions(sessionList);
      } catch (err: any) {
        setError(err.response?.data?.message || `Failed to load ${showAllSessions ? 'sessions' : 'drafts'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [refreshTrigger]);

  const formatDate = (date: Date) => {
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

  const handleStatusUpdate = (updatedSession: Session) => {
    setSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === updatedSession.id ? updatedSession : session
      )
    );
    setNotification({
      type: 'success',
      message: `Session status updated to ${updatedSession.status}`
    });
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  const handleStatusUpdateError = (error: string) => {
    setNotification({
      type: 'error',
      message: error
    });
    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

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
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading {showAllSessions ? 'sessions' : 'drafts'}</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const filteredSessions = showAllSessions ? filterSessions(sessions) : sessions;
  const sessionCounts = showAllSessions ? getSessionCounts(sessions) : undefined;

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No {showAllSessions ? 'sessions' : 'drafts'} found</h3>
          <p className="mt-1 text-sm text-gray-500">Start by creating a new session to see your {showAllSessions ? 'sessions' : 'drafts'} here.</p>
        </div>
      </div>
    );
  }

  if (showAllSessions && filteredSessions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Sessions</h3>
          <div className="mt-3">
            <SessionStatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sessionCounts={sessionCounts}
            />
          </div>
        </div>
        <div className="p-6">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">No sessions match the selected status filter.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className={`mb-4 p-4 rounded-md ${
          notification.type === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                notification.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notification.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    notification.type === 'success'
                      ? 'text-green-500 hover:bg-green-100 focus:ring-green-600'
                      : 'text-red-500 hover:bg-red-100 focus:ring-red-600'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {showAllSessions ? 'Your Sessions' : 'Your Draft Sessions'}
        </h3>
        {showAllSessions ? (
          <div className="mt-3">
            <SessionStatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              sessionCounts={sessionCounts}
            />
          </div>
        ) : (
          <p className="mt-1 text-sm text-gray-500">
            Continue working on these unfinished sessions
          </p>
        )}
      </div>

      <div className="divide-y divide-gray-200">
        {filteredSessions.map((session) => (
          <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {session.title || 'Untitled Session'}
                  </h4>
                  <SessionStatusIndicator
                    status={session.status as SessionStatus}
                    size="sm"
                  />
                </div>

                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  {session.startTime && (
                    <span>
                      Scheduled: {formatDate(session.startTime)}
                    </span>
                  )}
                  <span>•</span>
                  <span>
                    Modified: {getTimeAgo(session.updatedAt)}
                  </span>
                  {session.location && (
                    <>
                      <span>•</span>
                      <span>
                        Location: {session.location.name}
                      </span>
                    </>
                  )}
                  {session.trainer && (
                    <>
                      <span>•</span>
                      <span>
                        Trainer: {session.trainer.firstName} {session.trainer.lastName}
                      </span>
                    </>
                  )}
                </div>

                {session.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {session.description}
                  </p>
                )}

                {/* Status Update Controls */}
                {showAllSessions && (
                  <div className="mt-3">
                    <SessionStatusUpdate
                      session={session}
                      onStatusUpdate={handleStatusUpdate}
                      onError={handleStatusUpdateError}
                      className="flex-wrap"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {session.status === SessionStatus.DRAFT && (
                  <>
                    <button
                      onClick={() => onEditDraft(session)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Continue
                    </button>
                    <button
                      onClick={() => onDeleteDraft(session)}
                      className="inline-flex items-center p-1.5 border border-transparent text-xs font-medium rounded text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete draft"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
                {session.status !== SessionStatus.DRAFT && (
                  <button
                    onClick={() => onEditDraft(session)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};