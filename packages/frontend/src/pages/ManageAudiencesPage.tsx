import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Audience {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  targetSize: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industries: string[];
  isActive: boolean;
}

const ManageAudiencesPage: React.FC = () => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setAudiences([
        {
          id: '1',
          name: 'New Managers',
          description: 'Recently promoted team leads and first-time managers',
          characteristics: ['Leadership transition', 'Team management', 'Decision making'],
          targetSize: '10-20',
          experienceLevel: 'entry',
          industries: ['Technology', 'Finance', 'Healthcare'],
          isActive: true,
        },
        {
          id: '2',
          name: 'Senior Executives',
          description: 'C-suite and VP-level strategic leaders',
          characteristics: ['Strategic thinking', 'Organizational change', 'Board relations'],
          targetSize: '5-15',
          experienceLevel: 'executive',
          industries: ['All Industries'],
          isActive: true,
        },
        {
          id: '3',
          name: 'Technical Team Leads',
          description: 'Engineering and technical managers',
          characteristics: ['Technical leadership', 'Agile methodologies', 'Team scaling'],
          targetSize: '8-16',
          experienceLevel: 'mid',
          industries: ['Technology', 'Engineering'],
          isActive: true,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredAudiences = audiences.filter(audience =>
    audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audience.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BuilderLayout
      title="Manage Audiences"
      subtitle="Target audience segments and personas"
      statusSlot={<Button>➕ Add Audience</Button>}
    >
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search audiences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

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
            {filteredAudiences.map((audience) => (
              <Card key={audience.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">{audience.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      audience.experienceLevel === 'executive' ? 'bg-purple-100 text-purple-700' :
                      audience.experienceLevel === 'senior' ? 'bg-blue-100 text-blue-700' :
                      audience.experienceLevel === 'mid' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {audience.experienceLevel}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{audience.description}</p>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-500">Target Size:</span>
                      <span className="ml-2 font-medium">{audience.targetSize} people</span>
                    </div>

                    <div>
                      <span className="text-slate-500">Key Characteristics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {audience.characteristics.slice(0, 2).map((char, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                            {char}
                          </span>
                        ))}
                        {audience.characteristics.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded">
                            +{audience.characteristics.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500">Industries:</span>
                      <div className="text-slate-700 text-xs mt-1">
                        {audience.industries.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="ghost" size="sm" className="text-slate-500">
                      View Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageAudiencesPage;