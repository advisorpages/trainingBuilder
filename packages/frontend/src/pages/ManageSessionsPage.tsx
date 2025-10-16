import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { sessionService } from '../services/session.service';
import { Session, SessionStatus } from '@leadership-training/shared';

interface SessionWithRelations extends Session {
  trainerAssignments?: Array<{
    trainer?: {
      id: number | string;
      name?: string;
    };
    trainerId?: number | string;
  }>;
  sessionTopicTrainers?: Array<{
    trainer?: {
      id: number | string;
      name?: string;
    };
    trainerId?: number | string;
  }>;
  incentives?: Array<{
    id: string;
    name: string;
  }>;
}

const StatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const statusConfig = {
    [SessionStatus.DRAFT]: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    [SessionStatus.REVIEW]: { label: 'Review', className: 'bg-yellow-100 text-yellow-700' },
    [SessionStatus.READY]: { label: 'Ready', className: 'bg-blue-100 text-blue-700' },
    [SessionStatus.PUBLISHED]: { label: 'Published', className: 'bg-green-100 text-green-700' },
    [SessionStatus.RETIRED]: { label: 'Archived', className: 'bg-gray-50 text-gray-900' },
    [SessionStatus.COMPLETED]: { label: 'Completed', className: 'bg-purple-100 text-purple-700' },
    [SessionStatus.CANCELLED]: { label: 'Archived', className: 'bg-gray-50 text-gray-900' },
  };

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

