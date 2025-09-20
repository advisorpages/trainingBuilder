import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Session, Incentive } from '@leadership-training/shared'
import { sessionService } from '../services/session.service'
import { incentiveService } from '../services/incentive.service'
import SessionCard from '../components/sessions/SessionCard'
import IncentiveCard from '../components/incentives/IncentiveCard'

const PublicHomepage = () => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set page title and meta tags for SEO
    document.title = 'Leadership Training - Professional Development Sessions'

    // Create or update meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', 'Join expert-led leadership training sessions designed to enhance your leadership capabilities and drive organizational success. Discover upcoming sessions and register today.')

    // Create or update meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]')
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta')
      metaKeywords.setAttribute('name', 'keywords')
      document.head.appendChild(metaKeywords)
    }
    metaKeywords.setAttribute('content', 'leadership training, professional development, leadership skills, management training, executive coaching')

    const fetchPublishedContent = async () => {
      try {
        setLoading(true)

        // Fetch both sessions and incentives in parallel
        const [publishedSessions, activeIncentives] = await Promise.all([
          sessionService.getPublishedSessions(),
          incentiveService.getActiveIncentives()
        ])

        // Sort sessions by upcoming date (earliest first)
        const sortedSessions = publishedSessions.sort((a, b) => {
          const dateA = new Date(a.startTime).getTime()
          const dateB = new Date(b.startTime).getTime()
          return dateA - dateB
        })

        // Sort incentives by end date (expiring soon first)
        const sortedIncentives = activeIncentives.sort((a, b) => {
          const dateA = new Date(a.endDate).getTime()
          const dateB = new Date(b.endDate).getTime()
          return dateA - dateB
        })

        setSessions(sortedSessions)
        setIncentives(sortedIncentives)
      } catch (err) {
        console.error('Error fetching content:', err)
        setError('Unable to load content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedContent()
  }, [])

  const upcomingSessions = sessions.filter(session => {
    const sessionDate = new Date(session.startTime)
    const now = new Date()
    return sessionDate >= now
  })

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Leadership Training</h1>
          <nav>
            <Link to="/login" className="inline-flex items-center px-4 py-2 border-2 border-slate-800 text-slate-800 rounded-md hover:bg-slate-800 hover:text-white">
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-4xl font-bold leading-tight">Develop Your Leadership Skills</h2>
          <p className="text-lg opacity-90 mt-2">
            Join our expert-led training sessions designed to enhance your leadership capabilities and drive organizational success.
          </p>
        </div>
      </section>

      {/* Incentives Section */}
      {!loading && !error && incentives.length > 0 && (
        <section className="py-8 bg-gradient-to-br from-red-50 to-amber-50 border-b-4 border-red-600" aria-labelledby="incentives-heading">
          <div className="max-w-7xl mx-auto px-4">
            <h3 id="incentives-heading" className="text-2xl font-bold text-red-600 text-center mb-8">
              🎁 Special Incentives & Offers
            </h3>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3" role="list">
              {incentives.map((incentive) => (
                <div key={incentive.id} role="listitem">
                  <IncentiveCard incentive={incentive} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sessions Section */}
      <section className="flex-1 py-12" aria-labelledby="sessions-heading">
        <div className="max-w-7xl mx-auto px-4">
          <h3 id="sessions-heading" className="text-3xl font-semibold text-slate-800 text-center mb-8">
            Upcoming Training Sessions
          </h3>

          {loading && (
            <div className="text-center py-12" role="status" aria-live="polite">
              <div className="h-10 w-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" aria-hidden="true"></div>
              <p>Loading content...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12" role="alert">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={() => window.location.reload()}
                aria-label="Reload page to try loading content again"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {upcomingSessions.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2" role="list">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} role="listitem">
                      <SessionCard session={session} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <h4 className="text-xl text-slate-800 mb-2">No upcoming sessions available</h4>
                  <p>Check back soon for new training opportunities!</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Leadership Training App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicHomepage
