import React, { useState, useEffect } from 'react';
import { promptsService, Prompt, PromptCategory } from '../services/prompts.service';
import { BuilderLayout } from '../layouts/BuilderLayout';

interface PromptSection {
  category: PromptCategory;
  title: string;
  description: string;
  prompt?: Prompt;
  isLoading: boolean;
  isSaving: boolean;
  editedTemplate: string;
}

const CORE_PROMPTS = [
  {
    category: PromptCategory.SESSION_GENERATION,
    title: 'Session Generation',
    description: 'Main prompt for generating training session outlines'
  },
  {
    category: PromptCategory.TITLE_CREATION,
    title: 'Title Creation',
    description: 'Prompt for generating session titles'
  },
  {
    category: PromptCategory.CONTENT_ENHANCEMENT,
    title: 'Content Enhancement',
    description: 'Prompt for enhancing training topics and content'
  },
  {
    category: PromptCategory.TRAINING_KIT,
    title: 'Training Kit Generation',
    description: 'Prompt for creating training materials and facilitator guides'
  },
  {
    category: PromptCategory.MARKETING_KIT,
    title: 'Marketing Kit Generation',
    description: 'Prompt for creating promotional content and session descriptions'
  }
];

interface PlaceholderInfo {
  code: string;
  description: string;
}

const getPlaceholdersForCategory = (category: PromptCategory): PlaceholderInfo[] => {
  const commonPlaceholders: PlaceholderInfo[] = [
    { code: '{{title}}', description: 'Session title' },
    { code: '{{category}}', description: 'Session category (e.g., Leadership, Sales)' },
    { code: '{{duration}}', description: 'Session duration in minutes' }
  ];

  const conditionalPlaceholders: PlaceholderInfo[] = [
    { code: '{{#if variable}}...{{/if}}', description: 'Conditional content block' },
    { code: '{{#if title}}Working title: {{title}}.{{/if}}', description: 'Example conditional usage' }
  ];

  switch (category) {
    case PromptCategory.SESSION_GENERATION:
      return [
        ...commonPlaceholders,
        { code: '{{sessionType}}', description: 'Type of session (workshop, seminar, etc.)' },
        { code: '{{desiredOutcome}}', description: 'What participants should achieve' },
        { code: '{{currentProblem}}', description: 'Problem the session addresses' },
        { code: '{{specificTopics}}', description: 'Specific topics to cover' },
        { code: '{{audienceSize}}', description: 'Expected number of participants' },
        ...conditionalPlaceholders
      ];

    case PromptCategory.TITLE_CREATION:
      return [
        { code: '{{category}}', description: 'Session category' },
        { code: '{{sessionType}}', description: 'Type of session' },
        { code: '{{desiredOutcome}}', description: 'What participants should achieve' },
        { code: '{{currentProblem}}', description: 'Problem the session addresses' },
        { code: '{{duration}}', description: 'Session duration in minutes' }
      ];

    case PromptCategory.CONTENT_ENHANCEMENT:
      return [
        { code: '{{audienceName}}', description: 'Target audience name' },
        { code: '{{toneName}}', description: 'Tone/style for the content' },
        { code: '{{topicName}}', description: 'Specific topic being enhanced' },
        { code: '{{learningOutcome}}', description: 'Expected learning outcome' },
        { code: '{{deliveryStyle}}', description: 'How content will be delivered' },
        { code: '{{sessionContext}}', description: 'Context of the training session' }
      ];

    case PromptCategory.TRAINING_KIT:
      return [
        { code: '{{sessionTitle}}', description: 'Title of the training session' },
        { code: '{{sessionOutline}}', description: 'Complete session outline' },
        { code: '{{audience}}', description: 'Target audience description' },
        { code: '{{duration}}', description: 'Session duration in minutes' }
      ];

    case PromptCategory.MARKETING_KIT:
      return [
        { code: '{{sessionTitle}}', description: 'Title of the training session' },
        { code: '{{sessionDescription}}', description: 'Description of the session' },
        { code: '{{keyBenefits}}', description: 'Key benefits participants will gain' },
        { code: '{{targetAudience}}', description: 'Who should attend this session' },
        { code: '{{duration}}', description: 'Session duration in minutes' }
      ];

    default:
      return commonPlaceholders;
  }
};

