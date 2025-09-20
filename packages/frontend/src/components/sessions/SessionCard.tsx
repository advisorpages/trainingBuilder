import { Session } from '../../../../shared/src/types'
import QrCodeDisplay from './QrCodeDisplay'
import { Button } from '../ui/Button'
import './SessionCard.css'

interface SessionCardProps {
  session: Session
}

const SessionCard = ({ session }: SessionCardProps) => {
  const formatDateTime = (dateTime: Date) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'published':
        return 'Available'
      case 'completed':
        return 'Completed'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Available'
    }
  }

  const { date, time } = formatDateTime(session.startTime)
  const statusDisplay = getStatusDisplay(session.status)

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-success-50 text-success-700 border-success-200'
      case 'completed':
        return 'bg-secondary-50 text-secondary-600 border-secondary-200'
      case 'cancelled':
        return 'bg-danger-50 text-danger-700 border-danger-200'
      default:
        return 'bg-success-50 text-success-700 border-success-200'
    }
  }

  return (
    <div className="session-card">
      <div className="session-card-header">
        <h3 className="session-title">
          {session.title}
        </h3>
        <span className={`session-status ${session.status}`}>
          {statusDisplay}
        </span>
      </div>

      <div className="session-details">
        <div className="session-datetime">
          <div className="session-date">{date}</div>
          <div className="session-time">{time}</div>
        </div>

        <div className="session-location">
          <span className="detail-label">Location:</span>
          <span className="detail-value">
            {session.location?.name || 'TBD'}
          </span>
        </div>

        <div className="session-trainer">
          <span className="detail-label">Trainer:</span>
          <span className="detail-value">
            {session.trainer?.name || 'TBD'}
          </span>
        </div>
      </div>

      {session.description && (
        <div className="session-description">
          {session.description.length > 150
            ? `${session.description.substring(0, 150)}...`
            : session.description
          }
        </div>
      )}

      {/* QR Code display for published sessions */}
      {session.status === 'published' && (
        <div className="mt-3 pt-3 border-t border-secondary-200">
          <QrCodeDisplay
            qrCodeUrl={session.qrCodeUrl}
            sessionId={session.id}
            sessionTitle={session.title}
            size="small"
            showLabel={true}
            allowCopy={true}
            allowDownload={true}
          />
        </div>
      )}

      <div className="session-card-footer">
        <a href={`/sessions/${session.id}`} className="session-details-link btn btn-primary">
          View Details
        </a>
      </div>
    </div>
  )
}

export default SessionCard