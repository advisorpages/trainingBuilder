import React, { useState, useEffect } from 'react';
import { aiPromptService, PromptTemplate } from '../../services/ai-prompt.service';
import { aiContentService, AIContentResponse } from '../../services/ai-content.service';

interface AIContentSectionProps {
  sessionData: any;
  isExpanded: boolean;
  onToggle: () => void;
  onContentGenerated?: (content: any) => void;
}

export const AIContentSection: React.FC<AIContentSectionProps> = ({
  sessionData,
  isExpanded,
  onToggle,
  onContentGenerated
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'prompt' | 'mode-select' | 'content'>('select');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [generationMode, setGenerationMode] = useState<'manual' | 'automated'>('manual');
  const [jsonResponse, setJsonResponse] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');

  // Load templates when component mounts or expands
  useEffect(() => {
    if (isExpanded && templates.length === 0) {
      loadTemplates();
    }
  }, [isExpanded]);

  // Auto-select marketing template when session data is sufficient
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate && sessionData.title && sessionData.startTime) {
      const marketingTemplate = templates.find(t => t.id === 'session-marketing-copy');
      if (marketingTemplate) {
        setSelectedTemplate(marketingTemplate);
      }
    }
  }, [templates, sessionData, selectedTemplate]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const loadedTemplates = await aiPromptService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Fallback to local templates
      setTemplates(aiPromptService.getLocalTemplates());
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Step 1: Generate AI Prompt
  const handleGeneratePrompt = async () => {
    if (!selectedTemplate || !sessionData.title) {
      setError('Please ensure you have a session title and template selected');
      return;
    }

    try {
      setIsGeneratingPrompt(true);
      setError('');

      // Generate prompt using the AI prompt service
      const prompt = await aiPromptService.generatePrompt({
        templateId: selectedTemplate.id,
        sessionData: {
          title: sessionData.title,
          description: sessionData.description || '',
          startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
          endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
          audience: sessionData.audienceId ? { name: 'Target Audience' } : undefined,
          tone: sessionData.toneId ? { name: 'Professional' } : undefined,
          category: sessionData.categoryId ? { name: 'Leadership' } : undefined,
          topics: sessionData.topicIds?.length > 0 ? [{ name: 'Communication Skills' }] : undefined,
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
        // Real AI content generation
        const contentRequest = {
          prompt: generatedPrompt,
          sessionData: {
            title: sessionData.title || 'Untitled Session',
            description: sessionData.description || 'No description provided',
            startTime: sessionData.startTime ? new Date(sessionData.startTime) : new Date(),
            endTime: sessionData.endTime ? new Date(sessionData.endTime) : new Date(Date.now() + 2 * 60 * 60 * 1000),
            maxRegistrations: sessionData.maxRegistrations || 50,
            audience: sessionData.audienceId ? { name: 'Target Audience' } : undefined,
            tone: sessionData.toneId ? { name: 'Professional' } : undefined,
            category: sessionData.categoryId ? { name: 'Leadership' } : undefined,
            topics: sessionData.topicIds?.length > 0 ? [{ name: 'Communication Skills' }] : undefined,
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

  // Handle manual JSON parsing
  const handleParseJSON = () => {
    setParseError('');
    try {
      // Clean up common JSON formatting issues from ChatGPT
      let cleanedJson = jsonResponse
        .replace(/\\\[/g, '[')  // Replace \[ with [
        .replace(/\\\]/g, ']')  // Replace \] with ]
        .replace(/\\\"/g, '"')  // Replace \" with " (if outside strings)
        .trim();

      // Remove any markdown formatting that might be present
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedJson);
      setGeneratedContent(parsed);
      setCurrentStep('content');

      if (onContentGenerated && parsed) {
        onContentGenerated(parsed);
      }
    } catch (error) {
      setParseError('Invalid JSON format. Please check your input and try again. Common issues: escaped brackets (\\[ \\]) should be [ ], and remove any ```json formatting.');
    }
  };


  const handleApplyToSession = (field: string, value: string) => {
    // This would update the parent form fields
    if (onContentGenerated) {
      onContentGenerated({ [field]: value });
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

      <div className="p-4 space-y-4">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          {isLoadingTemplates ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Loading templates...</span>
            </div>
          ) : (
            <select
              value={selectedTemplate?.id || ''}
              onChange={(e) => {
                const template = templates.find(t => t.id === e.target.value);
                setSelectedTemplate(template || null);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select content type...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-2 mb-4">
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'select' ? 'bg-blue-100 text-blue-700' :
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
        {currentStep === 'select' && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleGeneratePrompt}
              disabled={!selectedTemplate || isGeneratingPrompt || !sessionData.title}
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
                onClick={() => setCurrentStep('select')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                ← Back to Template Selection
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
                <p className="text-sm text-red-600">{parseError}</p>
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
              onClick={() => setCurrentStep('select')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Change Template
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
                    {generatedContent.headlines.map((headline: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={headline}
                          readOnly
                          className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => handleApplyToSession('title', headline)}
                          className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Use as Title
                        </button>
                      </div>
                    ))}
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
                      readOnly
                      rows={3}
                      className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyToSession('description', generatedContent.description)}
                      className="px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                    >
                      Use Description
                    </button>
                  </div>
                </div>
              )}

              {/* Social Media */}
              {generatedContent.socialMedia && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Posts</label>
                  <div className="space-y-2">
                    {generatedContent.socialMedia.map((post: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <textarea
                          value={post}
                          readOnly
                          rows={2}
                          className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(post)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Benefits */}
              {generatedContent.keyBenefits && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Benefits</label>
                  <div className="space-y-1">
                    {generatedContent.keyBenefits.map((benefit: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2">
                          ✓ {benefit}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(benefit)}
                          className="px-3 py-2 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
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
                      readOnly
                      rows={6}
                      className="flex-1 text-xs bg-white border border-gray-200 rounded px-3 py-2 font-mono"
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
                      readOnly
                      className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-2 font-medium"
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

            </div>
          </div>
        )}
      </div>
    </div>
  );
};