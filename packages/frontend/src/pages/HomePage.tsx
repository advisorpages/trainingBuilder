import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { sessionService } from '../services/session.service'
import SessionCard from '../components/sessions/SessionCard'
import { Session } from '../../../shared/src/types'

const HomePage = () => {
  const [backendHealth, setBackendHealth] = useState<string>('Checking...')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001'
        const response = await fetch(`${apiUrl}/api/health`)
        if (response.ok) {
          setBackendHealth('Connected ✅')
        } else {
          setBackendHealth('Backend responding but unhealthy ⚠️')
        }
      } catch (error) {
        setBackendHealth('Cannot connect to backend ❌')
      }
    }

    const fetchUpcomingSessions = async () => {
      try {
        setLoading(true)
        console.log('Fetching sessions...')
        console.log('VITE_API_URL:', import.meta.env.VITE_API_URL)
        const publishedSessions = await sessionService.getPublishedSessions()
        console.log('Published sessions:', publishedSessions)

        // Filter for upcoming sessions (future start time)
        const now = new Date()
        console.log('Current time:', now)
        const upcomingSessions = publishedSessions
          .filter(session => new Date(session.startTime) > now)
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
          .slice(0, 6) // Show max 6 upcoming sessions

        console.log('Upcoming sessions:', upcomingSessions)
        setSessions(upcomingSessions)
      } catch (err) {
        console.error('Error fetching sessions:', err)
        setError('Failed to load upcoming sessions')
      } finally {
        setLoading(false)
      }
    }

    checkBackendHealth()
    fetchUpcomingSessions()
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Welcome to Leadership Training App</h1>

      <div className={`p-4 mb-6 rounded-lg border ${
        backendHealth.includes('✅')
          ? 'bg-success-50 border-success-200 text-success-800'
          : 'bg-danger-50 border-danger-200 text-danger-800'
      }`}>
        <strong>Backend Status:</strong> {backendHealth}
      </div>

      {/* Upcoming Training Sessions Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-center mb-6">Upcoming Training Sessions</h2>

        {loading ? (
          <div className="text-center text-secondary-600">
            Loading upcoming sessions...
          </div>
        ) : error ? (
          <div className="text-center text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-4">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center text-secondary-600 bg-secondary-50 border border-secondary-200 rounded-lg p-6">
            No upcoming training sessions scheduled at this time.
            <br />
            Check back soon for new sessions!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      <div className="text-center mb-8">
        <Link to="/login">
          <Button variant="default" size="lg">
            Login to Manage Sessions
          </Button>
        </Link>
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4 text-center">Development Status</h3>
        <ul className="max-w-md mx-auto space-y-2 text-sm text-secondary-600">
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Monorepo structure
          </li>
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Docker environment
          </li>
          <li className="flex items-center">
            <span className="text-success-500 mr-2">✅</span>
            Frontend React app
          </li>
          <li className="flex items-center">
            <span className="text-warning-500 mr-2">🔄</span>
            Backend API (in progress)
          </li>
          <li className="flex items-center">
            <span className="text-warning-500 mr-2">🔄</span>
            Database connection
          </li>
          <li className="flex items-center">
            <span className="text-secondary-400 mr-2">⏳</span>
            Authentication
          </li>
        </ul>
      </div>
    </div>
  )
}

export default HomePage