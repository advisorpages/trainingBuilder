import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SessionTimeoutWarning from './components/auth/SessionTimeoutWarning'
import ErrorBoundary from './components/ErrorBoundary'
import { UserRole } from './types/auth.types'
import DashboardPage from './pages/DashboardPage'
import PublicHomepage from './pages/PublicHomepage'
import SessionDetailPage from './pages/SessionDetailPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import './App.css'

// All components now imported directly (no lazy loading)
import AnalyticsPage from './pages/AnalyticsPage'
import { SessionWorksheetPage } from './pages/SessionWorksheetPage'
import { IncentiveWorksheetPage } from './pages/IncentiveWorksheetPage'
import { ManageSessionsPage } from './pages/ManageSessionsPage'
import { ManageLocationsPage } from './pages/ManageLocationsPage'
import { ManageTrainersPage } from './pages/ManageTrainersPage'
// import { ManageSettingsPage } from './pages/ManageSettingsPage' // Temporarily disabled due to import errors
import { ManageTopicsPage } from './pages/ManageTopicsPage'
import { ManageAudiencesPage } from './pages/ManageAudiencesPage'
import { ManageTonesPage } from './pages/ManageTonesPage'
import { ManageCategoriesPage } from './pages/ManageCategoriesPage'
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import TrainerSessionDetailPage from './pages/TrainerSessionDetailPage'
import BrokerSessionsPage from './pages/BrokerSessionsPage'
import BrokerIncentivesPage from './pages/BrokerIncentivesPage'
import BrokerReportsPage from './pages/BrokerReportsPage'
import { SessionBuilderPage } from './pages/SessionBuilderPage'


function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <main>
          <Routes>
          <Route path="/" element={<PublicHomepage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/admin" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER, UserRole.TRAINER]}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route
            path="/sessions/worksheet"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionWorksheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/builder"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incentives/worksheet"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <IncentiveWorksheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/manage"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageSessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageLocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainers"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageTrainersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: '#e74c3c' }}>Settings Page Temporarily Disabled</h2>
                <p>This page has import errors and needs to be fixed.</p>
                <a href="/dashboard" style={{ color: '#6366f1' }}>← Back to Dashboard</a>
              </div>
            }
          />
          <Route
            path="/admin/topics"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageTopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audiences"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageAudiencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tones"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageTonesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute requiredRoles={[UserRole.TRAINER]}>
                <TrainerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId"
            element={
              <ProtectedRoute requiredRoles={[UserRole.TRAINER]}>
                <TrainerSessionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker/sessions"
            element={
              <ProtectedRoute requiredRoles={[UserRole.BROKER]}>
                <BrokerSessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker/incentives"
            element={
              <ProtectedRoute requiredRoles={[UserRole.BROKER]}>
                <BrokerIncentivesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/broker/reports"
            element={
              <ProtectedRoute requiredRoles={[UserRole.BROKER]}>
                <BrokerReportsPage />
              </ProtectedRoute>
            }
          />
          </Routes>
        </main>

      <SessionTimeoutWarning warningThreshold={5} />
    </div>
    </ErrorBoundary>
  )
}

export default App