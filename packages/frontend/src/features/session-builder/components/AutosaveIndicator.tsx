import * as React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../ui';

interface AutosaveIndicatorProps {
  lastSavedAt?: string;
  onManualSave?: () => void | Promise<void>;
  showSaveButton?: boolean;
}


const formatSavedTime = (lastSavedAt?: string) => {
  if (!lastSavedAt) return null;
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsed);
};

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  lastSavedAt,
  onManualSave,
  showSaveButton = false,
}) => {
  const formattedTime = formatSavedTime(lastSavedAt);

  return (
    <div
      data-testid="autosave-indicator"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-slate-100 text-slate-600 border-slate-200">
          <CheckCircleIcon aria-hidden className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <span className="font-medium leading-none text-slate-600">Ready</span>
          <span className="mt-1 text-xs text-slate-500">
            {formattedTime ? `Last saved at ${formattedTime}` : 'Make changes and save your work'}
          </span>
        </div>
      </div>
      {showSaveButton && onManualSave && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onManualSave}
          >
            Save now
          </Button>
        </div>
      )}
    </div>
  );
};
