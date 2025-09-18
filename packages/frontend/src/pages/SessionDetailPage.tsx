import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Session } from '../../../shared/src/types'
import { sessionService } from '../services/session.service'
import RegistrationForm from '../components/RegistrationForm'
import SessionContent from '../components/SessionContent'
import './SessionDetailPage.css'

const SessionDetailPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID not provided')
      setLoading(false)
      return
    }

    const fetchSession = async () => {
      try {
        setLoading(true)
        const sessionData = await sessionService.getPublicSession(sessionId)
        setSession(sessionData)

        // Set dynamic page title and meta tags
        document.title = `${sessionData.title} - Leadership Training`

        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]')
        if (!metaDescription) {
          metaDescription = document.createElement('meta')
          metaDescription.setAttribute('name', 'description')
          document.head.appendChild(metaDescription)
        }
        const description = sessionData.description || `Join ${sessionData.title} - A leadership training session`
        metaDescription.setAttribute('content', description.substring(0, 155))

        // Open Graph meta tags for social sharing
        updateOrCreateMetaTag('property', 'og:title', sessionData.title)
        updateOrCreateMetaTag('property', 'og:description', description.substring(0, 155))
        updateOrCreateMetaTag('property', 'og:type', 'event')
        updateOrCreateMetaTag('property', 'og:url', window.location.href)

        // Twitter Card meta tags
        updateOrCreateMetaTag('name', 'twitter:card', 'summary_large_image')
        updateOrCreateMetaTag('name', 'twitter:title', sessionData.title)
        updateOrCreateMetaTag('name', 'twitter:description', description.substring(0, 155))

        // Add structured data (JSON-LD) for events
        addStructuredData(sessionData)

      } catch (err: any) {
        console.error('Error fetching session:', err)
        if (err.response?.status === 404) {
          setError('Session not found')
        } else {
          setError('Unable to load session details. Please try again later.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const updateOrCreateMetaTag = (attribute: string, name: string, content: string) => {
    let meta = document.querySelector(`meta[${attribute}="${name}"]`)
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute(attribute, name)
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', content)
  }

  const addStructuredData = (sessionData: Session) => {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]')
    if (existingScript) {
      existingScript.remove()
    }

    const structuredData: any = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": sessionData.title,
      "description": sessionData.description || `Leadership training session: ${sessionData.title}`,
      "startDate": new Date(sessionData.startTime).toISOString(),
      "endDate": new Date(sessionData.endTime).toISOString(),
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "organizer": {
        "@type": "Organization",
        "name": "Leadership Training App"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
        "url": window.location.href
      }
    }

    if (sessionData.location) {
      structuredData.location = {
        "@type": "Place",
        "name": sessionData.location.name,
        "address": sessionData.location.address || sessionData.location.name
      }
    }

    if (sessionData.trainer) {
      structuredData.performer = {
        "@type": "Person",
        "name": sessionData.trainer.name,
        "description": sessionData.trainer.bio || `Trainer: ${sessionData.trainer.name}`
      }
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }

  const formatDateTime = (dateTime: Date) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const isRegistrationAvailable = (session: Session) => {
    return session.status === 'published' && new Date(session.startTime) > new Date()
  }

  if (loading) {
    return (
      <div className="session-detail-page">
        <div className="loading-container">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading session details...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="session-detail-page">
        <div className="error-container">
          <h1>Session Not Available</h1>
          <p className="error-message">{error || 'Session not found'}</p>
          <Link to="/" className="btn btn-primary">
            Back to Homepage
          </Link>
        </div>
      </div>
    )
  }

  const { date, time } = formatDateTime(session.startTime)
  const registrationAvailable = isRegistrationAvailable(session)

  return (
    <div className="session-detail-page">
      {/* Header */}
      <header className="session-header">
        <div className="header-content">
          <Link to="/" className="back-link">
            ← Back to Sessions
          </Link>
          <h1 className="brand-title">Leadership Training</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="session-title">{session.title}</h1>
            <p className="session-subtitle">
              {session.description || 'Join this leadership training session to enhance your professional development.'}
            </p>

            <div className="session-meta">
              <div className="meta-item">
                <strong>Date:</strong> {date}
              </div>
              <div className="meta-item">
                <strong>Time:</strong> {time}
              </div>
              {session.location && (
                <div className="meta-item">
                  <strong>Location:</strong> {session.location.name}
                  {session.location.address && (
                    <span className="location-address">, {session.location.address}</span>
                  )}
                </div>
              )}
              {session.trainer && (
                <div className="meta-item">
                  <strong>Trainer:</strong> {session.trainer.name}
                </div>
              )}
            </div>
          </div>

          {registrationAvailable && (
            <div className="hero-form" id="registration">
              <RegistrationForm
                sessionId={session.id}
                onRegistrationSuccess={() => {
                  // Could add success handling here
                }}
              />
            </div>
          )}

          {!registrationAvailable && (
            <div className="registration-unavailable">
              <div className="unavailable-message">
                {session.status === 'completed' && 'This session has been completed'}
                {session.status === 'cancelled' && 'This session has been cancelled'}
                {session.status === 'published' && new Date(session.startTime) <= new Date() && 'Registration is no longer available'}
                {session.status !== 'published' && 'Registration is not currently available'}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Session Content */}
      <SessionContent session={session} />

      {/* Footer */}
      <footer className="session-footer">
        <div className="footer-content">
          <p>&copy; 2024 Leadership Training App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default SessionDetailPage