import React, { useState, useEffect } from 'react';
import { aiPromptService, PromptTemplate } from '../../services/ai-prompt.service';

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
  const [currentStep, setCurrentStep] = useState<'select' | 'prompt' | 'content'>('select');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState<string>('');

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
      setCurrentStep('prompt');

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

      let contentResponse;

      // For marketing copy template, generate comprehensive content
      if (selectedTemplate?.id === 'session-marketing-copy') {
        contentResponse = generateMarketingContent(sessionData);
      } else {
        contentResponse = generateMockContent(sessionData);
      }

      setGeneratedContent(contentResponse);
      setCurrentStep('content');

      if (onContentGenerated && contentResponse) {
        onContentGenerated(contentResponse);
      }

    } catch (error: any) {
      setError(error.message || 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const generateMarketingContent = (data: any) => {
    const title = data.title || 'Leadership Training Session';
    const description = data.description || 'Professional development session';

    // Simulate a comprehensive marketing campaign response
    return {
      headlines: [
        `Transform Your Impact: ${title}`,
        `Master Excellence Through ${title}`,
        `Elevate Your Leadership with ${title}`,
        `Unlock Your Potential: ${title}`
      ],
      subheadlines: [
        `Join ${data.maxRegistrations || 50} professionals transforming their leadership approach`,
        `Proven strategies that deliver measurable results in your organization`,
        `From insights to action - practical tools you can implement immediately`
      ],
      description: `${description} This comprehensive session combines cutting-edge leadership research with practical application. You'll walk away with proven frameworks, actionable strategies, and the confidence to drive meaningful change in your organization. Perfect for leaders at all levels who are ready to amplify their impact and create lasting results.`,
      socialMedia: [
        `🚀 Transform your leadership impact! Join our ${title} and discover the frameworks that separate great leaders from the rest. Limited to ${data.maxRegistrations || 50} participants. #Leadership #ProfessionalGrowth`,
        `Ready to elevate your leadership game? 📈 Our ${title} delivers practical tools you can use immediately. Reserve your spot today! #LeadershipDevelopment`,
        `Leadership isn't just about managing—it's about inspiring excellence. Join ${title} and learn how to unlock your team's full potential! 💪 #Leadership #Management`
      ],
      emailCopy: `Subject: Transform Your Leadership Impact - ${title}

Dear [Name],

Are you ready to take your leadership to the next level?

Our upcoming ${title} is designed for ambitious professionals like you who want to make a real difference in their organizations.

What makes this session different:
✓ Practical frameworks you can implement immediately
✓ Interactive exercises with real workplace scenarios
✓ Proven strategies from successful leaders
✓ Small group format (max ${data.maxRegistrations || 50} participants) for personalized attention

You'll leave with:
- A clear action plan for your leadership development
- Tools to enhance team performance and engagement
- Strategies for navigating difficult conversations and decisions
- A network of like-minded professionals

This session fills up quickly. Reserve your spot today.

[Register Now Button]

Looking forward to supporting your leadership journey,
[Your Name]`,
      keyBenefits: [
        'Develop authentic leadership presence that inspires confidence and respect',
        'Master strategic communication techniques for influencing stakeholders',
        'Learn evidence-based frameworks for making tough decisions under pressure',
        'Build high-performing teams that consistently exceed expectations',
        'Navigate organizational change with clarity and confidence'
      ],
      callToAction: `Reserve your seat for ${title} - limited to ${data.maxRegistrations || 50} participants`,
      whoIsThisFor: `This session is ideal for mid-level managers, emerging leaders, department heads, and ambitious professionals who want to amplify their leadership impact. Whether you're leading a small team or preparing for executive roles, you'll gain practical tools to enhance your effectiveness and drive results.`,
      whyAttend: `This isn't theory-heavy training that you'll forget in a week. Every strategy and framework is immediately actionable and battle-tested by successful leaders. You'll leave with a clear roadmap for transformation and the confidence to implement changes that deliver measurable results in your organization.`,
      topicsAndBenefits: [
        'Authentic Leadership Presence: Build the gravitas and influence that commands respect',
        'Strategic Communication: Master the art of persuasion and stakeholder engagement',
        'Decision-Making Frameworks: Make tough calls with confidence and clarity',
        'Team Performance Optimization: Unlock your team\'s potential for exceptional results',
        'Change Leadership: Navigate uncertainty and drive transformation effectively'
      ],
      emotionalCallToAction: `Don't let another quarter pass wondering "what if?" Your team, your organization, and your career deserve the investment. Transform your leadership impact starting today.`,
      heroHeadline: `Master Leadership Excellence: ${title}`,
      heroSubheadline: `Join ${data.maxRegistrations || 50} ambitious professionals who are elevating their leadership game with proven frameworks and actionable strategies`,
      registrationFormCTA: 'Secure My Spot'
    };
  };

  const generateMockContent = (data: any) => {
    const title = data.title || 'Leadership Training Session';
    return {
      headlines: [
        `Transform Your Leadership Impact: ${title}`,
        `Master Professional Excellence in ${title}`,
        `Unlock Your Potential: ${title}`
      ],
      description: `Join us for this comprehensive ${title.toLowerCase()} that will transform how you lead and inspire others. This hands-on session combines proven leadership frameworks with practical exercises to deliver immediate, actionable results.`,
      socialMedia: [
        `🚀 Ready to transform your leadership style? Join our ${title} and discover the tools that set great leaders apart! #Leadership #ProfessionalDevelopment`,
        `Leadership isn't just about managing people—it's about inspiring excellence. Reserve your spot for ${title} today! 📈`,
        `Want to unlock your leadership potential? Our ${title} delivers the frameworks and strategies you need to succeed. Register now! 💪`
      ],
      keyBenefits: [
        'Develop authentic leadership presence that commands respect',
        'Master the art of influential communication and delegation',
        'Learn proven frameworks for making tough decisions under pressure',
        'Build high-performing teams that deliver exceptional results'
      ],
      callToAction: 'Reserve your spot today - transform your leadership impact!',
      heroHeadline: `Master Leadership Excellence: ${title}`,
      heroSubheadline: 'Join top professionals who are elevating their leadership game with proven strategies and frameworks'
    };
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
            currentStep === 'prompt' || currentStep === 'content' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-4 h-4 mr-1">1</span>
            Generate Prompt
          </div>
          <div className="w-4 h-px bg-gray-300"></div>
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            currentStep === 'content' ? 'bg-green-100 text-green-700' :
            currentStep === 'prompt' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <span className="w-4 h-4 mr-1">2</span>
            Generate Content
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

        {/* Step 2: Generate Content (after prompt is generated) */}
        {currentStep === 'prompt' && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={!generatedPrompt || isGeneratingContent}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingContent ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Content...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Step 2: Generate Marketing Content
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('select')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Template Selection
            </button>
          </div>
        )}

        {/* Content Generated - Show Regeneration Options */}
        {currentStep === 'content' && (
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleGenerateContent}
              disabled={isGeneratingContent}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🔄 Regenerate Content
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep('prompt')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Edit Prompt
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
        {generatedPrompt && (currentStep === 'prompt' || currentStep === 'content') && (
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