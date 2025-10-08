import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { variantConfigService, VariantConfig } from '../../services/variant-config.service';

export const VariantsTabContent: React.FC = () => {
  const [variants, setVariants] = useState<VariantConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, Partial<VariantConfig>>>({});
  const [saving, setSaving] = useState<string | null>(null);

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
    setEditedData({
      ...editedData,
      [variant.id]: {
        label: variant.label,
        description: variant.description,
        instruction: variant.instruction,
      },
    });
  };

  const handleCancel = (variantId: string) => {
    setEditingId(null);
    const updated = { ...editedData };
    delete updated[variantId];
    setEditedData(updated);
  };

  const handleSave = async (variant: VariantConfig) => {
    const data = editedData[variant.id];
    if (!data) return;

    try {
      setSaving(variant.id);
      await variantConfigService.updateVariantConfig(variant.id, data);
      setEditingId(null);
      const updated = { ...editedData };
      delete updated[variant.id];
      setEditedData(updated);
      await loadVariants();
    } catch (err) {
      setError(`Failed to update variant: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error updating variant:', err);
    } finally {
      setSaving(null);
    }
  };

  const updateEditedData = (variantId: string, field: keyof VariantConfig, value: string) => {
    setEditedData({
      ...editedData,
      [variantId]: {
        ...editedData[variantId],
        [field]: value,
      },
    });
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
          const isSaving = saving === variant.id;
          const data = editedData[variant.id] || variant;

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
                      value={data.instruction || ''}
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
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      onClick={() => handleSave(variant)}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(variant.id)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                <div className="text-xs text-slate-500 pt-2">
                  Last updated: {new Date(variant.updatedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
