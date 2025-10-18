import * as React from 'react';
import { SessionStatus } from '@leadership-training/shared';

export interface EditModeContextValue {
  canEdit: boolean;
  isEditing: boolean;
  sessionStatus: SessionStatus | null;
  sessionId: string;
  enableEditing: () => void;
  disableEditing: () => void;
  setSessionStatus: (status: SessionStatus | null) => void;
  setSessionId: (sessionId: string) => void;
}

const EditModeContext = React.createContext<EditModeContextValue | undefined>(undefined);

interface EditModeProviderProps {
  children: React.ReactNode;
  initialSessionId?: string;
  initialSessionStatus?: SessionStatus | null;
}

export const EditModeProvider: React.FC<EditModeProviderProps> = ({
  children,
  initialSessionId = 'new',
  initialSessionStatus = SessionStatus.DRAFT,
}) => {
  const [isEditing, setIsEditing] = React.useState(() =>
    initialSessionId === 'new' || initialSessionStatus === SessionStatus.DRAFT
  );
  const [sessionStatus, setSessionStatus] = React.useState<SessionStatus | null>(initialSessionStatus);
  const [sessionId, setSessionId] = React.useState<string>(initialSessionId);

  // Auto-enable editing for new sessions or drafts
  React.useEffect(() => {
    if (sessionId === 'new' || sessionStatus === SessionStatus.DRAFT) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [sessionId, sessionStatus]);

  const canEdit = React.useMemo(() => {
    return isEditing && (sessionId === 'new' || sessionStatus === SessionStatus.DRAFT);
  }, [isEditing, sessionId, sessionStatus]);

  const enableEditing = React.useCallback(() => {
    // Only allow editing for drafts or new sessions
    if (sessionId === 'new' || sessionStatus === SessionStatus.DRAFT) {
      setIsEditing(true);
    }
  }, [sessionId, sessionStatus]);

  const disableEditing = React.useCallback(() => {
    setIsEditing(false);
  }, []);

  const value = React.useMemo<EditModeContextValue>(() => ({
    canEdit,
    isEditing,
    sessionStatus,
    sessionId,
    enableEditing,
    disableEditing,
    setSessionStatus,
    setSessionId,
  }), [canEdit, isEditing, sessionStatus, sessionId, enableEditing, disableEditing]);

  return (
    <EditModeContext.Provider value={value}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = (): EditModeContextValue => {
  const context = React.useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
};

// Helper hook for components that need to check edit permissions
export const useEditPermissions = () => {
  const { canEdit, sessionStatus, sessionId } = useEditMode();

  return {
    canEdit,
    isPublished: sessionStatus === SessionStatus.PUBLISHED,
    isDraft: sessionStatus === SessionStatus.DRAFT,
    isNewSession: sessionId === 'new',
    statusMessage: sessionStatus === SessionStatus.PUBLISHED
      ? 'This session is published and cannot be edited. Create a new version to make changes.'
      : sessionStatus === SessionStatus.DRAFT
      ? 'Editing draft session'
      : 'Loading...'
  };
};