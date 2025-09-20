import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '../types/auth.types'
import { UnifiedDraftsList } from '../components/common/UnifiedDraftsList'
import { IncentiveDraftsList } from '../components/incentives/IncentiveDraftsList'
import { Session, Incentive } from '../../../shared/src/types'
import { useState } from 'react'
import { sessionService } from '../services/session.service'
import { incentiveService } from '../services/incentive.service'
import { Icon } from '../components/ui/Icon'
import { Button } from '../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { cn } from "@/lib/utils"

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
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Content Developer Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <Link to="/sessions/worksheet" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="document-text" size="sm" className="mr-2" />
                    Session Worksheet
                  </Link>
                </li>
                <li>
                  <Link to="/sessions/manage" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="clipboard-document-list" size="sm" className="mr-2" />
                    Manage Sessions
                  </Link>
                </li>
                <li>
                  <Link to="/admin/trainers" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="users" size="sm" className="mr-2" />
                    Manage Trainers
                  </Link>
                </li>
                <li>
                  <Link to="/admin/locations" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="map-pin" size="sm" className="mr-2" />
                    Manage Locations
                  </Link>
                </li>
                <li>
                  <Link to="/admin/settings" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="cog" size="sm" className="mr-2" />
                    System Settings
                  </Link>
                </li>
                <li>
                  <Link to="/incentives/worksheet" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="trophy" size="sm" className="mr-2" />
                    Incentive Worksheet
                  </Link>
                </li>
                <li>
                  <Link to="/analytics" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="chart-bar" size="sm" className="mr-2" />
                    Analytics Dashboard
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
        )

      case UserRole.TRAINER:
        return (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Trainer Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <Link to="/trainer/dashboard" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="calendar" size="sm" className="mr-2" />
                    Trainer Dashboard - My Sessions & Materials
                  </Link>
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Icon name="clipboard-document-list" size="sm" className="mr-2" />
                  Session Details & Coaching Tips ✅
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Icon name="light-bulb" size="sm" className="mr-2" />
                  AI Coaching Tips Generation ✅
                </li>
                <li className="flex items-center text-muted-foreground">
                  <Icon name="envelope" size="sm" className="mr-2" />
                  Trainer Kit Notifications (Coming in Story 4.5)
                </li>
              </ul>
            </CardContent>
          </Card>
        )

      case UserRole.BROKER:
        return (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Broker Access</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <Link to="/sessions/worksheet" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="document-text" size="sm" className="mr-2" />
                    Session Worksheet
                  </Link>
                </li>
                <li>
                  <Link to="/broker/sessions" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="book-open" size="sm" className="mr-2" />
                    View Published Sessions
                  </Link>
                </li>
                <li>
                  <Link to="/broker/incentives" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="trophy" size="sm" className="mr-2" />
                    Available Incentives
                  </Link>
                </li>
                <li>
                  <Link to="/broker/reports" className="flex items-center text-primary-600 hover:text-primary-700 transition-colors">
                    <Icon name="presentation-chart-line" size="sm" className="mr-2" />
                    Basic Reports
                  </Link>
                </li>
              </ul>
            </CardContent>
          </Card>
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
          <Button
            onClick={() => logout()}
            variant="destructive"
            size="sm"
          >
            Logout
          </Button>
        </div>

        {/* Notification */}
        {notification && (
          <Card className={cn("mb-4", {
            "bg-success-50 border-success-200 text-success-800": notification.type === 'success',
            "bg-destructive/10 border-destructive-200 text-destructive-foreground": notification.type === 'error',
          })}>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {notification.type === 'success' ? (
                    <svg className="h-5 w-5 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm">{notification.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <Button
                    onClick={() => setNotification(null)}
                    variant="ghost"
                    size="icon"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Welcome, {user.email}!</CardTitle>
            <CardDescription>
              <strong>Role:</strong> {user.role.name}<br />
              <strong>Account Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
            </CardDescription>
          </CardHeader>
        </Card>

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
            <Button variant="secondary" size="default">
              Back to Home
            </Button>
          </Link>
        </div>

        <Card className="mt-8">
          <CardContent className="text-sm text-muted-foreground">
            <p>
              <strong>Current Story:</strong> 6.4 - Incentive Publishing and Public Display ✅<br />
              <strong>Status:</strong> Complete - Incentives can be published, unpublished, and displayed publicly with automated expiration
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage