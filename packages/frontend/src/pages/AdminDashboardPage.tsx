import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminDashboardLayout } from '../layouts/AdminDashboardLayout';
import { promptsService, Prompt, PromptCategory } from '../services/prompts.service';
import { adminService, SystemHealth, SystemConfig, LogEntry } from '../services/admin.service';
import { AnalyticsTabContent } from '../components/admin/AnalyticsTabContent';
import { CategoriesTabContent } from '../components/admin/CategoriesTabContent';
import { AudiencesTabContent } from '../components/admin/AudiencesTabContent';
import { TonesTabContent } from '../components/admin/TonesTabContent';
import { AIInsightsTabContent } from '../components/admin/AIInsightsTabContent';
import SessionAITunerPage from './SessionAITunerPage';
import { ImportExportTabContent } from '../components/admin/ImportExportTabContent';
import { RagSettingsTabContent } from '../components/admin/RagSettingsTabContent';

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
    description: 'Executed when users click "Generate Outline" in the Session Builder. Creates a structured session outline with sections, durations, learning objectives, and activities based on session metadata (title, category, duration, etc.)'
  },
  {
    category: PromptCategory.TITLE_CREATION,
    title: 'Title Creation',
    description: 'Executed when users request a session title suggestion in the Session Builder. Generates an engaging, professional title (3-8 words) based on category, session type, desired outcome, and current problem'
  },
  {
    category: PromptCategory.CONTENT_ENHANCEMENT,
    title: 'Content Enhancement',
    description: 'Executed when enhancing individual training topics with audience and tone context. Enriches topic content with audience-tailored descriptions, learning objectives, trainer notes, materials needed, and delivery guidance based on selected audience profile and tone settings'
  },
  {
    category: PromptCategory.TRAINING_KIT,
    title: 'Training Kit Generation',
    description: 'Executed to generate comprehensive training materials including facilitator guides, participant handouts, activity instructions, assessment tools, and resource lists based on the complete session outline'
  },
  {
    category: PromptCategory.MARKETING_KIT,
    title: 'Marketing Kit Generation',
    description: 'Executed to create marketing materials including promotional headlines, course descriptions, key learning outcomes, target audience descriptions, and call-to-action copy for promoting the training session'
  }
];

type TabType = 'prompts' | 'config' | 'status' | 'logs' | 'analytics' | 'categories' | 'audiences' | 'tones' | 'ai-insights' | 'rag-settings' | 'import-export' | 'ai-tuner';

// Placeholder descriptions
const PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  // Session Generation & Title Creation
  title: 'The working title of the training session',
  category: 'The training category (e.g., Leadership, Communication)',
  sessionType: 'Type of session (e.g., Workshop, Seminar, Webinar)',
  desiredOutcome: 'The intended learning outcome or goal',
  duration: 'Session length in minutes',
  currentProblem: 'The problem or challenge being addressed',
  specificTopics: 'Specific topics or areas to cover',
  audienceSize: 'Expected number of participants',

  // Content Enhancement - Topic
  topicName: 'Name of the training topic being enhanced',
  learningOutcome: 'What participants will learn or achieve',
  deliveryStyle: 'How the content will be delivered (e.g., interactive, lecture)',
  sessionContext: 'Background context about the session',

  // Content Enhancement - Audience
  audienceName: 'Name of the audience profile',
  audienceDescription: 'General description of the audience characteristics',
  audienceExperienceLevel: 'Experience level (Beginner, Intermediate, Advanced, Mixed)',
  audienceTechnicalDepth: 'Technical depth rating (1-5 scale)',
  audienceCommunicationStyle: 'Preferred communication style (Formal, Conversational, Technical, Simplified)',
  audienceVocabularyLevel: 'Vocabulary complexity (Basic, Professional, Expert, Industry-Specific)',
  audienceLearningStyle: 'Preferred learning approach (e.g., visual, hands-on, theoretical)',
  audienceExampleTypes: 'Relevant example contexts (e.g., retail, healthcare)',
  audienceAvoidTopics: 'Topics to avoid in examples and discussions',
  audienceInstructions: 'Special instructions for tailoring content to this audience',

  // Content Enhancement - Tone
  toneName: 'Name of the tone profile',
  toneDescription: 'General description of the tone characteristics',
  toneStyle: 'Overall communication style (e.g., professional, casual, motivational)',
  toneFormality: 'Formality level (1-5 scale: 1=very casual, 5=very formal)',
  toneEnergyLevel: 'Energy and enthusiasm level (calm, moderate, energetic, passionate)',
  toneSentenceStructure: 'Preferred sentence structure (simple, moderate, complex, varied)',
  toneLanguageCharacteristics: 'Array of language traits (e.g., active-voice, direct, inclusive)',
  toneEmotionalResonance: 'Array of emotional qualities to convey (e.g., empathy, confidence, urgency)',
  toneExamplePhrases: 'Array of sample phrases that demonstrate the tone',
  toneInstructions: 'Special instructions for maintaining this tone',

  // Training Kit
  sessionTitle: 'The title of the training session',
  sessionOutline: 'Complete outline of the session structure',
  audience: 'Target audience description',

  // Marketing Kit
  sessionDescription: 'Full description of the session',
  keyBenefits: 'Key benefits participants will gain',
  targetAudience: 'Who should attend this session',

  // Validation
  content: 'Content to be validated',
  context: 'Context for the validation',
  criteria: 'Validation criteria or rules'
};

// Placeholder mappings for each prompt category
const PLACEHOLDER_MAPPINGS: Record<PromptCategory, string[]> = {
  [PromptCategory.SESSION_GENERATION]: [
    'title',
    'category',
    'sessionType',
    'desiredOutcome',
    'duration',
    'currentProblem',
    'specificTopics',
    'audienceSize',
    'audienceName',
    'audienceDescription',
    'audienceExperienceLevel',
    'audienceTechnicalDepth',
    'audienceCommunicationStyle',
    'audienceVocabularyLevel',
    'audienceLearningStyle',
    'audienceExampleTypes',
    'audienceAvoidTopics',
    'audienceInstructions',
    'toneName',
    'toneDescription',
    'toneStyle',
    'toneFormality',
    'toneEnergyLevel',
    'toneSentenceStructure',
    'toneLanguageCharacteristics',
    'toneEmotionalResonance',
    'toneExamplePhrases',
    'toneInstructions'
  ],
  [PromptCategory.TITLE_CREATION]: [
    'category',
    'sessionType',
    'desiredOutcome',
    'currentProblem',
    'duration',
    'audienceName',
    'audienceExperienceLevel',
    'audienceVocabularyLevel',
    'audienceCommunicationStyle',
    'toneName',
    'toneStyle',
    'toneFormality',
    'toneEnergyLevel',
    'toneLanguageCharacteristics'
  ],
  [PromptCategory.CONTENT_ENHANCEMENT]: [
    'topicName',
    'learningOutcome',
    'deliveryStyle',
    'sessionContext',
    'audienceName',
    'audienceExperienceLevel',
    'audienceTechnicalDepth',
    'audienceCommunicationStyle',
    'audienceVocabularyLevel',
    'audienceLearningStyle',
    'audienceExampleTypes',
    'audienceAvoidTopics',
    'audienceInstructions',
    'toneName',
    'toneStyle',
    'toneFormality',
    'toneEnergyLevel',
    'toneSentenceStructure',
    'toneLanguageTraits',
    'toneEmotionalQualities',
    'toneExamplePhrase',
    'toneInstructions'
  ],
  [PromptCategory.TRAINING_KIT]: [
    'sessionTitle',
    'sessionOutline',
    'audience',
    'duration',
    'audienceName',
    'audienceDescription',
    'audienceExperienceLevel',
    'audienceTechnicalDepth',
    'audienceCommunicationStyle',
    'audienceVocabularyLevel',
    'audienceLearningStyle',
    'audienceExampleTypes',
    'audienceAvoidTopics',
    'toneName',
    'toneDescription',
    'toneStyle',
    'toneFormality',
    'toneEnergyLevel',
    'toneSentenceStructure',
    'toneLanguageCharacteristics',
    'toneEmotionalResonance',
    'toneExamplePhrases'
  ],
  [PromptCategory.MARKETING_KIT]: [
    'sessionTitle',
    'sessionDescription',
    'keyBenefits',
    'targetAudience',
    'duration',
    'audienceName',
    'audienceDescription',
    'audienceExperienceLevel',
    'audienceTechnicalDepth',
    'audienceVocabularyLevel',
    'audienceCommunicationStyle',
    'audienceExampleTypes',
    'toneName',
    'toneDescription',
    'toneStyle',
    'toneFormality',
    'toneEnergyLevel',
    'toneSentenceStructure',
    'toneLanguageCharacteristics',
    'toneEmotionalResonance',
    'toneExamplePhrases'
  ],
  [PromptCategory.VALIDATION]: [
    'content',
    'context',
    'criteria'
  ]
};

