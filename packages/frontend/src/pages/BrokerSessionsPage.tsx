import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface BrokerSession {
  id: string;
  title: string;
  trainer: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  enrolled: number;
  location: string;
  status: 'available' | 'full' | 'completed';
  price: number;
  category: string;
}

const BrokerSessionsPage: React.FC = () => {
  const [sessions, setSessions] = useState<BrokerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setTimeout(() => {
      setSessions([
        {
          id: '1',
          title: 'Leadership Fundamentals',
          trainer: 'Sarah Johnson',
          date: '2024-02-15',
          time: '09:00',
          duration: 120,
          capacity: 25,
          enrolled: 18,
          location: 'Downtown Conference Center',
          status: 'available',
          price: 299,
          category: 'Leadership'
        },
        {
          id: '2',
          title: 'Effective Communication',
          trainer: 'Mike Chen',
          date: '2024-02-20',
          time: '14:00',
          duration: 90,
          capacity: 20,
          enrolled: 20,
          location: 'Virtual Session',
          status: 'full',
          price: 199,
          category: 'Communication'
        },
        // More mock sessions...
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <BuilderLayout
      title="Available Sessions"
      subtitle="Browse and book training sessions for your clients"
    >
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-md"
          >
            <option value="all">All Sessions</option>
            <option value="available">Available</option>
            <option value="full">Full</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map(session => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{session.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.status === 'available' ? 'bg-green-100 text-green-700' :
                    session.status === 'full' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <p>👨‍🏫 {session.trainer}</p>
                  <p>📅 {new Date(session.date).toLocaleDateString()}</p>
                  <p>⏰ {session.time} ({session.duration} min)</p>
                  <p>📍 {session.location}</p>
                  <p>👥 {session.enrolled}/{session.capacity} enrolled</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <span className="text-lg font-bold text-green-600">${session.price}</span>
                  <Button
                    size="sm"
                    disabled={session.status === 'full'}
                  >
                    {session.status === 'full' ? 'Full' : 'Book Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BuilderLayout>
  );
};

export default BrokerSessionsPage;