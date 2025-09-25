import * as React from 'react';
import { Input, Button } from '../../../ui';
import { SessionMetadata } from '../state/types';

interface SessionMetadataFormProps {
  metadata: SessionMetadata;
  onChange: (updates: Partial<SessionMetadata>) => void;
  onTriggerAI: () => void;
  onAutosave?: () => void;
  isAutosaving?: boolean;
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

export const SessionMetadataForm: React.FC<SessionMetadataFormProps> = ({
  metadata,
  onChange,
  onTriggerAI,
  onAutosave,
  isAutosaving,
}) => {
  const handleStringChange = (field: keyof SessionMetadata) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [field]: event.target.value } as Partial<SessionMetadata>);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Session Metadata</h3>
            <p className="text-sm text-slate-500">
              Fill out the essentials. These fields seed AI prompts and determine readiness.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onTriggerAI}>
            Generate Outline
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">Working Title</span>
          <Input
            value={metadata.title}
            placeholder="e.g. Coaching Through Change"
            onChange={handleStringChange('title')}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Category</span>
          <Input
            value={metadata.category}
            placeholder="Leadership"
            onChange={handleStringChange('category')}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Session Type</span>
          <select
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={metadata.sessionType}
            onChange={(event) => onChange({ sessionType: event.target.value as SessionMetadata['sessionType'] })}
          >
            {sessionTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Desired Outcome</span>
          <Input
            value={metadata.desiredOutcome}
            placeholder="Teams apply feedback frameworks confidently"
            onChange={handleStringChange('desiredOutcome')}
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium">Current Problem</span>
        <textarea
          className="h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={metadata.currentProblem}
          placeholder="Managers struggle to give constructive coaching conversations."
          onChange={handleStringChange('currentProblem')}
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium">Specific Topics</span>
        <textarea
          className="h-20 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={metadata.specificTopics}
          placeholder="Impact feedback, feedforward models, practice labs"
          onChange={handleStringChange('specificTopics')}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Session Date</span>
          <Input
            type="date"
            value={toDateInputValue(metadata.startDate)}
            onChange={(event) =>
              onChange({
                startDate: event.target.value,
                startTime: fromDateTimeLocal(
                  `${event.target.value}T${timeSegment(metadata.startTime)}`
                ),
              })
            }
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Start Time</span>
          <Input
            type="datetime-local"
            value={toDateTimeLocal(metadata.startTime)}
            onChange={(event) => onChange({ startTime: fromDateTimeLocal(event.target.value) })}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">End Time</span>
          <Input
            type="datetime-local"
            value={toDateTimeLocal(metadata.endTime)}
            onChange={(event) => onChange({ endTime: fromDateTimeLocal(event.target.value) })}
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Need a quick save? Use autosave in the header or trigger AI to generate the next version.
        </p>
        {onAutosave ? (
          <Button variant="ghost" size="sm" onClick={onAutosave} disabled={isAutosaving}>
            {isAutosaving ? 'Saving…' : 'Save Draft'}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
