import * as React from 'react';
import { Button } from '../../../ui';
import { AutosaveStatus } from '../state/types';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: string;
  onManualSave: () => void | Promise<void>;
}

const statusCopy: Record<AutosaveStatus, { label: string; tone: string }> = {
  idle: { label: 'Saved', tone: 'text-slate-500' },
  pending: { label: 'Saving…', tone: 'text-blue-600' },
  success: { label: 'Saved', tone: 'text-green-600' },
  error: { label: 'Save failed', tone: 'text-red-600' },
};

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  onManualSave,
}) => {
  const timestamp = lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : null;
  const copy = statusCopy[status];

  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
      <span className={copy.tone}>{copy.label}</span>
      {timestamp ? <span className="text-xs text-slate-400">{timestamp}</span> : null}
      <Button size="sm" variant="ghost" onClick={onManualSave}>
        Save now
      </Button>
    </div>
  );
};
