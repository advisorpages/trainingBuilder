import { Session } from '../../../../shared/src/types'
import QrCodeDisplay from './QrCodeDisplay'
import { Button } from '../ui/Button'

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
    <div className="bg-white border border-secondary-200 rounded-lg p-6 mb-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4 gap-4">
        <h3 className="text-xl font-semibold text-secondary-900 leading-tight flex-1">
          {session.title}
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border whitespace-nowrap flex-shrink-0 ${getStatusClasses(session.status)}`}>
          {statusDisplay}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="font-semibold text-secondary-900">{date}</div>
          <div className="text-secondary-600">{time}</div>
        </div>

        <div className="flex gap-2">
          <span className="font-medium text-secondary-600 min-w-[70px] text-sm">Location:</span>
          <span className="text-secondary-900 text-sm">
            {session.location?.name || 'TBD'}
          </span>
        </div>

        <div className="flex gap-2">
          <span className="font-medium text-secondary-600 min-w-[70px] text-sm">Trainer:</span>
          <span className="text-secondary-900 text-sm">
            {session.trainer?.name || 'TBD'}
          </span>
        </div>
      </div>

      {session.description && (
        <div className="text-secondary-600 leading-relaxed mb-6 text-sm">
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

      <div className="flex justify-end pt-4 border-t border-secondary-100">
        <a href={`/sessions/${session.id}`} className="inline-block">
          <Button
            variant="primary"
            size="sm"
            aria-label={`View details for ${session.title}`}
          >
            View Details
          </Button>
        </a>
      </div>
    </div>
  )
}

export default SessionCard