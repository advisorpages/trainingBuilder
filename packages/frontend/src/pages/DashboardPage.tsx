import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/auth.types'
import { UnifiedDraftsList } from '../components/common/UnifiedDraftsList'
import { IncentiveDraftsList } from '../components/incentives/IncentiveDraftsList'
import { Session, Incentive } from '../../../shared/src/types'
import { useState } from 'react'
import { sessionService } from '../services/session.service'
import { incentiveService } from '../services/incentive.service'

const DashboardPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [refreshDrafts, setRefreshDrafts] = useState(0)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!user) {
    return <div>Loading...</div>
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handlers for drafts actions
  const handleEditSessionDraft = (session: Session) => {
    navigate(`/sessions/worksheet?edit=${session.id}`)
  }

  const handleDeleteSessionDraft = async (session: Session) => {
    if (confirm(`Are you sure you want to delete the draft "${session.title || 'Untitled Session'}"?`)) {
      try {
        await sessionService.deleteSession(session.id)
        showNotification('success', 'Session draft deleted successfully')
        setRefreshDrafts(prev => prev + 1)
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to delete session draft')
      }
    }
  }

  const handleEditIncentiveDraft = (incentive: Incentive) => {
    navigate(`/incentives/worksheet?edit=${incentive.id}`)
  }

  const handleDeleteIncentiveDraft = async (incentive: Incentive) => {
    if (confirm(`Are you sure you want to delete the draft "${incentive.title || 'Untitled Incentive'}"?`)) {
      try {
        await incentiveService.deleteIncentive(incentive.id)
        showNotification('success', 'Incentive draft deleted successfully')
        setRefreshDrafts(prev => prev + 1)
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to delete incentive draft')
      }
    }
  }

  const handlePublishIncentive = async (incentive: Incentive) => {
    try {
      await incentiveService.publish(incentive.id)
      showNotification('success', 'Incentive published successfully')
      setRefreshDrafts(prev => prev + 1)
    } catch (error: any) {
      showNotification('error', error.response?.data?.message || 'Failed to publish incentive')
    }
  }

  const handleUnpublishIncentive = async (incentive: Incentive) => {
    if (confirm(`Are you sure you want to unpublish "${incentive.title}"? It will no longer be visible to the public.`)) {
      try {
        await incentiveService.unpublish(incentive.id)
        showNotification('success', 'Incentive unpublished successfully')
        setRefreshDrafts(prev => prev + 1)
      } catch (error: any) {
        showNotification('error', error.response?.data?.message || 'Failed to unpublish incentive')
      }
    }
  }

  const getRoleBasedContent = () => {
    switch (user.role.name) {
      case UserRole.CONTENT_DEVELOPER:
        return (
          <div>
            <h3>Content Developer Actions</h3>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>
                <Link to="/sessions/worksheet" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📝 Session Worksheet
                </Link>
              </li>
              <li>
                <Link to="/sessions/manage" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📋 Manage Sessions
                </Link>
              </li>
              <li>
                <Link to="/admin/trainers" style={{ color: '#007bff', textDecoration: 'none' }}>
                  👥 Manage Trainers
                </Link>
              </li>
              <li>
                <Link to="/admin/locations" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📍 Manage Locations
                </Link>
              </li>
              <li>
                <Link to="/admin/settings" style={{ color: '#007bff', textDecoration: 'none' }}>
                  ⚙️ System Settings
                </Link>
              </li>
              <li>
                <Link to="/incentives/worksheet" style={{ color: '#007bff', textDecoration: 'none' }}>
                  🎯 Incentive Worksheet
                </Link>
              </li>
              <li>
                <Link to="/analytics" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📊 Analytics Dashboard
                </Link>
              </li>
            </ul>
          </div>
        )

      case UserRole.TRAINER:
        return (
          <div>
            <h3>Trainer Dashboard</h3>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>
                <Link to="/trainer/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>
                  📅 Trainer Dashboard - My Sessions & Materials
                </Link>
              </li>
              <li>📋 Session Details & Coaching Tips ✅</li>
              <li>💡 AI Coaching Tips Generation ✅</li>
              <li>📧 Trainer Kit Notifications (Coming in Story 4.5)</li>
            </ul>
          </div>
        )

      case UserRole.BROKER:
        return (
          <div>
            <h3>Broker Access</h3>
            <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              <li>📚 View Published Sessions</li>
              <li>🎯 Available Incentives</li>
              <li>📊 Basic Reports</li>
            </ul>
          </div>
        )

      default:
        return <div>Unknown role</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Logout
          </button>
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-blue-900">Welcome, {user.email}!</h3>
          <p className="mt-1 text-blue-700"><strong>Role:</strong> {user.role.name}</p>
          <p className="text-blue-700"><strong>Account Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
        </div>

        {/* Show Drafts for Content Developers */}
        {user.role.name === UserRole.CONTENT_DEVELOPER && (
          <div className="mb-8 space-y-6">
            <UnifiedDraftsList
              onEditSessionDraft={handleEditSessionDraft}
              onDeleteSessionDraft={handleDeleteSessionDraft}
              onEditIncentiveDraft={handleEditIncentiveDraft}
              onDeleteIncentiveDraft={handleDeleteIncentiveDraft}
              refreshTrigger={refreshDrafts}
            />
            <IncentiveDraftsList
              onEditDraft={handleEditIncentiveDraft}
              onDeleteDraft={handleDeleteIncentiveDraft}
              onPublishIncentive={handlePublishIncentive}
              onUnpublishIncentive={handleUnpublishIncentive}
              refreshTrigger={refreshDrafts}
            />
          </div>
        )}

        {getRoleBasedContent()}

        <div className="mt-8">
          <Link to="/">
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
              Back to Home
            </button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-600 bg-gray-100 p-4 rounded-lg">
          <p>
            <strong>Current Story:</strong> 6.4 - Incentive Publishing and Public Display ✅<br />
            <strong>Status:</strong> Complete - Incentives can be published, unpublished, and displayed publicly with automated expiration
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage