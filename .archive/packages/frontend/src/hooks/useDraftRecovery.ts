import { useState, useEffect, useCallback } from 'react';

interface DraftData {
  sessionId?: string;
  formData: any;
  timestamp: number;
}

export const useDraftRecovery = (sessionId?: string) => {
  const [hasRecoverableDraft, setHasRecoverableDraft] = useState(false);
  const [recoverableDraft, setRecoverableDraft] = useState<DraftData | null>(null);

  const storageKey = `session-draft-${sessionId || 'new'}`;

  // Check for recoverable draft on mount
  useEffect(() => {
    const checkForRecoverableDraft = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const draftData: DraftData = JSON.parse(stored);

          // Check if draft is less than 24 hours old
          const hoursSinceLastSave = (Date.now() - draftData.timestamp) / (1000 * 60 * 60);

          if (hoursSinceLastSave < 24) {
            setRecoverableDraft(draftData);
            setHasRecoverableDraft(true);
          } else {
            // Remove expired draft
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error('Error checking for recoverable draft:', error);
        localStorage.removeItem(storageKey);
      }
    };

    checkForRecoverableDraft();
  }, [storageKey]);

  // Save draft data to localStorage
  const saveDraftLocally = useCallback((formData: any) => {
    try {
      const draftData: DraftData = {
        sessionId,
        formData,
        timestamp: Date.now()
      };

      localStorage.setItem(storageKey, JSON.stringify(draftData));
    } catch (error) {
      console.error('Error saving draft locally:', error);
    }
  }, [sessionId, storageKey]);

  // Clear local draft
  const clearLocalDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasRecoverableDraft(false);
      setRecoverableDraft(null);
    } catch (error) {
      console.error('Error clearing local draft:', error);
    }
  }, [storageKey]);

  // Recover draft data
  const recoverDraft = useCallback(() => {
    if (recoverableDraft) {
      setHasRecoverableDraft(false);
      return recoverableDraft.formData;
    }
    return null;
  }, [recoverableDraft]);

  // Get draft age in minutes
  const getDraftAge = useCallback(() => {
    if (recoverableDraft) {
      return Math.floor((Date.now() - recoverableDraft.timestamp) / (1000 * 60));
    }
    return 0;
  }, [recoverableDraft]);

  return {
    hasRecoverableDraft,
    recoverableDraft,
    saveDraftLocally,
    clearLocalDraft,
    recoverDraft,
    getDraftAge
  };
};