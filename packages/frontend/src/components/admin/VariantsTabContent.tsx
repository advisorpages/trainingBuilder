import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { variantConfigService, VariantConfig } from '../../services/variant-config.service';

interface InstructionToken {
  key: string;
  label: string;
  description: string;
  sample: string;
  aliases?: string[];
}

const INSTRUCTION_TOKENS: InstructionToken[] = [
  { key: 'category', label: 'Category', description: 'Session category name', sample: 'Financial Services' },
  { key: 'session_type', label: 'Session Type', description: 'Delivery format (training, workshop, etc.)', sample: 'training' },
  { key: 'desired_outcome', label: 'Desired Outcome', description: 'Target result statement for the session', sample: 'Increase mutual fund close rates by 15% in Q4.' },
  { key: 'current_problem', label: 'Current Problem', description: 'Pain point the session should address', sample: 'Advisors lack confidence positioning mutual funds with existing clients.' },
  { key: 'specific_topics', label: 'Specific Topics (raw)', description: 'Comma-separated topics entered by the user', sample: 'fund structures, risk framing, objection handling' },
  {
    key: 'specific_topics_list',
    label: 'Specific Topics (list)',
    description: 'Comma-separated list of topics',
    sample: 'fund structures, risk framing, objection handling',
  },
  {
    key: 'specific_topics_bullets',
    label: 'Specific Topics (bullets)',
    description: 'Bulleted list of topics, one per line',
    sample: '• fund structures\n• risk framing\n• objection handling',
  },
  { key: 'audience_name', label: 'Audience Name', description: 'Name of the selected audience profile', sample: 'Client Advisory Team' },
  {
    key: 'audience_description',
    label: 'Audience Description',
    description: 'Narrative description pulled from the audience profile',
    sample: 'Mid-level advisors with growing books of business.',
  },
  {
    key: 'audience_experience_level',
    label: 'Audience Experience Level',
    description: 'Experience level from the audience profile',
    sample: 'intermediate',
  },
  {
    key: 'audience_learning_style',
    label: 'Audience Learning Style',
    description: 'Preferred learning style of the audience',
    sample: 'hands-on',
  },
  {
    key: 'audience_communication_style',
    label: 'Audience Communication Style',
    description: 'Typical communication tone for the audience',
    sample: 'conversational',
  },
  {
    key: 'audience_technical_depth',
    label: 'Audience Technical Depth',
    description: '1-5 rating reflecting technical comfort',
    sample: '3',
  },
  { key: 'audience_size', label: 'Audience Size', description: 'Audience size entered by the user', sample: '25 advisors' },
  { key: 'tone_name', label: 'Tone Name', description: 'Selected tone name', sample: 'Consultative' },
  { key: 'tone_style', label: 'Tone Style', description: 'Tone style enum', sample: 'collaborative' },
  { key: 'tone_description', label: 'Tone Description', description: 'Description of the tone profile', sample: 'Supportive and confident.' },
  { key: 'tone_energy_level', label: 'Tone Energy Level', description: 'Selected tone energy level', sample: 'energetic' },
  { key: 'tone_formality', label: 'Tone Formality', description: '1-5 formality rating', sample: '3' },
  {
    key: 'tone_sentence_structure',
    label: 'Tone Sentence Structure',
    description: 'Preferred sentence structure',
    sample: 'varied',
  },
  {
    key: 'duration_minutes',
    label: 'Session Duration',
    description: 'Total session duration in minutes',
    sample: '90',
    aliases: ['duration'],
  },
  { key: 'start_time', label: 'Start Time', description: 'Start time ISO string', sample: '2025-01-15T10:00:00-05:00' },
  { key: 'end_time', label: 'End Time', description: 'End time ISO string', sample: '2025-01-15T11:30:00-05:00' },
  { key: 'timezone', label: 'Timezone', description: 'Session timezone', sample: 'America/New_York' },
  { key: 'location_name', label: 'Location Name', description: 'Selected location name', sample: 'HQ Training Room B' },
  { key: 'location_type', label: 'Location Type', description: 'Location type or platform', sample: 'in_person' },
  { key: 'meeting_platform', label: 'Meeting Platform', description: 'Virtual platform if applicable', sample: 'on-site' },
  { key: 'location_capacity', label: 'Location Capacity', description: 'Capacity of the selected location', sample: '30' },
  { key: 'location_notes', label: 'Location Notes', description: 'Additional notes or access instructions', sample: 'Projector + whiteboard.' },
  { key: 'location_timezone', label: 'Location Timezone', description: 'Location timezone', sample: 'America/New_York' },
  {
    key: 'topics',
    label: 'Topics (bullets)',
    description: 'Bulleted list of user-provided topics',
    sample:
      '• Opening: Market pulse and fund positioning\n• Workshop: Suitability scenarios\n• Clinic: Objection practice',
  },
  {
    key: 'topic_titles',
    label: 'Topic Titles (; separated)',
    description: 'Semicolon-separated topic titles',
    sample:
      'Opening: Market pulse and fund positioning; Workshop: Suitability scenarios; Clinic: Objection practice',
  },
  {
    key: 'topic_titles_inline',
    label: 'Topic Titles (comma separated)',
    description: 'Comma-separated topic titles',
    sample:
      'Opening: Market pulse and fund positioning, Workshop: Suitability scenarios, Clinic: Objection practice',
    aliases: ['topics_inline'],
  },
  { key: 'topics_count', label: 'Topics Count', description: 'Number of user-entered topics', sample: '3' },
  {
    key: 'first_topic_title',
    label: 'First Topic Title',
    description: 'Title of the first user topic',
    sample: 'Opening: Market pulse and fund positioning',
  },
  {
    key: 'first_topic_description',
    label: 'First Topic Description',
    description: 'Description of the first topic',
    sample: 'Set the context with performance snapshots.',
  },
  {
    key: 'first_topic_duration',
    label: 'First Topic Duration',
    description: 'Duration minutes for the first topic',
    sample: '15',
  },
  {
    key: 'second_topic_title',
    label: 'Second Topic Title',
    description: 'Title of the second topic',
    sample: 'Workshop: Suitability scenarios',
  },
  {
    key: 'second_topic_description',
    label: 'Second Topic Description',
    description: 'Description of the second topic',
    sample: 'Triad practice aligning funds to goals.',
  },
  {
    key: 'second_topic_duration',
    label: 'Second Topic Duration',
    description: 'Duration minutes for the second topic',
    sample: '45',
  },
  { key: 'variant_label', label: 'Variant Label', description: 'This variant’s label', sample: 'Precision' },
  {
    key: 'variant_description',
    label: 'Variant Description',
    description: 'Description shown to users for this variant',
    sample: 'Structured playbook leaning on proven fund scripts.',
  },
  {
    key: 'rag_sources_count',
    label: 'RAG Sources Count',
    description: 'Number of knowledge-base documents included',
    sample: '4',
  },
  { key: 'session_title', label: 'Session Title', description: 'Title provided by the requester', sample: 'Mutual Fund Fundamentals Playbook' },
];

const SAMPLE_PREVIEW_CONTEXT = INSTRUCTION_TOKENS.reduce((acc, token) => {
  acc[token.key.toLowerCase()] = token.sample;
  token.aliases?.forEach(alias => {
    acc[alias.toLowerCase()] = token.sample;
  });
  return acc;
}, {} as Record<string, string>);

const KNOWN_TOKEN_KEYS = (() => {
  const keys = new Set<string>();
  INSTRUCTION_TOKENS.forEach(token => {
    keys.add(token.key.toLowerCase());
    token.aliases?.forEach(alias => keys.add(alias.toLowerCase()));
  });
  return keys;
})();

const ALIAS_TOKENS = INSTRUCTION_TOKENS.flatMap(token =>
  (token.aliases ?? []).map(alias => ({
    key: alias,
    parent: token.key,
    description: token.description,
    sample: token.sample,
  }))
);

const formatToken = (key: string) => `{{${key}}}`;

const applyInstructionTokens = (instruction: string, replacements: Record<string, string>) =>
  instruction.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, token) => {
    const normalized = token.toLowerCase();
    return replacements[normalized] ?? '';
  });

const extractUnknownTokens = (instruction: string): string[] => {
  const matches = instruction.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g);
  const tokens = new Set<string>();
  for (const match of matches) {
    const raw = match[1];
    if (!KNOWN_TOKEN_KEYS.has(raw.toLowerCase())) {
      tokens.add(raw);
    }
  }
  return Array.from(tokens);
};

export const VariantsTabContent: React.FC = () => {
  const [variants, setVariants] = useState<VariantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, Partial<VariantConfig>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const instructionRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const loadVariants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await variantConfigService.getAllVariantConfigs();
      setVariants(data.sort((a, b) => a.variantIndex - b.variantIndex));
    } catch (err) {
      setError('Failed to load variant configurations');
      console.error('Error loading variants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, []);

  const handleEdit = (variant: VariantConfig) => {
    setEditingId(variant.id);
    setEditedData(prev => ({
      ...prev,
      [variant.id]: {
        label: variant.label,
        description: variant.description,
        instruction: variant.instruction,
      },
    }));
  };

  const handleCancel = (variantId: string) => {
    setEditingId(null);
    setEditedData(prev => {
      const updated = { ...prev };
      delete updated[variantId];
      return updated;
    });
  };

  const handleSave = async (variant: VariantConfig) => {
    const data = editedData[variant.id];
    if (!data) return;

    try {
      setSaving(variant.id);
      await variantConfigService.updateVariantConfig(variant.id, data);
      setEditingId(null);
      setEditedData(prev => {
        const updated = { ...prev };
        delete updated[variant.id];
        return updated;
      });
      await loadVariants();
    } catch (err) {
      setError(`Failed to update variant: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating variant:', err);
    } finally {
      setSaving(null);
    }
  };

  const updateEditedData = (variantId: string, field: keyof VariantConfig, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [variantId]: {
        ...prev[variantId],
        [field]: value,
      },
    }));
  };

  const registerInstructionRef = (variantId: string) => (element: HTMLTextAreaElement | null) => {
    instructionRefs.current[variantId] = element;
  };

  const insertToken = (variantId: string, token: string) => {
    const textarea = instructionRefs.current[variantId];
    const currentValue =
      editedData[variantId]?.instruction ??
      variants.find(existing => existing.id === variantId)?.instruction ??
      '';

    const selectionStart = textarea?.selectionStart ?? currentValue.length;
    const selectionEnd = textarea?.selectionEnd ?? selectionStart;
    const newValue = `${currentValue.slice(0, selectionStart)}${token}${currentValue.slice(selectionEnd)}`;

    updateEditedData(variantId, 'instruction', newValue);

    if (textarea) {
      const cursor = selectionStart + token.length;
      requestAnimationFrame(() => {
        const target = instructionRefs.current[variantId];
        if (target) {
          target.focus();
          target.setSelectionRange(cursor, cursor);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading variant configurations...</p>
      </div>
    );
  }

  if (error && variants.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
        <p className="text-red-700 mb-2">{error}</p>
        <Button variant="outline" onClick={loadVariants}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> These variant configurations control how AI generates different outline options.
          Changes will affect future session outline generation.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {variants.map((variant) => {
          const isEditing = editingId === variant.id;
          const isSavingActive = saving === variant.id;
          const data = editedData[variant.id] || variant;
          const instructionValue = data.instruction || '';
          const previewText = applyInstructionTokens(instructionValue, SAMPLE_PREVIEW_CONTEXT);
          const unknownTokens = isEditing ? extractUnknownTokens(instructionValue) : [];

          return (
            <Card key={variant.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Variant {variant.variantIndex + 1}
                      {variant.version > 1 && (
                        <span className="ml-2 text-sm text-slate-500">(v{variant.version})</span>
                      )}
                    </CardTitle>
                    {!isEditing && (
                      <p className="text-sm text-slate-600 mt-1">{variant.label}</p>
                    )}
                  </div>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => handleEdit(variant)}>
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Label
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={data.label || ''}
                      onChange={(e) => updateEditedData(variant.id, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Knowledge Base-Driven"
                    />
                  ) : (
                    <p className="text-slate-900">{variant.label}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description (shown to users)
                  </label>
                  {isEditing ? (
                    <textarea
                      value={data.description || ''}
                      onChange={(e) => updateEditedData(variant.id, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={3}
                      placeholder="e.g., Proven frameworks and trusted playbook approach. Data-backed and familiar structure."
                    />
                  ) : (
                    <p className="text-slate-700">{variant.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    AI Instruction (guides outline generation)
                  </label>
                  {isEditing ? (
                    <textarea
                      ref={registerInstructionRef(variant.id)}
                      value={instructionValue}
                      onChange={(e) => updateEditedData(variant.id, 'instruction', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      rows={6}
                      placeholder="Instructions for AI on how to generate this variant..."
                    />
                  ) : (
                    <p className="text-slate-700 whitespace-pre-wrap font-mono text-xs bg-slate-50 p-3 rounded border border-slate-200">
                      {variant.instruction}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">
                        Available tokens
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {INSTRUCTION_TOKENS.map((token) => (
                          <button
                            key={`${variant.id}-${token.key}`}
                            type="button"
                            onClick={() => insertToken(variant.id, formatToken(token.key))}
                            title={`${token.description}\nExample: ${token.sample}`}
                            className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full border border-slate-200 transition-colors"
                          >
                            {formatToken(token.key)}
                          </button>
                        ))}
                        {ALIAS_TOKENS.map(alias => (
                          <button
                            key={`${variant.id}-${alias.key}`}
                            type="button"
                            onClick={() => insertToken(variant.id, formatToken(alias.key))}
                            title={`Alias for ${formatToken(alias.parent)}\nExample: ${alias.sample}`}
                            className="text-xs px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-full border border-slate-200 transition-colors"
                          >
                            {formatToken(alias.key)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {unknownTokens.length > 0 && (
                      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                        <span className="font-semibold">Heads up:</span>
                        <span>
                          Unrecognized tokens {unknownTokens.map(token => formatToken(token)).join(', ')} will be removed at runtime.
                        </span>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-md">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                        <p className="text-xs font-semibold text-slate-600">
                          Preview with sample session data
                        </p>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">
                          Example only
                        </span>
                      </div>
                      <pre className="text-xs text-slate-700 whitespace-pre-wrap px-3 py-3 font-mono overflow-x-auto">
                        {previewText || '—'}
                      </pre>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleSave(variant)}
                      disabled={isSavingActive}
                    >
                      {isSavingActive ? 'Saving…' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => handleCancel(variant.id)} disabled={isSavingActive}>
                      Cancel
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
