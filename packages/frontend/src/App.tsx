import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import SessionTimeoutWarning from './components/auth/SessionTimeoutWarning'
import { UserRole } from './types/auth.types'
import './App.css'

// Lazy load components for code splitting
const PublicHomepage = lazy(() => import('./pages/PublicHomepage'))
const SessionDetailPage = lazy(() => import('./pages/SessionDetailPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const SessionWorksheetPage = lazy(() => import('./pages/SessionWorksheetPage').then(module => ({ default: module.SessionWorksheetPage })))
const IncentiveWorksheetPage = lazy(() => import('./pages/IncentiveWorksheetPage').then(module => ({ default: module.IncentiveWorksheetPage })))
const ManageSessionsPage = lazy(() => import('./pages/ManageSessionsPage').then(module => ({ default: module.ManageSessionsPage })))
const ManageLocationsPage = lazy(() => import('./pages/ManageLocationsPage').then(module => ({ default: module.ManageLocationsPage })))
const ManageTrainersPage = lazy(() => import('./pages/ManageTrainersPage').then(module => ({ default: module.ManageTrainersPage })))
const ManageSettingsPage = lazy(() => import('./pages/ManageSettingsPage').then(module => ({ default: module.ManageSettingsPage })))
const ManageTopicsPage = lazy(() => import('./pages/ManageTopicsPage').then(module => ({ default: module.ManageTopicsPage })))
const ManageAudiencesPage = lazy(() => import('./pages/ManageAudiencesPage').then(module => ({ default: module.ManageAudiencesPage })))
const ManageTonesPage = lazy(() => import('./pages/ManageTonesPage').then(module => ({ default: module.ManageTonesPage })))
const ManageCategoriesPage = lazy(() => import('./pages/ManageCategoriesPage').then(module => ({ default: module.ManageCategoriesPage })))
const TrainerDashboardPage = lazy(() => import('./pages/TrainerDashboardPage'))
const TrainerSessionDetailPage = lazy(() => import('./pages/TrainerSessionDetailPage'))
const BrokerSessionsPage = lazy(() => import('./pages/BrokerSessionsPage'))
const BrokerIncentivesPage = lazy(() => import('./pages/BrokerIncentivesPage'))
const BrokerReportsPage = lazy(() => import('./pages/BrokerReportsPage'))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
  </div>
)

function App() {
  return (
    <div className="App">
      <main>
        <Suspense fallback={<LoadingSpinner />}>
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
        </Suspense>
      </main>

      <SessionTimeoutWarning warningThreshold={5} />
    </div>
  )
}

export default App