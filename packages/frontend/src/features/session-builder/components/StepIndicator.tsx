import * as React from 'react';
import { cn } from '../../../lib/utils';

export type BuilderStep = 'setup' | 'generate' | 'review' | 'finalize';

interface StepIndicatorProps {
  currentStep: BuilderStep;
  completedSteps: BuilderStep[];
  onStepClick?: (step: BuilderStep) => void;
  className?: string;
}

const steps: { key: BuilderStep; label: string; description: string }[] = [
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
  className
}) => {
  const getCurrentStepIndex = () => steps.findIndex(step => step.key === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  const getStepStatus = (stepKey: BuilderStep, index: number) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'active';
    if (index < currentStepIndex) return 'completed';
    return 'pending';
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop/Tablet Step Indicator */}
      <nav aria-label="Session builder progress" className="hidden sm:block">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const isClickable = onStepClick && (status === 'completed' || status === 'active');

            return (
              <li key={step.key} className="flex-1">
                <div className="flex items-center">
                  {/* Step Circle */}
                  <button
                    onClick={() => isClickable && onStepClick(step.key)}
                    disabled={!isClickable}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
                      status === 'completed' && 'border-green-600 bg-green-600 text-white hover:bg-green-700 hover:scale-105',
                      status === 'active' && 'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100',
                      status === 'pending' && 'border-slate-300 bg-slate-100 text-slate-400 opacity-60',
                      isClickable && 'cursor-pointer hover:border-blue-500',
                      !isClickable && 'cursor-not-allowed opacity-50'
                    )}
                    title={isClickable ? `Go to ${step.label}` : `Complete previous steps to unlock`}
                  >
                    {status === 'completed' ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </button>

                  {/* Step Content */}
                  <div className="ml-3 md:ml-4 min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-xs sm:text-sm font-medium truncate',
                        status === 'completed' && 'text-green-600',
                        status === 'active' && 'text-blue-600',
                        status === 'pending' && 'text-slate-400'
                      )}
                    >
                      {step.label}
                    </div>
                    <div className="hidden md:block text-xs text-slate-500 truncate">
                      {step.description}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        'ml-2 md:ml-4 h-px w-full transition-colors',
                        status === 'completed' ? 'bg-green-600' : 'bg-slate-200'
                      )}
                    />
                  )}
                </div>
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
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
              'border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100'
            )}>
              {currentStepIndex + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-blue-600">
                {steps[currentStepIndex].label}
              </div>
              <div className="text-xs text-slate-500">
                Step {currentStepIndex + 1} of {steps.length}
              </div>
            </div>
          </div>
          <div className="text-xs font-medium text-slate-600">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const isClickable = onStepClick && (status === 'completed' || status === 'active');

            return (
              <button
                key={step.key}
                onClick={() => isClickable && onStepClick(step.key)}
                disabled={!isClickable}
                className={cn(
                  'h-2 rounded-full transition-all duration-200',
                  status === 'completed' && 'w-2 bg-green-600',
                  status === 'active' && 'w-8 bg-blue-600',
                  status === 'pending' && 'w-2 bg-slate-300',
                  isClickable && 'cursor-pointer hover:scale-125',
                  !isClickable && 'cursor-not-allowed'
                )}
                title={step.label}
                aria-label={step.label}
              />
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
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      completeStep(currentStep);
      setCurrentStep(steps[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
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