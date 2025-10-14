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
  trainerId?: number;
}

interface TopicInputProps {
  value: TopicInputValue;
  onChange: (value: TopicInputValue) => void;
  onEdit: () => void;
}

const parseBulletList = (value?: string | null): string[] =>
  (value || '')
    .split('\n')
    .map((item) => item.replace(/^•\s*/, '').trim())
    .filter(Boolean);

const toBulletString = (items: string[]): string =>
  items.length ? items.map((item) => `• ${item}`).join('\n') : '';

export const TopicInput = ({ value, onEdit }: TopicInputProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const trainerTasks = parseBulletList(value.trainerNotes);
  const materials = parseBulletList(value.materialsNeeded);

  return (
    <div className="space-y-3 rounded-lg border-2 border-slate-300 bg-white shadow-md hover:shadow-lg hover:border-blue-400 transition-all">
      {/* Read-Only View */}
      <div className="p-5">
        {/* Header with Title, Duration, and Edit Button */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-900 mb-2">
              {value.title || <span className="text-slate-400 italic">Untitled Topic</span>}
            </h4>
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{value.durationMinutes} min</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-600 rounded-md transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Description */}
        {value.description && (
          <div className="mb-3">
            <p className="text-sm text-slate-700 leading-relaxed">
              {value.description}
            </p>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {isExpanded ? 'Hide' : 'Show'} trainer details
        </button>
      </div>

      {/* Expanded View - Read-Only Trainer Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4 bg-slate-50">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Trainer Tasks */}
            {trainerTasks.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-slate-700">
                  Trainer Tasks ({trainerTasks.length})
                </h5>
                <ul className="space-y-1.5">
                  {trainerTasks.map((task, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Details */}
            <div className="space-y-3">
              {value.learningOutcomes && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                    Trainer Goal
                  </h5>
                  <p className="text-sm text-slate-700">{value.learningOutcomes}</p>
                </div>
              )}

              {value.callToAction && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                    Call to Action
                  </h5>
                  <p className="text-sm text-slate-700">{value.callToAction}</p>
                </div>
              )}

              {materials.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold uppercase text-slate-500 mb-1">
                    Materials Needed
                  </h5>
                  <ul className="space-y-1">
                    {materials.map((material, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-400" />
                        <span>{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export type { TopicInputValue };
