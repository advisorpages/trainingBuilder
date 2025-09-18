import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Session } from '../../../shared/src/types';
import { sessionService } from '../services/session.service';
import { DraftsList } from '../components/sessions/DraftsList';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';

export const ManageSessionsPage: React.FC = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user is Content Developer
  const canManageSessions = user?.role?.name === UserRole.CONTENT_DEVELOPER;

  const handleEditSession = (session: Session) => {
    // Navigate to session worksheet for editing
    window.location.href = `/sessions/worksheet?edit=${session.id}`;
  };

  const handleDeleteSession = async (session: Session) => {
    if (confirm(`Are you sure you want to delete "${session.title || 'Untitled Session'}"? This action cannot be undone.`)) {
      try {
        await sessionService.deleteSession(session.id);
        setRefreshTrigger(prev => prev + 1);
        // Show success notification
      } catch (error: any) {
        // Show error notification
        console.error('Failed to delete session:', error);
      }
    }
  };

  if (!canManageSessions) {
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
                  You need Content Developer permissions to manage training sessions.
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
              <h1 className="text-3xl font-bold text-gray-900">Manage Sessions</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage all your training sessions across different publishing states
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                to="/sessions/worksheet"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create New Session
              </Link>
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
                <span className="text-gray-500">Manage Sessions</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Status Legend */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Session Status Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 bg-blue-100 rounded-full"></span>
              <span className="text-gray-600"><strong>Draft:</strong> In creation/editing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 bg-green-100 rounded-full"></span>
              <span className="text-gray-600"><strong>Published:</strong> Live & available</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 bg-gray-100 rounded-full"></span>
              <span className="text-gray-600"><strong>Completed:</strong> Session finished</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-3 h-3 bg-red-100 rounded-full"></span>
              <span className="text-gray-600"><strong>Cancelled:</strong> Session cancelled</span>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <DraftsList
          onEditDraft={handleEditSession}
          onDeleteDraft={handleDeleteSession}
          refreshTrigger={refreshTrigger}
          showAllSessions={true}
        />
      </div>
    </div>
  );
};

export default ManageSessionsPage;