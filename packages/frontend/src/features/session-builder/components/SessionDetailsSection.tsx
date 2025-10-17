import * as React from 'react';
import { Button } from '../../../ui';
import { SessionMetadata, SessionTopicDraft } from '../state/types';
import { cn } from '../../../lib/utils';

interface SessionDetailsSectionProps {
  metadata: SessionMetadata;
  topics: SessionTopicDraft[];
  onUpdateMetadata: (updates: Partial<SessionMetadata>) => void;
}

// Helper functions for date/time handling
const toDateInputValue = (value: string) => value.slice(0, 10);

const timeSegment = (value: string) => {
  if (!value) return '09:00';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '09:00';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  const segment = adjusted.toISOString().slice(0, 16);
  return segment.split('T')[1] || '09:00';
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return date.toISOString();
};

const getDurationLabel = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Duration TBD';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainder} min`;
};

export const SessionDetailsSection: React.FC<SessionDetailsSectionProps> = ({
  metadata,
  topics,
  onUpdateMetadata,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState<Partial<SessionMetadata>>({});

  // Calculate total duration from topics
  const totalDurationMinutes = React.useMemo(() => {
    if (!topics || topics.length === 0) return 0;
    return topics.reduce((sum, topic) => sum + (topic.durationMinutes || 0), 0);
  }, [topics]);

  // Initialize edit data when entering edit mode
  const handleStartEdit = () => {
    setEditData({
      title: metadata.title,
      desiredOutcome: metadata.desiredOutcome,
      startDate: metadata.startDate,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    if (editData.title !== undefined ||
        editData.desiredOutcome !== undefined ||
        editData.startDate !== undefined ||
        editData.startTime !== undefined ||
        editData.endTime !== undefined) {
      onUpdateMetadata(editData);
    }
    setIsEditing(false);
    setEditData({});
  };

  const handleFieldChange = (field: keyof SessionMetadata, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (newDate: string) => {
    const currentStartTime = timeSegment(editData.startTime || metadata.startTime);
    const currentEndTime = timeSegment(editData.endTime || metadata.endTime);

    setEditData(prev => ({
      ...prev,
      startDate: newDate,
      startTime: fromDateTimeLocal(`${newDate}T${currentStartTime}`),
      endTime: fromDateTimeLocal(`${newDate}T${currentEndTime}`)
    }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', newTime: string) => {
    const currentDate = editData.startDate || metadata.startDate;
    setEditData(prev => ({
      ...prev,
      [field]: fromDateTimeLocal(`${currentDate}T${newTime}`)
    }));
  };

  // Format display values with improved error handling
  const formatDateDisplay = (dateValue?: string): string => {
    if (!dateValue) {
      return 'Date TBD';
    }

    try {
      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) {
        // If direct parsing fails, try parsing as ISO date
        const isoDate = new Date(dateValue.includes('T') ? dateValue : `${dateValue}T00:00:00`);
        if (Number.isNaN(isoDate.getTime())) {
          return 'Date TBD';
        }
        return isoDate.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('[SessionDetailsSection] Error formatting date:', { dateValue, error });
      return 'Date TBD';
    }
  };

  const formatTimeDisplay = (timeValue?: string): string => {
    if (!timeValue) {
      return 'Time TBD';
    }

    try {
      const time = new Date(timeValue);
      if (Number.isNaN(time.getTime())) {
        return 'Time TBD';
      }

      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('[SessionDetailsSection] Error formatting time:', { timeValue, error });
      return 'Time TBD';
    }
  };

  const displayDate = formatDateDisplay(metadata.startDate || metadata.startTime);
  const displayStartTime = formatTimeDisplay(metadata.startTime);
  const displayEndTime = formatTimeDisplay(metadata.endTime);

  // Only log when we have TBD values to debug the issue
  if (displayDate === 'Date TBD' || displayStartTime === 'Time TBD' || displayEndTime === 'Time TBD') {
    console.log('[SessionDetailsSection] TBD Values detected:', {
      startDate: metadata.startDate,
      startTime: metadata.startTime,
      endTime: metadata.endTime,
      displayDate,
      displayStartTime,
      displayEndTime
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Session Details</h2>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="text-slate-600 hover:text-slate-900"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.364 5.636a2 2 0 000-2.828l-1.172-1.172a2 2 0 00-2.828 0L7 9v4h4l7.364-7.364z" />
            </svg>
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Title */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Session Title
              </label>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter session title"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                value={editData.desiredOutcome || ''}
                onChange={(e) => handleFieldChange('desiredOutcome', e.target.value)}
                className="min-h-[80px] w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe what participants will be able to do after this session"
                rows={3}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={toDateInputValue(editData.startDate || metadata.startDate)}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Start Time
              </label>
              <input
                type="time"
                value={timeSegment(editData.startTime || metadata.startTime)}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                End Time
              </label>
              <input
                type="time"
                value={timeSegment(editData.endTime || metadata.endTime)}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              onClick={handleCancelEdit}
              className="text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Title */}
            <div className="sm:col-span-2">
              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {metadata.title || 'Untitled Session'}
              </h3>
              {metadata.desiredOutcome && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {metadata.desiredOutcome}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">Date:</span>
                <span>{displayDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 ml-6">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Time:</span>
                <span>{displayStartTime} - {displayEndTime}</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Location:</span>
                <span>{metadata.location || 'Location TBD'}</span>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Duration:</span>
                <span>{getDurationLabel(totalDurationMinutes)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};