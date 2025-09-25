import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Session } from '@leadership-training/shared';
import { SessionForm } from '../components/sessions/SessionForm';
import { SessionDetails } from '../components/sessions/SessionDetails';
import { sessionService } from '../services/session.service';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';

export const SessionWorksheetPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check if user is Content Developer or Broker
  const canCreateSessions = user?.role?.name === UserRole.CONTENT_DEVELOPER || user?.role?.name === UserRole.BROKER;

  // Check for edit parameter in URL
  const urlParams = new URLSearchParams(location.search);
  const editSessionId = urlParams.get('edit');

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Load session for editing if edit parameter is present
  useEffect(() => {
    if (editSessionId) {
      const loadSession = async () => {
        try {
          setIsLoading(true);
          const sessionData = await sessionService.getSession(editSessionId);
          setSession(sessionData);
        } catch (error: any) {
          showNotification('error', error.response?.data?.message || 'Failed to load session');
        } finally {
          setIsLoading(false);
        }
      };
      loadSession();
    }
  }, [editSessionId]);

  const handleCreateSession = async (data: any) => {
    try {
      setIsSubmitting(true);
      const newSession = await sessionService.createSession(data);
      showNotification('success', 'Session draft created successfully');

      // Navigate to edit mode for the new session
      navigate(`/sessions/worksheet?edit=${newSession.id}`, { replace: true });
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSession = async (data: any) => {
    if (!session) return;

    try {
      setIsSubmitting(true);
      const updatedSession = await sessionService.updateSession(session.id, data);
      console.log('Session updated successfully, navigating to dashboard');
      showNotification('success', 'Session updated successfully');
      // Navigate back to dashboard immediately after successful update
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Update session error:', error);
      showNotification('error', error.response?.data?.message || 'Failed to update session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: any) => {
    if (session) {
      await handleUpdateSession(data);
    } else {
      await handleCreateSession(data);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  // Access control check
  if (!canCreateSessions) {
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
                  You need Content Developer or Broker permissions to create training sessions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state for session data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading session...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                {session ? 'Edit Session' : 'Create Session'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {session ? 'Update your training session details and configuration' : 'Create a new training session with AI-powered content generation'}
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex mt-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-500">
                  {session ? 'Edit Session' : 'Session Worksheet'}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
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
                  className="text-gray-400 hover:text-gray-600"
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

        {/* Session Form */}
        <div className="bg-white shadow rounded-lg">
          <SessionForm
            session={session || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
};