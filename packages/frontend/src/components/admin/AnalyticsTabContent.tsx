import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface AnalyticsData {
  sessionMetrics: {
    totalSessions: number;
    completedSessions: number;
    averageAttendance: number;
    completionRate: number;
  };
  trainerMetrics: {
    totalTrainers: number;
    activeTrainers: number;
    averageRating: number;
    sessionsDelivered: number;
  };
  engagementMetrics: {
    totalParticipants: number;
    repeatAttendees: number;
    averageSessionDuration: number;
    feedbackScore: number;
  };
  topSessions: Array<{
    id: string;
    title: string;
    attendance: number;
    rating: number;
    completionRate: number;
  }>;
  topTrainers: Array<{
    id: string;
    name: string;
    sessionsDelivered: number;
    averageRating: number;
    totalParticipants: number;
  }>;
  recentTrends: Array<{
    date: string;
    sessions: number;
    attendance: number;
    completion: number;
  }>;
}

export const AnalyticsTabContent: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);

        // Mock data - replace with actual API calls
        setTimeout(() => {
          setAnalytics({
            sessionMetrics: {
              totalSessions: 156,
              completedSessions: 142,
              averageAttendance: 23,
              completionRate: 91.0,
            },
            trainerMetrics: {
              totalTrainers: 18,
              activeTrainers: 14,
              averageRating: 4.7,
              sessionsDelivered: 234,
            },
            engagementMetrics: {
              totalParticipants: 1247,
              repeatAttendees: 789,
              averageSessionDuration: 95,
              feedbackScore: 4.6,
            },
            topSessions: [
              {
                id: '1',
                title: 'Leadership Fundamentals',
                attendance: 45,
                rating: 4.8,
                completionRate: 96,
              },
              {
                id: '2',
                title: 'Effective Communication',
                attendance: 38,
                rating: 4.7,
                completionRate: 94,
              },
              {
                id: '3',
                title: 'Team Building Strategies',
                attendance: 42,
                rating: 4.6,
                completionRate: 88,
              },
              {
                id: '4',
                title: 'Strategic Planning',
                attendance: 31,
                rating: 4.5,
                completionRate: 92,
              },
            ],
            topTrainers: [
              {
                id: '1',
                name: 'Sarah Johnson',
                sessionsDelivered: 24,
                averageRating: 4.9,
                totalParticipants: 312,
              },
              {
                id: '2',
                name: 'Mike Chen',
                sessionsDelivered: 18,
                averageRating: 4.8,
                totalParticipants: 287,
              },
              {
                id: '3',
                name: 'Lisa Rodriguez',
                sessionsDelivered: 21,
                averageRating: 4.7,
                totalParticipants: 294,
              },
              {
                id: '4',
                name: 'David Kim',
                sessionsDelivered: 16,
                averageRating: 4.6,
                totalParticipants: 203,
              },
            ],
            recentTrends: [
              { date: '2024-01-01', sessions: 12, attendance: 284, completion: 89 },
              { date: '2024-01-08', sessions: 15, attendance: 342, completion: 92 },
              { date: '2024-01-15', sessions: 18, attendance: 398, completion: 88 },
              { date: '2024-01-22', sessions: 14, attendance: 325, completion: 94 },
              { date: '2024-01-29', sessions: 20, attendance: 456, completion: 91 },
            ],
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const exportData = () => {
    // Mock export functionality
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <div key={range} className="h-8 w-12 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header with Export Button and Time Range Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Last 7 days' :
               range === '30d' ? 'Last 30 days' :
               range === '90d' ? 'Last 90 days' : 'Last year'}
            </Button>
          ))}
        </div>
        <Button onClick={exportData} variant="outline" size="sm">
          📊 Export Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="trainers">Trainers</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Total Sessions
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {analytics?.sessionMetrics.totalSessions}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +12% from last period
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
                      Completion Rate
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics?.sessionMetrics.completionRate}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      +3.2% from last period
                    </p>
                  </div>
                  <div className="text-2xl">✅</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Avg Attendance
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics?.sessionMetrics.averageAttendance}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      +5.8% from last period
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
                      Active Trainers
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics?.trainerMetrics.activeTrainers}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      +2 from last period
                    </p>
                  </div>
                  <div className="text-2xl">👨‍🏫</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Trends</CardTitle>
                <CardDescription>Sessions completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
                  <div className="text-center text-slate-400">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-sm">Chart visualization would go here</p>
                    <p className="text-xs">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance by Session Type</CardTitle>
                <CardDescription>Breakdown of participation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
                  <div className="text-center text-slate-400">
                    <div className="text-4xl mb-2">🥧</div>
                    <p className="text-sm">Pie chart would go here</p>
                    <p className="text-xs">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Sessions</CardTitle>
              <CardDescription>Sessions ranked by attendance and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-2 font-medium text-slate-600 text-sm">Session</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600 text-sm">Attendance</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600 text-sm">Rating</th>
                      <th className="text-right py-3 px-2 font-medium text-slate-600 text-sm">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.topSessions.map((session, index) => (
                      <tr key={session.id} className="border-b border-slate-100">
                        <td className="py-3 px-2">
                          <div className="flex items-center space-x-3">
                            <div className="text-lg">
                              {index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📋'}
                            </div>
                            <span className="font-medium text-slate-900">{session.title}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-slate-600">{session.attendance}</td>
                        <td className="text-right py-3 px-2">
                          <span className="text-yellow-600">{'★'.repeat(Math.floor(session.rating))}</span>
                          <span className="text-slate-400 ml-1">{session.rating}</span>
                        </td>
                        <td className="text-right py-3 px-2 text-slate-600">{session.completionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Trainers</CardTitle>
              <CardDescription>Trainers ranked by performance and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics?.topTrainers.map((trainer, index) => (
                  <div key={trainer.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {trainer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{trainer.name}</h3>
                          <p className="text-xs text-slate-500">
                            {trainer.sessionsDelivered} sessions delivered
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-600">
                          ★ {trainer.averageRating}
                        </div>
                        <div className="text-xs text-slate-500">
                          {trainer.totalParticipants} participants
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {analytics?.engagementMetrics.totalParticipants}
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                    Total Participants
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round((analytics?.engagementMetrics.repeatAttendees || 0) / (analytics?.engagementMetrics.totalParticipants || 1) * 100)}%
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                    Return Rate
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics?.engagementMetrics.averageSessionDuration}m
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                    Avg Duration
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {analytics?.engagementMetrics.feedbackScore}
                  </p>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
                    Feedback Score
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Insights</CardTitle>
              <CardDescription>Key findings from participant data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">📈 Positive Trend</h4>
                  <p className="text-sm text-blue-800">
                    Participant retention has increased by 15% over the last quarter, with repeat attendees making up 63% of total participants.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">✨ Top Insight</h4>
                  <p className="text-sm text-green-800">
                    Sessions with interactive elements show 23% higher completion rates and 18% better feedback scores.
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">💡 Recommendation</h4>
                  <p className="text-sm text-orange-800">
                    Consider expanding the most popular session topics: Leadership Fundamentals and Effective Communication have the highest demand.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};