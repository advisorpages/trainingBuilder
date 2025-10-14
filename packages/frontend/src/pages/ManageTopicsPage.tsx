import React, { useState } from 'react';
import { Topic } from '@leadership-training/shared';
import { topicService, CreateTopicRequest, UpdateTopicRequest } from '../services/topic.service';
import { TopicList } from '../components/topics/TopicList';
import { EnhancedTopicForm } from '../components/topics/EnhancedTopicForm';
import { TopicDetails } from '../components/topics/TopicDetails';
import { DeleteTopicModal } from '../components/topics/DeleteTopicModal';
import { EditTopicModal } from '../components/topics/EditTopicModal';
import { useAuth } from '../contexts/AuthContext';
import { useTopicCreation } from '../hooks/useTopicCreation';
import { BuilderLayout } from '../layouts/BuilderLayout';

type ViewMode = 'list' | 'create' | 'details' | 'edit';

export const ManageTopicsPage: React.FC = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [topicsToDelete, setTopicsToDelete] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Check if user is Content Developer or Broker
  const canManageTopics = user?.role?.name === 'Content Developer' || user?.role?.name === 'Broker';

  // Topic creation hook with context loading
  const {
    audiences,
    tones,
    categories,
    isLoadingContext,
    error: contextError,
    clearError
  } = useTopicCreation({
    autoLoadContext: viewMode === 'create'
  });



  const handleCreateTopic = async (data: CreateTopicRequest | UpdateTopicRequest) => {
    try {
      setIsSubmitting(true);
      await topicService.createTopic(data as CreateTopicRequest);
      showNotification('success', 'Topic created successfully');
      setViewMode('list');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      // Error handling removed - no notification banner
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;

    try {
      setIsDeleting(true);
      await topicService.deleteTopic(topicToDelete.id);
      showNotification('success',
        topicToDelete.isActive
          ? 'Topic deactivated successfully'
          : 'Topic deleted successfully'
      );
      setTopicToDelete(null);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      // Error handling removed - no notification banner
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditTopic = async (data: UpdateTopicRequest) => {
    if (!topicToEdit) return;

    try {
      setIsSubmitting(true);
      await topicService.updateTopic(topicToEdit.id, data);
      showNotification('success', 'Topic updated successfully');
      setTopicToEdit(null);
      setViewMode('list');
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Bulk delete operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (topic: Topic, isActive: boolean) => {
    try {
      await topicService.updateTopic(topic.id, { isActive });
      showNotification('success',
        isActive ? 'Topic activated successfully' : 'Topic deactivated successfully'
      );
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to update topic status');
      throw error; // Re-throw to let the TopicList handle the error state
    }
  };


  const handleEdit = (topic: Topic) => {
    setTopicToEdit(topic);
  };

  const handleDelete = (topic: Topic) => {
    setTopicToDelete(topic);
  };

  const handleBulkDelete = (topicIds: number[]) => {
    setTopicsToDelete(topicIds);
  };

  const confirmBulkDelete = async () => {
    if (topicsToDelete.length === 0) return;

    try {
      setIsDeleting(true);
      const result = await topicService.bulkDeleteTopics(topicsToDelete);

      const successCount = result.success.length;
      const failedCount = result.failed.length;

      if (failedCount === 0) {
        showNotification('success', `Successfully deleted ${successCount} topic${successCount === 1 ? '' : 's'}`);
      } else if (successCount === 0) {
        showNotification('error', `Failed to delete ${failedCount} topic${failedCount === 1 ? '' : 's'}`);
      } else {
        showNotification('success', `Deleted ${successCount} topic${successCount === 1 ? '' : 's'}. ${failedCount} failed.`);
      }

      setTopicsToDelete([]);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Bulk delete operation failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedTopic(null);
    setTopicToEdit(null);
  };

  if (!canManageTopics) {
    return (
      <BuilderLayout title="Topics" subtitle="Access Restricted">
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
                You need Content Developer or Broker permissions to manage topics.
              </p>
            </div>
          </div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      title="Topics"
      subtitle="Create and manage content topics for your sessions"
    >
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-md ${
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
          <TopicList
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onStatusChange={handleStatusChange}
            onAddNew={() => setViewMode('create')}
            refreshTrigger={refreshTrigger}
          />
        )}

        {viewMode === 'create' && (
          isLoadingContext ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading context data...</span>
              </div>
            </div>
          ) : (
            <EnhancedTopicForm
              audiences={audiences}
              tones={tones}
              categories={categories}
              onSubmit={handleCreateTopic}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          )
        )}

        {viewMode === 'details' && selectedTopic && (
          <TopicDetails
            topic={selectedTopic}
            onBack={handleCancel}
          />
        )}

        {/* Edit Modal */}
        {topicToEdit && (
          <EditTopicModal
            topic={topicToEdit}
            onSave={handleEditTopic}
            onCancel={() => setTopicToEdit(null)}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Delete Modal */}
        {topicToDelete && (
          <DeleteTopicModal
            topic={topicToDelete}
            onConfirm={handleDeleteTopic}
            onCancel={() => setTopicToDelete(null)}
            isDeleting={isDeleting}
          />
        )}

        {/* Bulk Delete Modal */}
        {topicsToDelete.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">Delete Multiple Topics</h3>
                    <p className="mt-2 text-sm text-gray-600">
                      Are you sure you want to delete {topicsToDelete.length} topic
                      {topicsToDelete.length === 1 ? '' : 's'}? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
                <button
                  onClick={() => setTopicsToDelete([])}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBulkDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BuilderLayout>
  );
};
