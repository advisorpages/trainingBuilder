import * as React from 'react';
import { Input, Card, CardContent, CardHeader, CardTitle, Button } from '../../../ui';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';
import { CategorySelect } from '@/components/ui/CategorySelect';
import { LocationSelect } from '@/components/ui/LocationSelect';
import { AudienceSelect } from '@/components/ui/AudienceSelect';
import { ToneSelect } from '@/components/ui/ToneSelect';

interface SessionMetadataFormProps {
  metadata: SessionMetadata;
  onChange: (updates: Partial<SessionMetadata>) => void;
}

const sessionTypes: SessionMetadata['sessionType'][] = [
  'workshop',
  'training',
  'event',
  'webinar',
];

const toDateInputValue = (value: string) => value.slice(0, 10);

const toDateTimeLocal = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
};

const fromDateTimeLocal = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return date.toISOString();
};

const timeSegment = (value: string) => {
  const local = toDateTimeLocal(value);
  if (!local) return '09:00';
  const segment = local.split('T')[1];
  return segment || '09:00';
};

// Generate static test data for development
const generateTestData = (): SessionMetadata => {
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(9, 0, 0, 0); // 9:00 AM
  const endTime = new Date(today);
  endTime.setHours(12, 0, 0, 0); // 12:00 PM (3 hours)

  return {
    title: 'Effective Leadership Through Change',
    sessionType: 'workshop',
    category: 'Leadership',
    categoryId: 1,
    desiredOutcome: 'Participants will be able to lead their teams through organizational change with confidence and clear communication strategies',
    currentProblem: 'Managers struggle to maintain team morale and productivity during periods of uncertainty and organizational transitions',
    specificTopics: 'Change management frameworks, transparent communication, building psychological safety, managing resistance',
    startDate: today.toISOString().slice(0, 10),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    timezone: 'America/New_York',
    location: 'Main Conference Room',
    locationId: 1,
    audienceId: 1,
    audienceName: 'Mid-level Managers',
    toneId: 1,
    toneName: 'Professional',
  };
};


// Field validation helper
const getFieldValidation = (
  field: keyof SessionMetadata,
  value: SessionMetadata[keyof SessionMetadata],
) => {
  const requiredFields: (keyof SessionMetadata)[] = ['desiredOutcome', 'categoryId', 'sessionType', 'locationId'];
  const isRequired = requiredFields.includes(field);
  const isEmpty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '') ||
    (typeof value === 'number' && Number.isNaN(value));

  return {
    isRequired,
    isEmpty,
    isValid: !isRequired || !isEmpty,
    errorMessage: isRequired && isEmpty ? `${field} is required` : '',
  };
};

export const SessionMetadataForm: React.FC<SessionMetadataFormProps> = ({
  metadata,
  onChange,
}) => {
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const handleStringChange = (field: keyof SessionMetadata) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      onChange({ [field]: value } as Partial<SessionMetadata>);

      // Clear error when user starts typing
      if (fieldErrors[field]) {
        setFieldErrors(prev => ({ ...prev, [field]: '' }));
      }
    };


  const handleFillTestData = () => {
    const testData = generateTestData();
    onChange(testData);
  };

  return (
    <div className="space-y-6">
      {/* Development Test Data Button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleFillTestData}
            variant="outline"
            size="sm"
            className="bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 hover:border-purple-400"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Fill Test Data
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Session Setup</h2>
        <p className="text-sm text-slate-600">
          Configure your session details for a tailored outline
        </p>
      </div>

      {/* Session Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Session Configuration
            <span className="text-red-500 ml-1">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Audience */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Target Audience
              </label>
              <AudienceSelect
                value={metadata.audienceId ?? ''}
                selectedLabel={metadata.audienceName}
                onChange={(audience) => {
                  onChange({
                    audienceId: audience?.id ?? undefined,
                    audienceName: audience?.name ?? undefined,
                  });
                }}
              />
              <p className="text-xs text-slate-500">
                Optional — tailor prompts for a specific learner group
              </p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="session-category" className="text-sm font-medium text-slate-700">
                Category <span className="text-red-500">*</span>
              </label>
              <CategorySelect
                value={metadata.categoryId ?? ''}
                selectedLabel={metadata.category}
                onChange={(categoryId) => {
                  if (!categoryId) {
                    onChange({ categoryId: undefined, category: '' });
                    if (fieldErrors.categoryId) {
                      setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                    }
                  }
                }}
                onCategoryChange={(category) => {
                  onChange({
                    categoryId: category?.id ?? undefined,
                    category: category?.name ?? '',
                  });
                  if (fieldErrors.categoryId) {
                    setFieldErrors(prev => ({ ...prev, categoryId: '' }));
                  }
                }}
                placeholder="Select or create category..."
                className={cn(
                  fieldErrors.categoryId && 'border-red-500 focus:border-red-500'
                )}
                allowCreate={true}
                required={true}
                onError={(error) => console.error('Category error:', error)}
              />
              {fieldErrors.categoryId && (
                <p className="text-xs text-red-600">{fieldErrors.categoryId}</p>
              )}
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <label htmlFor="session-type" className="text-sm font-medium text-slate-700">
                Session Type <span className="text-red-500">*</span>
              </label>
              <select
                id="session-type"
                className={cn(
                  'h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  fieldErrors.sessionType && 'border-red-500 focus:border-red-500'
                )}
                value={metadata.sessionType}
                onChange={(event) => onChange({ sessionType: event.target.value as SessionMetadata['sessionType'] })}
              >
                {sessionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {fieldErrors.sessionType && (
                <p className="text-xs text-red-600">{fieldErrors.sessionType}</p>
              )}
            </div>

            {/* Desired Outcome */}
            <div className="space-y-2">
              <label htmlFor="session-desired-outcome" className="text-sm font-medium text-slate-700">
                Desired Outcome <span className="text-red-500">*</span>
              </label>
              <textarea
                id="session-desired-outcome"
                className={cn(
                  'min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
                  fieldErrors.desiredOutcome && 'border-red-500 focus:border-red-500'
                )}
                value={metadata.desiredOutcome}
                placeholder="What should participants be able to do after this session?"
                onChange={handleStringChange('desiredOutcome')}
                rows={3}
              />
              {fieldErrors.desiredOutcome && (
                <p className="text-xs text-red-600">{fieldErrors.desiredOutcome}</p>
              )}
              <p className="text-xs text-slate-500">
                Be specific about the skills, behaviors, or knowledge participants will gain
              </p>
            </div>

            {/* Current Problem or Challenge */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Current Problem or Challenge
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={metadata.currentProblem}
                placeholder="What specific challenge or problem does this session address?"
                onChange={handleStringChange('currentProblem')}
                rows={3}
              />
              <p className="text-xs text-slate-500">
                Describe the current situation that needs improvement (optional but recommended)
              </p>
            </div>

            {/* Specific Topics to Cover */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700">
                Specific Topics to Cover
              </label>
              <textarea
                className="min-h-[60px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={metadata.specificTopics}
                placeholder="List key topics, frameworks, or skills to include"
                onChange={handleStringChange('specificTopics')}
                rows={2}
              />
              <p className="text-xs text-slate-500">
                Comma-separated list of topics, frameworks, or specific areas to focus on
              </p>
            </div>

            {/* Session Tone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Session Tone
              </label>
              <ToneSelect
                value={metadata.toneId ?? ''}
                selectedLabel={metadata.toneName}
                onChange={(tone) => {
                  onChange({
                    toneId: tone?.id ?? undefined,
                    toneName: tone?.name ?? undefined,
                  });
                }}
              />
              <p className="text-xs text-slate-500">
                Optional — guide AI copy toward the right voice
              </p>
            </div>

            {/* Session Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Session Location <span className="text-red-500">*</span>
              </label>
              <LocationSelect
                value={metadata.locationId ?? ''}
                selectedLabel={metadata.location}
                data-testid="location-select"
                onChange={(location) => {
                  onChange({
                    locationId: location?.id ?? undefined,
                    location: location?.name ?? '',
                    locationType: location?.locationType ?? undefined,
                    meetingPlatform: location?.meetingPlatform ?? undefined,
                    locationCapacity: location?.capacity ?? undefined,
                    locationTimezone: location?.timezone ?? undefined,
                    locationNotes: location ? (location.notes ?? location.accessInstructions ?? undefined) : undefined,
                  });
                  if (fieldErrors.locationId) {
                    setFieldErrors(prev => ({ ...prev, locationId: '' }));
                  }
                }}
                hasError={Boolean(fieldErrors.locationId)}
                required
              />
              {fieldErrors.locationId && (
                <p className="text-xs text-red-600">{fieldErrors.locationId}</p>
              )}
              <p className="text-xs text-slate-500">
                Choose an approved venue or delivery space
              </p>
            </div>

            {/* Session Title */}
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="session-title" className="text-sm font-medium text-slate-700">
                Session Title
              </label>
              <Input
                id="session-title"
                value={metadata.title}
                placeholder="e.g. Coaching Through Change"
                onChange={handleStringChange('title')}
                className={cn(
                  fieldErrors.title && 'border-red-500 focus:border-red-500'
                )}
              />
              {fieldErrors.title && (
                <p className="text-xs text-red-600">{fieldErrors.title}</p>
              )}
              <p className="text-xs text-slate-500">
                A clear, engaging title that describes your session
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Logistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Schedule & Logistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Session Date
              </label>
              <Input
                type="date"
                value={toDateInputValue(metadata.startDate)}
                onChange={(event) => {
                  const newDate = event.target.value;
                  const currentStartTime = timeSegment(metadata.startTime);
                  const currentEndTime = timeSegment(metadata.endTime);

                  onChange({
                    startDate: newDate,
                    startTime: fromDateTimeLocal(`${newDate}T${currentStartTime}`),
                    endTime: fromDateTimeLocal(`${newDate}T${currentEndTime}`)
                  });
                }}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Start Time
              </label>
              <Input
                type="time"
                value={timeSegment(metadata.startTime)}
                onChange={(event) => {
                  const newTime = event.target.value;
                  onChange({
                    startTime: fromDateTimeLocal(`${metadata.startDate}T${newTime}`)
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                End Time
              </label>
              <Input
                type="time"
                value={timeSegment(metadata.endTime)}
                onChange={(event) => {
                  const newTime = event.target.value;
                  onChange({
                    endTime: fromDateTimeLocal(`${metadata.startDate}T${newTime}`)
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Duration
              </label>
              <div className="h-10 flex items-center px-3 text-sm bg-slate-50 border border-slate-200 rounded-md">
                {metadata.startTime && metadata.endTime && (
                  <span className="text-slate-700 font-medium">
                    {Math.round((new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime()) / 60000)} min
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Duration Display */}
          {metadata.startTime && metadata.endTime && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Session Duration:</span>
                <span>
                  {Math.round((new Date(metadata.endTime).getTime() - new Date(metadata.startTime).getTime()) / 60000)} minutes
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};
