import { Session, Audience, Tone, Category } from '@leadership-training/shared';

export interface SessionContextForTopic {
  audienceId?: number;
  toneId?: number;
  categoryId?: number;
  title?: string;
  description?: string;
  existingTopics?: string[];
}

/**
 * Extract topic creation context from session data
 */
export const extractSessionContext = (session: Partial<Session>): SessionContextForTopic => {
  return {
    audienceId: session.audienceId,
    toneId: session.toneId,
    categoryId: session.categoryId,
    title: session.title,
    description: session.description,
    existingTopics: session.topics?.map(topic => topic.name) || []
  };
};

/**
 * Auto-populate enhancement form fields from session context
 */
export const buildTopicFormDefaults = (
  sessionContext?: SessionContextForTopic,
  audiences?: Audience[],
  tones?: Tone[],
  categories?: Category[]
) => {
  // If no session context, return empty defaults
  if (!sessionContext) {
    return {
      audienceId: 0,
      toneId: 0,
      categoryId: 0,
    };
  }

  // Validate that IDs exist in available options
  const validAudienceId = sessionContext.audienceId &&
    audiences?.some(a => a.id === sessionContext.audienceId)
    ? sessionContext.audienceId
    : 0;

  const validToneId = sessionContext.toneId &&
    tones?.some(t => t.id === sessionContext.toneId)
    ? sessionContext.toneId
    : 0;

  const validCategoryId = sessionContext.categoryId &&
    categories?.some(c => c.id === sessionContext.categoryId)
    ? sessionContext.categoryId
    : 0;

  return {
    audienceId: validAudienceId,
    toneId: validToneId,
    categoryId: validCategoryId,
  };
};

/**
 * Get context description for display purposes
 */
export const getSessionContextDescription = (
  sessionContext?: SessionContextForTopic,
  audiences?: Audience[],
  tones?: Tone[],
  categories?: Category[]
): string => {
  if (!sessionContext) {
    return 'No session context available';
  }

  const parts: string[] = [];

  if (sessionContext.title) {
    parts.push(`Session: "${sessionContext.title}"`);
  }

  if (sessionContext.audienceId && audiences) {
    const audience = audiences.find(a => a.id === sessionContext.audienceId);
    if (audience) {
      parts.push(`Audience: ${audience.name}`);
    }
  }

  if (sessionContext.toneId && tones) {
    const tone = tones.find(t => t.id === sessionContext.toneId);
    if (tone) {
      parts.push(`Tone: ${tone.name}`);
    }
  }

  if (sessionContext.categoryId && categories) {
    const category = categories.find(c => c.id === sessionContext.categoryId);
    if (category) {
      parts.push(`Category: ${category.name}`);
    }
  }

  if (sessionContext.existingTopics && sessionContext.existingTopics.length > 0) {
    parts.push(`${sessionContext.existingTopics.length} existing topics`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Session context available';
};

/**
 * Check if session context is complete for AI enhancement
 */
export const isSessionContextComplete = (sessionContext?: SessionContextForTopic): boolean => {
  return !!(
    sessionContext &&
    sessionContext.audienceId &&
    sessionContext.toneId &&
    sessionContext.categoryId
  );
};

/**
 * Get suggested learning outcome based on session context
 */
export const suggestLearningOutcome = (
  topicName: string,
  sessionContext?: SessionContextForTopic,
  categories?: Category[]
): string => {
  if (!sessionContext || !sessionContext.categoryId || !categories) {
    return `Learn about ${topicName.toLowerCase()}`;
  }

  const category = categories.find(c => c.id === sessionContext.categoryId);
  const categoryName = category?.name || 'this topic';

  // Generate contextual learning outcome suggestions
  const suggestions = {
    'Leadership': `develop leadership skills in ${topicName.toLowerCase()}`,
    'Sales': `apply effective sales techniques for ${topicName.toLowerCase()}`,
    'Communication': `master communication strategies for ${topicName.toLowerCase()}`,
    'Technical': `understand and implement ${topicName.toLowerCase()} best practices`,
    'Compliance': `ensure compliance and understanding of ${topicName.toLowerCase()} requirements`,
    'Customer Service': `deliver exceptional customer service through ${topicName.toLowerCase()}`,
    'Training': `effectively teach and facilitate ${topicName.toLowerCase()}`,
  };

  // Find matching suggestion or use default
  const matchingKey = Object.keys(suggestions).find(key =>
    category?.name.toLowerCase().includes(key.toLowerCase())
  );

  if (matchingKey) {
    return suggestions[matchingKey as keyof typeof suggestions];
  }

  return `apply ${categoryName.toLowerCase()} principles for ${topicName.toLowerCase()}`;
};