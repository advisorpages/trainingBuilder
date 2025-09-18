import React, { useState } from 'react';
import { Incentive } from '../../../shared/src/types';
import { IncentiveForm } from '../components/incentives/IncentiveForm';
import { IncentiveDraftsList } from '../components/incentives/IncentiveDraftsList';
import { UnsavedChangesModal } from '../components/sessions/UnsavedChangesModal';
import { IncentiveStatusIndicator } from '../components/common/IncentiveStatusIndicator';
import { useAuth } from '../contexts/AuthContext';
import { incentiveService } from '../services/incentive.service';

type ViewMode = 'list' | 'create' | 'edit';

export const IncentiveWorksheetPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIncentive, setSelectedIncentive] = useState<Incentive | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation] = useState<() => void>(() => {});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check if user is Content Developer
  const canCreateIncentives = user?.role?.name === 'Content Developer';

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateIncentive = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Type guard to ensure we have all required fields for creation
      if (!data.title || !data.startDate || !data.endDate) {
        throw new Error('Missing required fields for incentive creation');
      }

      const newIncentive = await incentiveService.createIncentive(data);

      showNotification('success', 'Incentive draft created successfully');
      setSelectedIncentive(newIncentive);
      setViewMode('edit');
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to create incentive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateIncentive = async (data: any) => {
    if (!selectedIncentive) return;

    try {
      setIsSubmitting(true);
      const updatedIncentive = await incentiveService.saveDraft(selectedIncentive.id, data);

      showNotification('success', 'Incentive draft saved successfully');
      setSelectedIncentive(updatedIncentive);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to save incentive draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedIncentive(null);
  };

  // Draft management handlers
  const handleEditDraft = (incentive: Incentive) => {
    setSelectedIncentive(incentive);
    setViewMode('edit');
  };

  const handleDeleteDraft = async (incentive: Incentive) => {
    if (confirm(`Are you sure you want to delete the draft "${incentive.title || 'Untitled Incentive'}"?`)) {
      try {
        await incentiveService.deleteIncentive(incentive.id);

        showNotification('success', 'Draft deleted successfully');
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to delete draft');
      }
    }
  };

  // Publishing handlers for Story 6.4
  const handlePublishIncentive = async (incentive: Incentive) => {
    if (confirm(`Are you sure you want to publish "${incentive.title}"? This will make it visible to all users.`)) {
      try {
        await incentiveService.publish(incentive.id);

        showNotification('success', 'Incentive published successfully');
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to publish incentive');
      }
    }
  };

  const handleUnpublishIncentive = async (incentive: Incentive) => {
    if (confirm(`Are you sure you want to unpublish "${incentive.title}"? This will remove it from public view.`)) {
      try {
        await incentiveService.unpublish(incentive.id);

        showNotification('success', 'Incentive unpublished successfully');
        setRefreshTrigger(prev => prev + 1);
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to unpublish incentive');
      }
    }
  };

  const handleCreateNew = () => {
    setSelectedIncentive(null);
    setViewMode('create');
  };

  // Unsaved changes handling
  const handleSaveDraft = async () => {
    if (selectedIncentive) {
      try {
        setIsSubmitting(true);
        // This would need to call the form's save functionality
        // For now, we'll just close the modal
        setShowUnsavedModal(false);
        pendingNavigation();
      } catch (error: any) {
        showNotification('error', 'Failed to save draft');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedModal(false);
    pendingNavigation();
  };

  const handleCancelModal = () => {
    setShowUnsavedModal(false);
  };

  if (!canCreateIncentives) {
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
                  You need Content Developer permissions to create incentives.
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
              <h1 className="text-3xl font-bold text-gray-900">Incentive Worksheet</h1>
              <p className="mt-1 text-sm text-gray-500">
                {viewMode === 'list'
                  ? 'Manage your draft incentives and create new promotional content'
                  : 'Create and design your incentive with AI-powered content generation'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {selectedIncentive && (
                <IncentiveStatusIndicator
                  status={selectedIncentive.status}
                  showDescription={true}
                />
              )}

              {viewMode !== 'list' && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Back to Drafts
                </button>
              )}

              {viewMode === 'list' && (
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create New Incentive
                </button>
              )}
            </div>
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
                <span className="text-gray-500">Incentive Worksheet</span>
              </li>
              {selectedIncentive && (
                <>
                  <li>
                    <span className="text-gray-400">/</span>
                  </li>
                  <li>
                    <span className="text-gray-500 truncate max-w-xs">
                      {selectedIncentive.title || 'Untitled Incentive'}
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
          <IncentiveDraftsList
            onEditDraft={handleEditDraft}
            onDeleteDraft={handleDeleteDraft}
            onPublishIncentive={handlePublishIncentive}
            onUnpublishIncentive={handleUnpublishIncentive}
            refreshTrigger={refreshTrigger}
          />
        )}

        {viewMode === 'create' && (
          <IncentiveForm
            onSubmit={handleCreateIncentive}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {viewMode === 'edit' && selectedIncentive && (
          <IncentiveForm
            incentive={selectedIncentive}
            onSubmit={handleUpdateIncentive}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Unsaved Changes Modal */}
        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onSave={handleSaveDraft}
          onDiscard={handleDiscardChanges}
          onCancel={handleCancelModal}
          isSaving={isSubmitting}
        />
      </div>
    </div>
  );
};