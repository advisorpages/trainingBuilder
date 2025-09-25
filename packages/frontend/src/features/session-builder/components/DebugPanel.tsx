import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '../../../ui';
import { cn } from '../../../lib/utils';

interface ApiCall {
  id: string;
  url: string;
  method: string;
  timestamp: Date;
  duration: number;
  status: 'pending' | 'success' | 'error';
  request: any;
  response?: any;
  error?: string;
}

interface DebugPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

// Global debug store for tracking API calls
class DebugStore {
  private calls: ApiCall[] = [];
  private listeners: Set<(calls: ApiCall[]) => void> = new Set();

  addCall(call: Omit<ApiCall, 'id' | 'timestamp'>) {
    const apiCall: ApiCall = {
      ...call,
      id: `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.calls = [apiCall, ...this.calls.slice(0, 49)]; // Keep last 50 calls
    this.notifyListeners();
    return apiCall.id;
  }

  updateCall(id: string, updates: Partial<ApiCall>) {
    this.calls = this.calls.map(call =>
      call.id === id ? { ...call, ...updates } : call
    );
    this.notifyListeners();
  }

  getCalls() {
    return [...this.calls];
  }

  subscribe(listener: (calls: ApiCall[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  clear() {
    this.calls = [];
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getCalls()));
  }
}

export const debugStore = new DebugStore();

// Hook to intercept API calls for debugging
export const useApiDebugger = () => {
  React.useEffect(() => {
    // Intercept fetch calls
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const [input, init] = args;
      const url = input.toString();
      const method = init?.method || 'GET';

      // Only track session builder API calls
      if (!url.includes('/sessions/builder/')) {
        return originalFetch(...args);
      }

      const startTime = Date.now();
      const callId = debugStore.addCall({
        url,
        method,
        duration: 0,
        status: 'pending',
        request: {
          url,
          method,
          headers: init?.headers,
          body: init?.body ? JSON.parse(init.body as string) : null,
        },
      });

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        // Clone response to read body without consuming it
        const responseClone = response.clone();
        const responseData = await responseClone.text();
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseData);
        } catch {
          parsedResponse = responseData;
        }

        debugStore.updateCall(callId, {
          duration,
          status: response.ok ? 'success' : 'error',
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: parsedResponse,
          },
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        });

        return response;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        debugStore.updateCall(callId, {
          duration,
          status: 'error',
          error: error.message || 'Network error',
        });
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);
};

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onToggle }) => {
  const [calls, setCalls] = React.useState<ApiCall[]>([]);
  const [selectedCall, setSelectedCall] = React.useState<ApiCall | null>(null);

  React.useEffect(() => {
    return debugStore.subscribe(setCalls);
  }, []);

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Debug ({calls.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[600px] bg-white border border-slate-200 rounded-lg shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">API Debug Panel</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => debugStore.clear()}
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700"
          >
            Clear
          </Button>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex flex-col max-h-[520px]">
        {!selectedCall ? (
          <div className="flex-1 overflow-y-auto">
            {calls.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No API calls yet. Generate some content to see requests.
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {calls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => setSelectedCall(call)}
                    className="w-full text-left p-3 rounded hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          call.status === 'success' ? 'bg-green-500' :
                          call.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                        )} />
                        <span className="text-xs font-medium text-slate-600">
                          {call.method}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {call.duration}ms
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {call.url.split('/').pop()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {call.timestamp.toLocaleTimeString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-slate-200">
              <Button
                onClick={() => setSelectedCall(null)}
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-700 mb-2"
              >
                ← Back
              </Button>
              <h4 className="font-semibold text-slate-900 mb-2">
                {selectedCall.method} {selectedCall.url.split('/').pop()}
              </h4>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className={cn(
                  'inline-flex items-center gap-1',
                  selectedCall.status === 'success' ? 'text-green-600' :
                  selectedCall.status === 'error' ? 'text-red-600' : 'text-yellow-600'
                )}>
                  <span className={cn(
                    'w-2 h-2 rounded-full',
                    selectedCall.status === 'success' ? 'bg-green-500' :
                    selectedCall.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
                  )} />
                  {selectedCall.status}
                </span>
                <span>{selectedCall.duration}ms</span>
                <span>{selectedCall.timestamp.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {selectedCall.request && (
                <div>
                  <h5 className="font-medium text-slate-900 mb-2">Request</h5>
                  <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedCall.request, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCall.response && (
                <div>
                  <h5 className="font-medium text-slate-900 mb-2">Response</h5>
                  <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                    {JSON.stringify(selectedCall.response, null, 2)}
                  </pre>
                </div>
              )}

              {selectedCall.error && (
                <div>
                  <h5 className="font-medium text-red-600 mb-2">Error</h5>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedCall.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};