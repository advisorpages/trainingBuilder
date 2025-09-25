import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sessionCount: number;
  parentId?: string;
  isActive: boolean;
  order: number;
}

const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setTimeout(() => {
      setCategories([
        {
          id: '1',
          name: 'Leadership Development',
          description: 'Sessions focused on building leadership skills and capabilities',
          color: 'blue',
          icon: '👑',
          sessionCount: 12,
          isActive: true,
          order: 1,
        },
        {
          id: '2',
          name: 'Communication Skills',
          description: 'Training on effective communication, presentation, and interpersonal skills',
          color: 'green',
          icon: '💬',
          sessionCount: 8,
          isActive: true,
          order: 2,
        },
        {
          id: '3',
          name: 'Team Management',
          description: 'Building and managing high-performing teams',
          color: 'purple',
          icon: '👥',
          sessionCount: 15,
          isActive: true,
          order: 3,
        },
        {
          id: '4',
          name: 'Strategic Planning',
          description: 'Strategic thinking, planning, and execution methodologies',
          color: 'orange',
          icon: '🎯',
          sessionCount: 6,
          isActive: true,
          order: 4,
        },
        {
          id: '5',
          name: 'Digital Transformation',
          description: 'Leading change in the digital age',
          color: 'cyan',
          icon: '🚀',
          sessionCount: 4,
          isActive: true,
          order: 5,
        },
        {
          id: '6',
          name: 'Performance Management',
          description: 'Optimizing individual and team performance',
          color: 'yellow',
          icon: '📊',
          sessionCount: 7,
          isActive: false,
          order: 6,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap: { [key: string]: { [key: string]: string } } = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    };
    return colorMap[color]?.[variant] || colorMap.blue[variant];
  };

  return (
    <BuilderLayout
      title="Manage Categories"
      subtitle="Session categories and organization"
      statusSlot={<Button>📁 Add Category</Button>}
    >
      <div className="space-y-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Reorder Categories
            </Button>
            <Button variant="outline" size="sm">
              Bulk Actions
            </Button>
          </div>
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
          <>
            {/* Active Categories */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Active Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.filter(cat => cat.isActive).map((category) => (
                  <Card key={category.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getColorClasses(category.color)}`}>
                            <span className="text-lg">{category.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900">{category.name}</h4>
                            <p className={`text-sm font-medium ${getColorClasses(category.color, 'text')}`}>
                              {category.sessionCount} sessions
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-slate-400">#{category.order}</div>
                      </div>

                      <p className="text-sm text-slate-600 mb-4">{category.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="text-slate-500">
                            View Sessions
                          </Button>
                        </div>
                        <div className={`px-2 py-1 text-xs rounded-full ${getColorClasses(category.color)} ${getColorClasses(category.color, 'text')}`}>
                          Active
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inactive Categories */}
            {filteredCategories.some(cat => !cat.isActive) && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Inactive Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.filter(cat => !cat.isActive).map((category) => (
                    <Card key={category.id} className="opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-slate-100">
                              <span className="text-lg grayscale">{category.icon}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-700">{category.name}</h4>
                              <p className="text-sm text-slate-500">
                                {category.sessionCount} sessions
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">#{category.order}</div>
                        </div>

                        <p className="text-sm text-slate-500 mb-4">{category.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="default" size="sm">
                              Activate
                            </Button>
                          </div>
                          <div className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                            Inactive
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredCategories.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No categories found</h3>
                  <p className="text-slate-600 mb-4">Start by creating your first session category.</p>
                  <Button>Add Category</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Stats Summary */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-slate-600">Active Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.reduce((sum, c) => sum + c.sessionCount, 0)}
              </div>
              <div className="text-sm text-slate-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(categories.reduce((sum, c) => sum + c.sessionCount, 0) / categories.filter(c => c.isActive).length)}
              </div>
              <div className="text-sm text-slate-600">Avg per Category</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.filter(c => !c.isActive).length}
              </div>
              <div className="text-sm text-slate-600">Inactive</div>
            </div>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageCategoriesPage;