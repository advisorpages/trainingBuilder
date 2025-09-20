import React, { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters?: any;
}

export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  includedMetrics: {
    sessions: boolean;
    registrations: boolean;
    trainers: boolean;
    topics: boolean;
  };
  reportTitle: string;
  reportDescription: string;
  includeCharts: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, currentFilters }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    includedMetrics: {
      sessions: true,
      registrations: true,
      trainers: true,
      topics: true
    },
    reportTitle: 'Training Analytics Report',
    reportDescription: 'Comprehensive analytics report for training sessions',
    includeCharts: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call export API here
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...exportOptions,
          filters: currentFilters
        })
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      if (response.ok) {
        const result = await response.json();

        // Handle download
        if (result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Close modal after successful export
        setTimeout(() => {
          onClose();
          setIsExporting(false);
          setExportProgress(0);
        }, 1000);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getEstimatedSize = () => {
    // Rough estimation based on selected metrics
    const baseSize = 50; // KB
    const metricCount = Object.values(exportOptions.includedMetrics).filter(Boolean).length;
    const formatMultiplier = exportOptions.format === 'pdf' ? 3 : exportOptions.format === 'excel' ? 2 : 1;

    return `~${Math.round(baseSize * metricCount * formatMultiplier)} KB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Export Analytics Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isExporting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isExporting ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="animate-spin mx-auto h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Export...</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{exportProgress}% complete</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'csv', label: 'CSV (Spreadsheet)', icon: '📊' },
                    { value: 'pdf', label: 'PDF Report', icon: '📄' },
                    { value: 'excel', label: 'Excel Workbook', icon: '📈' },
                    { value: 'json', label: 'JSON Data', icon: '💾' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as ExportFormat }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        exportOptions.format === format.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="text-xl mr-2">{format.icon}</span>
                        <span className="font-medium">{format.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.startDate}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, startDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={exportOptions.dateRange.endDate}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, endDate: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Included Metrics */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include Data</label>
                <div className="space-y-2">
                  {[
                    { key: 'sessions', label: 'Session Data' },
                    { key: 'registrations', label: 'Registration Data' },
                    { key: 'trainers', label: 'Trainer Performance' },
                    { key: 'topics', label: 'Topic Analytics' }
                  ].map((metric) => (
                    <label key={metric.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includedMetrics[metric.key as keyof typeof exportOptions.includedMetrics]}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          includedMetrics: {
                            ...prev.includedMetrics,
                            [metric.key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{metric.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                  <input
                    type="text"
                    value={exportOptions.reportTitle}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, reportTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={exportOptions.reportDescription}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, reportDescription: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* PDF Options */}
              {exportOptions.format === 'pdf' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include Charts in PDF</span>
                  </label>
                </div>
              )}

              {/* Export Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Estimated Size:</span>
                  <span className="text-sm text-gray-600">{getEstimatedSize()}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium text-gray-700">Records:</span>
                  <span className="text-sm text-gray-600">~500-1000</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={Object.values(exportOptions.includedMetrics).every(v => !v)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;