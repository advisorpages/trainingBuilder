import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/card';
import KPIKard from './KPIKard';

interface AIMetrics {
  totalPrompts: number;
  successfulGenerations: number;
  rejectedGenerations: number;
  acceptedGenerations: number;
  averageProcessingTime: number;
  topPromptCategories: { category: string; count: number }[];
  qualityScores: { score: number; count: number }[];
}

interface BuilderMetrics {
  totalSessions: number;
  sessionsWithAI: number;
  averageBuilderTime: number;
  publishedSessions: number;
  draftSessions: number;
  topUserActions: { action: string; count: number }[];
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [aiMetrics, setAIMetrics] = React.useState<AIMetrics | null>(null);
  const [builderMetrics, setBuilderMetrics] = React.useState<BuilderMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch AI metrics
        const aiResponse = await fetch('/api/analytics/ai-metrics');
        if (!aiResponse.ok) throw new Error('Failed to fetch AI metrics');
        const aiData = await aiResponse.json();

        // Fetch builder metrics
        const builderResponse = await fetch('/api/analytics/builder-metrics');
        if (!builderResponse.ok) throw new Error('Failed to fetch builder metrics');
        const builderData = await builderResponse.json();

        setAIMetrics(aiData);
        setBuilderMetrics(builderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Analytics fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-slate-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-slate-200 rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="text-red-600 font-medium">Error loading analytics</div>
            <div className="text-red-500 text-sm mt-1">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const aiSuccessRate = aiMetrics && aiMetrics.totalPrompts > 0 ?
    Math.round((aiMetrics.successfulGenerations / aiMetrics.totalPrompts) * 100) : 0;

  const aiAdoptionRate = builderMetrics && builderMetrics.totalSessions > 0 ?
    Math.round((builderMetrics.sessionsWithAI / builderMetrics.totalSessions) * 100) : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPIKard
          title="Total Sessions"
          value={builderMetrics?.totalSessions || 0}
          trend={builderMetrics && builderMetrics.totalSessions > 0 ? "up" : "stable"}
        />
        <KPIKard
          title="AI Success Rate"
          value={`${aiSuccessRate}%`}
          trend={aiSuccessRate > 80 ? "up" : aiSuccessRate > 60 ? "stable" : "down"}
        />
        <KPIKard
          title="AI Adoption"
          value={`${aiAdoptionRate}%`}
          trend={aiAdoptionRate > 70 ? "up" : aiAdoptionRate > 50 ? "stable" : "down"}
        />
        <KPIKard
          title="Published Sessions"
          value={builderMetrics?.publishedSessions || 0}
          trend={builderMetrics && builderMetrics.publishedSessions > 0 ? "up" : "stable"}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Prompts</span>
                <span className="font-medium">{aiMetrics?.totalPrompts || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Successful Generations</span>
                <span className="font-medium">{aiMetrics?.successfulGenerations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Content Accepted</span>
                <span className="font-medium">{aiMetrics?.acceptedGenerations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg Processing Time</span>
                <span className="font-medium">{aiMetrics?.averageProcessingTime || 0}ms</span>
              </div>
            </div>

            {aiMetrics?.topPromptCategories && aiMetrics.topPromptCategories.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Top Content Types</h4>
                <div className="space-y-2">
                  {aiMetrics.topPromptCategories.slice(0, 3).map((category, index) => (
                    <div key={category.category} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 capitalize">{category.category}</span>
                      <span className="text-sm font-medium">{category.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Builder Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Builder Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total Sessions Created</span>
                <span className="font-medium">{builderMetrics?.totalSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Sessions with AI</span>
                <span className="font-medium">{builderMetrics?.sessionsWithAI || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Published Sessions</span>
                <span className="font-medium">{builderMetrics?.publishedSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Draft Sessions</span>
                <span className="font-medium">{builderMetrics?.draftSessions || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Avg Builder Time</span>
                <span className="font-medium">{builderMetrics?.averageBuilderTime || 0}min</span>
              </div>
            </div>

            {builderMetrics?.topUserActions && builderMetrics.topUserActions.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Top Actions</h4>
                <div className="space-y-2">
                  {builderMetrics.topUserActions.slice(0, 3).map((action, index) => (
                    <div key={action.action} className="flex justify-between items-center">
                      <span className="text-sm text-slate-600 capitalize">
                        {action.action.replace('_', ' ')}
                      </span>
                      <span className="text-sm font-medium">{action.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality Distribution */}
      {aiMetrics?.qualityScores && aiMetrics.qualityScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Content Quality Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {aiMetrics.qualityScores.map((scoreRange) => (
                <div key={scoreRange.score} className="text-center">
                  <div className="text-sm text-slate-600">
                    {scoreRange.score}-{scoreRange.score + 9}
                  </div>
                  <div className="text-lg font-medium">{scoreRange.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};