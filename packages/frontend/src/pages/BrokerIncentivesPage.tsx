import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface BrokerIncentive {
  id: string;
  title: string;
  description: string;
  discount: number;
  validUntil: string;
  applicableSessions: string[];
  used: boolean;
  code: string;
}

const BrokerIncentivesPage: React.FC = () => {
  const [incentives, setIncentives] = useState<BrokerIncentive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIncentives([
        {
          id: '1',
          title: 'Early Bird Discount',
          description: '15% off sessions booked 2+ weeks in advance',
          discount: 15,
          validUntil: '2024-12-31',
          applicableSessions: ['Leadership Fundamentals', 'Team Management'],
          used: false,
          code: 'EARLY15'
        },
        {
          id: '2',
          title: 'Volume Discount',
          description: '20% off when booking 5+ sessions',
          discount: 20,
          validUntil: '2024-06-30',
          applicableSessions: ['All Sessions'],
          used: true,
          code: 'VOLUME20'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <BuilderLayout
      title="Available Incentives"
      subtitle="Discounts and special offers for your bookings"
    >
      <div className="space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incentives.map(incentive => (
            <Card key={incentive.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{incentive.title}</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {incentive.discount}% OFF
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-4">{incentive.description}</p>
                <div className="space-y-2 text-sm">
                  <p>🏷️ Code: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{incentive.code}</span></p>
                  <p>⏰ Valid until: {new Date(incentive.validUntil).toLocaleDateString()}</p>
                  <p>📚 Applies to: {incentive.applicableSessions.join(', ')}</p>
                </div>
                <Button
                  className="w-full mt-4"
                  variant={incentive.used ? "outline" : "default"}
                  disabled={incentive.used}
                >
                  {incentive.used ? 'Already Used' : 'Apply Code'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BuilderLayout>
  );
};

export default BrokerIncentivesPage;