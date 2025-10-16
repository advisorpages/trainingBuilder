import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import { UserRole } from './types/auth.types'
import PublicHomepage from './pages/PublicHomepage'
import SessionDetailPage from './pages/SessionDetailPage'
import PublicSessionPage from './pages/PublicSessionPage'
import LoginPage from './pages/LoginPage'
import ManageSessionsPage from './pages/ManageSessionsPage'
import { ManageTrainersPage } from './pages/ManageTrainersPage'
import { ManageTopicsPage } from './pages/ManageTopicsPage'
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import TrainerSessionDetailPage from './pages/TrainerSessionDetailPage'
import { SessionBuilderPage } from './pages/SessionBuilderPage'
import ClassicSessionBuilderPage from './pages/ClassicSessionBuilderPage'
import SessionEditPage from './pages/SessionEditPage'
import DashboardPage from './pages/DashboardPage'
import SessionWorksheetPage from './pages/SessionWorksheetPage'
import ManageLocationsPage from './pages/ManageLocationsPage'
import ManageAudiencesPage from './pages/ManageAudiencesPage'
import ManageTonesPage from './pages/ManageTonesPage'
import ManageCategoriesPage from './pages/ManageCategoriesPage'
import IncentiveWorksheetPage from './pages/IncentiveWorksheetPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import SessionAITunerPage from './pages/SessionAITunerPage'
import HomePage from './pages/HomePage'
import { SavedVariantsPage } from './pages/SavedVariantsPage'
import './App.css'


function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <main>
          <Routes>
          <Route path="/" element={<PublicHomepage />} />
          <Route path="/sessions/:sessionId" element={<PublicSessionPage />} />
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
            element={<Navigate to="/sessions/builder/new" replace />}
          />
          <Route
            path="/sessions/builder/classic"
            element={<Navigate to="/sessions/builder/classic/new" replace />}
          />
          <Route
            path="/sessions/builder/:sessionId"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/builder/edit/:sessionId"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/builder/classic/:sessionId"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ClassicSessionBuilderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/edit/:sessionId"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageSessionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/saved-variants"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SavedVariantsPage />
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
            path="/incentives"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <IncentiveWorksheetPage />
              </ProtectedRoute>
            }
          />
          {/* Redirect to main navigation pages */}
          <Route path="/admin/locations" element={<Navigate to="/locations" replace />} />
          <Route path="/admin/trainers" element={<Navigate to="/trainers" replace />} />
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
            path="/topics"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageTopicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/locations"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageLocationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainers"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <ManageTrainersPage />
              </ProtectedRoute>
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
          <Route path="/admin/audiences" element={<Navigate to="/admin/dashboard?tab=audiences" replace />} />
          <Route path="/admin/tones" element={<Navigate to="/admin/dashboard?tab=tones" replace />} />
          <Route path="/admin/categories" element={<Navigate to="/admin/dashboard?tab=categories" replace />} />
          <Route path="/analytics" element={<Navigate to="/admin/dashboard?tab=analytics" replace />} />
            <Route
            path="/admin/ai-tuner"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <SessionAITunerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER, UserRole.BROKER]}>
                <AdminDashboardPage />
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
          <Route path="/broker/sessions" element={<Navigate to="/sessions" replace />} />
          <Route path="/broker/incentives" element={<Navigate to="/incentives" replace />} />
          <Route path="/broker/reports" element={<Navigate to="/admin/dashboard?tab=analytics" replace />} />
          </Routes>
        </main>

    </div>
    </ErrorBoundary>
  )
}

export default App
