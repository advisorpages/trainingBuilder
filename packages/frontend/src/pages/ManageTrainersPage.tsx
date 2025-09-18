import React, { useState } from 'react';
import { Trainer } from '../../../shared/src/types';
import { trainerService, CreateTrainerRequest, UpdateTrainerRequest } from '../services/trainer.service';
import { TrainerList } from '../components/trainers/TrainerList';
import { TrainerForm } from '../components/trainers/TrainerForm';
import { DeleteTrainerModal } from '../components/trainers/DeleteTrainerModal';
import { useAuth } from '../contexts/AuthContext';

type ViewMode = 'list' | 'create' | 'edit';

export const ManageTrainersPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [trainerToDelete, setTrainerToDelete] = useState<Trainer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user is Content Developer
  const canManageTrainers = user?.role?.name === 'Content Developer';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateTrainer = async (data: CreateTrainerRequest) => {
    try {
      setIsSubmitting(true);
      await trainerService.createTrainer(data);
      showNotification('success', 'Trainer created successfully');
      setViewMode('list');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to create trainer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTrainer = async (data: UpdateTrainerRequest) => {
    if (!selectedTrainer) return;

    try {
      setIsSubmitting(true);
      await trainerService.updateTrainer(selectedTrainer.id, data);
      showNotification('success', 'Trainer updated successfully');
      setViewMode('list');
      setSelectedTrainer(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to update trainer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrainer = async () => {
    if (!trainerToDelete) return;

    try {
      setIsDeleting(true);
      await trainerService.deleteTrainer(trainerToDelete.id);
      showNotification('success',
        trainerToDelete.isActive
          ? 'Trainer deactivated successfully'
          : 'Trainer deleted successfully'
      );
      setTrainerToDelete(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to delete trainer');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setViewMode('edit');
  };

  const handleDelete = (trainer: Trainer) => {
    setTrainerToDelete(trainer);
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTrainer(null);
  };

  if (!canManageTrainers) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need Content Developer permissions to manage trainers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Trainers</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create and manage trainer profiles for your training sessions
              </p>
            </div>

            {viewMode === 'list' && (
              <button
                onClick={() => setViewMode('create')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add New Trainer
              </button>
            )}
          </div>

          {/* Breadcrumb */}
          <nav className="flex mt-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </a>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-500">Trainers</span>
              </li>
              {viewMode !== 'list' && (
                <>
                  <li>
                    <span className="text-gray-400">/</span>
                  </li>
                  <li>
                    <span className="text-gray-500">
                      {viewMode === 'create' ? 'Create' : 'Edit'}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-md ${
            notification.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="inline-flex text-sm"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'list' && (
          <TrainerList
            onEdit={handleEdit}
            onDelete={handleDelete}
            key={refreshTrigger}
          />
        )}

        {viewMode === 'create' && (
          <TrainerForm
            onSubmit={handleCreateTrainer}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {viewMode === 'edit' && selectedTrainer && (
          <TrainerForm
            trainer={selectedTrainer}
            onSubmit={handleUpdateTrainer}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Delete Modal */}
        {trainerToDelete && (
          <DeleteTrainerModal
            trainer={trainerToDelete}
            onConfirm={handleDeleteTrainer}
            onCancel={() => setTrainerToDelete(null)}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
};