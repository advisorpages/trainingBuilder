import React from 'react';
import { BuilderLayout } from '../layouts/BuilderLayout';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import sessionAiTunerService, {
  AIInteractionComparison,
  AiPromptSetting,
  PromptSandboxSettings,
  PromptVariantPersona,
  PromptSettingsResponse,
  QuickTweaksConfig,
  SessionTunerOverviewResponse,
  VariantLogEntry,
  VariantLogDetail,
} from '../services/session-ai-tuner.service';
import { promptsService, Prompt, PromptCategory } from '../services/prompts.service';
import { VariantAnalyticsDashboard } from '../components/admin/VariantAnalyticsDashboard';
import { cn } from '../lib/utils';

type TabKey = 'overview' | 'prompts' | 'recent' | 'logs' | 'sandbox' | 'saved' | 'analytics';
type SandboxSubTab = 'personas' | 'tone' | 'duration';
type ComparisonView = 'summary' | 'prompt' | 'outline';

interface RunsParams {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
}

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

const cloneSettings = (settings: PromptSandboxSettings): PromptSandboxSettings =>
  JSON.parse(JSON.stringify(settings));

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const formatDelta = (value: number): string => {
  const rounded = value.toFixed(1);
  if (value === 0) return '0';
  return value > 0 ? `+${rounded}` : rounded;
};

const formatDateTime = (value: string): string => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const formatDuration = (minutes: number): string => {
  return `${minutes.toFixed(1)} mins`;
};

const formatBool = (value: boolean | undefined): string => (value ? 'On' : 'Off');

const chips = (items: string[]) => (
  <div className="flex flex-wrap gap-2">
    {items.map(item => (
      <span
        key={item}
        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
      >
        {item}
      </span>
    ))}
  </div>
);

const SessionAITunerPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<TabKey>('overview');

  const [overview, setOverview] = React.useState<SessionTunerOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = React.useState(false);

  const [runs, setRuns] = React.useState<AIInteractionComparison[]>([]);
  const [runsTotal, setRunsTotal] = React.useState(0);
  const [runsLoading, setRunsLoading] = React.useState(false);
  const [runsParams, setRunsParams] = React.useState<RunsParams>({ limit: 10, offset: 0 });
  const [runsError, setRunsError] = React.useState<string | null>(null);
  const [runNotesDraft, setRunNotesDraft] = React.useState<Record<string, string>>({});
  const [pinningRunId, setPinningRunId] = React.useState<string | null>(null);
  const [savingNoteId, setSavingNoteId] = React.useState<string | null>(null);

  const [currentSettings, setCurrentSettings] = React.useState<PromptSettingsResponse | null>(null);
  const [sandboxSettings, setSandboxSettings] = React.useState<PromptSandboxSettings | null>(null);
  const [originalSandboxSettings, setOriginalSandboxSettings] = React.useState<PromptSandboxSettings | null>(null);
  const [sandboxSubTab, setSandboxSubTab] = React.useState<SandboxSubTab>('personas');
  const [activePersonaId, setActivePersonaId] = React.useState<string | null>(null);
  const [sandboxSaving, setSandboxSaving] = React.useState(false);
  const [sandboxStatus, setSandboxStatus] = React.useState<string | null>(null);
  const [previewVariantIndex, setPreviewVariantIndex] = React.useState<number>(0);
  const [variantConfigs, setVariantConfigs] = React.useState<any[]>([]);
  const [variantConfigsLoading, setVariantConfigsLoading] = React.useState(false);

  const [savedSettings, setSavedSettings] = React.useState<AiPromptSetting[]>([]);
  const [savedLoading, setSavedLoading] = React.useState(false);

  const [variantLogs, setVariantLogs] = React.useState<VariantLogEntry[]>([]);
  const [logsTotal, setLogsTotal] = React.useState(0);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [logsParams, setLogsParams] = React.useState({
    limit: 20,
    offset: 0,
    search: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [logsError, setLogsError] = React.useState<string | null>(null);
  const [logsSummary, setLogsSummary] = React.useState<{
    totalRuns: number;
    successRate: number;
    avgProcessingTime: number;
    totalCost: number;
  } | null>(null);
  const [selectedLogDetail, setSelectedLogDetail] = React.useState<VariantLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [comparisonPrimary, setComparisonPrimary] = React.useState<AIInteractionComparison | null>(null);
  const [comparisonTargetId, setComparisonTargetId] = React.useState<string | null>(null);
  const [comparisonView, setComparisonView] = React.useState<ComparisonView>('summary');

  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [initialLoading, setInitialLoading] = React.useState(false);

  // Prompts state for AI Settings tab
  const [promptSections, setPromptSections] = React.useState<PromptSection[]>(
    CORE_PROMPTS.map(p => ({
      ...p,
      prompt: undefined,
      isLoading: true,
      isSaving: false,
      editedTemplate: ''
    }))
  );
  const [promptsLoading, setPromptsLoading] = React.useState(true);

  const fetchOverview = React.useCallback(async () => {
    try {
      setOverviewLoading(true);
      const data = await sessionAiTunerService.getOverview();
      setOverview(data);
      if (!currentSettings && data.promptSettings) {
        setCurrentSettings(data.promptSettings);
        setSandboxSettings(cloneSettings(data.promptSettings.settings));
        setOriginalSandboxSettings(cloneSettings(data.promptSettings.settings));
        setActivePersonaId(data.promptSettings.settings.variantPersonas?.[0]?.id ?? null);
      }
    } catch (error) {
      console.error('Failed to load Session AI Tuner overview', error);
      setGlobalError('Failed to load overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, [currentSettings]);

  const fetchRuns = React.useCallback(async (params: RunsParams) => {
    try {
      setRunsLoading(true);
      setRunsError(null);
      const data = await sessionAiTunerService.getComparisons(params);
      setRuns(data.runs);
      setRunsTotal(data.total);
      const noteDraft: Record<string, string> = {};
      data.runs.forEach(run => {
        const whatWorked = run.userNotes?.whatWorked ?? '';
        noteDraft[run.id] = whatWorked;
      });
      setRunNotesDraft(noteDraft);
    } catch (error) {
      console.error('Failed to load comparison runs', error);
      setRunsError('Unable to load recent generations.');
    } finally {
      setRunsLoading(false);
    }
  }, []);

  const fetchSettings = React.useCallback(async () => {
    try {
      const current = await sessionAiTunerService.getCurrentSettings();
      setCurrentSettings(current);
      setSandboxSettings(cloneSettings(current.settings));
      setOriginalSandboxSettings(cloneSettings(current.settings));
      setActivePersonaId(current.settings.variantPersonas?.[0]?.id ?? null);
    } catch (error) {
      console.error('Failed to load prompt settings', error);
      setGlobalError('Failed to load prompt sandbox settings.');
    }
  }, []);

  const fetchSavedSettings = React.useCallback(async () => {
    try {
      setSavedLoading(true);
      const saved = await sessionAiTunerService.listSavedSettings();
      setSavedSettings(saved);
    } catch (error) {
      console.error('Failed to load saved prompt settings', error);
      setGlobalError('Unable to load saved settings.');
    } finally {
      setSavedLoading(false);
    }
  }, []);

  const fetchVariantLogs = React.useCallback(async (params: typeof logsParams) => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const data = await sessionAiTunerService.getVariantLogs(params);
      setVariantLogs(data.logs);
      setLogsTotal(data.total);
      setLogsSummary(data.summary);
    } catch (error) {
      console.error('Failed to load variant logs', error);
      setLogsError('Unable to load variant logs.');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchLogDetails = React.useCallback(async (logId: string) => {
    try {
      setDetailLoading(true);
      const detail = await sessionAiTunerService.getVariantLogDetails(logId);
      setSelectedLogDetail(detail);
    } catch (error) {
      console.error('Failed to load log details', error);
      setLogsError('Unable to load log details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchPrompts = React.useCallback(async () => {
    try {
      setPromptsLoading(true);
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
      setGlobalError('Failed to load AI prompts.');
    } finally {
      setPromptsLoading(false);
    }
  }, []);

  const fetchVariantConfigs = React.useCallback(async () => {
    try {
      setVariantConfigsLoading(true);
      // Mock variant configs based on the migration data
      // In a real implementation, this would fetch from an API endpoint
      const mockVariantConfigs = [
        {
          variantIndex: 0,
          label: 'Precision',
          description: 'Clear, step-by-step approach with predictable flow and detailed guidance. Ideal for structured learning.',
          instruction: 'Create a highly organized session with clear time blocks, detailed agendas, and sequential steps. Use structured frameworks and prescriptive guidance. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~30%), Application (~30%), Video (~15%), Closing+CTA (~15%). Include specific talking points, checklists, and exact activities that trainers can follow verbatim. Every section should have explicit objectives and outcomes. Make instructions crystal-clear for less experienced trainers. When knowledge base insights are available, present them in an organized, systematic way. Ensure this variant feels predictable and orderly.'
        },
        {
          variantIndex: 1,
          label: 'Insight',
          description: 'Evidence-based approach with data, research, and proven strategies. Ideal for analytical thinkers.',
          instruction: 'Build a logic-driven session emphasizing facts, statistics, case studies, and measurable outcomes. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~30%), Application (~30%), Video (~15%), Closing+CTA (~15%). Use data to support each teaching point. Include analysis activities, research findings, and evidence-based practices. Provide specific metrics, concrete examples, and factual talking points trainers can reference. Present knowledge base insights with statistics and proof points. Design application exercises around analyzing real scenarios and drawing logical conclusions. Ensure this variant feels data-backed and intellectually rigorous.'
        },
        {
          variantIndex: 2,
          label: 'Ignite',
          description: 'Fast-paced, results-oriented session with immediate takeaways and momentum. Ideal for action-takers.',
          instruction: 'Design a high-energy session focused on quick wins and immediate action. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~20%), Application (~35%), Video (~15%), Closing+CTA (~20%). Use rapid-fire activities, time-boxed exercises, and goal-oriented challenges. Keep theory concise and punchy—focus on "what to do now." Make application section intensive with momentum-building activities. Include specific action items and clear next steps trainers can drive with urgency. Provide prescriptive guidance for less experienced trainers to maintain energy. When knowledge base insights exist, present them as quick wins and proven tactics. Ensure this variant feels fast-paced and results-driven.'
        },
        {
          variantIndex: 3,
          label: 'Connect',
          description: 'Story-driven, collaborative approach building rapport and real-world connection. Ideal for relationship-builders.',
          instruction: 'Create a people-centered session using stories, real-world scenarios, and collaborative activities. Follow this {{duration}}-minute structure: Opening (~10%), Theory (~25%), Application (~30%), Video (~15%), Closing+CTA (~20%). Include peer discussions, group sharing, and relationship-building exercises. Use storytelling, empathy, and authentic connection. Design application activities that encourage advisors to learn from each other through role-plays and peer coaching. Provide trainers with discussion prompts, facilitation guidance, and stories they can tell. Present knowledge base insights as real advisor success stories and relatable examples. Ensure this variant feels warm, collaborative, and human-centered.'
        }
      ];
      setVariantConfigs(mockVariantConfigs);
    } catch (error) {
      console.error('Failed to load variant configs:', error);
      setGlobalError('Failed to load variant configurations.');
    } finally {
      setVariantConfigsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const initialise = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([
          fetchOverview(),
          fetchRuns(runsParams),
          fetchVariantLogs(logsParams),
          fetchSavedSettings(),
          fetchPrompts(),
          fetchVariantConfigs(),
        ]);
        if (!currentSettings) {
          await fetchSettings();
        }
      } finally {
        setInitialLoading(false);
      }
    };
    void initialise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sandboxHasChanges = React.useMemo(() => {
    if (!sandboxSettings || !originalSandboxSettings) return false;
    return JSON.stringify(sandboxSettings) !== JSON.stringify(originalSandboxSettings);
  }, [sandboxSettings, originalSandboxSettings]);

  const handleRunPinToggle = async (run: AIInteractionComparison) => {
    if (!run) return;
    try {
      setPinningRunId(run.id);
      const existingTags: string[] = Array.isArray(run.metadata?.comparisonTags)
        ? run.metadata.comparisonTags
        : [];
      const isPinned = existingTags.includes('benchmark') || run.isPinned;
      const nextTags = isPinned ? [] : ['benchmark'];
      await sessionAiTunerService.updateRunMetadata(run.id, {
        comparisonTags: nextTags,
      });
      await fetchRuns(runsParams);
    } catch (error) {
      console.error('Failed to toggle benchmark pin', error);
      setRunsError('Unable to update benchmark pin.');
    } finally {
      setPinningRunId(null);
    }
  };

  const handleRunNoteSave = async (run: AIInteractionComparison) => {
    const note = runNotesDraft[run.id] ?? '';
    try {
      setSavingNoteId(run.id);
      await sessionAiTunerService.updateRunMetadata(run.id, {
        userNotes: {
          whatWorked: note,
          updatedAt: new Date().toISOString(),
        },
      });
      await fetchRuns(runsParams);
    } catch (error) {
      console.error('Failed to save run note', error);
      setRunsError('Unable to save note.');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleApplySandbox = async () => {
    if (!sandboxSettings) return;
    try {
      setSandboxSaving(true);
      setSandboxStatus(null);
      const updated = await sessionAiTunerService.updateCurrentSettings({
        settings: sandboxSettings,
      });
      setCurrentSettings(updated);
      setOriginalSandboxSettings(cloneSettings(updated.settings));
      setSandboxSettings(cloneSettings(updated.settings));
      setSandboxStatus('Prompt overrides applied to next run.');
      await fetchOverview();
    } catch (error) {
      console.error('Failed to update prompt settings', error);
      setSandboxStatus('Failed to apply prompt overrides.');
    } finally {
      setSandboxSaving(false);
    }
  };

  const handleRevertSandbox = () => {
    if (!originalSandboxSettings) return;
    setSandboxSettings(cloneSettings(originalSandboxSettings));
    setSandboxStatus('Reverted to last saved configuration.');
  };

  const handleSaveTemplate = async () => {
    if (!sandboxSettings) return;
    const label = window.prompt('Template name', 'Sandbox Preset');
    if (!label) return;
    try {
      setSavedLoading(true);
      await sessionAiTunerService.createSavedSetting({
        label,
        settings: sandboxSettings,
      });
      await fetchSavedSettings();
      setSandboxStatus(`Saved "${label}" to templates.`);
    } catch (error) {
      console.error('Failed to save sandbox template', error);
      setSandboxStatus('Unable to save template.');
    } finally {
      setSavedLoading(false);
    }
  };

  const handleLoadSavedIntoSandbox = (setting: AiPromptSetting) => {
    const cloned = cloneSettings(setting.settings);
    setSandboxSettings(cloned);
    setSandboxStatus(`Loaded "${setting.label}" into sandbox.`);
    setActivePersonaId(cloned.variantPersonas?.[0]?.id ?? null);
    setActiveTab('sandbox');
    setSandboxSubTab('personas');
  };

  const handleSetSavedAsDefault = async (setting: AiPromptSetting) => {
    try {
      const updated = await sessionAiTunerService.setCurrentFromSaved(setting.id);
      setCurrentSettings(updated);
      const cloned = cloneSettings(updated.settings);
      setSandboxSettings(cloned);
      setOriginalSandboxSettings(cloned);
      setActivePersonaId(cloned.variantPersonas?.[0]?.id ?? null);
      setSandboxStatus(`"${setting.label}" is now the active configuration.`);
      await fetchSavedSettings();
      await fetchOverview();
    } catch (error) {
      console.error('Failed to activate saved setting', error);
      setSandboxStatus('Unable to set saved setting as default.');
    }
  };

  const handleDeleteSavedSetting = async (setting: AiPromptSetting) => {
    if (!window.confirm(`Delete "${setting.label}"?`)) return;
    try {
      await sessionAiTunerService.deleteSavedSetting(setting.id);
      await fetchSavedSettings();
    } catch (error) {
      console.error('Failed to delete saved setting', error);
      setSandboxStatus('Unable to delete saved setting.');
    }
  };

  const handleOpenInSandboxFromRun = (run: AIInteractionComparison) => {
    const sandboxFromRun = run.metadata?.sandboxSettings as PromptSandboxSettings | undefined;
    if (sandboxFromRun) {
      const cloned = cloneSettings(sandboxFromRun);
      setSandboxSettings(cloned);
      setSandboxStatus(`Loaded settings from run ${run.variantLabel ?? run.id}.`);
      setActivePersonaId(run.configSnapshot?.variantPersona?.id ?? cloned.variantPersonas?.[0]?.id ?? null);
    } else if (currentSettings) {
      const cloned = cloneSettings(currentSettings.settings);
      setSandboxSettings(cloned);
      setSandboxStatus('Run did not include sandbox snapshot; loaded current settings.');
      setActivePersonaId(cloned.variantPersonas?.[0]?.id ?? null);
    }
    setActiveTab('sandbox');
    setSandboxSubTab('personas');
  };

  const handleComparisonOpen = (run: AIInteractionComparison) => {
    setComparisonPrimary(run);
    setComparisonTargetId(null);
    setComparisonView('summary');
    setDrawerOpen(true);
  };

  const handleComparisonClose = () => {
    setDrawerOpen(false);
    setComparisonPrimary(null);
    setComparisonTargetId(null);
  };

  // Prompts tab functions
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

      setGlobalError('Prompt updated successfully!');

      // Update the prompt in state
      setPromptSections(prev => prev.map((s, i) =>
        i === sectionIndex
          ? { ...s, prompt: { ...s.prompt!, template: s.editedTemplate }, isSaving: false }
          : s
      ));
    } catch (error) {
      console.error('Failed to save prompt:', error);
      setGlobalError('Failed to save prompt. Please try again.');
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

  const comparisonTarget = React.useMemo(() => {
    if (!comparisonTargetId) return null;
    return runs.find(run => run.id === comparisonTargetId) ?? null;
  }, [comparisonTargetId, runs]);

  const updatePersonaField = (persona: PromptVariantPersona, updates: Partial<PromptVariantPersona>) => {
    if (!sandboxSettings) return;
    const next = sandboxSettings.variantPersonas.map(item =>
      item.id === persona.id
        ? { ...item, ...updates }
        : item
    );
    setSandboxSettings({
      ...sandboxSettings,
      variantPersonas: next,
    });
  };

  const updateQuickTweak = (key: keyof QuickTweaksConfig, value: boolean) => {
    if (!sandboxSettings) return;
    setSandboxSettings({
      ...sandboxSettings,
      quickTweaks: {
        ...sandboxSettings.quickTweaks,
        [key]: value,
      },
    });
  };

  const sandboxPreviewPrompt = React.useMemo(() => {
    if (!sandboxSettings || variantConfigs.length === 0) return '';

    const variant = variantConfigs[previewVariantIndex];
    const persona = sandboxSettings.variantPersonas[previewVariantIndex] || sandboxSettings.variantPersonas[0];

    const pieces: string[] = [];

    // 1. VARIANT PERSONALITY - Combined from database and sandbox
    pieces.push(`# VARIANT PERSONALITY: ${variant.label}`);
    pieces.push('');
    pieces.push(variant.instruction);
    pieces.push('');

    // Add sandbox persona amplifier if exists
    if (persona && persona.prompt) {
      pieces.push(`Sandbox Persona Amplifier:`);
      pieces.push(persona.prompt);
      if (persona.summary) {
        pieces.push('');
        pieces.push(`Variant Emphasis: ${persona.summary}`);
      }
    }
    pieces.push('');

    // 2. SESSION CONTEXT (placeholder)
    pieces.push(`# Session Context`);
    pieces.push(`- Category: [Category will be inserted here]`);
    pieces.push(`- Type: [Session type will be inserted here]`);
    pieces.push(`- Title: "[Title will be inserted here]"`);
    pieces.push(`- Duration: [Duration] minutes`);
    pieces.push(`- Desired Outcome: [Desired outcome will be inserted here]`);
    pieces.push(`- Current Problem: [Problem will be inserted here]`);
    pieces.push(`- Must Cover: [Topics will be inserted here]`);
    pieces.push(`- Audience Size: [Size will be inserted here]`);
    pieces.push('');

    // 3. AUDIENCE CONTEXT (placeholder)
    pieces.push(`# Audience Context`);
    pieces.push(`- Profile: [Audience name will be inserted here]`);
    pieces.push(`- Description: [Audience description will be inserted here]`);
    pieces.push(`- Experience Level: [Experience will be inserted here]`);
    pieces.push(`- Technical Depth: [Depth/5 will be inserted here]`);
    pieces.push(`- Communication Style: [Style will be inserted here]`);
    pieces.push(`- Learning Preferences: [Preferences will be inserted here]`);
    pieces.push('');

    // 4. TONE GUIDELINES (placeholder)
    pieces.push(`# Tone Guidelines`);
    pieces.push(`- Profile: [Tone name will be inserted here]`);
    pieces.push(`- Description: [Tone description will be inserted here]`);
    pieces.push(`- Style: [Tone style will be inserted here]`);
    pieces.push(`- Energy: [Energy level will be inserted here]`);
    pieces.push(`- Formality: [Formality/5 will be inserted here]`);
    pieces.push('');

    // 5. LOCATION CONTEXT (placeholder)
    pieces.push(`# Location Details`);
    pieces.push(`- Name: [Location name will be inserted here]`);
    pieces.push(`- Format: [Format will be inserted here]`);
    pieces.push(`- Platform: [Platform will be inserted here]`);
    pieces.push(`- Capacity: [Capacity will be inserted here]`);
    pieces.push('');

    // 6. Sandbox Tone Guidance
    pieces.push(`# Sandbox Tone Guidance`);
    pieces.push(sandboxSettings.globalTone.toneGuidelines);
    pieces.push('');
    pieces.push(`System Directives: ${sandboxSettings.globalTone.systemGuidelines}`);
    pieces.push('');

    // 7. Duration & Flow Constraints
    pieces.push(`# Duration & Flow Constraints`);
    pieces.push(`- ${sandboxSettings.durationFlow.pacingGuidelines}`);
    pieces.push(`- ${sandboxSettings.durationFlow.structuralNotes}`);
    pieces.push('');

    // 8. OUTPUT REQUIREMENTS
    pieces.push(`# Output Requirements`);
    pieces.push(`- Return valid JSON with the specified structure`);
    pieces.push(`- Ensure totalDuration equals [duration] minutes exactly`);
    pieces.push(`- Create 3-6 sections that flow logically`);
    pieces.push(`- Include opening/welcome and closing/commitments sections`);
    pieces.push(`- Make it practical, engaging, and immediately applicable`);
    pieces.push('');

    // 9. RAG Context placeholder
    pieces.push(`## Knowledge Base Inspiration`);
    pieces.push(`[RAG sources will be inserted here when available]`);
    pieces.push(`Use these materials as inspiration—blend useful insights without overriding the variant personality.`);
    pieces.push('');

    // 10. Quick Tweaks
    if (sandboxSettings.quickTweaks.increaseDataEmphasis || sandboxSettings.quickTweaks.speedUpPace || sandboxSettings.quickTweaks.raiseRagPriority) {
      pieces.push(`# Override Directives`);
      if (sandboxSettings.quickTweaks.increaseDataEmphasis) {
        pieces.push(`- Include more metrics, benchmarks, and measurable outcomes`);
      }
      if (sandboxSettings.quickTweaks.speedUpPace) {
        pieces.push(`- Use brisk transitions and higher-energy activities`);
      }
      if (sandboxSettings.quickTweaks.raiseRagPriority) {
        pieces.push(`- Lean harder on knowledge base snippets when available`);
      }
    }

    return pieces.join('\n');
  }, [sandboxSettings, variantConfigs, previewVariantIndex]);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {overviewLoading || initialLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Loading overview…
        </div>
      ) : overview ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Sessions Analysed</CardTitle>
                <CardDescription>Outline generations tracked</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">{overview.metrics.totalRuns}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>Generations without errors</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-emerald-600">{formatPercent(overview.metrics.successRate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>RAG Hit Rate</CardTitle>
                <CardDescription>Generations using KB sources</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-sky-600">{formatPercent(overview.metrics.ragHitRate)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg Duration Δ</CardTitle>
                <CardDescription>Generated vs target (mins)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatDelta(overview.metrics.averageDurationDelta)}
                </p>
                <p className="text-xs text-slate-500">
                  | Mean absolute: {formatDelta(overview.metrics.averageDurationDeltaAbs)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Active Settings Snapshot</CardTitle>
                <CardDescription>
                  Last updated {formatDateTime(overview.activeSettings.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Quick Tweaks
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    <li>
                      • Data emphasis:{' '}
                      <span className={overview.activeSettings.quickTweaks.increaseDataEmphasis ? 'text-emerald-600' : 'text-slate-500'}>
                        {formatBool(overview.activeSettings.quickTweaks.increaseDataEmphasis)}
                      </span>
                    </li>
                    <li>
                      • Pace boost:{' '}
                      <span className={overview.activeSettings.quickTweaks.speedUpPace ? 'text-emerald-600' : 'text-slate-500'}>
                        {formatBool(overview.activeSettings.quickTweaks.speedUpPace)}
                      </span>
                    </li>
                    <li>
                      • RAG priority:{' '}
                      <span className={overview.activeSettings.quickTweaks.raiseRagPriority ? 'text-emerald-600' : 'text-rose-500'}>
                        {formatBool(overview.activeSettings.quickTweaks.raiseRagPriority)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Variant Personas ({overview.activeSettings.variantCount})
                  </p>
                  <p className="text-xs text-slate-500">
                    Version {overview.activeSettings.version ?? '—'}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('sandbox')}>
                  Open Sandbox
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('saved')}>
                  View Saved Templates
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Issues</CardTitle>
                <CardDescription>Latest generation failures</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview.metrics.recentIssues.length === 0 ? (
                  <p className="text-sm text-slate-500">No failures recorded in the recent window.</p>
                ) : (
                  overview.metrics.recentIssues.map(issue => (
                    <div key={issue.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-medium text-slate-900">
                        {issue.variantLabel || 'Unknown Variant'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(issue.createdAt)}
                      </p>
                      {issue.errorMessage && (
                        <p className="mt-2 text-sm text-rose-600">
                          {issue.errorMessage}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Overview data unavailable.
        </div>
      )}
    </div>
  );

  const renderRunCard = (run: AIInteractionComparison) => {
    const ragInfo = `${run.ragMode.toUpperCase()} • Weight ${run.ragWeight.toFixed(2)}`;
    const directiveLabels = Object.entries(run.quickTweaks ?? {})
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key);

    const isPinned = run.isPinned || (Array.isArray(run.metadata?.comparisonTags) && run.metadata.comparisonTags.includes('benchmark'));

    return (
      <Card key={run.id} className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base text-slate-900">
              {run.variantLabel ?? 'Untitled Variant'}
            </CardTitle>
            <CardDescription>
              Generated {formatDateTime(run.createdAt)} • {run.status.toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleComparisonOpen(run)}
            >
              Compare
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenInSandboxFromRun(run)}
            >
              Open in Sandbox
            </Button>
            <Button
              size="sm"
              variant={isPinned ? 'default' : 'outline'}
              onClick={() => handleRunPinToggle(run)}
              disabled={pinningRunId === run.id}
            >
              {isPinned ? 'Pinned' : 'Pin as Benchmark'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
              <p className="text-sm font-medium text-slate-900">
                {formatDuration(run.durationActual)} ({formatDelta(run.durationDelta)} vs target)
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">RAG</p>
              <p className="text-sm font-medium text-slate-900">{ragInfo}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Quick Tweaks</p>
              {directiveLabels.length > 0 ? (
                chips(directiveLabels)
              ) : (
                <p className="text-sm text-slate-500">No overrides</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Persona</p>
              <p className="text-sm text-slate-900">
                {run.configSnapshot?.variantPersona?.label ?? run.variantDescription ?? '—'}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              What worked?
            </p>
            <textarea
              value={runNotesDraft[run.id] ?? ''}
              onChange={(event) =>
                setRunNotesDraft((prev) => ({
                  ...prev,
                  [run.id]: event.target.value,
                }))
              }
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              rows={runNotesDraft[run.id]?.split('\n').length > 2 ? runNotesDraft[run.id].split('\n').length : 3}
              placeholder="Capture highlights or follow-ups for this run…"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {run.userNotes?.updatedAt ? `Last updated ${formatDateTime(run.userNotes.updatedAt)}` : 'Not saved yet'}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRunNoteSave(run)}
                disabled={savingNoteId === run.id}
              >
                Save Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderRecentTab = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Filter by Variant
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-64"
              placeholder="Persona name or keyword"
              value={runsParams.search ?? ''}
              onChange={(event) => setRunsParams((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-40"
              value={runsParams.status ?? ''}
              onChange={(event) => setRunsParams((prev) => ({
                ...prev,
                status: event.target.value || undefined,
              }))}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-center"
            onClick={() => {
              const nextParams = { ...runsParams, offset: 0 };
              setRunsParams(nextParams);
              void fetchRuns(nextParams);
            }}
          >
            Apply Filters
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            Showing {runs.length} of {runsTotal}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={runsLoading || runsParams.offset === 0}
              onClick={() => {
                const nextOffset = Math.max(0, runsParams.offset - runsParams.limit);
                const nextParams = { ...runsParams, offset: nextOffset };
                setRunsParams(nextParams);
                void fetchRuns(nextParams);
              }}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={runsLoading || runsParams.offset + runsParams.limit >= runsTotal}
              onClick={() => {
                const nextOffset = runsParams.offset + runsParams.limit;
                const nextParams = { ...runsParams, offset: nextOffset };
                setRunsParams(nextParams);
                void fetchRuns(nextParams);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {runsLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Loading recent generations…
        </div>
      ) : runsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {runsError}
        </div>
      ) : runs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No generation history found for the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map(renderRunCard)}
        </div>
      )}
    </div>
  );

  const renderVariantLogsTab = () => (
    <div className="space-y-5">
      {/* Summary Cards */}
      {logsSummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{logsSummary.totalRuns}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-emerald-600">{formatPercent(logsSummary.successRate)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Avg Processing Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">{formatDuration(logsSummary.avgProcessingTime)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-slate-900">${(Number(logsSummary.totalCost) || 0).toFixed(4)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Search
            </label>
            <input
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-64"
              placeholder="Session title, category, or user"
              value={logsParams.search}
              onChange={(event) => setLogsParams((prev) => ({ ...prev, search: event.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-40"
              value={logsParams.status}
              onChange={(event) => setLogsParams((prev) => ({
                ...prev,
                status: event.target.value,
              }))}
            >
              <option value="">All</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="self-start md:self-center"
            onClick={() => {
              const nextParams = { ...logsParams, offset: 0 };
              setLogsParams(nextParams);
              void fetchVariantLogs(nextParams);
            }}
          >
            Apply Filters
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>
            Showing {variantLogs.length} of {logsTotal}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={logsLoading || logsParams.offset === 0}
              onClick={() => {
                const nextOffset = Math.max(0, logsParams.offset - logsParams.limit);
                const nextParams = { ...logsParams, offset: nextOffset };
                setLogsParams(nextParams);
                void fetchVariantLogs(nextParams);
              }}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={logsLoading || logsParams.offset + logsParams.limit >= logsTotal}
              onClick={() => {
                const nextOffset = logsParams.offset + logsParams.limit;
                const nextParams = { ...logsParams, offset: nextOffset };
                setLogsParams(nextParams);
                void fetchVariantLogs(nextParams);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      {logsLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Loading variant logs…
        </div>
      ) : logsError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {logsError}
        </div>
      ) : variantLogs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No variant logs found for the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {variantLogs.map(renderVariantLogCard)}
        </div>
      )}
    </div>
  );

  const renderVariantLogCard = (log: VariantLogEntry) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'success': return 'text-emerald-600 bg-emerald-50';
        case 'failure': return 'text-red-600 bg-red-50';
        case 'partial': return 'text-amber-600 bg-amber-50';
        default: return 'text-slate-600 bg-slate-50';
      }
    };

    const formatCost = (cost?: number | string) => cost ? `$${(Number(cost) || 0).toFixed(4)}` : '—';
    const formatTime = (ms?: number) => ms ? `${(ms / 1000).toFixed(1)}s` : '—';

    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(log.status)}`}>
                  {log.status.toUpperCase()}
                </span>
                {log.variantLabel && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {log.variantLabel}
                  </span>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Session</p>
                  <p className="text-sm font-medium text-slate-900 truncate" title={log.sessionTitle}>
                    {log.sessionTitle || 'Untitled'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                  <p className="text-sm text-slate-900">{log.category || '—'}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Performance</p>
                  <p className="text-sm text-slate-900">
                    {formatTime(log.processingTimeMs)} • {formatCost(log.estimatedCost)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">User</p>
                  <p className="text-sm text-slate-900">{log.userName || '—'}</p>
                </div>
              </div>

              {log.errorMessage && (
                <div className="mt-3 rounded-md bg-red-50 p-3">
                  <p className="text-sm text-red-700">{log.errorMessage}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{formatDateTime(log.createdAt)}</span>
                <div className="flex items-center gap-4">
                  {log.tokensUsed && (
                    <span>{log.tokensUsed.toLocaleString()} tokens</span>
                  )}
                  {log.qualityScore !== undefined && (
                    <span>Quality: {log.qualityScore}%</span>
                  )}
                  {log.ragWeight !== undefined && (
                    <span>RAG: {formatPercent(log.ragWeight)}</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchLogDetails(log.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSandboxTab = () => {
    if (!sandboxSettings) {
      return (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Sandbox settings not available.
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <Button
              variant="default"
              size="sm"
              onClick={handleApplySandbox}
              disabled={!sandboxHasChanges || sandboxSaving}
            >
              Apply to Next Run
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveTemplate}
              disabled={sandboxSaving}
            >
              Save as Template
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevertSandbox}
              disabled={!sandboxHasChanges || sandboxSaving}
            >
              Revert to Saved
            </Button>
          </div>
          <div className="text-xs text-slate-500">
            {sandboxHasChanges ? 'Unsaved changes' : 'In sync with active overrides'}
          </div>
        </div>

        {sandboxStatus && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            {sandboxStatus}
          </div>
        )}

        <div>
          <Tabs
            defaultValue="personas"
            value={sandboxSubTab}
            onValueChange={(value) => setSandboxSubTab(value as SandboxSubTab)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="personas">Variant Personas</TabsTrigger>
              <TabsTrigger value="tone">Global Tone &amp; System</TabsTrigger>
              <TabsTrigger value="duration">Duration &amp; Flow</TabsTrigger>
            </TabsList>
            <TabsContent value="personas">
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-amber-700">
                      <p className="font-medium mb-2">How Sandbox Personas Work with Database Variants:</p>
                      <ul className="space-y-1 text-amber-600">
                        <li>• <strong>Database Variants</strong>: The system has 4 base variants (Precision, Insight, Ignite, Connect) that provide core instructions</li>
                        <li>• <strong>Sandbox Personas</strong>: These act as "amplifiers" that modify and enhance the base variant instructions</li>
                        <li>• <strong>Combined Effect</strong>: During generation, the system combines both to create unique outputs</li>
                        <li>• <strong>Mapping</strong>: Persona 1 amplifies Precision, Persona 2 amplifies Insight, etc.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {sandboxSettings.variantPersonas.map((persona, index) => (
                  <Card
                    key={persona.id}
                    className={cn(
                      'border-slate-200 transition-shadow hover:shadow-md',
                      activePersonaId === persona.id && 'border-blue-400 shadow-lg'
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base text-slate-900">
                            {persona.label}
                          </CardTitle>
                          <CardDescription>
                            Amplifies: {variantConfigs[index]?.label || `Variant ${index + 1}`}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivePersonaId(persona.id)}
                        >
                          Focus
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Label
                        </label>
                        <input
                          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          value={persona.label}
                          onChange={(event) => updatePersonaField(persona, { label: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Summary
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          rows={3}
                          value={persona.summary ?? ''}
                          onChange={(event) => updatePersonaField(persona, { summary: event.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Prompt Guidance
                        </label>
                        <textarea
                          className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          rows={6}
                          value={persona.prompt}
                          onChange={(event) => updatePersonaField(persona, { prompt: event.target.value })}
                        />
                      </div>

                      {/* Affected Base Prompts */}
                      <div>
                        <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Affected Base Prompts
                        </label>
                        <div className="mt-2 p-3 bg-slate-50 rounded-md border border-slate-200">
                          <p className="text-xs text-slate-600 mb-2">
                            This persona influences the following base prompt types:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {CORE_PROMPTS.map(prompt => (
                              <span
                                key={prompt.category}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                title={prompt.description}
                              >
                                {prompt.title}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-slate-500 mt-2 italic">
                            All personas modify how the base prompts generate content by applying their specific style and approach
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="tone">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tone Guidelines</CardTitle>
                    <CardDescription>How the outline should sound</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      rows={10}
                      value={sandboxSettings.globalTone.toneGuidelines}
                      onChange={(event) =>
                        setSandboxSettings({
                          ...sandboxSettings,
                          globalTone: {
                            ...sandboxSettings.globalTone,
                            toneGuidelines: event.target.value,
                          },
                        })
                      }
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>System Directives</CardTitle>
                    <CardDescription>Non-negotiable system instructions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      rows={10}
                      value={sandboxSettings.globalTone.systemGuidelines}
                      onChange={(event) =>
                        setSandboxSettings({
                          ...sandboxSettings,
                          globalTone: {
                            ...sandboxSettings.globalTone,
                            systemGuidelines: event.target.value,
                          },
                        })
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="duration">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Pacing Guidelines</CardTitle>
                    <CardDescription>How time should be allocated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      rows={8}
                      value={sandboxSettings.durationFlow.pacingGuidelines}
                      onChange={(event) =>
                        setSandboxSettings({
                          ...sandboxSettings,
                          durationFlow: {
                            ...sandboxSettings.durationFlow,
                            pacingGuidelines: event.target.value,
                          },
                        })
                      }
                    />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Structural Notes</CardTitle>
                    <CardDescription>Flow, transitions, and milestones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      rows={8}
                      value={sandboxSettings.durationFlow.structuralNotes}
                      onChange={(event) =>
                        setSandboxSettings({
                          ...sandboxSettings,
                          durationFlow: {
                            ...sandboxSettings.durationFlow,
                            structuralNotes: event.target.value,
                          },
                        })
                      }
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Tweaks</CardTitle>
            <CardDescription>Switch on or off to nudge AI behaviour</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={sandboxSettings.quickTweaks.increaseDataEmphasis}
                onChange={(event) => updateQuickTweak('increaseDataEmphasis', event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Increase data emphasis</p>
                <p className="text-xs text-slate-500">
                  Encourage metrics, benchmarks, and measurable outcomes.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={sandboxSettings.quickTweaks.speedUpPace}
                onChange={(event) => updateQuickTweak('speedUpPace', event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Speed up pace</p>
                <p className="text-xs text-slate-500">
                  Push for brisk transitions and higher-energy activities.
                </p>
              </div>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={sandboxSettings.quickTweaks.raiseRagPriority}
                onChange={(event) => updateQuickTweak('raiseRagPriority', event.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-slate-900">Raise RAG priority</p>
                <p className="text-xs text-slate-500">
                  Lean harder on knowledge base snippets when available.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live Prompt Preview</CardTitle>
                <CardDescription>See how prompts are constructed for each variant</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-500">Variant:</label>
                <select
                  value={previewVariantIndex}
                  onChange={(e) => setPreviewVariantIndex(Number(e.target.value))}
                  className="text-sm border border-slate-200 rounded px-2 py-1 bg-white"
                >
                  {variantConfigs.map((variant, index) => (
                    <option key={variant.variantIndex} value={index}>
                      {variant.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">How this prompt is built:</p>
                    <ul className="space-y-0.5 text-blue-600">
                      <li>• <strong>Variant Personality</strong>: Base instruction from database (Precision, Insight, Ignite, Connect)</li>
                      <li>• <strong>Sandbox Persona</strong>: Amplifier prompt from this sandbox</li>
                      <li>• <strong>Context</strong>: Session, audience, tone, and location details</li>
                      <li>• <strong>Sandbox Settings</strong>: Your custom tone, flow, and tweak settings</li>
                      <li>• <strong>RAG Sources</strong>: Knowledge base content (when available)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
                {sandboxPreviewPrompt}
              </pre>
              {sandboxSettings && variantConfigs.length > 0 && (
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                  <div>
                    <strong>Database Variant:</strong> {variantConfigs[previewVariantIndex]?.label}
                  </div>
                  <div>
                    <strong>Sandbox Persona:</strong> {sandboxSettings.variantPersonas[previewVariantIndex]?.label || 'Default'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSavedSettingsTab = () => (
    <div className="space-y-4">
      {savedLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Loading saved settings…
        </div>
      ) : savedSettings.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          No saved templates yet. Save a sandbox configuration to reuse it later.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {savedSettings.map(setting => (
            <Card key={setting.id} className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base text-slate-900">{setting.label}</CardTitle>
                <CardDescription>
                  Updated {formatDateTime(setting.updatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-600">
                  Personas: {setting.settings.variantPersonas.length} • Quick tweaks:{' '}
                  {Object.values(setting.settings.quickTweaks).filter(Boolean).length}
                </p>
                {setting.description && (
                  <p className="text-sm text-slate-500">{setting.description}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => handleLoadSavedIntoSandbox(setting)}>
                  Load into Sandbox
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSetSavedAsDefault(setting)}>
                  Set as Default
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteSavedSetting(setting)}>
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      {/* Cost Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">{logsSummary?.totalRuns || 0}</p>
            <p className="text-xs text-slate-500">All generations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              ${(Number(logsSummary?.totalCost) || 0).toFixed(4)}
            </p>
            <p className="text-xs text-slate-500">API spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Avg Cost/Run</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-600">
              ${logsSummary?.totalRuns ?
                ((Number(logsSummary.totalCost) / logsSummary.totalRuns).toFixed(4)) :
                '0.0000'}
            </p>
            <p className="text-xs text-slate-500">Per generation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatPercent(logsSummary?.successRate || 0)}
            </p>
            <p className="text-xs text-slate-500">Completed runs</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration Overview</CardTitle>
          <CardDescription>Current AI system configuration and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Base Prompts</h4>
              <p className="text-2xl font-bold text-blue-600">{CORE_PROMPTS.length}</p>
              <p className="text-xs text-blue-600">Configured templates</p>
              <div className="mt-3 space-y-1">
                {CORE_PROMPTS.map(prompt => (
                  <div key={prompt.category} className="flex justify-between text-xs">
                    <span className="text-blue-700">{prompt.title}</span>
                    <span className="text-blue-500">Active</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-900 mb-1">Variant Personas</h4>
              <p className="text-2xl font-bold text-green-600">{sandboxSettings?.variantPersonas.length || 0}</p>
              <p className="text-xs text-green-600">Active personas</p>
              <div className="mt-3 space-y-1">
                {sandboxSettings?.variantPersonas.map(persona => (
                  <div key={persona.id} className="flex justify-between text-xs">
                    <span className="text-green-700">{persona.label}</span>
                    <span className="text-green-500">Configured</span>
                  </div>
                )) || <p className="text-xs text-green-500">No personas configured</p>}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-1">Quick Tweaks</h4>
              <p className="text-2xl font-bold text-purple-600">
                {sandboxSettings ? Object.values(sandboxSettings.quickTweaks).filter(Boolean).length : 0}
              </p>
              <p className="text-xs text-purple-600">Enabled settings</p>
              <div className="mt-3 space-y-1">
                {sandboxSettings ? (
                  <>
                    {sandboxSettings.quickTweaks.increaseDataEmphasis && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-700">Data emphasis</span>
                        <span className="text-green-500">ON</span>
                      </div>
                    )}
                    {sandboxSettings.quickTweaks.speedUpPace && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-700">Speed up pace</span>
                        <span className="text-green-500">ON</span>
                      </div>
                    )}
                    {sandboxSettings.quickTweaks.raiseRagPriority && (
                      <div className="flex justify-between text-xs">
                        <span className="text-purple-700">RAG priority</span>
                        <span className="text-green-500">ON</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-purple-500">No tweaks enabled</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Variant Performance Analytics</CardTitle>
          <CardDescription>
            Monitor how your variant personas perform across different sessions and categories.
            Track selection rates, RAG effectiveness, and identify opportunities for optimization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VariantAnalyticsDashboard />
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Analysis by Configuration</CardTitle>
          <CardDescription>
            Understand how different configurations impact API costs and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-3">Cost by Persona</h4>
                <div className="space-y-2">
                  {sandboxSettings?.variantPersonas.map(persona => {
                    const personaRuns = variantLogs.filter(log =>
                      log.variantLabel === persona.label
                    );
                    const personaCost = personaRuns.reduce((sum, log) =>
                      sum + (Number(log.estimatedCost) || 0), 0
                    );
                    return (
                      <div key={persona.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <span className="text-sm font-medium text-slate-900">{persona.label}</span>
                          <span className="text-xs text-slate-500 block">{personaRuns.length} runs</span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          ${personaCost.toFixed(4)}
                        </span>
                      </div>
                    );
                  }) || <p className="text-sm text-slate-500">No persona data available</p>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-3">Cost by Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-green-900">Successful</span>
                      <span className="text-xs text-green-500 block">
                        {variantLogs.filter(log => log.status === 'success').length} runs
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-900">
                      ${variantLogs
                        .filter(log => log.status === 'success')
                        .reduce((sum, log) => sum + (Number(log.estimatedCost) || 0), 0)
                        .toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-red-900">Failed</span>
                      <span className="text-xs text-red-500 block">
                        {variantLogs.filter(log => log.status === 'failure').length} runs
                      </span>
                    </div>
                    <span className="text-sm font-medium text-red-900">
                      ${variantLogs
                        .filter(log => log.status === 'failure')
                        .reduce((sum, log) => sum + (Number(log.estimatedCost) || 0), 0)
                        .toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPromptsTab = () => (
    <div className="space-y-6">
      {promptsLoading ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Loading AI prompts…
        </div>
      ) : (
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
      )}

      {/* Integration Section */}
      <div className="mt-8 p-4 bg-green-50 rounded-md border border-green-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Variant Personas Integration
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p className="mb-2">
                These base prompts are modified by variant personas in the Prompt Sandbox to create different output styles.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('sandbox')}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Open Prompt Sandbox →
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
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
  );

  const renderComparisonDrawer = () => {
    if (!drawerOpen || !comparisonPrimary) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-900 bg-opacity-50">
        <div className="h-full w-full max-w-4xl overflow-y-auto bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Compare Generations</h2>
              <p className="text-sm text-slate-500">
                {comparisonPrimary.variantLabel ?? comparisonPrimary.id}
              </p>
            </div>
            <Button variant="ghost" onClick={handleComparisonClose}>
              Close
            </Button>
          </div>

          <div className="border-b border-slate-200 px-6 py-4">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Compare against
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-72"
              value={comparisonTargetId ?? ''}
              onChange={(event) => setComparisonTargetId(event.target.value || null)}
            >
              <option value="">(select run)</option>
              {runs
                .filter(run => run.id !== comparisonPrimary.id)
                .map(run => (
                  <option key={run.id} value={run.id}>
                    {run.variantLabel ?? run.id} • {formatDateTime(run.createdAt)}
                  </option>
                ))}
            </select>
          </div>

          <div className="px-6 py-2">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  comparisonView === 'summary' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                )}
                onClick={() => setComparisonView('summary')}
              >
                Summary
              </button>
              <button
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  comparisonView === 'prompt' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                )}
                onClick={() => setComparisonView('prompt')}
              >
                Prompt Details
              </button>
              <button
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium',
                  comparisonView === 'outline' ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
                )}
                onClick={() => setComparisonView('outline')}
              >
                Outline JSON
              </button>
            </div>
          </div>

          <div className="px-6 pb-8">
            {comparisonView === 'summary' && (
              <div className="grid gap-4 md:grid-cols-2">
                {[comparisonPrimary, comparisonTarget].filter(Boolean).map((run, index) => (
                  <Card key={run!.id} className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base text-slate-900">
                        {index === 0 ? 'Primary' : 'Comparison'} • {run!.variantLabel ?? run!.id}
                      </CardTitle>
                      <CardDescription>
                        Generated {formatDateTime(run!.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid gap-2">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                          <p className="font-medium text-slate-900">{run!.status.toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Duration</p>
                          <p className="font-medium text-slate-900">
                            {formatDuration(run!.durationActual)} ({formatDelta(run!.durationDelta)})
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">RAG</p>
                          <p className="font-medium text-slate-900">
                            {run!.ragMode.toUpperCase()} • {run!.ragWeight.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Persona</p>
                          <p className="font-medium text-slate-900">
                            {run!.configSnapshot?.variantPersona?.label ?? run!.variantDescription ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500">Quick Tweaks</p>
                          {Object.entries(run!.quickTweaks ?? {}).some(([, value]) => value) ? (
                            chips(
                              Object.entries(run!.quickTweaks ?? {})
                                .filter(([, value]) => Boolean(value))
                                .map(([key]) => key)
                            )
                          ) : (
                            <p className="text-slate-500">None</p>
                          )}
                        </div>
                        {run!.userNotes?.whatWorked && (
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500">Notes</p>
                            <p className="text-slate-700">{run!.userNotes.whatWorked}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!comparisonTarget && (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    Select a comparison run to view side-by-side insights.
                  </div>
                )}
              </div>
            )}

            {comparisonView === 'prompt' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900">
                    {comparisonPrimary.variantLabel ?? comparisonPrimary.id}
                  </p>
                  <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
                    {comparisonPrimary.renderedPrompt ?? 'Prompt not available'}
                  </pre>
                </div>
                {comparisonTarget ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900">
                      {comparisonTarget.variantLabel ?? comparisonTarget.id}
                    </p>
                    <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
                      {comparisonTarget.renderedPrompt ?? 'Prompt not available'}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    Select another run to compare full prompts.
                  </div>
                )}
              </div>
            )}

            {comparisonView === 'outline' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-900">
                    {comparisonPrimary.variantLabel ?? comparisonPrimary.id}
                  </p>
                  <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
                    {JSON.stringify(comparisonPrimary.structuredOutput, null, 2)}
                  </pre>
                </div>
                {comparisonTarget ? (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-900">
                      {comparisonTarget.variantLabel ?? comparisonTarget.id}
                    </p>
                    <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
                      {JSON.stringify(comparisonTarget.structuredOutput, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    Select another run to compare outline JSON.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <BuilderLayout
      title="Session AI Tuner"
      subtitle="Review, tune, and benchmark AI-assisted session generations without leaving the workspace."
    >
      <div className="space-y-6">
        {globalError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <Tabs defaultValue="overview" value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
          <TabsList className="mb-6 overflow-x-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="recent">Recent Generations</TabsTrigger>
            <TabsTrigger value="logs">Variant Logs</TabsTrigger>
            <TabsTrigger value="sandbox">Prompt Sandbox</TabsTrigger>
            <TabsTrigger value="saved">Saved Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="prompts">{renderPromptsTab()}</TabsContent>
          <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>
          <TabsContent value="recent">{renderRecentTab()}</TabsContent>
          <TabsContent value="logs">{renderVariantLogsTab()}</TabsContent>
          <TabsContent value="sandbox">{renderSandboxTab()}</TabsContent>
          <TabsContent value="saved">{renderSavedSettingsTab()}</TabsContent>
        </Tabs>
      </div>

      {renderComparisonDrawer()}

      {/* Variant Log Details Modal */}
      {selectedLogDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Variant Generation Details</h2>
                  <p className="text-sm text-slate-600">
                    {selectedLogDetail.sessionTitle || 'Untitled Session'} • {formatDateTime(selectedLogDetail.createdAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedLogDetail(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-slate-600">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Info */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Performance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="text-sm">⏱️ {formatDuration((selectedLogDetail.processingTimeMs || 0) / 1000)}</p>
                        <p className="text-sm">🎫 {selectedLogDetail.tokensUsed?.toLocaleString() || '—'} tokens</p>
                        <p className="text-sm">💰 ${(Number(selectedLogDetail.estimatedCost) || 0).toFixed(4)}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Quality</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="text-sm">📊 {selectedLogDetail.qualityScore || '—'}% quality score</p>
                        <p className="text-sm">🔄 {selectedLogDetail.userFeedback || 'No feedback'}</p>
                        {selectedLogDetail.ragWeight !== undefined && (
                          <p className="text-sm">🧠 {formatPercent(selectedLogDetail.ragWeight)} RAG usage</p>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Context</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="text-sm">🏷️ {selectedLogDetail.category || '—'}</p>
                        <p className="text-sm">📋 {selectedLogDetail.sessionType || '—'}</p>
                        <p className="text-sm">👤 {selectedLogDetail.userName || 'Unknown'}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Full Prompt */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">AI Prompt</CardTitle>
                      <CardDescription>The complete prompt sent to the AI</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                        {selectedLogDetail.renderedPrompt}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Input Variables */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Input Variables</CardTitle>
                      <CardDescription>Data used to generate the prompt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-slate-50 text-slate-900 p-4 rounded-md text-xs overflow-auto max-h-48">
                        {JSON.stringify(selectedLogDetail.inputVariables, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* AI Response */}
                  {selectedLogDetail.aiResponse && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">AI Response</CardTitle>
                        <CardDescription>The raw response from the AI</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-900 text-slate-100 p-4 rounded-md text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                          {selectedLogDetail.aiResponse}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* Structured Output */}
                  {selectedLogDetail.structuredOutput && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Structured Output</CardTitle>
                        <CardDescription>Parsed and structured version of the response</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-50 text-slate-900 p-4 rounded-md text-xs overflow-auto max-h-64">
                          {JSON.stringify(selectedLogDetail.structuredOutput, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {/* Error Details */}
                  {selectedLogDetail.errorMessage && (
                    <Card className="border-red-200">
                      <CardHeader>
                        <CardTitle className="text-base text-red-700">Error Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-red-700">{selectedLogDetail.errorMessage}</p>
                        {selectedLogDetail.errorDetails && (
                          <pre className="mt-2 bg-red-50 text-red-900 p-3 rounded-md text-xs overflow-auto">
                            {JSON.stringify(selectedLogDetail.errorDetails, null, 2)}
                          </pre>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata */}
                  {selectedLogDetail.metadata && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Additional Metadata</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="bg-slate-50 text-slate-900 p-3 rounded-md text-xs overflow-auto max-h-48">
                          {JSON.stringify(selectedLogDetail.metadata, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </BuilderLayout>
  );
};

export default SessionAITunerPage;

