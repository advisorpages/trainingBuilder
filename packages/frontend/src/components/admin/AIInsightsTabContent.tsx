import React, { useState, useEffect } from 'react';
import {
  aiInteractionsService,
  AIInteraction,
  AIInteractionMetrics,
  AIInteractionFilters,
  AIInteractionType,
  AIInteractionStatus,
  UserFeedback,
} from '../../services/ai-interactions.service';

export const AIInsightsTabContent: React.FC = () => {
  const [activeView, setActiveView] = useState<'metrics' | 'log' | 'failures' | 'quality'>('metrics');
  const [metrics, setMetrics] = useState<AIInteractionMetrics | null>(null);
  const [interactions, setInteractions] = useState<AIInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<AIInteraction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<AIInteractionFilters>({
    page: 1,
    limit: 50,
  });
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (activeView === 'metrics') {
      loadMetrics();
    } else if (activeView === 'log') {
      loadInteractions();
    } else if (activeView === 'failures') {
      loadFailures();
    } else if (activeView === 'quality') {
      loadQualityIssues();
    }
  }, [activeView, filters, dateRange]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const data = await aiInteractionsService.getMetrics({
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInteractions = async () => {
    setIsLoading(true);
    try {
      const response = await aiInteractionsService.getAll({
        ...filters,
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });
      setInteractions(response.data);
      setTotalPages(Math.ceil(response.total / (filters.limit || 50)));
    } catch (error) {
      console.error('Failed to load interactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFailures = async () => {
    setIsLoading(true);
    try {
      const data = await aiInteractionsService.getRecentFailures(50);
      setInteractions(data);
    } catch (error) {
      console.error('Failed to load failures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadQualityIssues = async () => {
    setIsLoading(true);
    try {
      const data = await aiInteractionsService.getDataQualityIssues(50);
      setInteractions(data);
    } catch (error) {
      console.error('Failed to load quality issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const result = await aiInteractionsService.exportInteractions(format, {
        startDate: dateRange.startDate || undefined,
        endDate: dateRange.endDate || undefined,
      });

      const blob = new Blob([result.data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-interactions-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const renderMetrics = () => {
    if (!metrics) return <div className="text-gray-500">Loading metrics...</div>;

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Interactions</div>
            <div className="text-2xl font-bold">{metrics.totalInteractions}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">{metrics.successRate.toFixed(1)}%</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Processing Time</div>
            <div className="text-2xl font-bold">
              {aiInteractionsService.formatProcessingTime(metrics.averageProcessingTime)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Cost</div>
            <div className="text-2xl font-bold">{aiInteractionsService.formatCost(metrics.totalCost)}</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">By Type</h3>
            <div className="space-y-2">
              {Object.entries(metrics.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {aiInteractionsService.getTypeLabel(type as AIInteractionType)}
                  </span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">By Status</h3>
            <div className="space-y-2">
              {Object.entries(metrics.byStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">User Feedback</h3>
            <div className="space-y-2">
              {Object.entries(metrics.byFeedback).map(([feedback, count]) => (
                <div key={feedback} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{feedback.replace('_', ' ')}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Data Quality</h3>
            <div className="text-3xl font-bold text-blue-600">{metrics.dataQualityRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-600 mt-1">Requests with all variables present</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-2">Average Quality Score</h3>
            <div className="text-3xl font-bold text-purple-600">
              {metrics.averageQualityScore > 0 ? metrics.averageQualityScore.toFixed(1) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">User-rated quality (0-100)</div>
          </div>
        </div>
      </div>
    );
  };

  const renderInteractionTable = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {interactions.map((interaction) => (
                <tr key={interaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(interaction.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {aiInteractionsService.getTypeLabel(interaction.interactionType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        interaction.status === AIInteractionStatus.SUCCESS
                          ? 'bg-green-100 text-green-800'
                          : interaction.status === AIInteractionStatus.FAILURE
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {interaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {aiInteractionsService.formatProcessingTime(interaction.processingTimeMs)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {aiInteractionsService.formatTokens(interaction.tokensUsed)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {aiInteractionsService.formatCost(interaction.estimatedCost)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {interaction.userFeedback !== UserFeedback.NO_FEEDBACK ? (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          interaction.userFeedback === UserFeedback.ACCEPTED
                            ? 'bg-green-100 text-green-800'
                            : interaction.userFeedback === UserFeedback.REJECTED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {interaction.userFeedback}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">No feedback</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => setSelectedInteraction(interaction)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {interactions.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">No interactions found</div>
        )}

        {isLoading && <div className="text-center py-12 text-gray-500">Loading...</div>}
      </div>
    );
  };

  const renderFilters = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filters.interactionType || ''}
              onChange={(e) =>
                setFilters({ ...filters, interactionType: e.target.value as AIInteractionType | undefined })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Types</option>
              {Object.values(AIInteractionType).map((type) => (
                <option key={type} value={type}>
                  {aiInteractionsService.getTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as AIInteractionStatus | undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Statuses</option>
              {Object.values(AIInteractionStatus).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
            <select
              value={filters.userFeedback || ''}
              onChange={(e) => setFilters({ ...filters, userFeedback: e.target.value as UserFeedback | undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Feedback</option>
              {Object.values(UserFeedback).map((feedback) => (
                <option key={feedback} value={feedback}>
                  {feedback.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setFilters({ page: 1, limit: 50 });
              setDateRange({ startDate: '', endDate: '' });
            }}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Filters
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Export JSON
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveView('metrics')}
          className={`px-4 py-2 font-medium text-sm ${
            activeView === 'metrics'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Metrics Dashboard
        </button>
        <button
          onClick={() => setActiveView('log')}
          className={`px-4 py-2 font-medium text-sm ${
            activeView === 'log' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Interaction Log
        </button>
        <button
          onClick={() => setActiveView('failures')}
          className={`px-4 py-2 font-medium text-sm ${
            activeView === 'failures'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Recent Failures
        </button>
        <button
          onClick={() => setActiveView('quality')}
          className={`px-4 py-2 font-medium text-sm ${
            activeView === 'quality'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Data Quality Issues
        </button>
      </div>

      {/* Date Range Filter (shown for all views) */}
      {activeView === 'metrics' && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'metrics' && renderMetrics()}
      {activeView === 'log' && (
        <>
          {renderFilters()}
          {renderInteractionTable()}
        </>
      )}
      {activeView === 'failures' && renderInteractionTable()}
      {activeView === 'quality' && renderInteractionTable()}

      {/* Detail Modal */}
      {selectedInteraction && (
        <InteractionDetailModal
          interaction={selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
        />
      )}
    </div>
  );
};

// Detail Modal Component
const InteractionDetailModal: React.FC<{
  interaction: AIInteraction;
  onClose: () => void;
}> = ({ interaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Interaction Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-medium">
                  {aiInteractionsService.getTypeLabel(interaction.interactionType)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium">{interaction.status}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Processing Time</div>
                <div className="font-medium">
                  {aiInteractionsService.formatProcessingTime(interaction.processingTimeMs)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Tokens / Cost</div>
                <div className="font-medium">
                  {aiInteractionsService.formatTokens(interaction.tokensUsed)} /{' '}
                  {aiInteractionsService.formatCost(interaction.estimatedCost)}
                </div>
              </div>
            </div>

            {interaction.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800 mb-1">Error</div>
                <div className="text-sm text-red-700">{interaction.errorMessage}</div>
              </div>
            )}

            {!interaction.allVariablesPresent && interaction.missingVariables && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm font-medium text-yellow-800 mb-1">Missing Variables</div>
                <div className="text-sm text-yellow-700">{interaction.missingVariables.join(', ')}</div>
              </div>
            )}

            <div>
              <div className="text-sm text-gray-600 mb-2">Input Variables</div>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                {JSON.stringify(interaction.inputVariables, null, 2)}
              </pre>
            </div>

            {interaction.aiResponse && (
              <div>
                <div className="text-sm text-gray-600 mb-2">AI Response</div>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto max-h-60">
                  {interaction.aiResponse}
                </pre>
              </div>
            )}

            {interaction.structuredOutput && (
              <div>
                <div className="text-sm text-gray-600 mb-2">Structured Output</div>
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                  {JSON.stringify(interaction.structuredOutput, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
