import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Session } from '../../../shared/src/types'
import { sessionService } from '../services/session.service'
import SessionCard from '../components/sessions/SessionCard'

const BrokerSessionsPage = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPublishedSessions = async () => {
      try {
        setLoading(true)
        const publishedSessions = await sessionService.getPublishedSessions()

        // Sort sessions by upcoming date (earliest first)
        const sortedSessions = publishedSessions.sort((a, b) => {
          const dateA = new Date(a.startTime).getTime()
          const dateB = new Date(b.startTime).getTime()
          return dateA - dateB
        })

        setSessions(sortedSessions)
      } catch (err) {
        console.error('Error fetching published sessions:', err)
        setError('Unable to load published sessions. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedSessions()
  }, [])

  const upcomingSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    const now = new Date()
    return sessionDate >= now
  })

  const pastSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    const now = new Date()
    return sessionDate < now
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Published Training Sessions</h2>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Back to Dashboard
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading sessions...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
            <p>{error}</p>
            <button
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Upcoming Sessions */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Upcoming Sessions</h3>
              {upcomingSessions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No upcoming sessions</h4>
                  <p className="text-gray-600">Check back soon for new training opportunities!</p>
                </div>
              )}
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">Past Sessions</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BrokerSessionsPage