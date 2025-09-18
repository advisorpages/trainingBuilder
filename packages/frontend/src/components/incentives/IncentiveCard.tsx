import { Incentive } from '../../../../shared/src/types'
import './IncentiveCard.css'

interface IncentiveCardProps {
  incentive: Incentive
}

const IncentiveCard = ({ incentive }: IncentiveCardProps) => {
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

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date()
    const end = new Date(endDate)
    const timeDiff = end.getTime() - now.getTime()

    if (timeDiff <= 0) {
      return 'Expired'
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 7) {
      return `${days} days remaining`
    } else if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`
    } else {
      return 'Expires soon'
    }
  }

  const getUrgencyClass = (endDate: Date) => {
    const now = new Date()
    const end = new Date(endDate)
    const timeDiff = end.getTime() - now.getTime()
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))

    if (days <= 1) return 'urgent'
    if (days <= 3) return 'warning'
    return 'normal'
  }

  const { date: startDate } = formatDateTime(incentive.startDate)
  const { date: endDate } = formatDateTime(incentive.endDate)
  const timeRemaining = getTimeRemaining(incentive.endDate)
  const urgencyClass = getUrgencyClass(incentive.endDate)

  return (
    <div className="incentive-card">
      <div className="incentive-badge">
        <span>🎁 Special Incentive</span>
      </div>

      <div className="incentive-card-header">
        <h3 className="incentive-title">{incentive.title}</h3>
        <span className={`incentive-urgency ${urgencyClass}`}>
          {timeRemaining}
        </span>
      </div>

      <div className="incentive-details">
        <div className="incentive-dates">
          <div className="incentive-date-item">
            <span className="date-label">Starts:</span>
            <span className="date-value">{startDate}</span>
          </div>
          <div className="incentive-date-item">
            <span className="date-label">Ends:</span>
            <span className="date-value">{endDate}</span>
          </div>
        </div>
      </div>

      {incentive.description && (
        <div className="incentive-description">
          {incentive.description.length > 120
            ? `${incentive.description.substring(0, 120)}...`
            : incentive.description
          }
        </div>
      )}

      {incentive.rules && (
        <div className="incentive-rules">
          <strong>Rules:</strong> {incentive.rules.length > 100
            ? `${incentive.rules.substring(0, 100)}...`
            : incentive.rules
          }
        </div>
      )}

      <div className="incentive-card-footer">
        <button
          className="btn btn-incentive"
          aria-label={`Learn more about ${incentive.title}`}
        >
          Learn More
        </button>
      </div>
    </div>
  )
}

export default IncentiveCard