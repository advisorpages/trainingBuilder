import * as React from 'react';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '../../../ui';
import { AutosaveStatus } from '../state/types';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt?: string;
  onManualSave: () => void | Promise<void>;
  canUndo?: boolean;
  onUndo?: () => void;
}

type StatusConfig = {
  label: string;
  tone: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge: string;
};

const statusConfig: Record<AutosaveStatus, StatusConfig> = {
  idle: {
    label: 'Saved',
    tone: 'text-slate-600',
    icon: CheckCircleIcon,
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  pending: {
    label: 'Saving…',
    tone: 'text-blue-600',
    icon: ArrowPathIcon,
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  success: {
    label: 'Saved',
    tone: 'text-emerald-600',
    icon: CheckCircleIcon,
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  error: {
    label: 'Save failed',
    tone: 'text-red-600',
    icon: ExclamationTriangleIcon,
    badge: 'bg-red-50 text-red-600 border-red-200',
  },
};

const formatSavedTime = (lastSavedAt?: string) => {
  if (!lastSavedAt) return null;
  const parsed = new Date(lastSavedAt);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(parsed);
};

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSavedAt,
  onManualSave,
  canUndo = false,
  onUndo,
}) => {
  const config = statusConfig[status];
  const formattedTime = formatSavedTime(lastSavedAt);
  const Icon = config.icon;
  const isPending = status === 'pending';
  const isError = status === 'error';

  return (
    <div
      data-testid="autosave-indicator"
      aria-live="polite"
      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white/90 px-4 py-2 text-sm shadow-sm backdrop-blur"
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border ${config.badge}`}
        >
          <Icon
            aria-hidden
            className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`}
          />
        </span>
        <div className="flex flex-col">
          <span className={`font-medium leading-none ${config.tone}`}>{config.label}</span>
          <span className="mt-1 text-xs text-slate-500">
            {isError
              ? 'We could not save your latest changes.'
              : formattedTime
                ? `Saved at ${formattedTime}`
                : 'Auto-save keeps your progress up to date.'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {canUndo && onUndo ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            className="font-medium text-slate-700 hover:text-slate-900"
          >
            Undo
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={isError ? 'outline' : 'ghost'}
          onClick={onManualSave}
          disabled={isPending}
        >
          {isError ? 'Retry save' : 'Save now'}
        </Button>
      </div>
    </div>
  );
};
