import React, { useState, useEffect } from 'react';
import { aiInteractionsService } from '../../services/ai-interactions.service';

interface VariantSelectionMetrics {
  totalSelections: number;
  selectionsByVariant: Record<string, number>;
  selectionRateByVariant: Record<string, number>;
  ragVsBaselineRate: {
    ragSelections: number;
    baselineSelections: number;
    ragPercentage: number;
    baselinePercentage: number;
  };
  averageRagWeight: number;
  categoryBreakdown: Record<string, {
    total: number;
    ragCount: number;
    baselineCount: number;
    ragPercentage: number;
  }>;
  averageRagSourcesUsed: number;
  selectionsByLabel: Record<string, number>;
}

interface VariantAnalyticsDashboardProps {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export const VariantAnalyticsDashboard: React.FC<VariantAnalyticsDashboardProps> = ({ dateRange }) => {
  const [metrics, setMetrics] = useState<VariantSelectionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiInteractionsService.getVariantSelectionMetrics({
        startDate: dateRange?.startDate || undefined,
        endDate: dateRange?.endDate || undefined,
      });
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load variant selection metrics:', err);
      setError('Failed to load variant selection metrics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!metrics || metrics.totalSelections === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">No variant selections recorded yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Start using Session Builder v2.0 to see variant selection analytics here.
        </p>
      </div>
    );
  }

  const ragSuccessRate = metrics.ragVsBaselineRate.ragPercentage;
  const isRagSuccessful = ragSuccessRate >= 50;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Selections</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">{metrics.totalSelections}</div>
        </div>

        <div className={`bg-white border rounded-lg p-4 ${isRagSuccessful ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
          <div className="text-sm text-gray-600">RAG Selection Rate</div>
          <div className={`text-2xl font-semibold mt-1 ${isRagSuccessful ? 'text-green-700' : 'text-yellow-700'}`}>
            {ragSuccessRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isRagSuccessful ? '✓ Target met (>50%)' : '⚠ Below target (50%)'}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Avg RAG Weight</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {(metrics.averageRagWeight * 100).toFixed(0)}%
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Avg RAG Sources</div>
          <div className="text-2xl font-semibold text-gray-900 mt-1">
            {metrics.averageRagSourcesUsed.toFixed(1)}
          </div>
        </div>
      </div>

      {/* RAG vs Baseline */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">RAG vs Baseline Distribution</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">RAG-Powered Variants</span>
              <span className="text-sm text-gray-600">
                {metrics.ragVsBaselineRate.ragSelections} selections ({ragSuccessRate.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${ragSuccessRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Baseline (No RAG)</span>
              <span className="text-sm text-gray-600">
                {metrics.ragVsBaselineRate.baselineSelections} selections ({metrics.ragVsBaselineRate.baselinePercentage.toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${metrics.ragVsBaselineRate.baselinePercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Selections by Variant */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Selections by Variant</h3>
        <div className="space-y-3">
          {Object.entries(metrics.selectionsByLabel).map(([label, count]) => {
            const percentage = metrics.totalSelections > 0 ? (count / metrics.totalSelections) * 100 : 0;
            return (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(metrics.categoryBreakdown).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Category</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">RAG</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Baseline</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">RAG %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Object.entries(metrics.categoryBreakdown)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([category, stats]) => (
                    <tr key={category}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{category}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{stats.total}</td>
                      <td className="px-4 py-3 text-sm text-blue-600 text-right">{stats.ragCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-right">{stats.baselineCount}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-medium ${stats.ragPercentage >= 50 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {stats.ragPercentage.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Success Indicator */}
      <div className={`border rounded-lg p-4 ${isRagSuccessful ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'}`}>
        <div className="flex items-start gap-3">
          <div className={`text-2xl ${isRagSuccessful ? 'text-green-600' : 'text-yellow-600'}`}>
            {isRagSuccessful ? '✓' : '⚠'}
          </div>
          <div className="flex-1">
            <h4 className={`font-semibold ${isRagSuccessful ? 'text-green-900' : 'text-yellow-900'}`}>
              {isRagSuccessful ? 'Success: RAG is Effective' : 'Warning: RAG Below Target'}
            </h4>
            <p className={`text-sm mt-1 ${isRagSuccessful ? 'text-green-700' : 'text-yellow-700'}`}>
              {isRagSuccessful
                ? `RAG-powered variants are selected ${ragSuccessRate.toFixed(1)}% of the time, exceeding the 50% target. This indicates that RAG is adding value to session generation.`
                : `RAG-powered variants are only selected ${ragSuccessRate.toFixed(1)}% of the time, below the 50% target. Consider improving RAG query quality or adjusting variant generation strategy.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
