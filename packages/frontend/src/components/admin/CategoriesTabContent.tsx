import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { categoryService } from '../../services/category.service';
import type { Category } from '@leadership-training/shared';

export const CategoriesTabContent: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsSaving(true);
      await categoryService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
      });

      // Reset form and reload
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsAdding(false);
      await loadCategories();
    } catch (err) {
      setError('Failed to create category');
      console.error('Error creating category:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setNewCategoryName('');
    setNewCategoryDescription('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          📁 Add Category
        </Button>
      </div>

      {error && !loading ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <Button variant="outline" onClick={loadCategories}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Description</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isAdding && (
                <tr className="bg-blue-50">
                  <td className="px-6 py-4">
                    <Input
                      placeholder="Category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      placeholder="Description (optional)..."
                      value={newCategoryDescription}
                      onChange={(e) => setNewCategoryDescription(e.target.value)}
                      disabled={isSaving}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    New
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="default"
                        size="sm"
                        disabled={isSaving || !newCategoryName.trim()}
                        onClick={handleAddCategory}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSaving}
                        onClick={handleCancelAdd}
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-64 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-slate-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-slate-200 rounded w-32 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">📁</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No categories found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? 'Try a different search term.' : 'Start by creating your first category.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsAdding(true)}>Add Category</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="default" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600">
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};