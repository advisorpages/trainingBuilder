import { Routes, Route } from 'react-router-dom'
import PublicHomepage from './pages/PublicHomepage'
import SessionDetailPage from './pages/SessionDetailPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { SessionWorksheetPage } from './pages/SessionWorksheetPage'
import { IncentiveWorksheetPage } from './pages/IncentiveWorksheetPage'
import { ManageSessionsPage } from './pages/ManageSessionsPage'
import { ManageLocationsPage } from './pages/ManageLocationsPage'
import { ManageTrainersPage } from './pages/ManageTrainersPage'
import { ManageSettingsPage } from './pages/ManageSettingsPage'
import { ManageTopicsPage } from './pages/ManageTopicsPage'
import { ManageAudiencesPage } from './pages/ManageAudiencesPage'
import { ManageTonesPage } from './pages/ManageTonesPage'
import { ManageCategoriesPage } from './pages/ManageCategoriesPage'
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import TrainerSessionDetailPage from './pages/TrainerSessionDetailPage'
import BrokerSessionsPage from './pages/BrokerSessionsPage'
import BrokerIncentivesPage from './pages/BrokerIncentivesPage'
import BrokerReportsPage from './pages/BrokerReportsPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SessionTimeoutWarning from './components/auth/SessionTimeoutWarning'
import { UserRole } from './types/auth.types'
import './App.css'

function App() {
  return (
    <div className="App">
      <main>
        <Routes>
          <Route path="/" element={<PublicHomepage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/admin" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/sessions/worksheet"
            element={
              <ProtectedRoute>
                <SessionWorksheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incentives/worksheet"
            element={
              <ProtectedRoute>
                <IncentiveWorksheetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/manage"
            element={
              <ProtectedRoute>
                <ManageSessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute>
                <ManageLocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/trainers"
            element={
              <ProtectedRoute>
                <ManageTrainersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <ManageSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/topics"
            element={
              <ProtectedRoute>
                <ManageTopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audiences"
            element={
              <ProtectedRoute>
                <ManageAudiencesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tones"
            element={
              <ProtectedRoute>
                <ManageTonesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute>
                <ManageCategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute>
                <TrainerDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer/sessions/:sessionId"
            element={
              <ProtectedRoute>
                <TrainerSessionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}>
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
  )
}

export default App