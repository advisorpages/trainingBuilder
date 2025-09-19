import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Session, Incentive } from '../../../shared/src/types'
import { sessionService } from '../services/session.service'
import { incentiveService } from '../services/incentive.service'

interface BasicStats {
  totalPublishedSessions: number
  upcomingSessions: number
  activeIncentives: number
  pastSessions: number
}

const BrokerReportsPage = () => {
  const [stats, setStats] = useState<BasicStats>({
    totalPublishedSessions: 0,
    upcomingSessions: 0,
    activeIncentives: 0,
    pastSessions: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBasicStats = async () => {
      try {
        setLoading(true)

        // Fetch both sessions and incentives
        const [publishedSessions, activeIncentives] = await Promise.all([
          sessionService.getPublishedSessions(),
          incentiveService.getActiveIncentives()
        ])

        const now = new Date()

        // Calculate stats
        const upcomingSessions = publishedSessions.filter(session =>
          new Date(session.startTime) >= now
        ).length

        const pastSessions = publishedSessions.filter(session =>
          new Date(session.startTime) < now
        ).length

        setStats({
          totalPublishedSessions: publishedSessions.length,
          upcomingSessions,
          pastSessions,
          activeIncentives: activeIncentives.length
        })
      } catch (err) {
        console.error('Error fetching basic stats:', err)
        setError('Unable to load reports. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchBasicStats()
  }, [])

  const StatCard = ({ title, value, icon, description }: {
    title: string
    value: number
    icon: string
    description: string
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Basic Reports</h2>
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
            <span className="ml-3 text-gray-600">Loading reports...</span>
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
            {/* Statistics Grid */}
            <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Published Sessions"
                value={stats.totalPublishedSessions}
                icon="📚"
                description="All published training sessions"
              />
              <StatCard
                title="Upcoming Sessions"
                value={stats.upcomingSessions}
                icon="📅"
                description="Sessions scheduled for the future"
              />
              <StatCard
                title="Past Sessions"
                value={stats.pastSessions}
                icon="📋"
                description="Completed training sessions"
              />
              <StatCard
                title="Active Incentives"
                value={stats.activeIncentives}
                icon="🎯"
                description="Currently available offers"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Link
                  to="/broker/sessions"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl mr-3">📚</span>
                  <div>
                    <h4 className="font-medium">View All Sessions</h4>
                    <p className="text-sm text-gray-600">Browse published training sessions</p>
                  </div>
                </Link>
                <Link
                  to="/broker/incentives"
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h4 className="font-medium">View All Incentives</h4>
                    <p className="text-sm text-gray-600">Browse available incentives and offers</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-900 mb-2">About These Reports</h3>
              <p className="text-blue-700">
                These basic reports provide an overview of the training content available to you.
                For more detailed analytics and reporting, please contact your system administrator.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BrokerReportsPage