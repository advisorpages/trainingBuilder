import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface Session {
  id: string;
  title: string;
  subtitle?: string;
  status: 'draft' | 'review' | 'ready' | 'published' | 'retired';
  readinessScore?: number;
  updatedAt: string;
  topic?: {
    id: string;
    name: string;
  };
  trainerAssignments?: Array<{
    trainer: {
      id: string;
      name: string;
    };
  }>;
  incentives?: Array<{
    id: string;
    name: string;
  }>;
}

const StatusBadge: React.FC<{ status: Session['status'] }> = ({ status }) => {
  const statusConfig = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
    review: { label: 'Review', className: 'bg-yellow-100 text-yellow-700' },
    ready: { label: 'Ready', className: 'bg-blue-100 text-blue-700' },
    published: { label: 'Published', className: 'bg-green-100 text-green-700' },
    retired: { label: 'Retired', className: 'bg-red-100 text-red-700' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

const SessionsTable: React.FC<{
  sessions: Session[];
  selectedSessions: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onEditSession: (sessionId: string) => void;
}> = ({ sessions, selectedSessions, onSelectionChange, onEditSession }) => {
  const handleSelectAll = (checked: boolean) => {
    onSelectionChange(checked ? sessions.map(s => s.id) : []);
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSessions, sessionId]);
    } else {
      onSelectionChange(selectedSessions.filter(id => id !== sessionId));
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={selectedSessions.length === sessions.length && sessions.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Title
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Topic
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Trainer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Last Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {sessions.map((session) => (
            <tr key={session.id} className="hover:bg-slate-50">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session.id)}
                  onChange={(e) => handleSelectSession(session.id, e.target.checked)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="px-6 py-4">
                <div>
                  <div className="text-sm font-medium text-slate-900">{session.title}</div>
                  {session.subtitle && (
                    <div className="text-sm text-slate-500">{session.subtitle}</div>
                  )}
                  {session.readinessScore !== undefined && (
                    <div className="mt-1 text-xs text-slate-400">
                      Readiness: {session.readinessScore}%
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={session.status} />
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {session.topic ? session.topic.name : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {session.trainerAssignments?.length
                  ? session.trainerAssignments[0].trainer.name
                  : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {new Date(session.updatedAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right text-sm">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditSession(session.id)}
                >
                  Edit in Builder
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const ManageSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, topicFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (topicFilter !== 'all') params.append('topicId', topicFilter);

      const response = await fetch(`/api/sessions?${params.toString()}`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedSessions.length === 0) return;

    try {
      await fetch('/api/sessions/bulk/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: selectedSessions }),
      });

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to publish sessions:', error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedSessions.length === 0) return;

    try {
      await fetch('/api/sessions/bulk/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: selectedSessions }),
      });

      setSelectedSessions([]);
      fetchSessions();
    } catch (error) {
      console.error('Failed to archive sessions:', error);
    }
  };

  const handleEditSession = (sessionId: string) => {
    navigate(`/sessions/builder/${sessionId}`);
  };

  const handleNewSession = () => {
    navigate('/sessions/builder/new');
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
      subtitle={`${sessions.length} sessions total`}
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border-slate-300 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">Review</option>
              <option value="ready">Ready</option>
              <option value="published">Published</option>
              <option value="retired">Retired</option>
            </select>

            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="rounded-lg border-slate-300 text-sm"
            >
              <option value="all">All Topics</option>
              {/* Topic options would be populated from API */}
            </select>
          </div>

          <Button onClick={handleNewSession}>
            New Session
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedSessions.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">
                {selectedSessions.length} session{selectedSessions.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBulkPublish}>
                  Publish Selected
                </Button>
                <Button variant="outline" size="sm" onClick={handleBulkArchive}>
                  Archive Selected
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

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-slate-500 mb-4">No sessions found</div>
            <Button onClick={handleNewSession}>Create Your First Session</Button>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageSessionsPage;