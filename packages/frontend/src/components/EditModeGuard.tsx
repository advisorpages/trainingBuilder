import * as React from 'react';
import { useEditPermissions } from '../contexts/EditModeContext';
import { Button } from './ui';

interface EditModeGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showCreateVersionButton?: boolean;
  onCreateVersion?: () => void;
  className?: string;
}

export const EditModeGuard: React.FC<EditModeGuardProps> = ({
  children,
  fallback,
  showCreateVersionButton = false,
  onCreateVersion,
  className = '',
}) => {
  const { canEdit, isPublished, statusMessage } = useEditPermissions();

  if (canEdit) {
    return <>{children}</>;
  }

  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback for published sessions
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-800">
              Read-Only Mode
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              {statusMessage}
            </p>
          </div>
        </div>

        {showCreateVersionButton && onCreateVersion && (
          <div className="mt-4">
            <Button
              onClick={onCreateVersion}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Create New Version
            </Button>
          </div>
        )}
      </div>

      {/* Show children in read-only state */}
      <div className="opacity-75 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

// Simplified guard that just returns a boolean
export const useCanEdit = (): boolean => {
  const { canEdit } = useEditPermissions();
  return canEdit;
};