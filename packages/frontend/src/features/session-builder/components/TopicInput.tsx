import * as React from 'react';

interface TopicInputValue {
  title: string;
  description?: string;
  durationMinutes: number;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  callToAction?: string;
  topicId?: number;
}

interface TopicInputProps {
  value: TopicInputValue;
  onChange: (value: TopicInputValue) => void;
}

const parseBulletList = (value?: string | null): string[] =>
  (value || '')
    .split('\n')
    .map((item) => item.replace(/^•\s*/, '').trim())
    .filter(Boolean);

const toBulletString = (items: string[]): string =>
  items.length ? items.map((item) => `• ${item}`).join('\n') : '';

export const TopicInput = ({ value, onChange }: TopicInputProps) => {
  const [trainerTasksInput, setTrainerTasksInput] = React.useState('');

  React.useEffect(() => {
    const tasks = parseBulletList(value.trainerNotes);
    setTrainerTasksInput(tasks.join('\n'));
  }, [value.trainerNotes]);

  const handleDurationChange = (minutes: number) => {
    onChange({ ...value, durationMinutes: Math.max(5, Math.round(minutes / 5) * 5) });
  };

  const handleTrainerTasksChange = (rawValue: string) => {
    setTrainerTasksInput(rawValue);
    const tasks = rawValue
      .split('\n')
      .map((line) => line.replace(/^•\s*/, '').trim())
      .filter(Boolean);

    onChange({
      ...value,
      trainerNotes: toBulletString(tasks),
    });
  };

  const trainerTasks = parseBulletList(value.trainerNotes);
  const materials = parseBulletList(value.materialsNeeded);
  const materialsText = materials.join('\n');

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Name this topic
          </label>
          <input
            type="text"
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Example: Leading Through Change"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            How many minutes?
          </label>
          <input
            type="number"
            className="h-10 w-32 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={value.durationMinutes}
            min={5}
            step={5}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
          />
          <p className="text-xs text-slate-500">
            We round to the nearest 5 minutes.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          What will participants hear? (optional)
        </label>
        <textarea
          className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder="Write a short teaser or summary for the group."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              What should the trainer do? <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-slate-500">
              {trainerTasks.length} task{trainerTasks.length === 1 ? '' : 's'}
            </span>
          </div>
          <textarea
            className="min-h-[140px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={trainerTasksInput}
            onChange={(e) => handleTrainerTasksChange(e.target.value)}
            placeholder="One task per line. Example: Lead a quick story swap."
          />
          <p className="text-xs text-slate-500">
            Each line becomes a bullet. Start with action words like "Guide" or "Model".
          </p>
        </div>

        <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Trainer goal
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={value.learningOutcomes ?? ''}
              onChange={(e) => onChange({ ...value, learningOutcomes: e.target.value })}
              placeholder="Example: Make sure everyone can name the three coaching steps."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Call to action for the group
            </label>
            <input
              type="text"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={value.callToAction ?? ''}
              onChange={(e) => onChange({ ...value, callToAction: e.target.value })}
              placeholder="Example: Invite everyone to pick one action for this week."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-slate-500">
              What supplies are needed?
            </label>
            <textarea
              className="min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={materialsText}
              onChange={(e) => {
                const items = e.target.value
                  .split('\n')
                  .map((line) => line.replace(/^•\s*/, '').trim())
                  .filter(Boolean);
                onChange({
                  ...value,
                  materialsNeeded: toBulletString(items),
                });
              }}
              placeholder="One item per line. Example: Flip chart, sticky notes."
            />
            <p className="text-xs text-slate-500">
              Each line becomes a bullet in the trainer view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { TopicInputValue };
