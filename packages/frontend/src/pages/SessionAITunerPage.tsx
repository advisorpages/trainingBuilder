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
} from '../services/session-ai-tuner.service';
import { cn } from '../lib/utils';

type TabKey = 'overview' | 'recent' | 'sandbox' | 'saved';
type SandboxSubTab = 'personas' | 'tone' | 'duration';
type ComparisonView = 'summary' | 'prompt' | 'outline';

interface RunsParams {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
}

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

  const [savedSettings, setSavedSettings] = React.useState<AiPromptSetting[]>([]);
  const [savedLoading, setSavedLoading] = React.useState(false);

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [comparisonPrimary, setComparisonPrimary] = React.useState<AIInteractionComparison | null>(null);
  const [comparisonTargetId, setComparisonTargetId] = React.useState<string | null>(null);
  const [comparisonView, setComparisonView] = React.useState<ComparisonView>('summary');

  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [initialLoading, setInitialLoading] = React.useState(false);

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

  React.useEffect(() => {
    const initialise = async () => {
      try {
        setInitialLoading(true);
        await Promise.all([
          fetchOverview(),
          fetchRuns(runsParams),
          fetchSavedSettings(),
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
    if (!sandboxSettings) return '';
    const persona = sandboxSettings.variantPersonas[0];
    const pieces: string[] = [];
    if (persona) {
      pieces.push(`# Persona: ${persona.label}`);
      if (persona.summary) {
        pieces.push(persona.summary);
      }
      pieces.push(persona.prompt);
    }
    pieces.push('');
    pieces.push(`# Tone Guidance`);
    pieces.push(sandboxSettings.globalTone.toneGuidelines);
    pieces.push('');
    pieces.push(`# System Directives`);
    pieces.push(sandboxSettings.globalTone.systemGuidelines);
    pieces.push('');
    pieces.push(`# Duration & Flow`);
    pieces.push(`- ${sandboxSettings.durationFlow.pacingGuidelines}`);
    pieces.push(`- ${sandboxSettings.durationFlow.structuralNotes}`);
    pieces.push('');
    pieces.push(`# Quick Tweaks`);
    pieces.push(
      `Data emphasis: ${formatBool(sandboxSettings.quickTweaks.increaseDataEmphasis)}, ` +
      `Pace: ${formatBool(sandboxSettings.quickTweaks.speedUpPace)}, ` +
      `RAG priority: ${formatBool(sandboxSettings.quickTweaks.raiseRagPriority)}`
    );
    return pieces.join('\n');
  }, [sandboxSettings]);

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
              <div className="grid gap-4 md:grid-cols-2">
                {sandboxSettings.variantPersonas.map(persona => (
                  <Card
                    key={persona.id}
                    className={cn(
                      'border-slate-200 transition-shadow hover:shadow-md',
                      activePersonaId === persona.id && 'border-blue-400 shadow-lg'
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-slate-900">
                          {persona.label}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivePersonaId(persona.id)}
                        >
                          Focus
                        </Button>
                      </div>
                      <CardDescription>Guidance for this persona variant</CardDescription>
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
                    </CardContent>
                  </Card>
                ))}
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
            <CardTitle>Live Prompt Preview</CardTitle>
            <CardDescription>Composite view of current sandbox instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-xs text-slate-100">
              {sandboxPreviewPrompt}
            </pre>
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
            <TabsTrigger value="recent">Recent Generations</TabsTrigger>
            <TabsTrigger value="sandbox">Prompt Sandbox</TabsTrigger>
            <TabsTrigger value="saved">Saved Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
          <TabsContent value="recent">{renderRecentTab()}</TabsContent>
          <TabsContent value="sandbox">{renderSandboxTab()}</TabsContent>
          <TabsContent value="saved">{renderSavedSettingsTab()}</TabsContent>
        </Tabs>
      </div>

      {renderComparisonDrawer()}
    </BuilderLayout>
  );
};

export default SessionAITunerPage;

