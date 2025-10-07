import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { audienceService } from '../../services/audience.service';
import type { Audience } from '@leadership-training/shared';
import { EditAudienceModal } from './EditAudienceModal';

export const AudiencesTabContent: React.FC = () => {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newAudienceName, setNewAudienceName] = useState('');
  const [newAudienceDescription, setNewAudienceDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [audienceToDelete, setAudienceToDelete] = useState<Audience | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadAudiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await audienceService.getAudiences({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });
      setAudiences(response.audiences);
    } catch (err) {
      setError('Failed to load audiences');
      console.error('Error loading audiences:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudiences();
  }, [searchTerm]);

  const filteredAudiences = audiences.filter(audience =>
    audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (audience.description && audience.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddAudience = async () => {
    if (!newAudienceName.trim()) return;

    try {
      setIsSaving(true);
      await audienceService.createAudience({
        name: newAudienceName.trim(),
        description: newAudienceDescription.trim() || undefined,
      });

      // Reset form and reload
      setNewAudienceName('');
      setNewAudienceDescription('');
      setIsAdding(false);
      await loadAudiences();
    } catch (err) {
      setError('Failed to create audience');
      console.error('Error creating audience:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setNewAudienceName('');
    setNewAudienceDescription('');
    setIsAdding(false);
  };

  const handleEditClick = (audience: Audience) => {
    setEditingAudience(audience);
    setIsEditModalOpen(true);
  };

  const handleEditSave = async (data: Partial<Audience>) => {
    if (!editingAudience) return;

    try {
      await audienceService.updateAudience(editingAudience.id, data);
      await loadAudiences();
      setIsEditModalOpen(false);
      setEditingAudience(null);
    } catch (err) {
      setError('Failed to update audience');
      console.error('Error updating audience:', err);
      throw err;
    }
  };

  const handleDeleteClick = (audience: Audience) => {
    setAudienceToDelete(audience);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!audienceToDelete) return;

    try {
      await audienceService.deleteAudience(audienceToDelete.id);
      await loadAudiences();
      setIsDeleteDialogOpen(false);
      setAudienceToDelete(null);
    } catch (err) {
      setError('Failed to delete audience');
      console.error('Error deleting audience:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="Search audiences..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          Add Audience
        </Button>
      </div>

      {error && !loading ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <Button variant="outline" onClick={loadAudiences}>
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
                      placeholder="Audience name..."
                      value={newAudienceName}
                      onChange={(e) => setNewAudienceName(e.target.value)}
                      disabled={isSaving}
                      autoFocus
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Input
                      placeholder="Description (optional)..."
                      value={newAudienceDescription}
                      onChange={(e) => setNewAudienceDescription(e.target.value)}
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
                        disabled={isSaving || !newAudienceName.trim()}
                        onClick={handleAddAudience}
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
              ) : filteredAudiences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No audiences found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? 'Try a different search term.' : 'Start by creating your first audience.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setIsAdding(true)}>Add Audience</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredAudiences.map((audience) => (
                  <tr key={audience.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {audience.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {audience.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        audience.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {audience.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(audience.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEditClick(audience)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDeleteClick(audience)}
                        >
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

      {/* Edit Modal */}
      <EditAudienceModal
        audience={editingAudience}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && audienceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteDialogOpen(false)}
          />
          <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete Audience</h2>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete "{audienceToDelete.name}"? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
