import React from 'react';
import { SessionOutline, FlexibleSessionSection, sessionBuilderService } from '../../services/session-builder.service';

interface SessionOutlineDisplayProps {
  outline: SessionOutline;
  generationMetadata?: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
  onEdit: () => void;
  onApprove: () => void;
  onRegenerate: () => void;
  isProcessing?: boolean;
}

export const SessionOutlineDisplay: React.FC<SessionOutlineDisplayProps> = ({
  outline,
  generationMetadata,
  onEdit,
  onApprove,
  onRegenerate,
  isProcessing = false
}) => {
  const formatDuration = (minutes: number) => sessionBuilderService.formatDuration(minutes);

  // Handle legacy format conversion if needed
  const isFlexible = sessionBuilderService.isFlexibleOutline(outline);
  const isLegacy = sessionBuilderService.isLegacyOutline(outline);

  // For legacy format, show a different message
  if (isLegacy && !isFlexible) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-600 text-lg mb-2">🔄</div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Legacy Format Detected</h3>
          <p className="text-blue-700 mb-4">
            This session outline is in the old format. Please regenerate to get the new flexible structure with unlimited sections.
          </p>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Regenerate with New Format
          </button>
        </div>
      </div>
    );
  }

  const getIconForSection = (section: FlexibleSessionSection): React.ReactNode => {
    const iconMap: { [key: string]: { emoji: string; bgColor: string; textColor: string } } = {
      opener: { emoji: '🎯', bgColor: 'bg-green-100', textColor: 'text-green-600' },
      topic: { emoji: '📚', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
      exercise: { emoji: '🎮', bgColor: 'bg-purple-100', textColor: 'text-purple-600' },
      video: { emoji: '🎥', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      discussion: { emoji: '💬', bgColor: 'bg-indigo-100', textColor: 'text-indigo-600' },
      presentation: { emoji: '🎤', bgColor: 'bg-pink-100', textColor: 'text-pink-600' },
      inspiration: { emoji: '✨', bgColor: 'bg-yellow-100', textColor: 'text-yellow-600' },
      break: { emoji: '☕', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
      assessment: { emoji: '📋', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
      closing: { emoji: '🏁', bgColor: 'bg-red-100', textColor: 'text-red-600' },
      custom: { emoji: '⚙️', bgColor: 'bg-gray-100', textColor: 'text-gray-600' }
    };

    const config = iconMap[section.type] || iconMap.custom;
    const displayIcon = section.icon || config.emoji;

    return (
      <div className={`w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
        <span className={`${config.textColor} font-bold text-sm`}>{displayIcon}</span>
      </div>
    );
  };

  const FlexibleSectionCard: React.FC<{
    section: FlexibleSessionSection;
  }> = ({ section }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {getIconForSection(section)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <p className="text-sm text-gray-500">{formatDuration(section.duration)}</p>
            {section.type && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mt-1">
                {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </button>
      </div>

      <div className="space-y-3">
        {/* Description */}
        <p className="text-gray-700">{section.description}</p>

        {/* Learning Objectives */}
        {section.learningObjectives && section.learningObjectives.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {section.learningObjectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Exercise Properties */}
        {section.isExercise && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-purple-900">Interactive Exercise:</h4>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Exercise
              </span>
            </div>

            {section.exerciseInstructions && (
              <div className="mt-2 p-2 bg-white border border-purple-200 rounded">
                <h5 className="font-medium text-purple-900 text-xs mb-1">Instructions:</h5>
                <p className="text-purple-800 text-xs whitespace-pre-line">{section.exerciseInstructions}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              {section.exerciseType && (
                <span className="inline-block px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded">
                  {section.exerciseType.replace('-', ' ').toUpperCase()}
                </span>
              )}
              {section.engagementType && (
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {section.engagementType.replace('-', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Inspiration Properties */}
        {section.type === 'inspiration' && section.suggestions && section.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Content Suggestions:</h4>
            <ul className="space-y-2">
              {section.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></span>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Closing Properties */}
        {section.type === 'closing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.keyTakeaways && section.keyTakeaways.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Takeaways:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.keyTakeaways.map((takeaway, index) => (
                    <li key={index}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}
            {section.actionItems && section.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Action Items:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.actionItems.map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Discussion Properties */}
        {section.type === 'discussion' && section.discussionPrompts && section.discussionPrompts.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Discussion Prompts:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {section.discussionPrompts.map((prompt, index) => (
                <li key={index}>{prompt}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested Activities */}
        {section.suggestedActivities && section.suggestedActivities.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Suggested Activities:</h4>
            <div className="flex flex-wrap gap-2">
              {section.suggestedActivities.map((activity, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {activity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Materials Needed */}
        {section.materialsNeeded && section.materialsNeeded.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Materials Needed:</h4>
            <div className="flex flex-wrap gap-2">
              {section.materialsNeeded.map((material, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  {material}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Outcomes */}
        {section.learningOutcomes && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <h4 className="font-medium text-green-900 mb-2">Learning Outcomes:</h4>
            <p className="text-green-800 text-sm whitespace-pre-line">{section.learningOutcomes}</p>
          </div>
        )}

        {/* Trainer Notes */}
        {section.trainerNotes && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <h4 className="font-medium text-yellow-900 mb-2">Trainer Notes:</h4>
            <p className="text-yellow-800 text-sm whitespace-pre-line">{section.trainerNotes}</p>
          </div>
        )}

        {/* Delivery Guidance */}
        {section.deliveryGuidance && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <h4 className="font-medium text-blue-900 mb-2">Delivery Guidance:</h4>
            <p className="text-blue-800 text-sm whitespace-pre-line">{section.deliveryGuidance}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {outline.suggestedSessionTitle}
            </h2>
            <p className="text-gray-700 mb-4">{outline.suggestedDescription}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <strong>Total:</strong> {formatDuration(outline.totalDuration)}
              </span>
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Level:</strong> {outline.difficulty.charAt(0).toUpperCase() + outline.difficulty.slice(1)}
              </span>
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                <strong>Size:</strong> {outline.recommendedAudienceSize}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Metadata */}
      {generationMetadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Generated in {generationMetadata.processingTime}ms</span>
              <span>•</span>
              <span>{generationMetadata.topicsFound} relevant topics found</span>
              {generationMetadata.ragQueried && (
                <>
                  <span>•</span>
                  <span className="text-green-600">✓ AI-enhanced with knowledge base</span>
                </>
              )}
              {generationMetadata.fallbackUsed && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">⚠ Limited content sources available</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session Outline Sections - Flexible */}
      <div className="space-y-4">
        {outline.sections && outline.sections.length > 0 ? (
          // Sort sections by position and render them
          sessionBuilderService.sortSectionsByPosition(outline.sections).map((section) => (
            <FlexibleSectionCard key={section.id} section={section} />
          ))
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <div className="text-amber-600 text-lg mb-2">⚠️</div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">No Sections Found</h3>
            <p className="text-amber-700">
              This session outline appears to be empty or in an unsupported format.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onRegenerate}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Regenerate Outline
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onEdit}
            disabled={isProcessing}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Customize Outline
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Creating Session...' : 'Approve & Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
};