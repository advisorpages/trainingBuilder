import * as React from 'react';
import { Input, Button, Card, CardContent, CardHeader, CardTitle } from '../../../ui';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';

interface SessionMetadataFormProps {
  metadata: SessionMetadata;
  onChange: (updates: Partial<SessionMetadata>) => void;
  onTriggerAI: () => void;
  onAutosave?: () => void;
  isAutosaving?: boolean;
  showAdvancedOptions?: boolean;
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

// Collapsible section component
interface CollapsibleSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  required?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  children,
  defaultOpen = true,
  required = false
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <Card className="w-full">
      <CardHeader
        className="cursor-pointer transition-colors hover:bg-slate-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {description && (
              <p className="text-sm text-slate-500 hidden sm:block">{description}</p>
            )}
            <svg
              className={cn(
                'h-5 w-5 transition-transform',
                isOpen ? 'rotate-180' : 'rotate-0'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {description && (
          <p className="text-sm text-slate-500 sm:hidden mt-1">{description}</p>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

// Field validation helper
const getFieldValidation = (field: keyof SessionMetadata, value: string) => {
  const requiredFields: (keyof SessionMetadata)[] = ['title', 'desiredOutcome', 'category', 'sessionType'];
  const isRequired = requiredFields.includes(field);
  const isEmpty = !value || value.trim() === '';

  return {
    isRequired,
    isEmpty,
    isValid: !isRequired || !isEmpty,
    errorMessage: isRequired && isEmpty ? `${field} is required` : ''
  };
};

export const SessionMetadataForm: React.FC<SessionMetadataFormProps> = ({
  metadata,
  onChange,
  onTriggerAI,
  onAutosave,
  isAutosaving,
  showAdvancedOptions = false,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState(showAdvancedOptions);
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

  const validateField = (field: keyof SessionMetadata) => {
    const validation = getFieldValidation(field, metadata[field] as string);
    if (!validation.isValid) {
      setFieldErrors(prev => ({ ...prev, [field]: validation.errorMessage }));
      return false;
    }
    return true;
  };

  const validateForm = () => {
    const requiredFields: (keyof SessionMetadata)[] = ['title', 'desiredOutcome', 'category', 'sessionType'];
    let isValid = true;
    const errors: Record<string, string> = {};

    requiredFields.forEach(field => {
      const validation = getFieldValidation(field, metadata[field] as string);
      if (!validation.isValid) {
        errors[field] = validation.errorMessage;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleGenerateOutline = () => {
    if (validateForm()) {
      onTriggerAI();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Session Setup</h2>
          <p className="text-sm text-slate-600">
            Configure your session details to generate a tailored outline
          </p>
        </div>
        <Button
          onClick={handleGenerateOutline}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isAutosaving}
        >
          {isAutosaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Generating...
            </div>
          ) : (
            'Generate Outline'
          )}
        </Button>
      </div>

      {/* Basic Information Section */}
      <CollapsibleSection
        title="Basic Information"
        description="Essential session details"
        required
        defaultOpen
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="session-title" className="text-sm font-medium text-slate-700">
              Session Title <span className="text-red-500">*</span>
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

          <div className="space-y-2">
            <label htmlFor="session-category" className="text-sm font-medium text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <Input
              id="session-category"
              value={metadata.category}
              placeholder="Leadership, Sales, Communication..."
              onChange={handleStringChange('category')}
              className={cn(
                fieldErrors.category && 'border-red-500 focus:border-red-500'
              )}
            />
            {fieldErrors.category && (
              <p className="text-xs text-red-600">{fieldErrors.category}</p>
            )}
          </div>

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
        </div>
      </CollapsibleSection>

      {/* Content Focus Section */}
      <CollapsibleSection
        title="Content Focus"
        description="Define the problem and topics to cover"
        defaultOpen
      >
        <div className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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
        </div>
      </CollapsibleSection>

      {/* Schedule & Logistics Section */}
      <CollapsibleSection
        title="Schedule & Logistics"
        description="When and where the session will take place"
        defaultOpen
      >
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
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
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
      </CollapsibleSection>

      {/* Advanced Options Section */}
      <CollapsibleSection
        title="Advanced Options"
        description="Optional settings for customization"
        defaultOpen={showAdvanced}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Location
              </label>
              <Input
                type="number"
                value={metadata.locationId || ''}
                placeholder="Location ID (optional)"
                onChange={(event) => onChange({ locationId: event.target.value ? parseInt(event.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Target Audience
              </label>
              <Input
                type="number"
                value={metadata.audienceId || ''}
                placeholder="Audience ID (optional)"
                onChange={(event) => onChange({ audienceId: event.target.value ? parseInt(event.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Session Tone
              </label>
              <Input
                type="number"
                value={metadata.toneId || ''}
                placeholder="Tone ID (optional)"
                onChange={(event) => onChange({ toneId: event.target.value ? parseInt(event.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Timezone
              </label>
              <Input
                value={metadata.timezone}
                placeholder="America/New_York"
                onChange={handleStringChange('timezone')}
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quick Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          <p>Changes are automatically saved as you type</p>
        </div>
        <div className="flex items-center gap-2">
          {onAutosave && (
            <Button variant="ghost" size="sm" onClick={onAutosave} disabled={isAutosaving}>
              {isAutosaving ? (
                <div className="flex items-center gap-1">
                  <div className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
                  Saving...
                </div>
              ) : (
                'Save Now'
              )}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>
      </div>
    </div>
  );
};
