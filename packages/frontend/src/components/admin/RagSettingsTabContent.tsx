import * as React from 'react';
import { Button } from '../ui';
import {
  ragSettingsService,
  type RagSettings,
  type UpdateRagSettingsDto,
  type TestRagConnectionResponse,
} from '../../services/rag-settings.service';

export const RagSettingsTabContent: React.FC = () => {
  const [settings, setSettings] = React.useState<RagSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestRagConnectionResponse | null>(null);
  const [formData, setFormData] = React.useState<UpdateRagSettingsDto>({});
  const [activeTab, setActiveTab] = React.useState<'api' | 'scoring' | 'variants' | 'template'>(
    'api',
  );

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await ragSettingsService.getSettings();
      setSettings(data);
      setFormData({
        apiUrl: data.apiUrl,
        timeoutMs: data.timeoutMs,
        retryAttempts: data.retryAttempts,
        maxResults: data.maxResults,
        similarityWeight: data.similarityWeight,
        recencyWeight: data.recencyWeight,
        categoryWeight: data.categoryWeight,
        baseScore: data.baseScore,
        similarityThreshold: data.similarityThreshold,
        variant1Weight: data.variant1Weight,
        variant2Weight: data.variant2Weight,
        variant3Weight: data.variant3Weight,
        variant4Weight: data.variant4Weight,
        queryTemplate: data.queryTemplate,
        enabled: data.enabled,
        useCategoryFilter: data.useCategoryFilter,
        useRecencyScoring: data.useRecencyScoring,
      });
    } catch (error) {
      console.error('Failed to load RAG settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await ragSettingsService.updateSettings(formData);
      setSettings(updated);
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert(`Failed to save settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await ragSettingsService.testConnection({
        category: 'Leadership Development',
        desiredOutcome: 'Build high-performing teams',
        sessionType: 'workshop',
        audienceName: 'Senior Managers',
      });
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || error.message,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      const updated = await ragSettingsService.resetToDefaults();
      setSettings(updated);
      setFormData({
        apiUrl: updated.apiUrl,
        timeoutMs: updated.timeoutMs,
        retryAttempts: updated.retryAttempts,
        maxResults: updated.maxResults,
        similarityWeight: updated.similarityWeight,
        recencyWeight: updated.recencyWeight,
        categoryWeight: updated.categoryWeight,
        baseScore: updated.baseScore,
        similarityThreshold: updated.similarityThreshold,
        variant1Weight: updated.variant1Weight,
        variant2Weight: updated.variant2Weight,
        variant3Weight: updated.variant3Weight,
        variant4Weight: updated.variant4Weight,
        queryTemplate: updated.queryTemplate,
        enabled: updated.enabled,
        useCategoryFilter: updated.useCategoryFilter,
        useRecencyScoring: updated.useRecencyScoring,
      });
      alert('Settings reset to defaults!');
    } catch (error: any) {
      alert(`Failed to reset settings: ${error.response?.data?.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof UpdateRagSettingsDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading RAG settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">Failed to load RAG settings</p>
          <Button onClick={loadSettings} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const scoringWeightSum =
    Number(formData.similarityWeight || 0) +
    Number(formData.recencyWeight || 0) +
    Number(formData.categoryWeight || 0) +
    Number(formData.baseScore || 0);

  const scoringWeightError = scoringWeightSum > 1.0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">RAG Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure the Retrieval-Augmented Generation system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              settings.enabled
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {settings.enabled ? '✓ Enabled' : '○ Disabled'}
          </span>
        </div>
      </div>

      {/* Last Test Status */}
      {settings.lastTestStatus !== 'never' && (
        <div
          className={`p-4 rounded-lg border ${
            settings.lastTestStatus === 'success'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold">
                {settings.lastTestStatus === 'success'
                  ? '✓ Last Test: Successful'
                  : '✗ Last Test: Failed'}
              </h3>
              <p className="text-xs text-gray-700 mt-1">{settings.lastTestMessage}</p>
              {settings.lastTestedBy && settings.lastTestedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Tested by {settings.lastTestedBy} on{' '}
                  {new Date(settings.lastTestedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'api', label: 'API Configuration', icon: '🔌' },
            { id: 'scoring', label: 'Scoring Weights', icon: '⚖️' },
            { id: 'variants', label: 'Variant Weights', icon: '🎯' },
            { id: 'template', label: 'Query Template', icon: '📝' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'api' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RAG API URL
              </label>
              <input
                type="text"
                value={formData.apiUrl || ''}
                onChange={(e) => updateField('apiUrl', e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to disable RAG (uses environment variable RAG_API_URL)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={formData.timeoutMs || 0}
                  onChange={(e) => updateField('timeoutMs', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Attempts
                </label>
                <input
                  type="number"
                  value={formData.retryAttempts || 0}
                  onChange={(e) => updateField('retryAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Results
                </label>
                <input
                  type="number"
                  value={formData.maxResults || 0}
                  onChange={(e) => updateField('maxResults', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.enabled || false}
                  onChange={(e) => updateField('enabled', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable RAG</span>
              </label>
            </div>

            <div className="border-t pt-4">
              <Button onClick={handleTestConnection} disabled={testing} variant="outline">
                {testing ? 'Testing...' : '🧪 Test Connection'}
              </Button>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-lg ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}
              >
                <h4 className="text-sm font-semibold mb-2">
                  {testResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}
                </h4>
                <p className="text-xs text-gray-700 mb-2">{testResult.message}</p>
                {testResult.resultsCount !== undefined && (
                  <p className="text-xs text-gray-600">
                    Results: {testResult.resultsCount} • Avg Similarity:{' '}
                    {((testResult.averageSimilarity || 0) * 100).toFixed(1)}% • Response Time:{' '}
                    {testResult.responseTime}ms
                  </p>
                )}
                {testResult.sampleResults && testResult.sampleResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Sample Results:</p>
                    {testResult.sampleResults.map((result, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border text-xs">
                        <p className="font-medium">{result.filename}</p>
                        <p className="text-gray-600 mt-1">{result.excerpt}...</p>
                        <p className="text-gray-500 mt-1">
                          Similarity: {(result.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ℹ️ Scoring weights must sum to ≤ 1.0. Current sum:{' '}
                <strong
                  className={scoringWeightError ? 'text-red-700' : 'text-green-700'}
                >
                  {scoringWeightSum.toFixed(2)}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarity Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.similarityWeight || 0}
                  onChange={(e) => updateField('similarityWeight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weight for vector similarity (0.0-1.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recency Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.recencyWeight || 0}
                  onChange={(e) => updateField('recencyWeight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weight for document recency (0.0-1.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.categoryWeight || 0}
                  onChange={(e) => updateField('categoryWeight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Weight for category match (0.0-1.0)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Score
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={formData.baseScore || 0}
                  onChange={(e) => updateField('baseScore', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Base score for all results</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Similarity Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.similarityThreshold || 0}
                onChange={(e) => updateField('similarityThreshold', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum similarity score to include result (0.0-1.0)
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.useCategoryFilter || false}
                  onChange={(e) => updateField('useCategoryFilter', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Use Category Filter</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.useRecencyScoring || false}
                  onChange={(e) => updateField('useRecencyScoring', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Use Recency Scoring</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                ℹ️ Configure how much RAG context each variant uses (0.0 = none, 1.0 =
                maximum)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant 1: Knowledge Base-Driven
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.variant1Weight || 0}
                  onChange={(e) => updateField('variant1Weight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 0.8 (heavy RAG)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant 2: Recommended Mix
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.variant2Weight || 0}
                  onChange={(e) => updateField('variant2Weight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 0.5 (balanced)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant 3: Creative Approach
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.variant3Weight || 0}
                  onChange={(e) => updateField('variant3Weight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 0.2 (light RAG)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant 4: Alternative Structure
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={formData.variant4Weight || 0}
                  onChange={(e) => updateField('variant4Weight', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 0.0 (pure AI)</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'template' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900 mb-2">
                ℹ️ Advanced: Customize the RAG query template (uses Handlebars syntax)
              </p>
              <p className="text-xs text-blue-800">
                Use <code className="bg-blue-100 px-1 rounded">{`{{placeholder}}`}</code> for values and{' '}
                <code className="bg-blue-100 px-1 rounded">{`{{#if placeholder}}...{{/if}}`}</code> for
                conditionals
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Query Template
              </label>
              <textarea
                value={formData.queryTemplate || ''}
                onChange={(e) => updateField('queryTemplate', e.target.value)}
                placeholder="Leave empty to use default template..."
                rows={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
              />
            </div>

            {/* Available Placeholders */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Available Placeholders (Actually Sent to RAG):
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-gray-700 mb-2">Session Info:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li><code className="bg-gray-100 px-1 rounded">sessionType</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">category</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">specificTopics</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">desiredOutcome</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">currentProblem</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">duration</code></li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-700 mb-2">Audience Profile:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li><code className="bg-gray-100 px-1 rounded">audienceName</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">audienceDescription</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">experienceLevel</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">preferredLearningStyle</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">communicationStyle</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">vocabularyLevel</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">exampleTypes</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">avoidTopics</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">technicalDepth</code></li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-gray-700 mb-2">Tone & Style:</p>
                  <ul className="space-y-1 text-gray-600">
                    <li><code className="bg-gray-100 px-1 rounded">toneStyle</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">toneDescription</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">energyLevel</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">formality</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">sentenceStructure</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">languageCharacteristics</code></li>
                    <li><code className="bg-gray-100 px-1 rounded">emotionalResonance</code></li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 italic">
                💡 Total: 22 enriched placeholders (6 session + 9 audience + 7 tone)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button onClick={handleResetDefaults} variant="outline" disabled={saving}>
          Reset to Defaults
        </Button>

        <div className="flex items-center gap-3">
          <Button onClick={loadSettings} variant="outline" disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || scoringWeightError}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
};
