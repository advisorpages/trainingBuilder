import { useState, useEffect, useCallback } from 'react';
import { Audience, Tone, Category, TopicEnhancementInput } from '@leadership-training/shared';
import { api } from '../services/api.service';
import { SessionContextForTopic, extractSessionContext, buildTopicFormDefaults } from '../utils/sessionContextUtils';

interface UseTopicCreationOptions {
  sessionContext?: SessionContextForTopic;
  autoLoadContext?: boolean;
}

interface UseTopicCreationReturn {
  // Context data
  audiences: Audience[];
  tones: Tone[];
  categories: Category[];

  // Loading states
  isLoadingContext: boolean;
  error: string | null;

  // Helper functions
  buildEnhancementInput: (baseInput: Partial<TopicEnhancementInput>) => TopicEnhancementInput;
  getFormDefaults: () => { audienceId: number; toneId: number; categoryId: number };
  hasSessionContext: boolean;

  // Actions
  loadContextData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing topic creation with session context awareness
 */
export const useTopicCreation = (options: UseTopicCreationOptions = {}): UseTopicCreationReturn => {
  const { sessionContext, autoLoadContext = true } = options;

  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tones, setTones] = useState<Tone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContextData = useCallback(async () => {
    try {
      setIsLoadingContext(true);
      setError(null);

      const [audiencesRes, tonesRes, categoriesRes] = await Promise.all([
        api.get<Audience[]>('/audiences'),
        api.get<Tone[]>('/tones'),
        api.get<Category[]>('/categories')
      ]);

      setAudiences(audiencesRes.data);
      setTones(tonesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error loading context data:', err);
      setError('Failed to load context data for topic creation');
    } finally {
      setIsLoadingContext(false);
    }
  }, []);

  // Auto-load context data on mount
  useEffect(() => {
    if (autoLoadContext) {
      loadContextData();
    }
  }, [autoLoadContext, loadContextData]);

  const buildEnhancementInput = useCallback((
    baseInput: Partial<TopicEnhancementInput>
  ): TopicEnhancementInput => {
    const defaults = buildTopicFormDefaults(sessionContext, audiences, tones, categories);

    return {
      name: baseInput.name || '',
      learningOutcome: baseInput.learningOutcome || '',
      categoryId: baseInput.categoryId || defaults.categoryId,
      audienceId: baseInput.audienceId || defaults.audienceId,
      toneId: baseInput.toneId || defaults.toneId,
      deliveryStyle: baseInput.deliveryStyle || 'workshop',
      specialConsiderations: baseInput.specialConsiderations,
      sessionContext: sessionContext ? {
        sessionTitle: sessionContext.title,
        sessionDescription: sessionContext.description,
        existingTopics: sessionContext.existingTopics,
      } : undefined,
    };
  }, [sessionContext, audiences, tones, categories]);

  const getFormDefaults = useCallback(() => {
    return buildTopicFormDefaults(sessionContext, audiences, tones, categories);
  }, [sessionContext, audiences, tones, categories]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Context data
    audiences,
    tones,
    categories,

    // Loading states
    isLoadingContext,
    error,

    // Helper functions
    buildEnhancementInput,
    getFormDefaults,
    hasSessionContext: !!sessionContext,

    // Actions
    loadContextData,
    clearError,
  };
};

/**
 * Hook specifically for session-aware topic creation
 */
export const useSessionAwareTopicCreation = (session?: any) => {
  const sessionContext = session ? extractSessionContext(session) : undefined;

  return useTopicCreation({
    sessionContext,
    autoLoadContext: true,
  });
};