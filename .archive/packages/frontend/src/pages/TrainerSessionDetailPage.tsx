import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SessionDetail {
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
  audience?: { id: number; name: string };
  tone?: { id: number; name: string };
  category?: { id: number; name: string };
  topics?: Array<{ id: number; name: string }>;
  registrations?: any[];
  coachingTips?: any[];
  promotionalHeadline?: string;
  promotionalSummary?: string;
  keyBenefits?: string;
  callToAction?: string;
  socialMediaContent?: string;
  emailMarketingContent?: string;
}

interface CoachingTip {
  id: string;
  sessionId: string;
  status: string;
  createdAt: string;
  coachingTip: {
    id: number;
    text: string;
    category?: string;
    difficultyLevel?: string;
  };
}

const TrainerSessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [coachingTips, setCoachingTips] = useState<CoachingTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingTips, setGeneratingTips] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'coaching-tips'>('overview');

  useEffect(() => {
    if (user && user.role.name === 'Trainer' && sessionId) {
      fetchSessionDetail();
      fetchCoachingTips();
    }
  }, [user, sessionId]);

  const fetchSessionDetail = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/trainer-dashboard/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Session not found or not assigned to you');
        }
        throw new Error('Failed to fetch session details');
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachingTips = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/trainer-dashboard/sessions/${sessionId}/coaching-tips`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCoachingTips(data);
      }
    } catch (err) {
      console.error('Failed to fetch coaching tips:', err);
    }
  };

  const generateCoachingTips = async () => {
    if (!sessionId) return;

    try {
      setGeneratingTips(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/trainer-dashboard/sessions/${sessionId}/coaching-tips/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focusArea: 'general',
          difficultyLevel: 'intermediate',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate coaching tips');
      }

      await response.json();
      // Refresh coaching tips
      await fetchCoachingTips();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate coaching tips');
    } finally {
      setGeneratingTips(false);
    }
  };

  const sendTrainerKitEmail = async () => {
    if (!sessionId) return;

    try {
      setSendingEmail(true);
      setEmailStatus(null);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/trainer-dashboard/sessions/${sessionId}/send-trainer-kit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setEmailStatus('Trainer kit email sent successfully! 📧');
      } else {
        setEmailStatus(result.message || 'Failed to send email');
      }
    } catch (err) {
      setEmailStatus('Error sending email: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSendingEmail(false);
      // Clear status after 5 seconds
      setTimeout(() => setEmailStatus(null), 5000);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
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
          <button className="btn">Back to Dashboard</button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <h2>Session Details</h2>
        <p>Loading session details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <h2>Session Details</h2>
        <div style={{ color: '#dc3545', marginBottom: '1rem' }}>
          Error: {error}
        </div>
        <Link to="/trainer/dashboard">
          <button className="btn">Back to Trainer Dashboard</button>
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page">
        <h2>Session Not Found</h2>
        <p>The requested session could not be found.</p>
        <Link to="/trainer/dashboard">
          <button className="btn">Back to Trainer Dashboard</button>
        </Link>
      </div>
    );
  }

  const dateTime = formatDateTime(session.startTime);
  const endTime = formatDateTime(session.endTime);

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>{session.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.9rem', color: '#6c757d' }}>
            <span>{dateTime.date} at {dateTime.time}</span>
            <span style={{ color: getStatusColor(session.status) }}>
              ● {session.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={sendTrainerKitEmail}
            disabled={sendingEmail}
            className="btn"
            style={{ backgroundColor: '#28a745' }}
          >
            {sendingEmail ? 'Sending...' : '📧 Send Trainer Kit Email'}
          </button>
          <Link to="/trainer/dashboard">
            <button className="btn">← Back to Dashboard</button>
          </Link>
        </div>
      </div>

      {/* Email Status */}
      {emailStatus && (
        <div style={{
          backgroundColor: emailStatus.includes('successfully') ? '#d4edda' : '#f8d7da',
          color: emailStatus.includes('successfully') ? '#155724' : '#721c24',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          border: `1px solid ${emailStatus.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`,
        }}>
          {emailStatus}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        borderBottom: '1px solid #dee2e6',
        marginBottom: '2rem',
        display: 'flex',
        gap: '2rem'
      }}>
        {(['overview', 'materials', 'coaching-tips'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '1rem 0',
              borderBottom: activeTab === tab ? '2px solid #007bff' : '2px solid transparent',
              color: activeTab === tab ? '#007bff' : '#6c757d',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          {/* Session Overview */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3>Session Overview</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              {session.description || 'No description available'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Start Time:</strong><br />
                {dateTime.date}<br />
                {dateTime.time}
              </div>
              <div>
                <strong>End Time:</strong><br />
                {endTime.time}
              </div>
              <div>
                <strong>Location:</strong><br />
                {session.location?.name || 'TBD'}<br />
                {session.location?.address && (
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {session.location.address}
                  </span>
                )}
              </div>
              <div>
                <strong>Trainer:</strong><br />
                {session.trainer?.name || 'Not assigned'}<br />
                {session.trainer?.email && (
                  <span style={{ fontSize: '0.9rem', color: '#6c757d' }}>
                    {session.trainer.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Session Metadata */}
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3>Session Metadata</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Audience:</strong><br />
                {session.audience?.name || 'Not specified'}
              </div>
              <div>
                <strong>Tone:</strong><br />
                {session.tone?.name || 'Not specified'}
              </div>
              <div>
                <strong>Category:</strong><br />
                {session.category?.name || 'Not specified'}
              </div>
              <div>
                <strong>Registrations:</strong><br />
                {session.registrations?.length || 0} participants
              </div>
            </div>

            {session.topics && session.topics.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Topics:</strong><br />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {session.topics.map((topic) => (
                    <span
                      key={topic.id}
                      style={{
                        backgroundColor: '#e7f3ff',
                        color: '#0066cc',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                    >
                      {topic.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Author Information */}
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #dee2e6',
            padding: '1.5rem',
            borderRadius: '8px'
          }}>
            <h3>Content Developer</h3>
            <p>
              <strong>Created by:</strong> {session.author.email}
            </p>
            <p style={{ fontSize: '0.9rem', color: '#6c757d' }}>
              Contact your content developer if you have questions about the session content or need additional materials.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div>
          {/* Promotional Content */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <h3>Session Materials</h3>
            <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
              Review the promotional content and key messaging for this session.
            </p>

            {session.promotionalHeadline && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Promotional Headline</h4>
                <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007bff' }}>
                  {session.promotionalHeadline}
                </p>
              </div>
            )}

            {session.promotionalSummary && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Promotional Summary</h4>
                <p>{session.promotionalSummary}</p>
              </div>
            )}

            {session.keyBenefits && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Key Benefits</h4>
                <div style={{ whiteSpace: 'pre-line' }}>{session.keyBenefits}</div>
              </div>
            )}

            {session.callToAction && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4>Call to Action</h4>
                <p style={{ fontWeight: 'bold', color: '#28a745' }}>{session.callToAction}</p>
              </div>
            )}
          </div>

          {/* Marketing Content */}
          {(session.socialMediaContent || session.emailMarketingContent) && (
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #dee2e6',
              padding: '1.5rem',
              borderRadius: '8px'
            }}>
              <h3>Marketing Content</h3>

              {session.socialMediaContent && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>Social Media Content</h4>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    whiteSpace: 'pre-line'
                  }}>
                    {session.socialMediaContent}
                  </div>
                </div>
              )}

              {session.emailMarketingContent && (
                <div>
                  <h4>Email Marketing Content</h4>
                  <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '4px',
                    whiteSpace: 'pre-line'
                  }}>
                    {session.emailMarketingContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'coaching-tips' && (
        <div>
          {/* Coaching Tips Section */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '8px',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>AI Coaching Tips</h3>
              <button
                onClick={generateCoachingTips}
                disabled={generatingTips}
                className="btn"
                style={{ backgroundColor: '#28a745' }}
              >
                {generatingTips ? 'Generating...' : '✨ Generate New Tips'}
              </button>
            </div>
            <p style={{ color: '#6c757d' }}>
              AI-powered coaching tips to help you deliver an outstanding session.
            </p>
          </div>

          {coachingTips.length === 0 ? (
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #dee2e6',
              padding: '2rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <h4>No Coaching Tips Yet</h4>
              <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
                Generate AI-powered coaching tips tailored to this specific session.
              </p>
              <button
                onClick={generateCoachingTips}
                disabled={generatingTips}
                className="btn"
                style={{ backgroundColor: '#28a745' }}
              >
                {generatingTips ? 'Generating...' : '✨ Generate Coaching Tips'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {coachingTips.map((tip) => (
                <div
                  key={tip.id}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {tip.coachingTip.category && (
                        <span style={{
                          backgroundColor: '#e7f3ff',
                          color: '#0066cc',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}>
                          {tip.coachingTip.category}
                        </span>
                      )}
                      {tip.coachingTip.difficultyLevel && (
                        <span style={{
                          backgroundColor: '#f0f0f0',
                          color: '#666',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}>
                          {tip.coachingTip.difficultyLevel}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '1rem', lineHeight: '1.5' }}>
                    {tip.coachingTip.text}
                  </p>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#6c757d',
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    Generated on {new Date(tip.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainerSessionDetailPage;