import * as React from 'react';
import { Button } from '../../../ui';
import { SectionType } from '../../../services/session-builder.service';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (type: SectionType) => void;
}

const sectionOptions: { type: SectionType; label: string; description: string }[] = [
  { type: 'opener', label: 'Opener', description: 'Kick off energy and context setting.' },
  { type: 'topic', label: 'Topic Block', description: 'Teaching moments with learning objectives.' },
  { type: 'exercise', label: 'Exercise', description: 'Hands-on practice with guided facilitation.' },
  { type: 'discussion', label: 'Discussion', description: 'Prompted dialogue for reflection and alignment.' },
  { type: 'closing', label: 'Closing', description: 'Wrap-up with commitments and next steps.' },
  { type: 'custom', label: 'Custom Block', description: 'Flexible slot for any specialized content.' },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ open, onClose, onAdd }) => {
  const onCloseRef = React.useRef(onClose);

  React.useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Quick Add Section</h2>
            <p className="text-sm text-slate-500">
              Choose a block to append to your draft outline. You can refine details after adding.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close quick add"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {sectionOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                onAdd(option.type);
                onClose();
              }}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="text-sm font-semibold text-slate-800">{option.label}</p>
              <p className="text-xs text-slate-500">{option.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
