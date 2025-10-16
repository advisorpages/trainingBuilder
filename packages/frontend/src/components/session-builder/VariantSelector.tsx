import * as React from 'react';
import { Button } from '../ui';
import type { MultiVariantResponse } from '../../services/session-builder.service';

type Variant = MultiVariantResponse['variants'][number];

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
  onSaveForLater?: (variantId: string) => void;
  selectedVariantId?: string;
  isLoading?: boolean;
  loadingProgress?: number;
  loadingStage?: string;
}

const loadingStages = [
  { progress: 0, message: "🔎 Looking for your best ideas…", icon: "🔎" },
  { progress: 20, message: "📚 Pulling in the most useful training material…", icon: "📖" },
  { progress: 40, message: "🧠 Thinking up smart ways to make it shine…", icon: "💭" },
  { progress: 60, message: "✨ Building Version 1 — powered by your knowledge base!", icon: "✍️" },
  { progress: 70, message: "🎨 Building Version 2 — the perfect mix of old and new!", icon: "🎯" },
  { progress: 80, message: "🚀 Building Version 3 — bold and creative!", icon: "💡" },
  { progress: 90, message: "🎪 Building Version 4 — a totally fresh approach!", icon: "🎭" },
  { progress: 100, message: "🎉 Done! Your four session ideas are ready to explore!", icon: "✅" }
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const isUserDrivenSection = (section: any) => {
  if (!section) return false;
  if (section.userDefined === true || section.isUserDefined === true) return true;
  if (typeof section.source === 'string' && section.source.toLowerCase() === 'user') return true;
  if (section.origin === 'user') return true;
  const id = typeof section.id === 'string' ? section.id : '';
  return id.startsWith('topic-');
};

const calculateContributionMix = (variant: Variant) => {
  const sections = Array.isArray(variant.outline.sections) ? variant.outline.sections : [];
  const totalDurationFromSections = sections.reduce((sum, section) => {
    return sum + Math.max(0, toNumber(section?.duration));
  }, 0);
  const fallbackTotal = Math.max(toNumber(variant.outline.totalDuration), 0);
  const totalDuration = totalDurationFromSections > 0 ? totalDurationFromSections : fallbackTotal;
  const safeTotal = totalDuration > 0 ? totalDuration : Math.max(sections.length * 10, 1);

  const userDuration = sections.reduce((sum, section) => {
    if (!isUserDrivenSection(section)) {
      return sum;
    }
    return sum + Math.max(0, toNumber(section?.duration));
  }, 0);

  const userShare = Math.min(userDuration / safeTotal, 1);
  const remainingShare = Math.max(0, 1 - userShare);
  const normalizedRagWeight = clamp(
    Number.isFinite(variant.ragWeight) ? variant.ragWeight : toNumber(variant.ragWeight)
  );
  const ragShare = remainingShare * normalizedRagWeight;
  const aiShare = Math.max(0, remainingShare - ragShare);

  let ragPercent = Math.round(ragShare * 100);
  let aiPercent = Math.round(aiShare * 100);
  let userPercent = Math.round(userShare * 100);

  const totalPercent = ragPercent + aiPercent + userPercent;
  if (totalPercent !== 100) {
    const diff = 100 - totalPercent;
    if (diff > 0) {
      if (aiPercent >= ragPercent && aiPercent >= userPercent) {
        aiPercent += diff;
      } else if (ragPercent >= userPercent) {
        ragPercent += diff;
      } else {
        userPercent += diff;
      }
    } else {
      const adjustmentTargets: Array<{ key: 'ai' | 'rag' | 'user'; value: number }> = [
        { key: 'ai', value: aiPercent },
        { key: 'rag', value: ragPercent },
        { key: 'user', value: userPercent },
      ];
      adjustmentTargets.sort((a, b) => b.value - a.value);

      for (const target of adjustmentTargets) {
        if (target.value === 0) continue;
        if (target.key === 'ai') {
          aiPercent = Math.max(0, aiPercent + diff);
        } else if (target.key === 'rag') {
          ragPercent = Math.max(0, ragPercent + diff);
        } else {
          userPercent = Math.max(0, userPercent + diff);
        }
        break;
      }
    }
  }

  return { aiPercent, ragPercent, userPercent };
};

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onSelect,
  onSaveForLater,
  selectedVariantId,
  isLoading = false,
  loadingProgress = 0,
  loadingStage = ''
}) => {
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  // Simulate progress updates
  React.useEffect(() => {
    if (!isLoading) {
      setCurrentStageIndex(0);
      return;
    }

    setCurrentStageIndex(0);

    const interval = setInterval(() => {
      setCurrentStageIndex(prev => {
        if (prev < loadingStages.length - 1) return prev + 1;
        return prev;
      });
    }, 3000); // Change stage every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading]);

  // Allow external loading progress to advance the animation if provided
  React.useEffect(() => {
    if (!isLoading) {
      return;
    }

    if (typeof loadingProgress !== 'number') {
      return;
    }

    const targetIndex = loadingStages.reduce((acc, stage, index) => {
      return loadingProgress >= stage.progress ? index : acc;
    }, 0);

    setCurrentStageIndex(prev => Math.max(prev, targetIndex));
  }, [isLoading, loadingProgress]);

  if (isLoading) {
    const currentStage = loadingStages[currentStageIndex];
    const progressValue = typeof loadingProgress === 'number'
      ? Math.min(
          100,
          Math.max(currentStage.progress, Math.round(loadingProgress))
        )
      : currentStage.progress;

    return (
      <div className="flex items-center justify-center py-8 sm:py-12 md:py-16 px-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-4 sm:mb-6">
            <div className="text-4xl sm:text-5xl md:text-6xl animate-bounce mb-3 sm:mb-4">{currentStage.icon}</div>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 px-2">
            {currentStage.message}
          </h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 mb-3 sm:mb-4">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressValue}%` }}
            />
          </div>

          <p className="text-xs sm:text-sm text-gray-500">
            Generating 4 variants... {progressValue}%
          </p>

          {/* Fun tip */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>Pro tip:</strong> The more specific your desired outcome, the better the AI can tailor your session!
            </p>
          </div>

          {/* Live progress log (optional) */}
          {loadingStage && (
            <div className="mt-3 sm:mt-4 text-left bg-gray-50 p-2.5 sm:p-3 rounded text-xs font-mono text-gray-600">
              <div className="opacity-50">✓ RAG query sent...</div>
              <div className="opacity-75">✓ Found relevant sources...</div>
              <div className="text-blue-600">⏳ {loadingStage}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Choose Your Session Outline</h2>
        <p className="text-xs sm:text-sm text-gray-600 px-2">
          Select the variant that best fits your needs. You can edit it in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {variants.map((variant) => {
          const [showSources, setShowSources] = React.useState(false);
          const contribution = calculateContributionMix(variant);
          const isSelected = selectedVariantId === variant.id;

          return (
            <div
              key={variant.id}
              className={`border rounded-lg p-4 sm:p-5 md:p-6 transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-500 ring-opacity-50'
                  : 'border-gray-200 hover:shadow-lg hover:border-blue-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900">{variant.label}</h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{variant.description}</p>
                </div>
                <div
                  className="flex flex-col items-end text-[11px] text-gray-600"
                  data-testid={`variant-${variant.id}-mix`}
                >
                  <span className="uppercase text-[10px] font-semibold tracking-wide text-gray-500">
                    Contribution mix
                  </span>
                  <div className="mt-1 space-y-0.5 text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />
                      <span>AI {contribution.aiPercent}%</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-purple-500" aria-hidden="true" />
                      <span>RAG {contribution.ragPercent}%</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                      <span>End User {contribution.userPercent}%</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* RAG Sources Badge */}
              {variant.ragSources && variant.ragSources.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <span>📚 Based on {variant.ragSourcesUsed} knowledge base source{variant.ragSourcesUsed !== 1 ? 's' : ''}</span>
                    <span className="text-blue-500">{showSources ? '▼' : '▶'}</span>
                  </button>
                </div>
              )}

              {/* RAG Sources List (Expandable) */}
              {showSources && variant.ragSources && variant.ragSources.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-900 mb-2">Knowledge Base Sources:</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {variant.ragSources.map((source, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-blue-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate" title={source.filename}>
                              📄 {source.filename}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {source.excerpt}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              {Math.round(source.similarity * 100)}%
                            </span>
                            {source.category && (
                              <p className="text-xs text-gray-500 mt-1">{source.category}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {variant.outline.suggestedSessionTitle}
                </p>
                <p className="text-xs text-gray-500">
                  {variant.outline.sections.length} sections • {variant.outline.totalDuration} min
                </p>

                {/* Detailed section list with descriptions */}
                <div className="space-y-2 sm:space-y-3 mt-2 sm:mt-3">
                  {variant.outline.sections.map((section: any) => (
                    <div key={section.id} className="border-l-2 border-blue-200 pl-2 sm:pl-3">
                      <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                        <span className="text-xs font-semibold text-gray-900">
                          • {section.title}
                        </span>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          ({section.duration} min)
                        </span>
                      </div>
                      {section.description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onSelect(variant.id)}
                  className={`flex-1 text-sm sm:text-base ${
                    isSelected
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }`}
                  variant={isSelected ? 'default' : 'default'}
                  aria-label={isSelected ? 'Selected' : 'Select & Edit'}
                >
                  {isSelected ? (
                    <>
                      <svg className="h-4 w-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline" aria-hidden="true">Selected</span>
                      <span className="sm:hidden" aria-hidden="true">✓</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline" aria-hidden="true">Select & Edit</span>
                      <span className="sm:hidden" aria-hidden="true">Select</span>
                    </>
                  )}
                </Button>
                {onSaveForLater && (
                  <Button
                    onClick={() => onSaveForLater(variant.id)}
                    variant="outline"
                    size="sm"
                    title="Save for later"
                    className="px-3"
                  >
                    💾
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