export const AISettingsPage: React.FC = () => {
  const [promptSections, setPromptSections] = useState<PromptSection[]>(
    CORE_PROMPTS.map(p => ({
      ...p,
      prompt: undefined,
      isLoading: true,
      isSaving: false,
      editedTemplate: ''
    }))
  );
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      // First try to seed defaults if they don't exist
      await promptsService.seedDefaultPrompts();

      // Then load all prompts
      const allPrompts = await promptsService.getAllPrompts();

      setPromptSections(prev => prev.map(section => {
        const prompt = allPrompts.find(p => p.category === section.category);
        return {
          ...section,
          prompt,
          isLoading: false,
          editedTemplate: prompt?.template || ''
        };
      }));
    } catch (error) {
      console.error('Failed to load prompts:', error);
      alert('Failed to load AI prompts. Please try refreshing the page.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSavePrompt = async (sectionIndex: number) => {
    const section = promptSections[sectionIndex];
    if (!section.prompt) return;

    setPromptSections(prev => prev.map((s, i) =>
      i === sectionIndex ? { ...s, isSaving: true } : s
    ));

    try {
      await promptsService.updatePrompt(section.prompt.id, {
        template: section.editedTemplate
      });

      alert('Prompt updated successfully!');

      // Update the prompt in state
      setPromptSections(prev => prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, prompt: { ...s.prompt!, template: s.editedTemplate }, isSaving: false }
          : s
      ));
    } catch (error) {
      console.error('Failed to save prompt:', error);
      alert('Failed to save prompt. Please try again.');
      setPromptSections(prev => prev.map((s, i) =>
        i === sectionIndex ? { ...s, isSaving: false } : s
      ));
    }
  };

  const handleTemplateChange = (sectionIndex: number, value: string) => {
    setPromptSections(prev => prev.map((s, i) =>
      i === sectionIndex ? { ...s, editedTemplate: value } : s
    ));
  };

  const hasChanges = (section: PromptSection) => {
    return section.prompt && section.editedTemplate !== section.prompt.template;
  };

  if (isInitializing) {
    return (
      <BuilderLayout
        title="AI Settings"
        subtitle="Loading AI prompts..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading...</div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      title="AI Settings"
      subtitle="Configure the AI prompts used throughout the application"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {promptSections.map((section, index) => (
            <div key={section.category} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{section.description}</p>
              </div>

              <div className="px-6 py-4">
                {section.isLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : section.prompt ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt Template
                      </label>
                      <textarea
                        value={section.editedTemplate}
                        onChange={(e) => handleTemplateChange(index, e.target.value)}
                        className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed resize-y"
                        placeholder="Enter your AI prompt template..."
                        rows={12}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date(section.prompt.updatedAt).toLocaleDateString()}
                      </div>

                      <button
                        onClick={() => handleSavePrompt(index)}
                        disabled={!hasChanges(section) || section.isSaving}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          hasChanges(section) && !section.isSaving
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {section.isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>

                    {/* Placeholder Reference */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Available Placeholders:</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        {getPlaceholdersForCategory(section.category).map((placeholder, idx) => (
                          <div key={idx} className="flex">
                            <code className="bg-white px-1 py-0.5 rounded mr-2 text-blue-700 font-mono">
                              {placeholder.code}
                            </code>
                            <span>{placeholder.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    No prompt found for this category. Try refreshing the page.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Tips for editing AI prompts
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use {`{{variable}}`} syntax for dynamic content (e.g., {`{{title}}`}, {`{{category}}`})</li>
                  <li>Use proper line breaks and spacing for readability</li>
                  <li>Format conditional blocks with proper indentation:</li>
                  <li className="ml-4 font-mono text-xs bg-blue-50 p-2 rounded">
                    {`{{#if variable}}`}<br/>
                    &nbsp;&nbsp;Content when variable exists.<br/>
                    {`{{/if}}`}
                  </li>
                  <li>Be specific about the desired output format and structure</li>
                  <li>Include examples in your prompts for better AI understanding</li>
                  <li>Test changes gradually - small edits often work better than major rewrites</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
};