const SessionsTable: React.FC<{
  sessions: SessionWithRelations[];
  selectedSessions: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEditSession: (sessionId: string) => void;
}> = ({ sessions, selectedSessions, onSelectionChange, onEditSession }) => {
  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? (sessions || []).map(s => s.id) : []);
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSessions, sessionId]);
    } else {
      onSelectionChange(selectedSessions.filter(id => id !== sessionId));
    }
  };

  // Helper: Get all topics in sequence order, including opener/closer sections
  type DisplayTopic = {
    id: string;
    topicId?: number | string;
    name: string;
    description?: string;
    sequenceOrder: number;
  };

  const getOrderedTopics = (session: Session): DisplayTopic[] => {
    if (!session) {
      return [];
    }

    if (Array.isArray(session.sessionTopics) && session.sessionTopics.length > 0) {
      const topicsById = new Map<number, { name: string; description?: string }>(
        (session.topics ?? []).map((topic) => [topic.id, topic]),
      );

      return [...session.sessionTopics]
        .sort((a, b) => {
          const orderA = typeof a.sequenceOrder === 'number' ? a.sequenceOrder : Number.MAX_SAFE_INTEGER;
          const orderB = typeof b.sequenceOrder === 'number' ? b.sequenceOrder : Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        })
        .map((sessionTopic, index) => {
          const fallbackOrderLabel =
            typeof sessionTopic.sequenceOrder === 'number'
              ? sessionTopic.sequenceOrder
              : index + 1;

          const topic =
            sessionTopic.topic ??
            (typeof sessionTopic.topicId === 'number'
              ? topicsById.get(sessionTopic.topicId)
              : undefined);

          if (topic) {
            return {
              id: `${topic.id ?? sessionTopic.topicId ?? `session-topic-${index}`}-${index}`,
              topicId: topic.id ?? sessionTopic.topicId,
              name: topic.name,
              description: topic.description,
              sequenceOrder: fallbackOrderLabel,
            };
          }

          return {
            id: `${sessionTopic.topicId ?? `session-topic-${index}`}-${index}`,
            topicId: sessionTopic.topicId,
            name: `Topic ${fallbackOrderLabel}`,
            description: sessionTopic.notes ?? '',
            sequenceOrder: fallbackOrderLabel,
          };
        });
    }

    return (session.topics || []).map((topic, index) => ({
      id: `${topic.id ?? `topic-${index}`}-${index}`,
      topicId: topic.id,
      name: topic.name,
      description: topic.description,
      sequenceOrder: index + 1,
    }));
  };

  // Helper: Get all unique trainers
  const getAllTrainers = (session: SessionWithRelations) => {
    // Aggregate trainers from every supported relation so both classic and new builders display correctly
    const uniqueTrainers = new Map<string, { id: number | string; name?: string } & Record<string, any>>();

    const addTrainer = (trainer?: Record<string, any>, fallbackId?: number | string, fallbackName?: string) => {
      const resolvedId = trainer?.id ?? fallbackId;
      if (resolvedId === undefined || resolvedId === null) {
        return;
      }

      const key = String(resolvedId);
      const resolvedName = trainer?.name ?? fallbackName ?? `Trainer ${resolvedId}`;

      if (uniqueTrainers.has(key)) {
        const existing = uniqueTrainers.get(key)!;
        if (!existing.name && resolvedName) {
          uniqueTrainers.set(key, { ...existing, name: resolvedName });
        }
        return;
      }

      uniqueTrainers.set(
        key,
        trainer
          ? { ...trainer, id: resolvedId, name: resolvedName }
          : { id: resolvedId, name: resolvedName },
      );
    };

    // Collect trainers from sessionTopics (supports single or multiple trainers)
    if (Array.isArray(session.sessionTopics)) {
      session.sessionTopics.forEach((sessionTopic: any) => {
        if (Array.isArray(sessionTopic?.trainers)) {
          sessionTopic.trainers.forEach((trainer: any) => addTrainer(trainer));
        } else {
          addTrainer(sessionTopic?.trainer, sessionTopic?.trainerId, sessionTopic?.trainerName);
        }
      });
    }

    // Collect trainers from explicit sessionTopicTrainers relation if present
    if (Array.isArray(session.sessionTopicTrainers)) {
      session.sessionTopicTrainers.forEach((topicTrainer) => {
        addTrainer(topicTrainer?.trainer, topicTrainer?.trainerId);
      });
    }

    // Collect trainers from trainerAssignments
    if (Array.isArray(session.trainerAssignments)) {
      session.trainerAssignments.forEach((assignment) => {
        addTrainer(assignment?.trainer, assignment?.trainerId);
      });
    }

    // Include primary trainer as fallback
    if (session.trainer || session.trainerId) {
      addTrainer(session.trainer as any, session.trainerId);
    }

    return Array.from(uniqueTrainers.values());
  };

  // Helper: Format duration from minutes
  const formatDuration = (durationMinutes?: number) => {
    if (!durationMinutes || durationMinutes <= 0) {
      return '—';
    }

    if (durationMinutes < 60) {
      return `${durationMinutes}m`;
    }
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Helper: Format date and time with null safety
  const formatDateTime = (dateTime?: Date | string | null) => {
    if (!dateTime) {
      return {
        date: 'Not scheduled',
        time: ''
      };
    }

    const date = new Date(dateTime);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return {
        date: 'Invalid date',
        time: ''
      };
    }

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={selectedSessions.length === (sessions || []).length && (sessions || []).length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Title
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Topics
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Trainers
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Date & Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Duration
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Location
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {(sessions || []).map((session) => {
            const orderedTopics = getOrderedTopics(session);
            const trainers = getAllTrainers(session);
            // Use scheduledAt instead of startTime (which doesn't exist in the entity)
            const { date, time } = formatDateTime((session as any).scheduledAt);

            return (
              <tr key={session.id} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={(e) => handleSelectSession(session.id, e.target.checked)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-slate-900 max-w-[200px] truncate" title={session.title}>
                      {session.title}
                    </div>
                    {session.subtitle && (
                      <div className="text-xs text-slate-500 max-w-[200px] truncate" title={session.subtitle}>
                        {session.subtitle}
                      </div>
                    )}
                    {session.readinessScore !== undefined && (
                      <div className="mt-1 text-xs text-slate-400">
                        Readiness: {session.readinessScore}%
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <StatusBadge status={session.status} />
                </td>
                <td className="px-4 py-4">
                  {orderedTopics.length > 0 ? (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {orderedTopics.length} {orderedTopics.length === 1 ? 'topic' : 'topics'}
                        </span>
                      </div>
                      <div className="text-slate-700 text-xs">
                        {orderedTopics.map((t) => (
                          <div key={t.id} className="py-0.5">
                            {t.sequenceOrder}. {t.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {trainers.length > 0 ? (
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          {trainers.length} {trainers.length === 1 ? 'trainer' : 'trainers'}
                        </span>
                      </div>
                      <div className="text-slate-700 text-xs">
                        {trainers.map((t: any, i) => (
                          <div key={i} className="py-0.5">
                            {t.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Not assigned</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm">
                    <div className="text-slate-900 font-medium">{date}</div>
                    <div className="text-slate-500 text-xs">{time}</div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-900">
                  {formatDuration((session as any).durationMinutes)}
                </td>
                <td className="px-4 py-4">
                  {session.location ? (
                    <div className="text-sm">
                      <div className="text-slate-900 max-w-[150px] truncate" title={session.location.name}>
                        {session.location.name}
                      </div>
                      {session.location.locationType && (
                        <div className="text-xs text-slate-500 capitalize">
                          {session.location.locationType}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditSession(session.id)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const ManageSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [availableTopics, setAvailableTopics] = useState<Array<{id: string, name: string}>>([]);

  console.log('Component render - statusFilter:', statusFilter, 'topicFilter:', topicFilter);

  // Track if this is the initial mount
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    if (isInitialMount) {
      console.log('Initial mount - setting up sessions');
      setIsInitialMount(false);
    } else {
      console.log('Filter changed - refetching sessions');
    }
    console.log('Effect triggered - statusFilter:', statusFilter, 'topicFilter:', topicFilter);
    fetchSessions();
  }, [statusFilter, topicFilter]);

  // Get unique topics from sessions for filter options
  const getAvailableTopics = (sessions: SessionWithRelations[]) => {
    const topics = new Map<string, string>();
    sessions.forEach(session => {
      if (session.topics && session.topics.length > 0) {
        session.topics.forEach(topic => {
          topics.set(topic.id.toString(), topic.name);
        });
      }
    });
    return Array.from(topics.entries()).map(([id, name]) => ({ id, name }));
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('Fetching sessions with filters:', { statusFilter, topicFilter });

      // Use the authenticated sessionService instead of direct fetch
      const data = await sessionService.getSessions();
      console.log('Raw sessions data:', data);

      // Ensure data is always an array
      const sessionsData = Array.isArray(data) ? data : [];
      console.log('Sessions count:', sessionsData.length);

      // Apply filters if needed (could be moved to backend later)
      let filteredData = sessionsData;

      // Apply status filter
      if (statusFilter !== 'all') {
        console.log('Applying status filter:', statusFilter);
        filteredData = filteredData.filter(session => {
          console.log(`Session ${session.id} status: ${session.status}, filter: ${statusFilter}, match: ${session.status === statusFilter}`);
          return session.status === statusFilter;
        });
      } else {
        // By default, hide archived sessions unless user specifically selects "Archived" filter
        console.log('Hiding archived sessions by default');
        filteredData = filteredData.filter(session => {
          const shouldInclude = session.status !== 'retired';
          console.log(`Session ${session.id}: ${session.status} !== retired? ${shouldInclude}`);
          return shouldInclude;
        });
      }

      // Apply topic filter
      if (topicFilter !== 'all') {
        console.log('Applying topic filter:', topicFilter);
        filteredData = filteredData.filter(session => {
          const hasTopic = session.topics &&
            session.topics.length > 0 &&
            session.topics.some(topic => topic.id.toString() === topicFilter);
          console.log(`Session ${session.id} has topic ${topicFilter}? ${hasTopic}`);
          return hasTopic;
        });
      }

      // Update available topics for filter dropdown
      const topics = getAvailableTopics(sessionsData);
      console.log('Available topics:', topics);
      setAvailableTopics(topics);

      console.log('Final filtered sessions count:', filteredData.length);
      setSessions(filteredData);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      setSessions([]); // Set empty array on error
      setAvailableTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedSessions.length === 0) return;

    try {
      console.log('Publish button clicked, calling bulk publish with:', selectedSessions);

      // First, check readiness of selected sessions
      const readinessResults = [];
      for (const sessionId of selectedSessions) {
        try {
          const readiness = await sessionService.getSessionReadiness(sessionId);
          readinessResults.push({ sessionId, readiness });
        } catch (error) {
          console.error(`Failed to get readiness for session ${sessionId}:`, error);
          readinessResults.push({ sessionId, error: error.message });
        }
      }

      // Check if any sessions are not ready
      const notReadySessions = readinessResults.filter(r =>
        !r.readiness || !r.readiness.canPublish
      );

      if (notReadySessions.length > 0) {
        const notReadyList = notReadySessions.map(r => {
          if (r.error) return `${r.sessionId}: Error checking readiness`;
          return `${r.sessionId}: ${r.readiness.percentage}% ready (needs ${r.readiness.recommendedActions.join(', ')})`;
        }).join('\n');

        console.log('Not ready sessions:', notReadyList);

        // For now, always proceed to see what happens
        const proceedAnyway = true; // Temporarily bypass confirmation

        if (!proceedAnyway) {
          return;
        }
      }

      // Use sessionService bulk publish method
      const result = await sessionService.bulkPublish(selectedSessions);
      console.log('Publish result:', result);

      if (result.published > 0) {
        alert(`Successfully published ${result.published} session(s)`);
      }

      if (result.failed.length > 0) {
        const failedSessionDetails = await Promise.all(
          result.failed.map(async (sessionId) => {
            try {
              const readiness = await sessionService.getSessionReadiness(sessionId);
              return `${sessionId}: ${readiness.percentage}% ready (${readiness.recommendedActions.join(', ')})`;
            } catch {
              return `${sessionId}: Unable to check readiness`;
            }
          })
        );

        alert(`Failed to publish ${result.failed.length} session(s):\n\n${failedSessionDetails.join('\n')}`);
      }

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to publish sessions:', error);
      alert(`Error publishing sessions: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedSessions.length === 0) return;

    try {
      console.log('Archive button clicked, calling with status:', SessionStatus.RETIRED);

      // First check if selected sessions are already archived
      const selectedSessionObjects = sessions.filter(s => selectedSessions.includes(s.id));
      const alreadyArchived = selectedSessionObjects.filter(s => s.status === 'retired');

      if (alreadyArchived.length > 0) {
        alert(`Some selected sessions are already archived: ${alreadyArchived.map(s => s.title).join(', ')}`);
        return;
      }

      // Use sessionService bulk status update method with RETIRED status
      console.log('Calling bulkUpdateStatus with:', selectedSessions, 'retired');
      const result = await sessionService.bulkUpdateStatus(selectedSessions, 'retired');
      console.log('Archive result:', result);

      if (result.updated > 0) {
        alert(`Successfully archived ${result.updated} session(s)`);
      } else {
        alert('No sessions were archived');
      }

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to archive sessions:', error);
      alert(`Error archiving sessions: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBulkRestoreToPublished = async () => {
    if (selectedSessions.length === 0) return;

    try {
      console.log('Restore to Published button clicked, calling with status:', SessionStatus.PUBLISHED);

      // Use sessionService bulk status update method with PUBLISHED status
      const result = await sessionService.bulkUpdateStatus(selectedSessions, 'published');
      console.log('Restore to Published result:', result);

      if (result.updated > 0) {
        alert(`Successfully restored ${result.updated} session(s) to published status`);
      } else {
        alert('No sessions were restored');
      }

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to restore sessions to published:', error);
      alert(`Error restoring sessions: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete ${selectedSessions.length} session(s)? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      console.log('Delete button clicked, calling bulkDelete with:', selectedSessions);
      const result = await sessionService.bulkDelete(selectedSessions);
      console.log('Delete result:', result);

      if (result.deleted > 0) {
        alert(`Successfully deleted ${result.deleted} session(s)`);
      } else {
        alert('No sessions were deleted');
      }

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete sessions:', error);
      alert(`Error deleting sessions: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEditSession = (sessionId: string) => {
    navigate(`/sessions/edit/${sessionId}`);
  };

  const handleNewGuidedSession = () => {
    navigate('/sessions/builder/new');
  };

  const handleNewClassicSession = () => {
    navigate('/sessions/builder/classic/new');
  };

  const handleBackToHome = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <BuilderLayout title="Sessions" subtitle="Loading sessions...">
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      title="Sessions"
      subtitle={`${(sessions || []).length} sessions total${statusFilter === 'all' ? ' (archived sessions hidden)' : ''}`}
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Status filter onChange fired, value:', value, 'current state:', statusFilter);
                setStatusFilter(value);
              }}
              className="rounded-lg border-slate-300 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="ready">Ready</option>
              <option value="published">Published</option>
              <option value="retired">Archived</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border-slate-300 text-sm"
            >
              <option value="all">All Topics</option>
              {availableTopics.map(topic => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleBackToHome}>
              Back to Home
            </Button>
            <Button onClick={handleNewGuidedSession}>
              Guided Builder
            </Button>
            <Button variant="outline" onClick={handleNewClassicSession}>
              Classic Builder
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedSessions.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {/* Show Restore to Published button only for archived/cancelled sessions */}
                {(() => {
                  const selectedSessionObjects = sessions.filter(s => selectedSessions.includes(s.id));
                  const hasArchivedOrCancelled = selectedSessionObjects.some(s =>
                    s.status === 'retired' || s.status === 'cancelled'
                  );

                  return hasArchivedOrCancelled ? (
                    <Button variant="outline" size="sm" onClick={handleBulkRestoreToPublished}>
                      Restore to Published
                    </Button>
                  ) : null;
                })()}

                <Button variant="outline" size="sm" onClick={handleBulkPublish}>
                  Publish Selected
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  Archive Selected
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  Delete Selected
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Sessions Table */}
        <SessionsTable
          sessions={sessions}
          selectedSessions={selectedSessions}
          onSelectionChange={setSelectedSessions}
          onEditSession={handleEditSession}
        />

        {(sessions || []).length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-4">No sessions found</div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleNewGuidedSession}>Create Guided Session</Button>
              <Button variant="outline" onClick={handleNewClassicSession}>Create Classic Session</Button>
            </div>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageSessionsPage;
