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
import TrainerDashboardPage from './pages/TrainerDashboardPage'
import TrainerSessionDetailPage from './pages/TrainerSessionDetailPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { UserRole } from './types/auth.types'
import PublicLayout from './layouts/PublicLayout'
import AppLayout from './layouts/AppLayout'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PublicHomepage />} />
          <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* Authenticated app routes with shared layout */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sessions/worksheet" element={<SessionWorksheetPage />} />
          <Route path="/incentives/worksheet" element={<IncentiveWorksheetPage />} />
          <Route path="/sessions/manage" element={<ManageSessionsPage />} />
          <Route path="/admin/locations" element={<ManageLocationsPage />} />
          <Route path="/admin/trainers" element={<ManageTrainersPage />} />
          <Route path="/admin/settings" element={<ManageSettingsPage />} />
          <Route path="/trainer/dashboard" element={<TrainerDashboardPage />} />
          <Route path="/trainer/sessions/:sessionId" element={<TrainerSessionDetailPage />} />
          <Route path="/analytics" element={<ProtectedRoute requiredRoles={[UserRole.CONTENT_DEVELOPER]}><AnalyticsPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
