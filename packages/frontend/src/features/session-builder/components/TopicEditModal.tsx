import * as React from 'react';
import { Button } from '@/components/ui/Button';
import type { TopicInputValue } from './TopicInput';

interface TopicEditModalProps {
  isOpen: boolean;
  topic: TopicInputValue;
  onSave: (topic: TopicInputValue) => void;
  onCancel: () => void;
}

const parseBulletList = (value?: string | null): string[] =>
  (value || '')
    .split('\n')
    .map((item) => item.replace(/^•\s*/, '').trim())
    .filter(Boolean);

const toBulletString = (items: string[]): string =>
  items.length ? items.map((item) => `• ${item}`).join('\n') : '';

export const TopicEditModal: React.FC<TopicEditModalProps> = ({
  isOpen,
  topic,
  onSave,
  onCancel,
}) => {
  const [editedTopic, setEditedTopic] = React.useState<TopicInputValue>(topic);
  const [trainerTasksInput, setTrainerTasksInput] = React.useState('');

  React.useEffect(() => {
    setEditedTopic(topic);
    const tasks = parseBulletList(topic.trainerNotes);
    setTrainerTasksInput(tasks.join('\n'));
  }, [topic, isOpen]);

  const handleDurationChange = (minutes: number) => {
    setEditedTopic({ ...editedTopic, durationMinutes: Math.max(5, Math.round(minutes / 5) * 5) });
  };

  const handleTrainerTasksChange = (rawValue: string) => {
    setTrainerTasksInput(rawValue);
    const tasks = rawValue
      .split('\n')
      .map((line) => line.replace(/^•\s*/, '').trim())
      .filter(Boolean);

    setEditedTopic({
      ...editedTopic,
      trainerNotes: toBulletString(tasks),
    });
  };

  const handleSave = () => {
    onSave(editedTopic);
  };

  const trainerTasks = parseBulletList(editedTopic.trainerNotes);
  const materials = parseBulletList(editedTopic.materialsNeeded);
  const materialsText = materials.join('\n');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Edit Topic</h2>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">
                Name this topic
              </label>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={editedTopic.title}
                onChange={(e) => setEditedTopic({ ...editedTopic, title: e.target.value })}
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
                value={editedTopic.durationMinutes}
                min={5}
                step={5}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500">
                We round to the nearest 5 minutes.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              What will participants hear? (optional)
            </label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={editedTopic.description || ''}
              onChange={(e) => setEditedTopic({ ...editedTopic, description: e.target.value })}
              placeholder="Write a short teaser or summary for the group."
              rows={3}
            />
          </div>

          {/* Trainer Details */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Trainer Details</h3>
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
                  rows={6}
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
                    value={editedTopic.learningOutcomes ?? ''}
                    onChange={(e) => setEditedTopic({ ...editedTopic, learningOutcomes: e.target.value })}
                    placeholder="Example: Make sure everyone can name the three coaching steps."
                    rows={3}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-slate-500">
                    Call to action for the group
                  </label>
                  <input
                    type="text"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editedTopic.callToAction ?? ''}
                    onChange={(e) => setEditedTopic({ ...editedTopic, callToAction: e.target.value })}
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
                      setEditedTopic({
                        ...editedTopic,
                        materialsNeeded: toBulletString(items),
                      });
                    }}
                    placeholder="One item per line. Example: Flip chart, sticky notes."
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    Each line becomes a bullet in the trainer view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
