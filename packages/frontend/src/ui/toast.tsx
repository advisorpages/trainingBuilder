import * as React from 'react';
import { cn } from '../lib/utils';

type ToastVariant = 'default' | 'success' | 'error' | 'info';

export interface ToastOptions {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastContextValue {
  publish: (toast: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-slate-200 bg-white text-slate-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastOptions[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const publish = React.useCallback(
    (toast: ToastOptions) => {
      const id = toast.id ?? `toast-${Math.random().toString(36).slice(2, 9)}`;
      const duration = toast.duration ?? 4000;

      setToasts((current) => [...current, { ...toast, id }]);

      if (duration !== Infinity) {
        window.setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const contextValue = React.useMemo(() => ({ publish, dismiss }), [publish, dismiss]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center space-y-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all',
              variantStyles[toast.variant ?? 'default']
            )}
          >
            <div className="flex items-start">
              <div className="flex-1 space-y-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                {toast.description ? <p className="text-sm opacity-90">{toast.description}</p> : null}
              </div>
              <button
                onClick={() => dismiss(toast.id!)}
                className="ml-3 text-sm text-slate-500 hover:text-slate-700"
              >
                Dismiss
              </button>
            </div>
            {toast.actionLabel ? (
              <button
                onClick={() => {
                  toast.onAction?.();
                  dismiss(toast.id!);
                }}
                className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                {toast.actionLabel}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
