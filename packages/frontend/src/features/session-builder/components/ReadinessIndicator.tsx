import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../ui';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';
import { getReadinessItems } from '../utils/readiness';

interface ReadinessIndicatorProps {
  metadata: SessionMetadata;
  hasOutline: boolean;
  hasAcceptedVersion: boolean;
  onOpenQuickAdd?: () => void;
  className?: string;
}

export const ReadinessIndicator: React.FC<ReadinessIndicatorProps> = ({
  metadata,
  hasOutline,
  hasAcceptedVersion,
  onOpenQuickAdd,
  className
}) => {
  const items = getReadinessItems(metadata, { hasOutline, hasAcceptedVersion });
  const incompleteRequired = items.filter((item) => item.required && !item.completed);
  const incompleteOptional = items.filter((item) => !item.required && !item.completed);
  const allRequiredComplete = incompleteRequired.length === 0;

  const statusTone = allRequiredComplete
    ? {
        title: 'All required items are complete',
        description: incompleteOptional.length
          ? 'Optional enhancements are still available if you want extra polish.'
          : 'Nice work — your session is ready for publishing.',
        iconColor: 'bg-green-500',
      }
    : {
        title: 'Complete the required items before publishing',
        description: 'These details make sure the session is publish-ready.',
        iconColor: 'bg-amber-500',
      };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Session Readiness</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Focus on the essentials needed to publish
            </p>
          </div>
          {onOpenQuickAdd && (
            <Button size="sm" variant="outline" onClick={onOpenQuickAdd}>
              Quick Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn('mt-1 h-2.5 w-2.5 rounded-full', statusTone.iconColor)} />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900">{statusTone.title}</h3>
            <p className="text-sm text-slate-600">{statusTone.description}</p>
          </div>
        </div>

        {!allRequiredComplete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700 mb-2">Finish these required items:</p>
            <ul className="space-y-1 text-sm text-amber-800">
              {incompleteRequired.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {allRequiredComplete && incompleteOptional.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Optional polish (not required):</p>
            <ul className="space-y-1 text-sm text-slate-600">
              {incompleteOptional.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
