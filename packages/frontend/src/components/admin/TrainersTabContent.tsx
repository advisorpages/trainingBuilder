import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { trainerService } from '../../services/trainer.service';
import { EditTrainerModal } from './EditTrainerModal';
import type { Trainer } from '@leadership-training/shared';

export const TrainersTabContent: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);

  const loadTrainers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await trainerService.getTrainers({
        search: searchTerm || undefined,
        page: 1,
        limit: 100,
      });
      setTrainers(response.trainers);
    } catch (err) {
      setError('Failed to load trainers');
      console.error('Error loading trainers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainers();
  }, [searchTerm]);

  const filteredTrainers = trainers.filter(trainer =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (trainer.email && trainer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (trainer.bio && trainer.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClick = () => {
    setEditingTrainer(null);
    setIsEditModalOpen(true);
  };

  const handleEditClick = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (data: Partial<Trainer>) => {
    try {
      if (editingTrainer) {
        // Update existing trainer
        await trainerService.updateTrainer(editingTrainer.id, data);
      } else {
        // Create new trainer
        await trainerService.createTrainer(data as any);
      }
      await loadTrainers();
      setIsEditModalOpen(false);
      setEditingTrainer(null);
    } catch (err: any) {
      console.error('Error saving trainer:', err);
      setError(editingTrainer ? 'Failed to update trainer' : 'Failed to create trainer');
      throw err;
    }
  };

  const handleDeleteClick = (trainer: Trainer) => {
    setTrainerToDelete(trainer);
  };

  const handleConfirmDelete = async () => {
    if (!trainerToDelete) return;

    try {
      await trainerService.deleteTrainer(trainerToDelete.id);
      await loadTrainers();
      setTrainerToDelete(null);
    } catch (err) {
      console.error('Error deleting trainer:', err);
      setError('Failed to delete trainer');
      setTrainerToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setTrainerToDelete(null);
  };

  return (
    <>
      <EditTrainerModal
        trainer={editingTrainer}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Dialog */}
      {trainerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Trainer
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete "{trainerToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-6xl">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Input
            placeholder="Search trainers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md"
          />
          <Button onClick={handleAddClick}>
            Add Trainer
          </Button>
        </div>

      {error && !loading ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700 mb-2">{error}</p>
          <Button variant="outline" onClick={loadTrainers}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Contact</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Expertise</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-48 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-40 animate-pulse"></div>
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
              ) : filteredTrainers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-4xl mb-4">👨‍🏫</div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No trainers found</h3>
                    <p className="text-slate-600 mb-4">
                      {searchTerm ? 'Try a different search term.' : 'Start by creating your first trainer.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleAddClick}>Add Trainer</Button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTrainers.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{trainer.name}</div>
                      {trainer.bio && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {trainer.bio}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div>{trainer.email}</div>
                      {trainer.phone && (
                        <div className="text-xs text-slate-500 mt-1">{trainer.phone}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {trainer.expertiseTags && trainer.expertiseTags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {trainer.expertiseTags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {trainer.expertiseTags.length > 2 && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600">
                              +{trainer.expertiseTags.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        trainer.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {trainer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(trainer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleEditClick(trainer)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-red-600"
                          onClick={() => handleDeleteClick(trainer)}
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
    </div>
    </>
  );
};
