import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface SessionDetail {
  id: string;
  title: string;
  subtitle?: string;
  objective?: string;
  audience?: string;
  status: 'draft' | 'review' | 'ready' | 'published' | 'retired';
  scheduledAt?: string;
  durationMinutes?: number;
  readinessScore?: number;
  topic?: {
    id: string;
    name: string;
    description?: string;
  };
  agendaItems?: Array<{
    id: string;
    title: string;
    description?: string;
    duration: number;
    position: number;
    type: 'opener' | 'topic' | 'activity' | 'closer';
  }>;
  trainerAssignments?: Array<{
    id: string;
    status: 'pending' | 'acknowledged' | 'prepared' | 'completed';
    acknowledgedAt?: string;
    preparedAt?: string;
  }>;
}

interface TrainerAsset {
  id: string;
  type: 'coaching_tips' | 'handout' | 'slides' | 'notes';
  title: string;
  content?: any;
  fileUrl?: string;
  createdAt: string;
}

const CoachingTips: React.FC<{ tips: string[] }> = ({ tips }) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">AI Coaching Tips</h3>
      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </div>
            <p className="text-sm text-slate-700">{tip}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

const SessionAgenda: React.FC<{ agendaItems: SessionDetail['agendaItems'] }> = ({ agendaItems }) => {
  if (!agendaItems?.length) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Session Agenda</h3>
        <p className="text-slate-500 text-sm">No agenda items available yet.</p>
      </Card>
    );
  }

  const totalDuration = agendaItems.reduce((sum, item) => sum + item.duration, 0);

  const typeColors = {
    opener: 'bg-green-100 text-green-700',
    topic: 'bg-blue-100 text-blue-700',
    activity: 'bg-purple-100 text-purple-700',
    closer: 'bg-orange-100 text-orange-700',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Session Agenda</h3>
        <span className="text-sm text-slate-500">Total: {totalDuration} minutes</span>
      </div>

      <div className="space-y-4">
        {agendaItems.map((item, index) => (
          <div key={item.id} className="flex gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-slate-900">{item.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[item.type]}`}>
                  {item.type}
                </span>
                <span className="text-xs text-slate-500">{item.duration} min</span>
              </div>
              {item.description && (
                <p className="text-sm text-slate-600">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const MaterialsSection: React.FC<{ assets: TrainerAsset[] }> = ({ assets }) => {
  const handleDownload = (asset: TrainerAsset) => {
    if (asset.fileUrl) {
      window.open(asset.fileUrl, '_blank');
    } else {
      // For demo purposes, create a blob with content
      const content = JSON.stringify(asset.content, null, 2);
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const typeIcons = {
    coaching_tips: '💡',
    handout: '📄',
    slides: '📊',
    notes: '📝',
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-slate-900">Training Materials</h3>

      {assets.length === 0 ? (
        <p className="text-slate-500 text-sm">No materials available yet.</p>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{typeIcons[asset.type]}</span>
                <div>
                  <h4 className="text-sm font-medium text-slate-900">{asset.title}</h4>
                  <p className="text-xs text-slate-500 capitalize">{asset.type.replace('_', ' ')}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDownload(asset)}>
                Download
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export const TrainerSessionDetailPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [assets, setAssets] = useState<TrainerAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId);
    }
  }, [sessionId]);

  const fetchSessionDetails = async (id: string) => {
    try {
      setLoading(true);

      // Mock data for development
      const mockSession: SessionDetail = {
        id,
        title: 'Leadership Communication Fundamentals',
        subtitle: 'Building trust through effective communication',
        objective: 'Develop core communication skills for team leadership',
        audience: 'Mid-level managers and team leads',
        status: 'published',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 120,
        readinessScore: 85,
        topic: {
          id: 'topic-1',
          name: 'Leadership Communication',
          description: 'Essential communication skills for effective leadership',
        },
        agendaItems: [
          {
            id: '1',
            title: 'Welcome & Context Setting',
            description: 'Open the workshop with a quick framing that highlights why communication matters right now.',
            duration: 10,
            position: 0,
            type: 'opener',
          },
          {
            id: '2',
            title: 'Core Communication Principles',
            description: 'Introduce the primary frameworks and reference recent examples.',
            duration: 30,
            position: 1,
            type: 'topic',
          },
          {
            id: '3',
            title: 'Interactive Exercise: Active Listening',
            description: 'Hands-on practice with active listening techniques in pairs.',
            duration: 25,
            position: 2,
            type: 'activity',
          },
          {
            id: '4',
            title: 'Communication Styles Assessment',
            description: 'Individual and group discussion on different communication preferences.',
            duration: 30,
            position: 3,
            type: 'topic',
          },
          {
            id: '5',
            title: 'Action Planning & Wrap-up',
            description: 'Participants create personal action plans and share key takeaways.',
            duration: 25,
            position: 4,
            type: 'closer',
          },
        ],
        trainerAssignments: [
          {
            id: 'assignment-1',
            status: 'acknowledged',
            acknowledgedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      const mockAssets: TrainerAsset[] = [
        {
          id: '1',
          type: 'coaching_tips',
          title: 'Session Coaching Tips',
          content: {
            tips: [
              'Start with a personal story to create connection',
              'Use the 3-2-1 technique for managing nervous energy',
              'Watch for non-verbal cues that indicate disengagement',
              'Have backup activities ready if discussions finish early',
            ],
          },
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'slides',
          title: 'Presentation Slides',
          fileUrl: '/assets/leadership-communication-slides.pptx',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'handout',
          title: 'Participant Workbook',
          fileUrl: '/assets/communication-workbook.pdf',
          createdAt: new Date().toISOString(),
        },
        {
          id: '4',
          type: 'notes',
          title: 'Facilitator Notes',
          content: {
            notes: [
              'Key points to emphasize during each section',
              'Common questions and recommended answers',
              'Troubleshooting guide for difficult participants',
            ],
          },
          createdAt: new Date().toISOString(),
        },
      ];

      setSession(mockSession);
      setAssets(mockAssets);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/trainer/dashboard');
  };

  const handleMarkPrepared = async () => {
    if (!session?.trainerAssignments?.[0]) return;

    try {
      await fetch(`/api/trainer/assignments/${session.trainerAssignments[0].id}/prepared`, {
        method: 'POST',
      });

      setSession(prev => prev ? {
        ...prev,
        trainerAssignments: prev.trainerAssignments?.map(assignment => ({
          ...assignment,
          status: 'prepared' as const,
          preparedAt: new Date().toISOString(),
        })),
      } : null);
    } catch (error) {
      console.error('Failed to mark as prepared:', error);
      // For demo, update local state anyway
      setSession(prev => prev ? {
        ...prev,
        trainerAssignments: prev.trainerAssignments?.map(assignment => ({
          ...assignment,
          status: 'prepared' as const,
          preparedAt: new Date().toISOString(),
        })),
      } : null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-600">Loading session details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 text-center">
            <div className="text-red-600 mb-4">{error || 'Session not found'}</div>
            <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
          </Card>
        </div>
      </div>
    );
  }

  const coachingTips = assets
    .find(a => a.type === 'coaching_tips')
    ?.content?.tips || [
      'Start with a personal story to create connection',
      'Use the 3-2-1 technique for managing nervous energy',
      'Watch for non-verbal cues that indicate disengagement',
      'Have backup activities ready if discussions finish early',
    ];

  const assignment = session.trainerAssignments?.[0];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={handleBackToDashboard} className="mb-4">
            ← Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{session.title}</h1>
              {session.subtitle && (
                <p className="text-lg text-slate-600 mb-2">{session.subtitle}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500">
                {session.scheduledAt && (
                  <span>
                    📅 {new Date(session.scheduledAt).toLocaleString()}
                  </span>
                )}
                {session.durationMinutes && (
                  <span>⏱️ {session.durationMinutes} minutes</span>
                )}
                {session.topic && (
                  <span>🏷️ {session.topic.name}</span>
                )}
              </div>
            </div>

            <div className="ml-6 space-y-2">
              {assignment?.status === 'acknowledged' && (
                <Button onClick={handleMarkPrepared}>
                  Mark as Prepared
                </Button>
              )}
              {assignment?.status === 'prepared' && (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Marked as Prepared
                </div>
              )}
            </div>
          </div>

          {session.objective && (
            <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
              <h3 className="font-medium text-blue-900 mb-1">Session Objective</h3>
              <p className="text-sm text-blue-700">{session.objective}</p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <SessionAgenda agendaItems={session.agendaItems} />
            <CoachingTips tips={coachingTips} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MaterialsSection assets={assets} />

            {session.audience && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2 text-slate-900">Target Audience</h3>
                <p className="text-sm text-slate-600">{session.audience}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerSessionDetailPage;