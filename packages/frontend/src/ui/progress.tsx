import * as React from 'react';
import { cn } from '../lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, label, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(value, max));
    const percent = (clamped / max) * 100;

    return (
      <div className={cn('w-full space-y-1', className)} ref={ref} {...props}>
        {label ? (
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{label}</span>
            <span>{Math.round(percent)}%</span>
          </div>
        ) : null}
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${percent}%` }}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={clamped}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = 'Progress';
