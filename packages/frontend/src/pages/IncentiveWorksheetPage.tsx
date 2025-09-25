import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface Incentive {
  id: string;
  title: string;
  description: string;
  type: 'attendance' | 'completion' | 'feedback' | 'referral';
  value: string;
  startDate: string;
  endDate: string;
  eligibilityRules: string[];
  status: 'draft' | 'active' | 'expired' | 'paused';
  participantCount: number;
  redemptionCount: number;
  budget: number;
  costPerRedemption: number;
}

const IncentiveWorksheetPage: React.FC = () => {
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIncentives([
        {
          id: '1',
          title: 'Early Bird Registration',
          description: '15% discount for sessions booked 2+ weeks in advance',
          type: 'attendance',
          value: '15% discount',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          eligibilityRules: ['Register 14+ days before session', 'First-time participants only'],
          status: 'active',
          participantCount: 84,
          redemptionCount: 67,
          budget: 10000,
          costPerRedemption: 125,
        },
        {
          id: '2',
          title: 'Course Completion Certificate',
          description: 'Digital certificate for completing leadership fundamentals',
          type: 'completion',
          value: 'Digital Certificate',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          eligibilityRules: ['Complete all session modules', 'Score 80%+ on assessments'],
          status: 'active',
          participantCount: 156,
          redemptionCount: 142,
          budget: 5000,
          costPerRedemption: 35,
        },
        {
          id: '3',
          title: 'Feedback Reward Points',
          description: 'Earn points for detailed session feedback',
          type: 'feedback',
          value: '50 reward points',
          startDate: '2024-01-01',
          endDate: '2024-06-30',
          eligibilityRules: ['Submit feedback within 24 hours', 'Minimum 100 characters'],
          status: 'expired',
          participantCount: 234,
          redemptionCount: 198,
          budget: 3000,
          costPerRedemption: 15,
        },
        {
          id: '4',
          title: 'Referral Program',
          description: 'Bonus session credit for successful referrals',
          type: 'referral',
          value: 'Free session credit',
          startDate: '2024-02-01',
          endDate: '2024-08-31',
          eligibilityRules: ['Referred person must attend session', 'Maximum 3 referrals per month'],
          status: 'draft',
          participantCount: 0,
          redemptionCount: 0,
          budget: 8000,
          costPerRedemption: 200,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: Incentive['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'expired':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeIcon = (type: Incentive['type']) => {
    switch (type) {
      case 'attendance':
        return '📅';
      case 'completion':
        return '🏆';
      case 'feedback':
        return '⭐';
      case 'referral':
        return '🤝';
      default:
        return '🎁';
    }
  };

  const filterIncentivesByTab = (tab: string) => {
    switch (tab) {
      case 'active':
        return incentives.filter(i => i.status === 'active');
      case 'draft':
        return incentives.filter(i => i.status === 'draft');
      case 'expired':
        return incentives.filter(i => i.status === 'expired' || i.status === 'paused');
      default:
        return incentives;
    }
  };

  const totalBudget = incentives.reduce((sum, i) => sum + i.budget, 0);
  const totalRedemptions = incentives.reduce((sum, i) => sum + i.redemptionCount, 0);
  const totalParticipants = incentives.reduce((sum, i) => sum + i.participantCount, 0);

  return (
    <BuilderLayout
      title="Incentive Management"
      subtitle="Engagement rewards and participation incentives"
      statusSlot={
        <Button onClick={() => setShowCreateForm(true)}>
          🎁 Create Incentive
        </Button>
      }
    >
      <div className="space-y-6 max-w-7xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Active Incentives
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {incentives.filter(i => i.status === 'active').length}
                  </p>
                </div>
                <div className="text-2xl">🎯</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Participants
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totalParticipants}
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
                    Redemptions
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {totalRedemptions}
                  </p>
                </div>
                <div className="text-2xl">🎁</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Budget
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    ${(totalBudget / 1000).toFixed(0)}K
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Incentive Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Incentive</CardTitle>
              <CardDescription>Design a new reward program to boost engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Incentive title" />
                <select className="px-3 py-2 border border-slate-200 rounded-md">
                  <option>Select incentive type...</option>
                  <option value="attendance">Attendance Reward</option>
                  <option value="completion">Completion Reward</option>
                  <option value="feedback">Feedback Incentive</option>
                  <option value="referral">Referral Program</option>
                </select>
                <Input placeholder="Reward value (e.g., 20% discount)" />
                <Input placeholder="Budget allocation" type="number" />
                <Input placeholder="Start date" type="date" />
                <Input placeholder="End date" type="date" />
                <textarea
                  placeholder="Description and eligibility rules..."
                  className="md:col-span-2 w-full min-h-[80px] px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button>Create Incentive</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Incentives Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active">
              Active ({incentives.filter(i => i.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({incentives.filter(i => i.status === 'draft').length})
            </TabsTrigger>
            <TabsTrigger value="expired">
              Ended ({incentives.filter(i => ['expired', 'paused'].includes(i.status)).length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({incentives.length})
            </TabsTrigger>
          </TabsList>

          {(['active', 'draft', 'expired', 'all'] as const).map(tab => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="animate-pulse space-y-3">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterIncentivesByTab(tab).map((incentive) => (
                    <Card key={incentive.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{getTypeIcon(incentive.type)}</div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{incentive.title}</h3>
                              <p className="text-sm font-medium text-blue-600">{incentive.value}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(incentive.status)}`}>
                            {incentive.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">{incentive.description}</p>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Participants:</span>
                            <span className="font-medium">{incentive.participantCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Redemptions:</span>
                            <span className="font-medium">{incentive.redemptionCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Success Rate:</span>
                            <span className="font-medium">
                              {incentive.participantCount > 0
                                ? Math.round((incentive.redemptionCount / incentive.participantCount) * 100)
                                : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Budget:</span>
                            <span className="font-medium">${incentive.budget.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="text-xs text-slate-500 mb-3">
                            {new Date(incentive.startDate).toLocaleDateString()} - {new Date(incentive.endDate).toLocaleDateString()}
                          </div>

                          <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" className="text-slate-500">
                                Analytics
                              </Button>
                              {incentive.status === 'active' && (
                                <Button variant="outline" size="sm">
                                  Pause
                                </Button>
                              )}
                              {incentive.status === 'draft' && (
                                <Button size="sm">
                                  Activate
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!loading && filterIncentivesByTab(tab).length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">🎁</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      No {tab === 'all' ? '' : tab} incentives found
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Create your first incentive program to boost engagement.
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      Create Incentive
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Performance Insights */}
        {!loading && incentives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key metrics and trends from your incentive programs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">🎯 Top Performer</h4>
                  <p className="text-sm text-green-800">
                    "Course Completion Certificate" has the highest engagement with {Math.round((142/156) * 100)}% success rate.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Optimization Tip</h4>
                  <p className="text-sm text-blue-800">
                    Attendance-based incentives show 20% higher participation when combined with early-bird discounts.
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-900 mb-2">📊 Budget Efficiency</h4>
                  <p className="text-sm text-orange-800">
                    Average cost per redemption is ${Math.round(totalBudget / totalRedemptions)} across all active programs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BuilderLayout>
  );
};

export default IncentiveWorksheetPage;