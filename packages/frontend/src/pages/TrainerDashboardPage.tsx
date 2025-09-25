import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface SessionAssignment {
  id: string;
  session: {
    id: string;
    title: string;
    subtitle?: string;
    objective?: string;
    status: 'draft' | 'review' | 'ready' | 'published' | 'retired';
    scheduledAt?: string;
    durationMinutes?: number;
    topic?: {
      id: string;
      name: string;
    };
  };
  trainer: {
    id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'acknowledged' | 'prepared' | 'completed';
  acknowledgedAt?: string;
  preparedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrainerAsset {
  id: string;
  sessionId: string;
  type: 'coaching_tips' | 'handout' | 'slides' | 'notes';
  title: string;
  content?: any;
  fileUrl?: string;
  createdAt: string;
}

const StatusBadge: React.FC<{ status: SessionAssignment['status'] }> = ({ status }) => {
  const statusConfig = {
    pending: { label: 'Pending Review', className: 'bg-yellow-100 text-yellow-700' },
    acknowledged: { label: 'Acknowledged', className: 'bg-blue-100 text-blue-700' },
    prepared: { label: 'Prepared', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-700' },
  };

  const config = statusConfig[status];

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
};

const SessionCard: React.FC<{
  assignment: SessionAssignment;
  onViewDetails: (sessionId: string) => void;
  onAcknowledge: (assignmentId: string) => void;
  onMarkPrepared: (assignmentId: string) => void;
}> = ({ assignment, onViewDetails, onAcknowledge, onMarkPrepared }) => {
  const { session } = assignment;
  const isUpcoming = session.scheduledAt && new Date(session.scheduledAt) > new Date();
  const isPast = session.scheduledAt && new Date(session.scheduledAt) <= new Date();

  return (
    <Card className={`p-6 ${isUpcoming ? 'border-blue-200' : isPast ? 'border-gray-200' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">{session.title}</h3>
            <StatusBadge status={assignment.status} />
          </div>

          {session.subtitle && (
            <p className="text-sm text-slate-600 mb-2">{session.subtitle}</p>
          )}

          <div className="space-y-1 text-sm text-slate-500">
            {session.topic && (
              <div>Topic: <span className="text-slate-700">{session.topic.name}</span></div>
            )}

            {session.scheduledAt && (
              <div>
                Scheduled: <span className="text-slate-700">
                  {new Date(session.scheduledAt).toLocaleString()}
                </span>
                {session.durationMinutes && (
                  <span> ({session.durationMinutes} minutes)</span>
                )}
              </div>
            )}

            {session.objective && (
              <div className="mt-2">
                <span className="font-medium">Objective:</span> {session.objective}
              </div>
            )}
          </div>
        </div>

        <div className="ml-4 space-y-2 flex flex-col">
          <Button
            size="sm"
            onClick={() => onViewDetails(session.id)}
          >
            View Details
          </Button>

          {assignment.status === 'pending' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(assignment.id)}
            >
              Acknowledge
            </Button>
          )}

          {assignment.status === 'acknowledged' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkPrepared(assignment.id)}
            >
              Mark as Prepared
            </Button>
          )}
        </div>
      </div>

      {assignment.acknowledgedAt && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Acknowledged: {new Date(assignment.acknowledgedAt).toLocaleString()}
            {assignment.preparedAt && (
              <span className="ml-4">
                Prepared: {new Date(assignment.preparedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export const TrainerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<SessionAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('upcoming');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // This would be the actual API endpoint for trainer assignments
      const response = await fetch('/api/trainer/assignments');
      if (!response.ok) {
        // Mock data for development
        const mockData: SessionAssignment[] = [
          {
            id: '1',
            session: {
              id: 'session-1',
              title: 'Leadership Communication Fundamentals',
              subtitle: 'Building trust through effective communication',
              objective: 'Develop core communication skills for team leadership',
              status: 'published',
              scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
              durationMinutes: 120,
              topic: {
                id: 'topic-1',
                name: 'Leadership Communication',
              },
            },
            trainer: {
              id: 'trainer-1',
              name: 'John Trainer',
              email: 'john@example.com',
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            session: {
              id: 'session-2',
              title: 'Team Motivation Strategies',
              subtitle: 'Techniques for inspiring high performance',
              objective: 'Learn practical methods for motivating team members',
              status: 'published',
              scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
              durationMinutes: 90,
              topic: {
                id: 'topic-2',
                name: 'Team Management',
              },
            },
            trainer: {
              id: 'trainer-1',
              name: 'John Trainer',
              email: 'john@example.com',
            },
            status: 'acknowledged',
            acknowledgedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];
        setAssignments(mockData);
        return;
      }
      const data = await response.json();
      setAssignments(data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      // Use mock data as fallback
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (assignmentId: string) => {
    try {
      await fetch(`/api/trainer/assignments/${assignmentId}/acknowledge`, {
        method: 'POST',
      });

      // Update local state
      setAssignments(prev => prev.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
          : assignment
      ));
    } catch (error) {
      console.error('Failed to acknowledge assignment:', error);
      // For demo, update local state anyway
      setAssignments(prev => prev.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, status: 'acknowledged' as const, acknowledgedAt: new Date().toISOString() }
          : assignment
      ));
    }
  };

  const handleMarkPrepared = async (assignmentId: string) => {
    try {
      await fetch(`/api/trainer/assignments/${assignmentId}/prepared`, {
        method: 'POST',
      });

      setAssignments(prev => prev.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, status: 'prepared' as const, preparedAt: new Date().toISOString() }
          : assignment
      ));
    } catch (error) {
      console.error('Failed to mark as prepared:', error);
      // For demo, update local state anyway
      setAssignments(prev => prev.map(assignment =>
        assignment.id === assignmentId
          ? { ...assignment, status: 'prepared' as const, preparedAt: new Date().toISOString() }
          : assignment
      ));
    }
  };

  const handleViewDetails = (sessionId: string) => {
    navigate(`/trainer/sessions/${sessionId}`);
  };

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'upcoming':
        return assignment.session.scheduledAt &&
               new Date(assignment.session.scheduledAt) > new Date() &&
               assignment.status !== 'completed';
      case 'pending':
        return assignment.status === 'pending';
      case 'completed':
        return assignment.status === 'completed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading your assignments...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Trainer Dashboard</h1>
          <p className="text-slate-600">
            Manage your training session assignments and preparation materials
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'upcoming', label: 'Upcoming', count: assignments.filter(a => a.session.scheduledAt && new Date(a.session.scheduledAt) > new Date() && a.status !== 'completed').length },
                { key: 'pending', label: 'Pending', count: assignments.filter(a => a.status === 'pending').length },
                { key: 'completed', label: 'Completed', count: assignments.filter(a => a.status === 'completed').length },
                { key: 'all', label: 'All', count: assignments.length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <SessionCard
              key={assignment.id}
              assignment={assignment}
              onViewDetails={handleViewDetails}
              onAcknowledge={handleAcknowledge}
              onMarkPrepared={handleMarkPrepared}
            />
          ))}

          {filteredAssignments.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-slate-500 mb-4">
                No assignments found for "{filter}" filter
              </div>
              <Button variant="outline" onClick={() => setFilter('all')}>
                View All Assignments
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboardPage;