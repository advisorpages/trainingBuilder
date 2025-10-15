import * as React from 'react';
import { cn } from '../../../lib/utils';

export type BuilderStep = 'setup' | 'generate' | 'trainers-topics' | 'review' | 'finalize';

export type BuilderStepConfig = { key: BuilderStep; label: string; description: string };

interface StepIndicatorProps {
  currentStep: BuilderStep;
  completedSteps: BuilderStep[];
  onStepClick?: (step: BuilderStep) => void;
  className?: string;
  steps?: BuilderStepConfig[];
}

const defaultSteps: BuilderStepConfig[] = [
  {
    key: 'setup',
    label: 'Details',
    description: 'Session information and goals'
  },
  {
    key: 'generate',
    label: 'Create Outline',
    description: 'Generate and select outline'
  },
  {
    key: 'trainers-topics',
    label: 'Trainers & Topics',
    description: 'Assign trainers and refine topics'
  },
  {
    key: 'review',
    label: 'Review & Edit',
    description: 'Refine your session content'
  },
  {
    key: 'finalize',
    label: 'Publish',
    description: 'Review and publish session'
  }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  className,
  steps,
}) => {
  const stepsToRender = steps ?? defaultSteps;
  const getCurrentStepIndex = () => stepsToRender.findIndex(step => step.key === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepKey: BuilderStep, index: number) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'active';
    if (index < currentStepIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Header */}
      <div className="mb-4 sm:mb-5">
        <h3 className="text-sm font-semibold text-slate-700">Session Builder Progress</h3>
      </div>

      {/* Desktop/Tablet Step Indicator */}
      <nav aria-label="Session builder progress" className="hidden sm:block">
        <ol className="flex items-center justify-between w-full">
          {stepsToRender.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const isClickable = onStepClick && (status === 'completed' || status === 'active');

            return (
              <li key={step.key} className="flex-1">
                <button
                  onClick={() => isClickable && onStepClick(step.key)}
                  disabled={!isClickable}
                  className={cn(
                    'w-full text-left group transition-all duration-200',
                    isClickable && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed'
                  )}
                  title={isClickable ? `Click to go to ${step.label}` : `Complete previous steps to unlock ${step.label}`}
                >
                  <div className="flex items-center">
                    {/* Step Circle */}
                    <div
                      className={cn(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                        status === 'completed' && 'border-green-600 bg-green-600 text-white group-hover:bg-green-700 group-hover:scale-110 shadow-md',
                        status === 'active' && 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg',
                        status === 'pending' && 'border-slate-300 bg-slate-100 text-slate-400',
                        !isClickable && 'opacity-50'
                      )}
                    >
                      {status === 'completed' ? (
                        <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="ml-3 md:ml-4 min-w-0 flex-1 pr-3 md:pr-4">
                      <div
                        className={cn(
                          'text-sm sm:text-base font-bold mb-0.5 transition-colors',
                          status === 'completed' && 'text-green-600 group-hover:text-green-700',
                          status === 'active' && 'text-blue-600',
                          status === 'pending' && 'text-slate-400'
                        )}
                      >
                        {step.label}
                      </div>
                      <div className={cn(
                        'text-xs sm:text-sm',
                        status === 'completed' && 'text-green-600/80 group-hover:text-green-600',
                        status === 'active' && 'text-blue-600/80 font-medium',
                        status === 'pending' && 'text-slate-400'
                      )}>
                        {step.description}
                      </div>
                      {status === 'completed' && isClickable && (
                        <div className="text-xs text-green-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Go back
                        </div>
                      )}
                    </div>

                    {/* Connector Line */}
                    {index < stepsToRender.length - 1 && (
                      <div
                        className={cn(
                          'h-0.5 w-full max-w-[60px] md:max-w-[80px] transition-colors flex-shrink-0',
                          status === 'completed' ? 'bg-green-600' : 'bg-slate-200'
                        )}
                      />
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Step Indicator - Compact View */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm',
              'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100'
            )}>
              {currentStepIndex + 1}
            </div>
            <div>
              <div className="text-base font-bold text-blue-600">
                {stepsToRender[currentStepIndex].label}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {stepsToRender[currentStepIndex].description}
              </div>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
            {Math.round(((currentStepIndex + 1) / stepsToRender.length) * 100)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${((currentStepIndex + 1) / stepsToRender.length) * 100}%` }}
          />
        </div>

        {/* Step Dots with Labels */}
        <div className="flex items-center justify-between gap-1 mt-4">
          {stepsToRender.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const isClickable = onStepClick && (status === 'completed' || status === 'active');

            return (
              <button
                key={step.key}
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1 flex-1 transition-all duration-200',
                  isClickable && 'cursor-pointer',
                  !isClickable && 'cursor-not-allowed opacity-50'
                )}
                title={step.label}
                aria-label={step.label}
              >
                <div className={cn(
                  'h-2 w-full rounded-full transition-all duration-200',
                  status === 'completed' && 'bg-green-600',
                  status === 'active' && 'bg-blue-600 shadow-sm',
                  status === 'pending' && 'bg-slate-300',
                  isClickable && 'hover:scale-105'
                )} />
                <span className={cn(
                  'text-xs font-medium text-center',
                  status === 'completed' && 'text-green-600',
                  status === 'active' && 'text-blue-600 font-semibold',
                  status === 'pending' && 'text-slate-400'
                )}>
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Hook to manage step state
export const useBuilderSteps = (initialStep: BuilderStep = 'setup') => {
  const [currentStep, setCurrentStep] = React.useState<BuilderStep>(initialStep);
  const [completedSteps, setCompletedSteps] = React.useState<BuilderStep[]>([]);

  const goToStep = (step: BuilderStep) => {
    setCurrentStep(step);
  };

  const completeStep = (step: BuilderStep) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        return [...prev, step];
      }
      return prev;
    });
  };

  const nextStep = () => {
    const currentIndex = defaultSteps.findIndex(s => s.key === currentStep);
    if (currentIndex < defaultSteps.length - 1) {
      completeStep(currentStep);
      setCurrentStep(defaultSteps[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = defaultSteps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(defaultSteps[currentIndex - 1].key);
    }
  };

  const canGoNext = currentStep !== 'finalize';
  const canGoPrev = currentStep !== 'setup';

  return {
    currentStep,
    completedSteps,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev
  };
};
