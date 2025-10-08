import * as React from 'react';
import { Button } from '../ui';

interface RagSource {
  filename: string;
  category: string;
  similarity: number;
  excerpt: string;
  createdAt?: string;
}

interface Variant {
  id: string;
  outline: {
    suggestedSessionTitle: string;
    sections: any[];
    totalDuration: number;
  };
  generationSource: 'rag' | 'baseline';
  ragWeight: number;
  ragSourcesUsed: number;
  ragSources?: RagSource[];
  label: string;
  description: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
  onSaveForLater?: (variantId: string) => void;
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

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  onSelect,
  onSaveForLater,
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

          return (
            <div
              key={variant.id}
              className="border border-gray-200 rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-lg hover:border-blue-300 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base sm:text-lg text-gray-900">{variant.label}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{variant.description}</p>
                </div>
                <span
                  className={`flex-shrink-0 ml-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    variant.generationSource === 'rag'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {variant.generationSource === 'rag' ? 'RAG' : 'AI'}
                </span>
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
                  className="flex-1 text-sm sm:text-base"
                  variant="default"
                  aria-label="Select & Edit"
                >
                  <span className="hidden sm:inline" aria-hidden="true">Select & Edit</span>
                  <span className="sm:hidden" aria-hidden="true">Select</span>
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
