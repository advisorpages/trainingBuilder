import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DashboardSummary {
  upcomingSessionsCount: number;
  nextSession: Session | null;
  totalCoachingTips: number;
  recentActivity: any[];
}

interface Session {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: string;
  location?: {
    id: number;
    name: string;
    address?: string;
  };
  trainer?: {
    id: number;
    name: string;
    email?: string;
  };
  author: {
    id: string;
    email: string;
  };
  registrations?: any[];
  coachingTips?: any[];
}

const TrainerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role.name === 'Trainer') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      // Fetch dashboard summary
      const summaryResponse = await fetch('/api/trainer-dashboard/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!summaryResponse.ok) {
        throw new Error('Failed to fetch dashboard summary');
      }

      const summaryData = await summaryResponse.json();
      setSummary(summaryData);

      // Fetch upcoming sessions
      const sessionsResponse = await fetch('/api/trainer-dashboard/sessions/upcoming?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!sessionsResponse.ok) {
        throw new Error('Failed to fetch upcoming sessions');
      }

      const sessionsData = await sessionsResponse.json();
      setUpcomingSessions(sessionsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return '#28a745';
      case 'draft':
        return '#ffc107';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  if (!user || user.role.name !== 'Trainer') {
    return (
      <div className="page">
        <h2>Access Denied</h2>
        <p>This page is only accessible to trainers.</p>
        <Link to="/dashboard">
          <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <h2>Trainer Dashboard</h2>
        <p>Loading your trainer dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Trainer Dashboard</h2>
        <div style={{ color: '#dc3545', marginBottom: '1rem' }}>
          Error: {error}
        </div>
        <button onClick={fetchDashboardData} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Trainer Dashboard</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/dashboard">
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">Main Dashboard</button>
          </Link>
          <button onClick={() => logout()} className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
            Logout
          </button>
        </div>
      </div>

      {/* Welcome Section */}
      <div style={{ backgroundColor: '#e7f3ff', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3>Welcome back, {user.email}!</h3>
        <p><strong>Role:</strong> {user.role.name}</p>
        {summary && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Upcoming Sessions:</strong> {summary.upcomingSessionsCount}
              </div>
              <div>
                <strong>Coaching Tips:</strong> {summary.totalCoachingTips}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Next Session Card */}
      {summary?.nextSession && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '2px solid #28a745',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#28a745', marginBottom: '1rem' }}>🎯 Next Session</h3>
          <div>
            <h4>{summary.nextSession.title}</h4>
            <p>{summary.nextSession.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <strong>Date:</strong> {formatDateTime(summary.nextSession.startTime).date}
              </div>
              <div>
                <strong>Time:</strong> {formatDateTime(summary.nextSession.startTime).time} - {formatDateTime(summary.nextSession.endTime).time}
              </div>
              <div>
                <strong>Location:</strong> {summary.nextSession.location?.name || 'TBD'}
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <Link to={`/trainer/sessions/${summary.nextSession.id}`}>
                <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                  View Session Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Sessions List */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>📅 Upcoming Sessions (Next 7 Days)</h3>
        {upcomingSessions.length === 0 ? (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '2rem',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6c757d'
          }}>
            <p>No upcoming sessions in the next 7 days.</p>
            <p>Check back later or contact your content developer for new assignments.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {upcomingSessions.map((session) => {
              const dateTime = formatDateTime(session.startTime);
              return (
                <div
                  key={session.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ marginBottom: '0.5rem' }}>{session.title}</h4>
                      <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
                        {session.description || 'No description available'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div><strong>Date:</strong> {dateTime.date}</div>
                        <div><strong>Time:</strong> {dateTime.time}</div>
                        <div><strong>Location:</strong> {session.location?.name || 'TBD'}</div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <span style={{ color: getStatusColor(session.status) }}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginLeft: '1rem' }}>
                      <Link to={`/trainer/sessions/${session.id}`}>
                        <button className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h3>⚡ Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h4>📋 Session Materials</h4>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Access detailed session information, coaching tips, and preparation materials
            </p>
            <button
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={upcomingSessions.length === 0}
              onClick={() => {
                if (upcomingSessions.length > 0) {
                  navigate(`/trainer/sessions/${upcomingSessions[0].id}`);
                }
              }}
            >
              View Materials
            </button>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h4>💡 Coaching Tips</h4>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Generate AI-powered coaching tips and customize your approach
            </p>
            <button
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={upcomingSessions.length === 0}
              onClick={() => {
                if (upcomingSessions.length > 0) {
                  navigate(`/trainer/sessions/${upcomingSessions[0].id}#coaching-tips`);
                }
              }}
            >
              View Tips
            </button>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #dee2e6'
          }}>
            <h4>📧 Trainer Kit</h4>
            <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
              Email notifications and preparation resources sent automatically
            </p>
            <button className="inline-flex items-center px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed opacity-70" disabled>
              Coming Soon
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p>
          <strong>Current Epic:</strong> 4 - Trainer Enablement & Dashboard ✅<br />
          <strong>Status:</strong> In Development
        </p>
      </div>
    </div>
  );
};

export default TrainerDashboardPage;
