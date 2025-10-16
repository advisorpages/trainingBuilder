import React, { useState, useEffect } from 'react';
import { aiPromptService, PromptTemplate } from '../../services/ai-prompt.service';
import { aiContentService, AIContentResponse } from '../../services/ai-content.service';
import { TONE_DEFAULTS } from '@leadership-training/shared';

const DEFAULT_MARKETING_TONE_NAME = TONE_DEFAULTS.MARKETING;

interface AIContentSectionProps {
  sessionData: any;
  audiences: any[]; // Loaded audiences data
  marketingTones: any[]; // Loaded marketing tones
  categories: any[]; // Loaded categories data
  topics: any[]; // Loaded topics data
  isExpanded: boolean;
  onToggle: () => void;
  onContentGenerated?: (content: any) => void;
}

export const AIContentSection: React.FC<AIContentSectionProps> = ({
  sessionData,
  audiences,
  marketingTones,
  categories,
  topics,
  isExpanded,
  onToggle,
  onContentGenerated
}) => {
  const [currentStep, setCurrentStep] = useState<'generate' | 'prompt' | 'mode-select' | 'content'>('generate');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<'manual' | 'automated'>('manual');
  const [jsonResponse, setJsonResponse] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string>('');

  useEffect(() => {
    if (sessionData?.aiGeneratedContent) {
      try {
        const content = typeof sessionData.aiGeneratedContent === 'string'
          ? JSON.parse(sessionData.aiGeneratedContent)
          : sessionData.aiGeneratedContent;
        
        if (content) {
          setGeneratedContent(content);
          setCurrentStep('content');
        }
      } catch (error) {
        console.error("Failed to parse existing aiGeneratedContent", error);
      }
    }
  }, [sessionData?.aiGeneratedContent]);

  // Hardcoded template for unified content generation
  const UNIFIED_TEMPLATE_ID = 'session-marketing-copy';

  // Generate AI Prompt for unified content
  const handleGeneratePrompt = async () => {
    if (!sessionData.title) {
      setError('Please ensure you have a session title');
      return;
    }

    try {
      setIsGeneratingPrompt(true);
      setError('');

      // Look up actual names from loaded dropdown data
      const selectedAudience = sessionData.audienceId ? audiences.find(a => a.id === Number(sessionData.audienceId)) : undefined;
      const selectedMarketingTone = sessionData.marketingToneId ? marketingTones.find(t => t.id === Number(sessionData.marketingToneId)) : undefined;
      const marketingToneForPrompt = selectedMarketingTone ?? { name: DEFAULT_MARKETING_TONE_NAME };
      const selectedCategory = sessionData.categoryId ? categories.find(c => c.id === Number(sessionData.categoryId)) : undefined;
      const selectedTopics = sessionData.topicIds?.length > 0 ? topics.filter(t => sessionData.topicIds.includes(t.id.toString())) : undefined;

      // Generate prompt using the unified template
      const prompt = await aiPromptService.generatePrompt({
        templateId: UNIFIED_TEMPLATE_ID,
        sessionData: {
          title: sessionData.title,
          description: sessionData.description || '',
          startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
          endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
          audience: selectedAudience,
          tone: marketingToneForPrompt,
          category: selectedCategory,
          topics: selectedTopics,
          maxRegistrations: sessionData.maxRegistrations || 50,
        }
      });

      setGeneratedPrompt(prompt);
      setCurrentStep('mode-select');

    } catch (error: any) {
      setError(error.message || 'Failed to generate prompt');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Step 2: Generate Content from Prompt
  const handleGenerateContent = async () => {
    if (!generatedPrompt) {
      setError('Please generate a prompt first');
      return;
    }

    try {
      setIsGeneratingContent(true);
      setError('');

      if (generationMode === 'automated') {
        // Look up actual names from loaded dropdown data
        const selectedAudience = sessionData.audienceId ? audiences.find(a => a.id === Number(sessionData.audienceId)) : undefined;
        const selectedMarketingTone = sessionData.marketingToneId ? marketingTones.find(t => t.id === Number(sessionData.marketingToneId)) : undefined;
        const marketingToneForPrompt = selectedMarketingTone ?? { name: DEFAULT_MARKETING_TONE_NAME };
        const selectedCategory = sessionData.categoryId ? categories.find(c => c.id === Number(sessionData.categoryId)) : undefined;
        const selectedTopics = sessionData.topicIds?.length > 0 ? topics.filter(t => sessionData.topicIds.includes(t.id.toString())) : undefined;

        // Real AI content generation
        const contentRequest = {
          prompt: generatedPrompt,
          sessionData: {
            title: sessionData.title || 'Untitled Session',
            description: sessionData.description || 'No description provided',
            startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
            endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
            maxRegistrations: sessionData.maxRegistrations || 50,
            audience: selectedAudience,
            tone: marketingToneForPrompt,
            category: selectedCategory,
            topics: selectedTopics,
          }
        };

        const aiContentResponse = await aiContentService.generateContent(contentRequest);

        // Convert AI response to display format
        const contentResponse: any = {};
        if (aiContentResponse?.contents) {
          aiContentResponse.contents.forEach((item: any) => {
            contentResponse[item.type] = item.content;
          });
        }

        setGeneratedContent(contentResponse);
        setCurrentStep('content');

        if (onContentGenerated && contentResponse) {
          onContentGenerated(contentResponse);
        }
      } else {
        // Manual mode - just proceed to show the prompt for copy/paste
        setCurrentStep('prompt');
      }

    } catch (error: any) {
      setError(error.message || 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Enhanced JSON cleaning function
  const cleanJSONString = (jsonStr: string): string => {
    let cleaned = jsonStr.trim();

    // Remove markdown formatting
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Remove any leading/trailing text that isn't JSON
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }

    // Fix common JSON issues
    cleaned = cleaned
      // Fix escaped brackets
      .replace(/\\\[/g, '[')
      .replace(/\\\]/g, ']')
      // Fix escaped forward slashes (unless needed)
      .replace(/\\\//g, '/')
      // Remove comments (// style)
      .replace(/\/\/.*$/gm, '')
      // Remove comments (/* */ style)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Fix trailing commas in objects and arrays
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix multiple consecutive quotes
      .replace(/""/g, '"')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove invisible characters
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();

    return cleaned;
  };

  // Get specific error location and message
  const getDetailedJSONError = (error: any, jsonStr: string): string => {
    let errorMsg = 'Invalid JSON format.';

    if (error.message.includes('position')) {
      const match = error.message.match(/position (\d+)/);
      if (match) {
        const pos = parseInt(match[1]);
        const lines = jsonStr.substring(0, pos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        errorMsg += ` Error at line ${line}, column ${column}.`;

        // Show context around error
        const contextLines = jsonStr.split('\n');
        if (contextLines[line - 1]) {
          errorMsg += `\n\nProblematic line: ${contextLines[line - 1]}`;
          errorMsg += `\n${' '.repeat(column - 1)}^`;
        }
      }
    }

    // Add specific suggestions based on error type
    if (error.message.includes('comma') || jsonStr.includes(',}') || jsonStr.includes(',]')) {
      errorMsg += '\n\n💡 Suggestion: Remove trailing commas before } or ]';
    } else if (error.message.includes('quote') || jsonStr.includes("'")) {
      errorMsg += '\n\n💡 Suggestion: Use double quotes (") for all strings, not single quotes (\')';
    } else if (jsonStr.includes('//') || jsonStr.includes('/*')) {
      errorMsg += '\n\n💡 Suggestion: Remove comments - JSON does not support // or /* */ comments';
    } else if (jsonStr.includes('```')) {
      errorMsg += '\n\n💡 Suggestion: Remove markdown formatting (```json blocks)';
    }

    return errorMsg;
  };

  // Handle manual JSON parsing with multiple cleaning attempts
  const handleParseJSON = () => {
    setParseError('');

    if (!jsonResponse.trim()) {
      setParseError('Please paste the JSON response from ChatGPT or your AI assistant.');
      return;
    }

    // Try multiple cleaning strategies
    const cleaningStrategies = [
      (str: string) => cleanJSONString(str), // Enhanced cleaning
      (str: string) => str.trim(), // Just trim
      (str: string) => cleanJSONString(str).replace(/'/g, '"'), // Replace single quotes
    ];

    for (let i = 0; i < cleaningStrategies.length; i++) {
      try {
        const cleanedJson = cleaningStrategies[i](jsonResponse);
        const parsed = JSON.parse(cleanedJson);

        // Validate that we have the expected structure
        if (typeof parsed !== 'object' || parsed === null) {
          throw new Error('Response must be a JSON object');
        }

        setGeneratedContent(parsed);
        setCurrentStep('content');

        if (onContentGenerated && parsed) {
          onContentGenerated(parsed);
        }
        return; // Success!

      } catch (error: any) {
        // If this is the last strategy, show detailed error
        if (i === cleaningStrategies.length - 1) {
          const cleanedJson = cleaningStrategies[0](jsonResponse);
          setParseError(getDetailedJSONError(error, cleanedJson));
        }
        // Otherwise, try next strategy
      }
    }
  };


  const handleApplyToSession = (field: string, value: string) => {
    // This would update the parent form fields
    if (onContentGenerated) {
      onContentGenerated({ [field]: value });
    }
  };

  const handleContentChange = (field: string, value: any) => {
    const newContent = {
      ...generatedContent,
      [field]: value
    };
    setGeneratedContent(newContent);
    if (onContentGenerated) {
      onContentGenerated(newContent);
    }
  };

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      setCacheMessage('');
      setError('');

      // Step 1: Clear the cache
      const result = await aiPromptService.clearTemplatesCache();

      // Step 2: Auto-regenerate prompt with fresh template (if session data is valid)
      if (sessionData?.title?.trim()) {
        try {
          // Look up actual names from loaded dropdown data
          const selectedAudience = sessionData.audienceId ? audiences.find(a => a.id === Number(sessionData.audienceId)) : undefined;
          const selectedMarketingTone = sessionData.marketingToneId ? marketingTones.find(t => t.id === Number(sessionData.marketingToneId)) : undefined;
          const marketingToneForPrompt = selectedMarketingTone ?? { name: DEFAULT_MARKETING_TONE_NAME };
          const selectedCategory = sessionData.categoryId ? categories.find(c => c.id === Number(sessionData.categoryId)) : undefined;
          const selectedTopics = sessionData.topicIds?.length > 0 ? topics.filter(t => sessionData.topicIds.includes(t.id.toString())) : undefined;

          // Generate prompt using the refreshed template
          const prompt = await aiPromptService.generatePrompt({
            templateId: UNIFIED_TEMPLATE_ID,
            sessionData: {
              title: sessionData.title,
              description: sessionData.description || '',
              startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
              endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
              audience: selectedAudience,
              tone: marketingToneForPrompt,
              category: selectedCategory,
              topics: selectedTopics,
              maxRegistrations: sessionData.maxRegistrations || 50,
            }
          });

          setGeneratedPrompt(prompt);
          setCacheMessage(`✅ Templates refreshed and prompt reloaded successfully! (${result.clearedCount} templates cleared)`);
        } catch (promptError: any) {
          setCacheMessage(`✅ ${result.message} (${result.clearedCount} templates cleared) - Warning: ${promptError.message}`);
        }
      } else {
        setCacheMessage(`✅ ${result.message} (${result.clearedCount} templates cleared)`);
      }

      // Clear the message after 7 seconds (longer due to more content)
      setTimeout(() => {
        setCacheMessage('');
      }, 7000);

    } catch (error: any) {
      setError(`Failed to clear cache: ${error.message}`);
    } finally {
      setIsClearingCache(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
            <span className="text-2xl">🤖</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI Content Enhancement</h3>
          <p className="text-sm text-gray-600 mb-4">
            Generate compelling promotional content, training materials, and marketing copy for your session
          </p>
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enhance with AI
          </button>
          <p className="mt-2 text-xs text-gray-500">
            Fill in session details above for better AI suggestions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">🤖</span>
            <h3 className="text-md font-medium text-gray-900">AI Content Enhancement</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear AI templates cache to reload from file system"
            >
              {isClearingCache ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700 mr-1"></div>
                  Clearing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Templates
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cache Message */}
        {cacheMessage && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
            {cacheMessage}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Content Type - Fixed to Marketing Copy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm font-medium text-blue-900">Complete Marketing Campaign</span>
            <span className="text-xs text-blue-600">• Promotional content for session marketing and landing pages</span>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-2 mb-4">
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'generate' ? 'bg-blue-100 text-blue-700' :
            ['mode-select', 'prompt', 'content'].includes(currentStep) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-4 h-4 mr-1">1</span>
            Generate Prompt
          </div>
          <div className="w-4 h-px bg-gray-300"></div>
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'mode-select' ? 'bg-blue-100 text-blue-700' :
            ['prompt', 'content'].includes(currentStep) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-4 h-4 mr-1">2</span>
            Choose Mode
          </div>
          <div className="w-4 h-px bg-gray-300"></div>
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'content' ? 'bg-green-100 text-green-700' :
            currentStep === 'prompt' && generationMode === 'manual' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-4 h-4 mr-1">3</span>
            {generationMode === 'manual' ? 'Paste & Review' : 'Generate Content'}
          </div>
        </div>

        {/* Step 1: Generate Prompt */}
        {currentStep === 'generate' && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleGeneratePrompt}
              disabled={isGeneratingPrompt || !sessionData.title}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPrompt ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Prompt...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Step 1: Generate AI Prompt
                </>
              )}
            </button>

            {!sessionData.title && (
              <p className="text-sm text-amber-600">
                ⚠️ Add a session title above to generate prompt
              </p>
            )}
          </div>
        )}

        {/* Step 2: Mode Selection */}
        {currentStep === 'mode-select' && (
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Choose Generation Mode</h5>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="manual-mode-section"
                    name="generation-mode-section"
                    type="radio"
                    checked={generationMode === 'manual'}
                    onChange={() => setGenerationMode('manual')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="manual-mode-section" className="ml-3 block text-sm font-medium text-gray-700">
                    Manual Generation (Recommended)
                  </label>
                </div>
                <p className="ml-7 text-xs text-gray-500">
                  Copy the prompt and paste it into ChatGPT manually, then paste the JSON response back here.
                </p>
                <div className="flex items-center">
                  <input
                    id="automated-mode-section"
                    name="generation-mode-section"
                    type="radio"
                    checked={generationMode === 'automated'}
                    onChange={() => setGenerationMode('automated')}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="automated-mode-section" className="ml-3 block text-sm font-medium text-gray-700">
                    Automated Generation
                  </label>
                </div>
                <p className="ml-7 text-xs text-gray-500">
                  Generate content automatically using the system's AI integration.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleGenerateContent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {generationMode === 'automated' ? 'Generate Content Automatically' : 'Continue with Manual Mode'}
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('generate')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Generate Prompt
              </button>
            </div>
          </div>
        )}

        {/* Step 3a: Manual Mode - Copy Prompt and Paste JSON */}
        {currentStep === 'prompt' && generationMode === 'manual' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Manual Generation Instructions</h5>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copy the enhanced prompt below using the "Copy to Clipboard" button</li>
                <li>2. Paste it into ChatGPT or your preferred AI assistant</li>
                <li>3. The AI will generate comprehensive promotional content in JSON format</li>
                <li>4. Copy the complete JSON response and paste it below</li>
              </ol>
              <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded p-2">
                <strong>💡 JSON Tips:</strong> The parser will automatically clean common issues like trailing commas,
                escaped brackets, and markdown formatting. Just paste the raw response!
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                ChatGPT JSON Response
              </label>
              <textarea
                value={jsonResponse}
                onChange={(e) => setJsonResponse(e.target.value)}
                rows={8}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                placeholder='Paste the complete JSON response here, e.g.:
{
  "headlines": ["Transform Your Leadership Impact", "Unlock Executive Presence"],
  "description": "Join us for this comprehensive leadership workshop...",
  "socialMedia": ["🚀 Ready to elevate your leadership?"],
  "keyBenefits": ["Develop authentic leadership presence"],
  ...
}'
              />
              {parseError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                  <div className="font-medium mb-1">JSON Parsing Error</div>
                  <pre className="whitespace-pre-wrap text-xs font-mono">{parseError}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleParseJSON}
                disabled={!jsonResponse.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Parse & Continue
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('mode-select')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Mode Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3b: Automated Mode - Show loading state when generating */}
        {currentStep === 'content' && isGeneratingContent && generationMode === 'automated' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              <span className="text-sm font-medium text-green-900">Generating content automatically...</span>
            </div>
          </div>
        )}

        {/* Content Generated - Show Regeneration Options */}
        {currentStep === 'content' && !isGeneratingContent && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (generationMode === 'automated') {
                  handleGenerateContent();
                } else {
                  setCurrentStep('prompt');
                }
              }}
              disabled={isGeneratingContent}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔄 {generationMode === 'automated' ? 'Regenerate Content' : 'Enter New JSON Response'}
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('mode-select')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Change Mode
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('generate')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Start Over
            </button>
          </div>
        )}

        {/* Generated Prompt Display (Step 1 Complete) */}
        {generatedPrompt && ['mode-select', 'prompt', 'content'].includes(currentStep) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-3">📝 Generated AI Prompt (AIDA/PAS Framework)</h4>
            <div className="bg-white rounded border p-3 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                {generatedPrompt}
              </pre>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  📋 Copy Full Prompt
                </button>
                <span className="text-xs text-blue-500">•</span>
                <span className="text-xs text-blue-600">
                  {generatedPrompt.length} characters
                </span>
              </div>
              {currentStep === 'mode-select' && (
                <span className="text-xs text-orange-600 font-medium">
                  📋 Choose generation mode above
                </span>
              )}
              {currentStep === 'prompt' && (
                <span className="text-xs text-green-600 font-medium">
                  ✅ Ready for AI content generation
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-blue-600">
              <strong>Frameworks:</strong> AIDA (Attention, Interest, Desire, Action) + PAS (Problem, Agitation, Solution) + Professional Marketing Best Practices
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Content Display (Step 2 Complete) */}
        {generatedContent && currentStep === 'content' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-3">✨ Generated Content</h4>

              {/* Headlines */}
              {generatedContent.headlines && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Headlines</label>
                  <div className="space-y-2">
                    {Array.isArray(generatedContent.headlines) ?
                      generatedContent.headlines.map((headline: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={headline}
                            onChange={(e) => {
                              const newHeadlines = [...generatedContent.headlines];
                              newHeadlines[index] = e.target.value;
                              handleContentChange('headlines', newHeadlines);
                            }}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyToSession('title', headline)}
                            className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Use as Title
                          </button>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(headline)}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Copy
                          </button>
                        </div>
                      )) :
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={generatedContent.headlines}
                          onChange={(e) => handleContentChange('headlines', e.target.value)}
                          className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyToSession('title', generatedContent.headlines)}
                          className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Use as Title
                        </button>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedContent.headlines)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  </div>
                </div>
              )}

              {/* Description */}
              {generatedContent.description && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Enhanced Description</label>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={generatedContent.description}
                      onChange={(e) => handleContentChange('description', e.target.value)}
                      rows={3}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyToSession('description', generatedContent.description)}
                      className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                    >
                      Use Description
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.description)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {generatedContent.socialMedia && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Posts</label>
                  <div className="space-y-2">
                    {Array.isArray(generatedContent.socialMedia) ?
                      generatedContent.socialMedia.map((post: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <textarea
                            value={post}
                            onChange={(e) => {
                              const newPosts = [...generatedContent.socialMedia];
                              newPosts[index] = e.target.value;
                              handleContentChange('socialMedia', newPosts);
                            }}
                            rows={2}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(post)}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      )) :
                      <div className="flex items-start space-x-2">
                        <textarea
                          value={generatedContent.socialMedia}
                          onChange={(e) => handleContentChange('socialMedia', e.target.value)}
                          rows={2}
                          className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedContent.socialMedia)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  </div>
                </div>
              )}

              {/* Key Benefits */}
              {generatedContent.keyBenefits && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Benefits</label>
                  <div className="space-y-1">
                    {Array.isArray(generatedContent.keyBenefits) ?
                      generatedContent.keyBenefits.map((benefit: string, index: number) => (
                        <div key={index} className="flex items-start space-x-2">
                          <input
                            type="text"
                            value={benefit}
                            onChange={(e) => {
                              const newBenefits = [...generatedContent.keyBenefits];
                              newBenefits[index] = e.target.value;
                              handleContentChange('keyBenefits', newBenefits);
                            }}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            placeholder={`Key benefit ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(benefit)}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                          >
                            Copy
                          </button>
                        </div>
                      )) :
                      <div className="flex items-start space-x-2">
                        <textarea
                          value={generatedContent.keyBenefits}
                          onChange={(e) => handleContentChange('keyBenefits', e.target.value)}
                          rows={3}
                          className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Key benefits"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedContent.keyBenefits)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  </div>
                </div>
              )}

              {/* Email Marketing Copy */}
              {generatedContent.emailCopy && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Marketing Copy</label>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={generatedContent.emailCopy}
                      onChange={(e) => handleContentChange('emailCopy', e.target.value)}
                      rows={6}
                      className="flex-1 text-xs bg-white border border-gray-300 rounded px-3 py-2 font-mono focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.emailCopy)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Call to Action */}
              {generatedContent.callToAction && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Call to Action</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedContent.callToAction}
                      onChange={(e) => handleContentChange('callToAction', e.target.value)}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 font-medium focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.callToAction)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Subheadlines */}
              {generatedContent.subheadlines && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subheadlines</label>
                  <div className="space-y-2">
                    {Array.isArray(generatedContent.subheadlines) ?
                      generatedContent.subheadlines.map((subheadline: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={subheadline}
                            onChange={(e) => {
                              const newSubheadlines = [...generatedContent.subheadlines];
                              newSubheadlines[index] = e.target.value;
                              handleContentChange('subheadlines', newSubheadlines);
                            }}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            placeholder={`Subheadline ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(subheadline)}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Copy
                          </button>
                        </div>
                      )) :
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={generatedContent.subheadlines}
                          onChange={(e) => handleContentChange('subheadlines', e.target.value)}
                          className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Subheadline"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedContent.subheadlines)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  </div>
                </div>
              )}

              {/* Who Is This For */}
              {generatedContent.whoIsThisFor && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Who Is This For</label>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={generatedContent.whoIsThisFor}
                      onChange={(e) => handleContentChange('whoIsThisFor', e.target.value)}
                      rows={3}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Target audience description"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.whoIsThisFor)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Why Attend */}
              {generatedContent.whyAttend && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Why Attend</label>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={generatedContent.whyAttend}
                      onChange={(e) => handleContentChange('whyAttend', e.target.value)}
                      rows={3}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Compelling reasons to attend"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.whyAttend)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Topics and Benefits */}
              {generatedContent.topicsAndBenefits && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topics and Benefits</label>
                  <div className="space-y-2">
                    {Array.isArray(generatedContent.topicsAndBenefits) ?
                      generatedContent.topicsAndBenefits.map((item: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newItems = [...generatedContent.topicsAndBenefits];
                              newItems[index] = e.target.value;
                              handleContentChange('topicsAndBenefits', newItems);
                            }}
                            className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                            placeholder={`Topic and benefit ${index + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(item)}
                            className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Copy
                          </button>
                        </div>
                      )) :
                      <div className="flex items-start space-x-2">
                        <textarea
                          value={generatedContent.topicsAndBenefits}
                          onChange={(e) => handleContentChange('topicsAndBenefits', e.target.value)}
                          rows={4}
                          className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Topics and benefits"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(generatedContent.topicsAndBenefits)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    }
                  </div>
                </div>
              )}

              {/* Emotional Call to Action */}
              {generatedContent.emotionalCallToAction && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emotional Call to Action</label>
                  <div className="flex items-start space-x-2">
                    <textarea
                      value={generatedContent.emotionalCallToAction}
                      onChange={(e) => handleContentChange('emotionalCallToAction', e.target.value)}
                      rows={2}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Emotionally compelling call-to-action"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.emotionalCallToAction)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Hero Headline */}
              {generatedContent.heroHeadline && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hero Headline</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedContent.heroHeadline}
                      onChange={(e) => handleContentChange('heroHeadline', e.target.value)}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Primary headline for hero section"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.heroHeadline)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Hero Subheadline */}
              {generatedContent.heroSubheadline && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hero Subheadline</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedContent.heroSubheadline}
                      onChange={(e) => handleContentChange('heroSubheadline', e.target.value)}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Supporting subheadline for hero section"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.heroSubheadline)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Registration Form CTA */}
              {generatedContent.registrationFormCTA && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Registration Form Button Text</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedContent.registrationFormCTA}
                      onChange={(e) => handleContentChange('registrationFormCTA', e.target.value)}
                      className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Registration button text (e.g., 'Save My Spot')"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(generatedContent.registrationFormCTA)}
                      className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};