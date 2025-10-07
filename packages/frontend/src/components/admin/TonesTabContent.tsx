import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { toneService } from '../../services/tone.service';
import type { Tone } from '@leadership-training/shared';

export const TonesTabContent: React.FC = () => {
  const [tones, setTones] = useState<Tone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newToneName, setNewToneName] = useState('');
  const [newToneDescription, setNewToneDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await toneService.getTones({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });
      setTones(response.tones);
    } catch (err) {
      setError('Failed to load tones');
      console.error('Error loading tones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTones();
  }, [searchTerm]);

  const filteredTones = tones.filter(tone =>
    tone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tone.description && tone.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddTone = async () => {
    if (!newToneName.trim()) return;

    try {
      setIsSaving(true);
      await toneService.createTone({
        name: newToneName.trim(),
        description: newToneDescription.trim() || undefined,
      });

      // Reset form and reload
      setNewToneName('');
      setNewToneDescription('');
      setIsAdding(false);
      await loadTones();
    } catch (err) {
      setError('Failed to create tone');
      console.error('Error creating tone:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setNewToneName('');
    setNewToneDescription('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search tones..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Tone
        </Button>
      </div>

      {error && !loading ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <Button variant="outline" onClick={loadTones}>
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
                      placeholder="Tone name..."
                      value={newToneName}
                      onChange={(e) => setNewToneName(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      placeholder="Description (optional)..."
                      value={newToneDescription}
                      onChange={(e) => setNewToneDescription(e.target.value)}
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
                        disabled={isSaving || !newToneName.trim()}
                        onClick={handleAddTone}
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
              ) : filteredTones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">🎨</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tones found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? 'Try a different search term.' : 'Start by creating your first tone.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsAdding(true)}>Add Tone</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTones.map((tone) => (
                  <tr key={tone.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {tone.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {tone.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        tone.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tone.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(tone.createdAt).toLocaleDateString()}
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
