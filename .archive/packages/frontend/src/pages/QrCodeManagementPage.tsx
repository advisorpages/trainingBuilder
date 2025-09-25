import React, { useState, useEffect } from 'react';
import { Session, SessionStatus } from '@leadership-training/shared';
import QrCodeDisplay from '../components/sessions/QrCodeDisplay';
import { useAuth } from '../contexts/AuthContext';

// API service functions (these would be implemented in a proper API service file)
const qrCodeAPI = {
  async getQrCodeStatus(): Promise<{ sessions: Array<Session & { has_qr_code: boolean }> }> {
    const response = await fetch('/api/admin/qr-codes/status', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch QR code status');
    return response.json();
  },

  async generateQrCode(sessionId: string): Promise<{ success: boolean; qr_code_url?: string; error?: string }> {
    const response = await fetch(`/api/admin/qr-codes/sessions/${sessionId}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to generate QR code');
    return response.json();
  },

  async regenerateQrCode(sessionId: string): Promise<{ success: boolean; qr_code_url?: string; error?: string }> {
    const response = await fetch(`/api/admin/qr-codes/sessions/${sessionId}/regenerate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to regenerate QR code');
    return response.json();
  },

  async batchGenerateQrCodes(sessionIds: string[]): Promise<{
    results: Array<{ session_id: string; success: boolean; qr_code_url?: string; error?: string }>;
    summary: { total: number; successful: number; failed: number; success_rate: number };
  }> {
    const response = await fetch('/api/admin/qr-codes/batch-generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_ids: sessionIds }),
    });
    if (!response.ok) throw new Error('Failed to batch generate QR codes');
    return response.json();
  },

  async getSessionsMissingQrCodes(): Promise<{ sessions: Session[] }> {
    const response = await fetch('/api/admin/qr-codes/missing', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to fetch sessions missing QR codes');
    return response.json();
  },
};

export const QrCodeManagementPage: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Array<Session & { has_qr_code: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'with_qr' | 'missing_qr'>('all');
  const [error, setError] = useState<string | null>(null);

  // Check if user is broker (admin role)
  const isAdmin = user?.role?.name === 'Broker';

  useEffect(() => {
    if (isAdmin) {
      loadQrCodeStatus();
    }
  }, [isAdmin]);

  const loadQrCodeStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await qrCodeAPI.getQrCodeStatus();
      setSessions(data.sessions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load QR code status');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateQrCode = async (sessionId: string) => {
    try {
      const result = await qrCodeAPI.regenerateQrCode(sessionId);
      if (result.success) {
        // Update the session in the list
        setSessions(prev => prev.map(session =>
          session.id === sessionId
            ? { ...session, qrCodeUrl: result.qr_code_url, has_qr_code: true }
            : session
        ));
      } else {
        alert(`Failed to regenerate QR code: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBatchGenerate = async () => {
    if (selectedSessions.length === 0) {
      alert('Please select sessions to generate QR codes for');
      return;
    }

    try {
      setBatchLoading(true);
      const result = await qrCodeAPI.batchGenerateQrCodes(selectedSessions);

      // Update sessions with new QR codes
      setSessions(prev => prev.map(session => {
        const updateResult = result.results.find(r => r.session_id === session.id);
        if (updateResult && updateResult.success) {
          return { ...session, qrCodeUrl: updateResult.qr_code_url, has_qr_code: true };
        }
        return session;
      }));

      setSelectedSessions([]);
      alert(`Batch generation completed: ${result.summary.successful}/${result.summary.total} successful`);
    } catch (error) {
      alert(`Batch generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session => {
    switch (filter) {
      case 'with_qr':
        return session.has_qr_code;
      case 'missing_qr':
        return !session.has_qr_code;
      default:
        return true;
    }
  });

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                <p className="mt-1 text-sm text-red-700">
                  You need administrator permissions to access QR code management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QR Code Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage QR codes for published training sessions
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={loadQrCodeStatus}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex mt-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </a>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-500">QR Code Management</span>
              </li>
            </ol>
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Sessions</option>
                <option value="with_qr">With QR Codes</option>
                <option value="missing_qr">Missing QR Codes</option>
              </select>
            </div>

            {/* Batch Actions */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedSessions.length} selected
              </span>
              <button
                onClick={handleBatchGenerate}
                disabled={selectedSessions.length === 0 || batchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {batchLoading ? 'Generating...' : 'Batch Generate QR Codes'}
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'missing_qr' ? 'All published sessions have QR codes.' : 'No published sessions available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <input
                    type="checkbox"
                    checked={selectedSessions.includes(session.id)}
                    onChange={() => toggleSessionSelection(session.id)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    session.status === SessionStatus.PUBLISHED
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">{session.title}</h3>

                <div className="mb-4">
                  <QrCodeDisplay
                    qrCodeUrl={session.qrCodeUrl}
                    sessionId={session.id}
                    sessionTitle={session.title}
                    size="medium"
                    showLabel={true}
                    allowCopy={true}
                    allowDownload={true}
                    onRegenerate={() => handleRegenerateQrCode(session.id)}
                  />
                </div>

                <div className="text-sm text-gray-500">
                  <p>Created: {new Date(session.createdAt).toLocaleDateString()}</p>
                  <p>Start: {new Date(session.startTime).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrCodeManagementPage;