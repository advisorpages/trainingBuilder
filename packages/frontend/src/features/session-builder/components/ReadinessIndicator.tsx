import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Progress, Button } from '../../../ui';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  weight: number; // How much this contributes to the overall score
}

interface ReadinessIndicatorProps {
  metadata: SessionMetadata;
  hasOutline: boolean;
  hasAcceptedVersion: boolean;
  readinessScore: number;
  onOpenQuickAdd?: () => void;
  className?: string;
}

const getReadinessItems = (
  metadata: SessionMetadata,
  hasOutline: boolean,
  hasAcceptedVersion: boolean
): ReadinessItem[] => {
  return [
    {
      id: 'title',
      label: 'Session Title',
      description: 'Clear, descriptive title for your session',
      completed: !!metadata.title?.trim(),
      required: true,
      weight: 15
    },
    {
      id: 'outcome',
      label: 'Desired Outcome',
      description: 'What participants will be able to do after the session',
      completed: !!metadata.desiredOutcome?.trim(),
      required: true,
      weight: 20
    },
    {
      id: 'category',
      label: 'Category',
      description: 'Training category for proper classification',
      completed: !!metadata.category?.trim(),
      required: true,
      weight: 10
    },
    {
      id: 'sessionType',
      label: 'Session Type',
      description: 'Format of your training session',
      completed: !!metadata.sessionType,
      required: true,
      weight: 10
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Date and time for the session',
      completed: !!metadata.startDate && !!metadata.startTime && !!metadata.endTime,
      required: true,
      weight: 10
    },
    {
      id: 'problem',
      label: 'Current Problem',
      description: 'Challenge or issue the session addresses',
      completed: !!metadata.currentProblem?.trim(),
      required: false,
      weight: 10
    },
    {
      id: 'topics',
      label: 'Specific Topics',
      description: 'Key topics, frameworks, or skills to cover',
      completed: !!metadata.specificTopics?.trim(),
      required: false,
      weight: 10
    },
    {
      id: 'outline',
      label: 'Session Outline',
      description: 'Generated session structure with sections',
      completed: hasOutline,
      required: true,
      weight: 20
    },
    {
      id: 'accepted_content',
      label: 'Approved Content',
      description: 'Accepted AI-generated version for your session',
      completed: hasAcceptedVersion,
      required: true,
      weight: 25
    }
  ];
};

const calculateDetailedScore = (items: ReadinessItem[]): number => {
  const completedWeight = items.filter(item => item.completed).reduce((sum, item) => sum + item.weight, 0);
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  return Math.round((completedWeight / totalWeight) * 100);
};

const ReadinessProgressRing: React.FC<{ score: number; size?: number }> = ({ score, size = 80 }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (score: number) => {
    if (score >= 90) return '#10b981'; // green-500
    if (score >= 70) return '#f59e0b'; // amber-500
    if (score >= 50) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{score}%</span>
      </div>
    </div>
  );
};

export const ReadinessIndicator: React.FC<ReadinessIndicatorProps> = ({
  metadata,
  hasOutline,
  hasAcceptedVersion,
  readinessScore,
  onOpenQuickAdd,
  className
}) => {
  const [showDetails, setShowDetails] = React.useState(false);
  const items = getReadinessItems(metadata, hasOutline, hasAcceptedVersion);
  const detailedScore = calculateDetailedScore(items);

  const completedRequired = items.filter(item => item.required && item.completed).length;
  const totalRequired = items.filter(item => item.required).length;
  const completedOptional = items.filter(item => !item.required && item.completed).length;
  const totalOptional = items.filter(item => !item.required).length;

  const nextSteps = items
    .filter(item => !item.completed && item.required)
    .slice(0, 3);

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusMessage = (score: number) => {
    if (score >= 90) return 'Ready to publish!';
    if (score >= 70) return 'Almost ready';
    if (score >= 50) return 'Good progress';
    return 'Getting started';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Session Readiness</CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              Track completion progress for publishing
            </p>
          </div>
          {onOpenQuickAdd && (
            <Button size="sm" variant="outline" onClick={onOpenQuickAdd}>
              Quick Add
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Progress Display */}
        <div className="flex items-center gap-6">
          <ReadinessProgressRing score={detailedScore} />

          <div className="flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={cn('text-lg font-semibold', getStatusColor(detailedScore))}>
                  {getStatusMessage(detailedScore)}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  {showDetails ? 'Hide' : 'Show'} Details
                  <svg
                    className={cn('ml-1 h-4 w-4 transition-transform', showDetails && 'rotate-180')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Required Items</p>
                  <p className="font-medium">{completedRequired}/{totalRequired} completed</p>
                </div>
                <div>
                  <p className="text-slate-600">Optional Items</p>
                  <p className="font-medium">{completedOptional}/{totalOptional} completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-900">Completion Checklist</h4>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                    item.completed
                      ? 'border-green-200 bg-green-50'
                      : item.required
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-slate-200 bg-slate-50'
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.completed ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <div className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                        item.required ? 'border-yellow-400 bg-white' : 'border-slate-300 bg-white'
                      )}>
                        {item.required && (
                          <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium',
                        item.completed ? 'text-green-800' : 'text-slate-900'
                      )}>
                        {item.label}
                      </p>
                      {item.required && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Required
                        </span>
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-0.5',
                      item.completed ? 'text-green-600' : 'text-slate-600'
                    )}>
                      {item.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-xs text-slate-500">
                    {item.weight}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Next Steps</h4>
            <div className="space-y-1">
              {nextSteps.map((step) => (
                <p key={step.id} className="text-sm text-slate-600">
                  • {step.description}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Progress Bar (Alternative view) */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">Overall Progress</span>
            <span className="text-slate-600">{detailedScore}% Complete</span>
          </div>
          <Progress value={detailedScore} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};