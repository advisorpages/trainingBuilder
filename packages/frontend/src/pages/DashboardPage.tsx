import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { sessionService } from '../services/session.service';

interface DashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalTrainers: number;
  upcomingSessions: number;
  publishedSessions: number;
  draftSessions: number;
}

interface RecentActivity {
  id: string;
  type: 'session_created' | 'session_published' | 'trainer_assigned' | 'session_updated';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    activeSessions: 0,
    totalTrainers: 0,
    upcomingSessions: 0,
    publishedSessions: 0,
    draftSessions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to get time ago string
  const getTimeAgo = (input: Date | string | undefined | null): string => {
    if (!input) return 'Unknown time';

    const date = new Date(input);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    // Fetch real dashboard data
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch actual session data
        const sessions = await sessionService.getSessions();

        // Calculate stats from real data
        const totalSessions = sessions.length;
        const publishedSessions = sessions.filter(s => s.status === 'published').length;
        const draftSessions = sessions.filter(s => s.status === 'draft').length;
        const activeSessions = sessions.filter(s => {
          // Consider active if scheduled for today or ongoing
          const sessionDate = new Date(s.startTime || s.createdAt);
          const today = new Date();
          return sessionDate.toDateString() === today.toDateString();
        }).length;

        // Calculate upcoming sessions (future scheduled sessions)
        const upcomingSessions = sessions.filter(s => {
          const sessionDate = new Date(s.startTime || s.createdAt);
          const today = new Date();
          return sessionDate > today;
        }).length;

        setStats({
          totalSessions,
          activeSessions,
          totalTrainers: 12, // Keep mock for now, would need trainer API
          upcomingSessions,
          publishedSessions,
          draftSessions,
        });

        // Create recent activity from sessions (latest updated sessions)
        const recentSessions = sessions
          .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
          .slice(0, 4);

        const activityItems: RecentActivity[] = recentSessions.map((session, index) => ({
          id: session.id,
          type: session.status === 'published' ? 'session_published' :
                session.status === 'draft' ? 'session_created' : 'session_updated',
          title: session.status === 'published' ? 'Session Published' :
                 session.status === 'draft' ? 'New Session Created' : 'Session Updated',
          description: `${session.title} is ${session.status}`,
          timestamp: getTimeAgo(session.updatedAt || session.createdAt),
          user: 'System', // Would need user info from API
        }));

        setRecentActivity(activityItems);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to empty data instead of mock data
        setStats({
          totalSessions: 0,
          activeSessions: 0,
          totalTrainers: 0,
          upcomingSessions: 0,
          publishedSessions: 0,
          draftSessions: 0,
        });
        setRecentActivity([]);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session_created':
        return '✨';
      case 'session_published':
        return '🚀';
      case 'trainer_assigned':
        return '👨‍🏫';
      case 'session_updated':
        return '📝';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'session_created':
        return 'text-blue-600';
      case 'session_published':
        return 'text-green-600';
      case 'trainer_assigned':
        return 'text-purple-600';
      case 'session_updated':
        return 'text-orange-600';
      default:
        return 'text-slate-600';
    }
  };

  const isContentDeveloper = user?.role.name === UserRole.CONTENT_DEVELOPER;
  const isBroker = user?.role.name === UserRole.BROKER;

  return (
    <BuilderLayout
      title="Dashboard"
      subtitle="Overview of your training management platform"
    >
      <div className="space-y-6 max-w-7xl">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-xl p-4 sm:p-6 border border-slate-200">
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            Welcome back, {user?.email.split('@')[0]}!
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4">
            {isContentDeveloper
              ? "Ready to create impactful training experiences? Your content development tools are at your fingertips."
              : isBroker
              ? "Manage your training sessions and track engagement across your network."
              : "Your comprehensive training management dashboard is ready to use."
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Button asChild className="h-auto p-4 justify-start">
            <Link to="/sessions/builder/new">
              <div className="text-left">
                <div className="text-lg mb-1">🎯</div>
                <div className="font-medium">New Session</div>
                <div className="text-xs opacity-80">Create with AI</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start">
            <Link to="/sessions/builder/classic/new">
              <div className="text-left">
                <div className="text-lg mb-1">🛠️</div>
                <div className="font-medium">Classic Builder</div>
                <div className="text-xs text-slate-500">Manual session setup</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start">
            <Link to="/sessions">
              <div className="text-left">
                <div className="text-lg mb-1">📋</div>
                <div className="font-medium">Manage Sessions</div>
                <div className="text-xs text-slate-500">View all sessions</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start">
            <Link to="/sessions/saved-variants">
              <div className="text-left">
                <div className="text-lg mb-1">💡</div>
                <div className="font-medium">Saved Ideas</div>
                <div className="text-xs text-slate-500">AI-generated outlines</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start">
            <Link to="/topics">
              <div className="text-left">
                <div className="text-lg mb-1">🏷️</div>
                <div className="font-medium">Topics</div>
                <div className="text-xs text-slate-500">Manage content</div>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-auto p-4 justify-start">
            <Link to="/analytics">
              <div className="text-left">
                <div className="text-lg mb-1">📊</div>
                <div className="font-medium">Analytics</div>
                <div className="text-xs text-slate-500">View insights</div>
              </div>
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Sessions
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {loading ? '-' : stats.totalSessions}
                  </p>
                </div>
                <div className="text-2xl">📚</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Published
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {loading ? '-' : stats.publishedSessions}
                  </p>
                </div>
                <div className="text-2xl">🚀</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Drafts
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {loading ? '-' : stats.draftSessions}
                  </p>
                </div>
                <div className="text-2xl">📝</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Active Trainers
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {loading ? '-' : stats.totalTrainers}
                  </p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Upcoming
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {loading ? '-' : stats.upcomingSessions}
                  </p>
                </div>
                <div className="text-2xl">⏰</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Active Now
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {loading ? '-' : stats.activeSessions}
                  </p>
                </div>
                <div className="text-2xl">🔴</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates and changes in your training platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                        <div className={`text-xl ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {activity.description}
                          </p>
                          <p className="text-xs text-slate-400 mt-2">
                            {activity.timestamp}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Current platform health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">API Services</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Database</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">AI Services</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Storage</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs text-yellow-600 font-medium">75% Used</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-800">
                      💡 <strong>Pro Tip:</strong> Use the AI session builder to quickly create engaging content templates.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800">
                      ✨ <strong>New Feature:</strong> Bulk actions are now available in session management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
};

export default DashboardPage;
