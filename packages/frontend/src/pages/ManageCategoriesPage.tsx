import React, { useState, useEffect } from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { categoryService } from '../services/category.service';
import type { Category } from '@leadership-training/shared';


const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getCategories({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });
      setCategories(response.categories);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [searchTerm]);

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getColorClasses = (index: number) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
      { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
      { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    ];
    return colors[index % colors.length];
  };

  const getDefaultIcon = (index: number) => {
    const icons = ['📂', '📋', '📊', '🎯', '💼', '🔧'];
    return icons[index % icons.length];
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
                {filteredCategories.filter(cat => cat.isActive).map((category, index) => {
                  const colors = getColorClasses(index);
                  const icon = getDefaultIcon(index);
                  return (
                    <Card key={category.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                              <span className="text-lg">{icon}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900">{category.name}</h4>
                              <p className={`text-sm font-medium ${colors.text}`}>
                                ID: {category.id}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-4">
                          {category.description || 'No description provided'}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-slate-500">
                              View Sessions
                            </Button>
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full ${colors.bg} ${colors.text}`}>
                            Active
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Inactive Categories */}
            {filteredCategories.some(cat => !cat.isActive) && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Inactive Categories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCategories.filter(cat => !cat.isActive).map((category, index) => {
                    const icon = getDefaultIcon(index);
                    return (
                      <Card key={category.id} className="opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-slate-100">
                                <span className="text-lg grayscale">{icon}</span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-700">{category.name}</h4>
                                <p className="text-sm text-slate-500">
                                  ID: {category.id}
                                </p>
                              </div>
                            </div>
                            <div className="text-xs text-slate-400">
                              {new Date(category.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 mb-4">
                            {category.description || 'No description provided'}
                          </p>

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
                    );
                  })}
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
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-slate-600">Active Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.filter(c => !c.isActive).length}
              </div>
              <div className="text-sm text-slate-600">Inactive Categories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900">
                {categories.length}
              </div>
              <div className="text-sm text-slate-600">Total Categories</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
            <p className="text-red-700 mb-2">{error}</p>
            <Button variant="outline" onClick={loadCategories}>
              Retry
            </Button>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};

export default ManageCategoriesPage;