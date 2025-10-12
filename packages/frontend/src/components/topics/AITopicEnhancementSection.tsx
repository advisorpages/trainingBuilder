import React, { useState } from 'react';
import { TopicEnhancementInput, TopicAIContent, TopicEnhancementResponse } from '@leadership-training/shared';
import { aiTopicService } from '../../services/aiTopicService';

interface AITopicEnhancementSectionProps {
  input: TopicEnhancementInput;
  onContentGenerated: (content: TopicAIContent) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const AITopicEnhancementSection: React.FC<AITopicEnhancementSectionProps> = ({
  input,
  onContentGenerated,
  isExpanded,
  onToggle,
}) => {
  const [currentStep, setCurrentStep] = useState<'generate' | 'prompt' | 'mode-select' | 'content'>('generate');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<TopicAIContent | null>(null);
  const [error, setError] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<'manual' | 'automated'>('manual');
  const [jsonResponse, setJsonResponse] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  const handleGeneratePrompt = async () => {
    try {
      setIsGeneratingPrompt(true);
      setError('');

      const prompt = await aiTopicService.generatePrompt(input);
      setGeneratedPrompt(prompt);
      setCurrentStep('mode-select');
    } catch (error) {
      console.error('Error generating prompt:', error);
      setError('Failed to generate AI prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleModeSelect = (mode: 'manual' | 'automated') => {
    setGenerationMode(mode);
    if (mode === 'manual') {
      setCurrentStep('prompt');
    } else {
      handleAutomatedGeneration();
    }
  };

  const handleAutomatedGeneration = async () => {
    try {
      setIsGeneratingContent(true);
      setError('');

      const response: TopicEnhancementResponse = await aiTopicService.enhanceTopic(input);
      setGeneratedContent(response.aiContent);
      setCurrentStep('content');
      onContentGenerated(response.aiContent);
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate AI content. Please try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleManualSubmit = async () => {
    try {
      setIsGeneratingContent(true);
      setParseError('');
      setError('');

      if (!jsonResponse.trim()) {
        setParseError('Please paste the AI response');
        return;
      }

      // Validate JSON format
      if (!aiTopicService.validateAIResponse(jsonResponse)) {
        setParseError('Invalid AI response format. Please check the JSON structure.');
        return;
      }

      const response: TopicEnhancementResponse = await aiTopicService.parseAIResponse(input, jsonResponse);
      setGeneratedContent(response.aiContent);
      setCurrentStep('content');
      onContentGenerated(response.aiContent);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      setParseError('Failed to parse AI response. Please check the format and try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const resetFlow = () => {
    setCurrentStep('generate');
    setGeneratedPrompt('');
    setGeneratedContent(null);
    setJsonResponse('');
    setError('');
    setParseError('');
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-gray-900">AI Topic Enhancement</h4>
        {currentStep !== 'generate' && (
          <button
            onClick={resetFlow}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Start Over
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Step 1: Generate Initial Content */}
      {currentStep === 'generate' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate AI-enhanced topic content with specific guidance for both attendees and trainers.
          </p>

          <div className="bg-white p-4 rounded-md border border-gray-200">
            <h5 className="font-medium text-gray-900 mb-2">Enhancement Context:</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Topic:</span> {input.name}
              </div>
              <div>
                <span className="font-medium">Learning Outcome:</span> {input.learningOutcome}
              </div>
              <div>
                <span className="font-medium">Delivery Style:</span> {input.deliveryStyle || 'workshop'}
              </div>
              {input.sessionContext?.sessionTitle && (
                <div>
                  <span className="font-medium">Session:</span> {input.sessionContext.sessionTitle}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleGeneratePrompt}
            disabled={isGeneratingPrompt}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isGeneratingPrompt ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </span>
            ) : (
              'Generate AI Enhancement'
            )}
          </button>
        </div>
      )}

      {/* Step 2: Mode Selection */}
      {currentStep === 'mode-select' && (
        <div className="space-y-4">
          <h5 className="font-medium text-gray-900">Choose Generation Mode</h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleModeSelect('manual')}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="text-center">
                <h6 className="font-medium text-gray-900">Manual Mode</h6>
                <p className="text-sm text-gray-600 mt-1">
                  Copy prompt → Use with ChatGPT → Paste response
                </p>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect('automated')}
              className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={true} // Disabled for now until backend API is ready
            >
              <div className="text-center">
                <h6 className="font-medium text-gray-400">Automated Mode</h6>
                <p className="text-sm text-gray-400 mt-1">
                  Direct AI integration (Coming Soon)
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Manual Prompt Display */}
      {currentStep === 'prompt' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900">AI Prompt</h5>
            <button
              onClick={() => copyToClipboard(generatedPrompt)}
              className="text-sm bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
            >
              Copy Prompt
            </button>
          </div>

          <div className="bg-gray-100 p-4 rounded-md max-h-64 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap text-gray-800">
              {generatedPrompt}
            </pre>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h6 className="font-medium text-blue-800">Instructions:</h6>
            <ol className="text-sm text-blue-700 mt-2 space-y-1">
              <li>1. Copy the prompt above</li>
              <li>2. Paste it into ChatGPT or your preferred AI tool</li>
              <li>3. Copy the complete JSON response</li>
              <li>4. Paste the response below</li>
            </ol>
          </div>

          <div>
            <label htmlFor="aiResponse" className="block text-sm font-medium text-gray-700 mb-2">
              AI Response (JSON format)
            </label>
            <textarea
              id="aiResponse"
              value={jsonResponse}
              onChange={(e) => setJsonResponse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={8}
              placeholder="Paste the JSON response from ChatGPT here..."
            />
            {parseError && <p className="mt-1 text-sm text-red-600">{parseError}</p>}
          </div>

          <button
            onClick={handleManualSubmit}
            disabled={isGeneratingContent || !jsonResponse.trim()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isGeneratingContent ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </span>
            ) : (
              'Apply AI Enhancement'
            )}
          </button>
        </div>
      )}

      {/* Step 4: Generated Content Preview */}
      {currentStep === 'content' && generatedContent && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-900">Enhanced Topic Content</h5>
            <span className="text-sm text-green-600 font-medium">✓ Enhancement Applied</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Enhanced Name */}
            <div>
              <h6 className="font-medium text-gray-900">Enhanced Topic Name:</h6>
              <p className="text-sm text-gray-700 mt-1">
                {generatedContent.enhancedContent.attendeeSection.enhancedName}
              </p>
            </div>

            {/* Attendee Section */}
            <div>
              <h6 className="font-medium text-gray-900">For Attendees:</h6>
              <div className="text-sm text-gray-700 mt-1 space-y-2">
                <p><strong>What You'll Learn:</strong> {generatedContent.enhancedContent.attendeeSection.whatYoullLearn}</p>
                <p><strong>Who This Is For:</strong> {generatedContent.enhancedContent.attendeeSection.whoThisIsFor}</p>
                <div>
                  <strong>Key Takeaways:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {generatedContent.enhancedContent.attendeeSection.keyTakeaways.map((takeaway, index) => (
                      <li key={index}>{takeaway}</li>
                    ))}
                  </ul>
                </div>
                {generatedContent.enhancedContent.callToAction && (
                  <p><strong>Call to Action:</strong> {generatedContent.enhancedContent.callToAction}</p>
                )}
              </div>
            </div>

            {/* Trainer Section */}
            <div>
              <h6 className="font-medium text-gray-900">For Trainers:</h6>
              <div className="text-sm text-gray-700 mt-1 space-y-2">
                <p><strong>Delivery Format:</strong> {generatedContent.enhancedContent.trainerSection.deliveryFormat}</p>
                <p><strong>Preparation:</strong> {generatedContent.enhancedContent.trainerSection.preparationGuidance}</p>
                <div>
                  <strong>Key Teaching Points:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {generatedContent.enhancedContent.trainerSection.keyTeachingPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Recommended Activities:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {generatedContent.enhancedContent.trainerSection.recommendedActivities.map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>Materials Needed:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {generatedContent.enhancedContent.trainerSection.materialsNeeded.map((material, index) => (
                      <li key={index}>{material}</li>
                    ))}
                  </ul>
                </div>
                {generatedContent.enhancedContent.trainerSection.commonChallenges.length > 0 && (
                  <div>
                    <strong>Common Challenges:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {generatedContent.enhancedContent.trainerSection.commonChallenges.map((challenge, index) => (
                        <li key={index}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(generatedContent.enhancedContent.trainerSection.assessmentSuggestions ?? []).length > 0 && (
                  <div>
                    <strong>Assessment Suggestions:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      {(generatedContent.enhancedContent.trainerSection.assessmentSuggestions ?? []).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-700">
              ✓ Topic enhancement has been applied to the form. You can now save the topic with this AI-generated content.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
