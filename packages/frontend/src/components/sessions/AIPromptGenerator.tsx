import React, { useState, useEffect } from 'react';
import { Session } from '../../../../shared/src/types';
import { aiPromptService, PromptTemplate, PromptGenerationRequest } from '../../services/ai-prompt.service';
import { aiContentService, AIContentResponse } from '../../services/ai-content.service';
import { AIContentDisplay } from './AIContentDisplay';

interface AIPromptGeneratorProps {
  session?: Session;
  sessionData: any; // Form data from SessionForm
  onPromptGenerated: (prompt: string, templateId: string) => void;
  onClose: () => void;
}

export const AIPromptGenerator: React.FC<AIPromptGeneratorProps> = ({
  sessionData,
  onPromptGenerated,
  onClose
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'select' | 'preview' | 'review'>('select');

  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Content generation state
  const [showContentDisplay, setShowContentDisplay] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<AIContentResponse | null>(null);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const availableTemplates = await aiPromptService.getTemplates();
        setTemplates(availableTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to local templates
        setTemplates(aiPromptService.getLocalTemplates());
      } finally {
        setLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate && activeTab === 'preview') {
      generatePreview();
    }
  }, [selectedTemplate, sessionData, customVariables, activeTab]);

  const generatePreview = () => {
    if (!selectedTemplate) return;

    try {
      const preview = aiPromptService.previewPrompt(selectedTemplate.id, {
        ...sessionData,
        audience: sessionData.audienceId ? { id: 1, name: 'Selected Audience', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
        tone: sessionData.toneId ? { id: 1, name: 'Selected Tone', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
        category: sessionData.categoryId ? { id: 1, name: 'Selected Category', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
        topics: sessionData.topicIds?.length > 0 ? [{ id: 1, name: 'Selected Topics', isActive: true, createdAt: new Date(), updatedAt: new Date() }] : undefined,
      });
      setGeneratedPrompt(preview);
    } catch (error) {
      setGeneratedPrompt(`Error generating preview: ${(error as Error).message}`);
    }
  };

  const handleGeneratePrompt = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    setActiveTab('review');

    try {
      const request: PromptGenerationRequest = {
        templateId: selectedTemplate.id,
        sessionData: {
          title: sessionData.title,
          description: sessionData.description,
          startTime: new Date(sessionData.startTime),
          endTime: new Date(sessionData.endTime),
          maxRegistrations: sessionData.maxRegistrations,
          // These would be populated from actual selected data
          audience: sessionData.audienceId ? { id: 1, name: 'Target Audience', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
          tone: sessionData.toneId ? { id: 1, name: 'Professional', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
          category: sessionData.categoryId ? { id: 1, name: 'Leadership', isActive: true, createdAt: new Date(), updatedAt: new Date() } : undefined,
          topics: sessionData.topicIds?.length > 0 ? [{ id: 1, name: 'Communication Skills', isActive: true, createdAt: new Date(), updatedAt: new Date() }] : undefined,
        },
        customVariables
      };

      const finalPrompt = await aiPromptService.generatePrompt(request);
      setGeneratedPrompt(finalPrompt);
    } catch (error) {
      setGeneratedPrompt(`Error generating prompt: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptPrompt = () => {
    if (selectedTemplate && generatedPrompt) {
      onPromptGenerated(generatedPrompt, selectedTemplate.id);
    }
  };

  const handleGenerateContent = async () => {
    if (!generatedPrompt) return;

    setIsGeneratingContent(true);
    setShowContentDisplay(true);

    try {
      const contentRequest = {
        prompt: generatedPrompt,
        sessionData: {
          title: sessionData.title,
          description: sessionData.description,
          startTime: new Date(sessionData.startTime),
          endTime: new Date(sessionData.endTime),
          maxRegistrations: sessionData.maxRegistrations,
          audience: sessionData.audienceId ? { name: 'Target Audience' } : undefined,
          tone: sessionData.toneId ? { name: 'Professional' } : undefined,
          category: sessionData.categoryId ? { name: 'Leadership' } : undefined,
          topics: sessionData.topicIds?.length > 0 ? [{ name: 'Communication Skills' }] : undefined,
        }
      };

      const content = await aiContentService.generateContent(contentRequest);
      setGeneratedContent(content);
    } catch (error) {
      console.error('Error generating content:', error);
      // Could show error notification here
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSaveContent = async (content: AIContentResponse) => {
    if (!sessionData.id) return;

    try {
      await aiContentService.saveContentToSession(sessionData.id, content);
      // Could show success notification here
    } catch (error) {
      console.error('Error saving content:', error);
      throw error;
    }
  };

  const handleRegenerateContent = () => {
    handleGenerateContent();
  };

  const handleRegenerateSpecific = async (contentTypes: string[], feedback?: string, parameters?: any) => {
    if (!generatedPrompt || !generatedContent) return;

    setIsGeneratingContent(true);

    try {
      const regenerationRequest = {
        prompt: generatedPrompt,
        sessionData: {
          title: sessionData.title,
          description: sessionData.description,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          audience: sessionData.audience,
          tone: sessionData.tone,
          category: sessionData.category,
          topics: sessionData.topics,
          maxRegistrations: sessionData.maxRegistrations
        },
        contentTypes,
        userFeedback: feedback,
        regenerationParameters: parameters,
        previousContent: generatedContent.contents
      };

      const newContent = await aiContentService.regenerateContent(regenerationRequest);

      // Merge regenerated content with existing content
      const updatedContents = generatedContent.contents.map(existingContent => {
        const regeneratedContent = newContent.contents.find(c => c.type === existingContent.type);
        return regeneratedContent || existingContent;
      });

      setGeneratedContent({
        ...generatedContent,
        contents: updatedContents,
        generatedAt: new Date(),
        version: (generatedContent.version || 1) + 1
      });
    } catch (error) {
      console.error('Error regenerating specific content:', error);
      throw error;
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleRestoreVersion = async (versionIndex: number) => {
    if (!sessionData.id) return;

    try {
      await aiContentService.restoreContentVersion(sessionData.id, versionIndex);

      // Refresh the content display by getting the updated content
      const updatedContent = await aiContentService.getSessionContent(sessionData.id);
      if (updatedContent.content) {
        const parsedContent = aiContentService.parseSavedContent(updatedContent.content);
        if (parsedContent) {
          setGeneratedContent(parsedContent);
        }
      }
    } catch (error) {
      console.error('Error restoring content version:', error);
      throw error;
    }
  };

  const handleContentIntegrated = () => {
    // Content has been integrated, could show success message
    // or refresh the session data if needed
    console.log('Content successfully integrated to draft');
  };

  const handleCustomVariableChange = (key: string, value: string) => {
    setCustomVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">AI Prompt Generator</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create AI prompts for generating content based on your session details
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="mt-4">
              <nav className="flex space-x-8">
                {[
                  { id: 'select', name: 'Select Template', icon: '📝' },
                  { id: 'preview', name: 'Preview', icon: '👀', disabled: !selectedTemplate },
                  { id: 'review', name: 'Review & Edit', icon: '✏️', disabled: !generatedPrompt }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id as any)}
                    disabled={tab.disabled}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : tab.disabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {/* Template Selection Tab */}
            {activeTab === 'select' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Choose a Prompt Template</h4>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading templates...</span>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1">
                    {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <div className="flex items-start">
                        <div className="flex h-5 items-center">
                          <input
                            type="radio"
                            name="template"
                            checked={selectedTemplate?.id === template.id}
                            onChange={() => setSelectedTemplate(template)}
                            className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <label className="font-medium text-gray-900">{template.name}</label>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              template.category === 'marketing_copy'
                                ? 'bg-green-100 text-green-800'
                                : template.category === 'trainer_guide'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {template.category.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {template.variables.slice(0, 5).map((variable) => (
                              <span
                                key={variable}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {variable}
                              </span>
                            ))}
                            {template.variables.length > 5 && (
                              <span className="text-xs text-gray-500">
                                +{template.variables.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && selectedTemplate && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Prompt Preview</h4>
                  <span className="text-sm text-gray-500">Template: {selectedTemplate.name}</span>
                </div>

                {/* Custom Variables */}
                {selectedTemplate.variables.some(v => !['title', 'description', 'duration', 'audience', 'tone', 'category', 'topics', 'maxRegistrations'].includes(v)) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">Custom Variables</h5>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {selectedTemplate.variables
                        .filter(v => !['title', 'description', 'duration', 'audience', 'tone', 'category', 'topics', 'maxRegistrations'].includes(v))
                        .map((variable) => (
                          <div key={variable}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {variable.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                            <input
                              type="text"
                              value={customVariables[variable] || ''}
                              onChange={(e) => handleCustomVariableChange(variable, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder={`Enter ${variable}...`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Generated Prompt Preview</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white rounded border p-3 max-h-64 overflow-y-auto">
                    {generatedPrompt || 'Loading preview...'}
                  </div>
                </div>
              </div>
            )}

            {/* Review Tab */}
            {activeTab === 'review' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Review and Edit Prompt</h4>
                  {isGenerating && (
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Final AI Prompt
                  </label>
                  <textarea
                    value={generatedPrompt}
                    onChange={(e) => setGeneratedPrompt(e.target.value)}
                    rows={12}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                    placeholder="Your generated prompt will appear here..."
                  />
                  <p className="text-sm text-gray-500">
                    You can edit this prompt before using it to generate AI content.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              {activeTab === 'select' && selectedTemplate && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Preview Prompt
                </button>
              )}

              {activeTab === 'preview' && (
                <button
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Generate Prompt
                </button>
              )}

              {activeTab === 'review' && generatedPrompt && !isGenerating && (
                <>
                  <button
                    onClick={handleGenerateContent}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Generate Content
                  </button>
                  <button
                    onClick={handleAcceptPrompt}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Use This Prompt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Content Display Modal */}
      <AIContentDisplay
        isOpen={showContentDisplay}
        sessionData={sessionData}
        generatedContent={generatedContent}
        isGenerating={isGeneratingContent}
        onClose={() => setShowContentDisplay(false)}
        onRegenerateContent={handleRegenerateContent}
        onSaveContent={handleSaveContent}
        onRegenerateSpecific={handleRegenerateSpecific}
        onRestoreVersion={handleRestoreVersion}
        onContentIntegrated={handleContentIntegrated}
      />
    </div>
  );
};