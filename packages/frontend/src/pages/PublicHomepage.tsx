import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Session, Incentive } from '@leadership-training/shared'
import { sessionService } from '../services/session.service'
import { incentiveService } from '../services/incentive.service'
import SessionCard from '../components/sessions/SessionCard'
import IncentiveCard from '../components/incentives/IncentiveCard'
import { useAuth } from '../contexts/AuthContext'
import './PublicHomepage.css'

const PublicHomepage = () => {
  const { user, isAuthenticated } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [incentives, setIncentives] = useState<Incentive[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to get the appropriate dashboard route
  const getDashboardRoute = () => {
    if (!user) return '/dashboard'
    const roleKey = user.role?.key ?? ''
    return roleKey === 'trainer' ? '/trainer/dashboard' : '/dashboard'
  }

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
    <div className="public-homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="header-content">
          <h1 className="brand-title">Leadership Training</h1>
          <nav className="header-nav">
            {isAuthenticated ? (
              <Link to={getDashboardRoute()} className="btn btn-outline">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2 className="hero-title">
            Develop Your Leadership Skills
          </h2>
          <p className="hero-subtitle">
            Join our expert-led training sessions designed to enhance your leadership capabilities and drive organizational success.
          </p>
        </div>
      </section>

      {/* Incentives Section */}
      {!loading && !error && incentives.length > 0 && (
        <section className="incentives-section" aria-labelledby="incentives-heading">
          <div className="incentives-content">
            <h3 id="incentives-heading" className="section-title incentives-title">
              🎁 Special Incentives & Offers
            </h3>
            <div className="incentives-grid" role="list">
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
      <section className="sessions-section" aria-labelledby="sessions-heading">
        <div className="sessions-content">
          <h3 id="sessions-heading" className="section-title">
            Upcoming Training Sessions
          </h3>

          {loading && (
            <div className="loading-state" role="status" aria-live="polite">
              <div className="loading-spinner" aria-hidden="true"></div>
              <p>Loading content...</p>
            </div>
          )}

          {error && (
            <div className="error-state" role="alert">
              <p className="error-message">{error}</p>
              <button
                className="btn btn-secondary"
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
                <div className="sessions-grid" role="list">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} role="listitem">
                      <SessionCard session={session} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h4>No upcoming sessions available</h4>
                  <p>Check back soon for new training opportunities!</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="footer-content">
          <p>&copy; 2024 Leadership Training App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default PublicHomepage