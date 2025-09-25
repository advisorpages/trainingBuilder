import { Session } from '@leadership-training/shared'
import './SessionContent.css'

interface SessionContentProps {
  session: Session
}

const SessionContent = ({ session }: SessionContentProps) => {
  const formatDuration = (startTime: Date | string, endTime: Date | string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0 && minutes > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`
    }
  }

  const parseAIContent = (aiGeneratedContent?: string | Record<string, any> | null) => {
    if (!aiGeneratedContent) return null

    if (typeof aiGeneratedContent === 'string') {
      try {
        const content = JSON.parse(aiGeneratedContent)
        return content
      } catch {
        // If it's not JSON, treat as plain text
        return { description: aiGeneratedContent }
      }
    }

    return aiGeneratedContent
  }

  const aiContent = parseAIContent(session.aiGeneratedContent)
  const duration = formatDuration(session.startTime, session.endTime)

  return (
    <div className="session-content">
      <div className="content-container">

        {/* Session Overview */}
        <section className="content-section overview-section">
          <h2>Session Overview</h2>
          <div className="overview-grid">
            <div className="overview-item">
              <h4>Duration</h4>
              <p>{duration}</p>
            </div>
            <div className="overview-item">
              <h4>Format</h4>
              <p>In-person training session</p>
            </div>
            {session.maxRegistrations && (
              <div className="overview-item">
                <h4>Capacity</h4>
                <p>Up to {session.maxRegistrations} participants</p>
              </div>
            )}
            {session.audience && (
              <div className="overview-item">
                <h4>Target Audience</h4>
                <p>{session.audience.name}</p>
              </div>
            )}
          </div>
        </section>

        {/* AI-Generated Content Sections */}
        {aiContent && (
          <>
            {aiContent.whoIsThisFor && (
              <section className="content-section">
                <h2>Who Is This For?</h2>
                <div className="content-text">
                  {typeof aiContent.whoIsThisFor === 'string' ? (
                    <p>{aiContent.whoIsThisFor}</p>
                  ) : (
                    aiContent.whoIsThisFor.map((item: string, index: number) => (
                      <p key={index}>{item}</p>
                    ))
                  )}
                </div>
              </section>
            )}

            {aiContent.whyAttend && (
              <section className="content-section">
                <h2>Why Attend?</h2>
                <div className="content-text">
                  {typeof aiContent.whyAttend === 'string' ? (
                    <p>{aiContent.whyAttend}</p>
                  ) : (
                    <ul>
                      {aiContent.whyAttend.map((benefit: string, index: number) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {aiContent.topicsAndBenefits && (
              <section className="content-section">
                <h2>Topics & Benefits</h2>
                <div className="content-text">
                  {typeof aiContent.topicsAndBenefits === 'string' ? (
                    <p>{aiContent.topicsAndBenefits}</p>
                  ) : (
                    <ul>
                      {aiContent.topicsAndBenefits.map((topic: string, index: number) => (
                        <li key={index}>{topic}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {/* Topics Section (from database relations) */}
        {session.topics && session.topics.length > 0 && (
          <section className="content-section">
            <h2>Key Topics</h2>
            <div className="topics-grid">
              {session.topics.map((topic) => (
                <div key={topic.id} className="topic-item">
                  <h4>{topic.name}</h4>
                  {topic.description && <p>{topic.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trainer Information */}
        {session.trainer && (
          <section className="content-section trainer-section">
            <h2>About Your Trainer</h2>
            <div className="trainer-info">
              <div className="trainer-header">
                <h3>{session.trainer.name}</h3>
                {session.trainer.expertise && (
                  <p className="trainer-expertise">{session.trainer.expertise}</p>
                )}
              </div>
              {session.trainer.bio && (
                <div className="trainer-bio">
                  <p>{session.trainer.bio}</p>
                </div>
              )}
              {session.trainer.email && (
                <div className="trainer-contact">
                  <p>
                    <strong>Contact:</strong>{' '}
                    <a href={`mailto:${session.trainer.email}`}>
                      {session.trainer.email}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Call to Action Section */}
        {aiContent?.callToAction && (
          <section className="content-section cta-section">
            <div className="cta-content">
              <h2>Ready to Transform Your Leadership?</h2>
              <p>{aiContent.callToAction}</p>
              <div className="cta-buttons">
                <a href="#registration" className="btn btn-primary btn-large">
                  Register Now
                </a>
                <a href="/" className="btn btn-secondary">
                  View All Sessions
                </a>
              </div>
            </div>
          </section>
        )}

        {/* Default description fallback */}
        {!aiContent && session.description && (
          <section className="content-section">
            <h2>About This Session</h2>
            <div className="content-text">
              <p>{session.description}</p>
            </div>
          </section>
        )}

        {/* Category Information */}
        {session.category && (
          <section className="content-section category-section">
            <div className="category-info">
              <span className="category-label">Category:</span>
              <span className="category-name">{session.category.name}</span>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default SessionContent