export const AdminDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>((searchParams.get('tab') as TabType) || 'prompts');
  const [promptSections, setPromptSections] = useState<PromptSection[]>(
    CORE_PROMPTS.map(p => ({
      ...p,
      prompt: undefined,
      isLoading: true,
      isSaving: false,
      editedTemplate: ''
    }))
  );
  const [systemStatus, setSystemStatus] = useState<SystemHealth | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Sync activeTab with URL params when they change
  useEffect(() => {
    const tab = (searchParams.get('tab') as TabType) || 'prompts';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'prompts') {
      loadPrompts();
    } else if (activeTab === 'config') {
      loadSystemConfig();
    } else if (activeTab === 'status') {
      loadSystemStatus();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  const loadPrompts = async () => {
    try {
      await promptsService.seedDefaultPrompts();
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
    } finally {
      setIsInitializing(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const config = await adminService.getSystemConfig();
      setSystemConfig(config);
    } catch (error) {
      console.error('Failed to load system config:', error);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const status = await adminService.getSystemHealth();
      setSystemStatus(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const logs = await adminService.getLogs();
      setLogs(logs);
    } catch (error) {
      console.error('Failed to load logs:', error);
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

      setPromptSections(prev => prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, prompt: { ...s.prompt!, template: s.editedTemplate }, isSaving: false }
          : s
      ));
    } catch (error) {
      console.error('Failed to save prompt:', error);
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


  const renderPromptsTab = () => (
    <div className="space-y-6">
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
                {/* 2-Column Layout: Prompt Template (3/4) + Placeholders (1/4) */}
                <div className="flex gap-4 items-start">
                  {/* Left Column - Prompt Template (75%) */}
                  <div className="w-3/4 flex flex-col">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prompt Template
                    </label>
                    <textarea
                      value={section.editedTemplate}
                      onChange={(e) => handleTemplateChange(index, e.target.value)}
                      className="w-full flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
                      placeholder="Enter your AI prompt template..."
                      style={{ height: 'auto', minHeight: '600px' }}
                    />
                  </div>

                  {/* Right Column - Available Placeholders (25%) */}
                  <div className="w-1/4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Placeholders
                    </label>
                    <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                      <div className="space-y-2">
                        {PLACEHOLDER_MAPPINGS[section.category]?.map((placeholder) => (
                          <div key={placeholder} className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`{{${placeholder}}}`);
                              }}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-slate-700 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 transition-colors cursor-pointer text-left"
                              title="Click to copy"
                            >
                              {`{{${placeholder}}}`}
                            </button>
                            <span className="text-xs text-slate-600 leading-snug px-1">
                              {PLACEHOLDER_DESCRIPTIONS[placeholder] || 'No description available'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-3 italic border-t border-slate-300 pt-2">
                        Click to copy
                      </p>
                    </div>
                  </div>
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
  );

  const renderConfigTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
        {systemConfig ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
              <input
                type="text"
                value={systemConfig.environment}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Node.js Version</label>
              <input
                type="text"
                value={systemConfig.nodeVersion}
                className="w-48 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Timeout (ms)</label>
              <input
                type="number"
                value={systemConfig.apiTimeout}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Request Size</label>
              <input
                type="text"
                value={systemConfig.maxRequestSize}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="pt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading configuration...</div>
        )}
      </div>
    </div>
  );

  const renderStatusTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
        {systemStatus ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                systemStatus.database === 'connected'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemStatus.database}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Service</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                systemStatus.api === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {systemStatus.api}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Uptime</span>
              <span className="text-sm text-gray-600">
                {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Version</span>
              <span className="text-sm text-gray-600">{systemStatus.version}</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Last checked: {new Date(systemStatus.lastCheck).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-500">Loading system status...</div>
        )}
      </div>
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Application Logs</h3>
        </div>
        <div className="p-6">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                <span className="text-gray-500 font-mono text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  log.level === 'error' ? 'bg-red-100 text-red-800' :
                  log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                  log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="flex-1">{log.message}</span>
                {log.context && (
                  <span className="text-gray-400 text-xs">[{log.context}]</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AdminDashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Tab Content */}
        {activeTab === 'prompts' && renderPromptsTab()}
        {activeTab === 'ai-tuner' && <SessionAITunerPage />}
        {activeTab === 'rag-settings' && <RagSettingsTabContent />}
        {activeTab === 'analytics' && <AnalyticsTabContent />}
        {activeTab === 'ai-insights' && <AIInsightsTabContent />}
        {activeTab === 'categories' && <CategoriesTabContent />}
        {activeTab === 'audiences' && <AudiencesTabContent />}
        {activeTab === 'tones' && <TonesTabContent />}
        {activeTab === 'import-export' && <ImportExportTabContent />}
        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'status' && renderStatusTab()}
        {activeTab === 'logs' && renderLogsTab()}
      </div>
    </AdminDashboardLayout>
  );
};
