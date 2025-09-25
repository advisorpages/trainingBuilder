import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

const BrokerReportsPage: React.FC = () => {
  const [reports, setReports] = useState({
    totalBookings: 45,
    totalSpent: 12750,
    averagePerSession: 284,
    completionRate: 89
  });

  return (
    <BuilderLayout
      title="Broker Reports"
      subtitle="Your booking history and performance metrics"
      statusSlot={<Button variant="outline">📊 Export Report</Button>}
    >
      <div className="space-y-6 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reports.totalBookings}
                  </p>
                </div>
                <div className="text-2xl">📅</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ${reports.totalSpent.toLocaleString()}
                  </p>
                </div>
                <div className="text-2xl">💰</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Avg Per Session
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    ${reports.averagePerSession}
                  </p>
                </div>
                <div className="text-2xl">📊</div>
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
                  <p className="text-2xl font-bold text-orange-600">
                    {reports.completionRate}%
                  </p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              📊 Detailed booking history and analytics would be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </BuilderLayout>
  );
};

export default BrokerReportsPage;