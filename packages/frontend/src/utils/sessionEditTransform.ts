import { Session, SessionStatus } from '@leadership-training/shared';
import { SessionMetadata, SessionTopicDraft } from '../features/session-builder/state/types';
import { FlexibleSessionSection } from '../services/session-builder.service';

type SessionTopicDetail = {
  sessionId: string;
  topicId: number;
  sequenceOrder?: number | null;
  durationMinutes?: number | null;
  notes?: string | null;
  trainerId?: number | null;
  trainer?: { id: number; name?: string | null } | null;
  topic?: {
    id: number;
    name: string;
    description?: string | null;
    learningOutcomes?: string | null;
    materialsNeeded?: string | null;
    deliveryGuidance?: string | null;
    trainerNotes?: string | null;
    callToAction?: string | null;
  } | null;
};

const toIsoString = (value?: string | Date | null): string => {
  if (!value) {
    return '';
  }

  try {
    let parsed: Date;

    if (value instanceof Date) {
      // Handle Date objects directly
      parsed = value;
    } else if (typeof value === 'string') {
      // Handle string values - try to parse as ISO date
      parsed = new Date(value);
    } else {
      // Handle any other type by converting to string first
      parsed = new Date(String(value));
    }

    if (Number.isNaN(parsed.getTime())) {
      console.warn('[sessionEditTransform] Invalid date value:', { value, valueType: typeof value });
      return '';
    }

    return parsed.toISOString();
  } catch (error) {
    console.error('[sessionEditTransform] Error converting date to ISO:', { value, error });
    return '';
  }
};

/**
 * Transform existing session data to builder format for editing
 */

// Transform Session to SessionMetadata
export const transformSessionToMetadata = (session: Session): SessionMetadata => {
  const originalStartTime = (session as Session & { startTime?: string | Date | null }).startTime;
  const originalEndTime = (session as Session & { endTime?: string | Date | null }).endTime;

  const startTimeIso = toIsoString(originalStartTime);
  const endTimeIso = toIsoString(originalEndTime);

  // Only log when we have issues to debug
  if (!startTimeIso || !endTimeIso) {
    console.log('[sessionEditTransform] Date/time transformation issue:', {
      sessionId: session.id,
      hasStartTime: !!originalStartTime,
      hasEndTime: !!originalEndTime,
      startTimeIsInvalid: originalStartTime ? Number.isNaN(new Date(originalStartTime).getTime()) : false,
      endTimeIsInvalid: originalEndTime ? Number.isNaN(new Date(originalEndTime).getTime()) : false
    });
  }

  return {
    title: session.title || '',
    desiredOutcome: session.objective || '',
    category: session.category?.name || session.categoryId?.toString() || '',
    sessionType: 'workshop', // Default value, could be derived from other fields
    sessionStatus: session.status ?? SessionStatus.DRAFT,
    locationId: session.locationId || undefined,
    location: session.location?.name || 'Location TBD',
    startDate: startTimeIso ? startTimeIso.split('T')[0] : startTimeIso,
    startTime: startTimeIso,
    endTime: endTimeIso,
    audienceId: session.audienceId || undefined,
    toneId: session.toneId || undefined,
    categoryId: session.categoryId || undefined,
    currentProblem: '',
    specificTopics: '',
    timezone: session.location?.timezone || 'America/New_York',
    locationType: session.location?.locationType,
    meetingPlatform: session.location?.meetingPlatform,
    locationCapacity: session.location?.capacity,
    locationTimezone: session.location?.timezone,
    locationNotes: session.location?.notes ?? undefined,
    audienceName: session.audience?.name ?? undefined,
    toneName: session.tone?.name ?? undefined,
    marketingToneId: session.marketingToneId ?? undefined,
    marketingToneName: session.marketingTone?.name ?? undefined,
  };
};

const extractTrainerInfo = (
  topicDetail: SessionTopicDetail,
): { trainerId?: number; trainerName?: string } => {
  const trainerId = topicDetail.trainerId;

  const trainerNameCandidate =
    topicDetail.trainer?.name ??
    (typeof (topicDetail as any).trainerName === 'string' ? (topicDetail as any).trainerName : undefined);
  const trainerName =
    typeof trainerNameCandidate === 'string' && trainerNameCandidate.trim().length > 0
      ? trainerNameCandidate.trim()
      : undefined;

  return { trainerId, trainerName };
};

// Transform SessionTopicDetail to SessionTopicDraft
export const transformSessionTopicDetailToDraft = (
  topicDetail: SessionTopicDetail,
  index: number
): SessionTopicDraft => {
  const { trainerId, trainerName } = extractTrainerInfo(topicDetail);

  // Extract rich topic data from the topic relationship
  const topic = topicDetail.topic;
  const title = topic?.name || `Topic ${index + 1}`;
  const description = topic?.description || '';
  const learningOutcomes = topic?.learningOutcomes || '';
  const materialsNeeded = topic?.materialsNeeded || '';
  const deliveryGuidance = topic?.deliveryGuidance || '';
  const callToAction = topic?.callToAction || '';

  // Use topic trainer notes if available, otherwise use session topic notes
  const trainerNotes = topic?.trainerNotes || topicDetail.notes || '';

  return {
    sectionId: `existing-topic-${topicDetail.topicId}`,
    topicId: topicDetail.topicId,
    title,
    description,
    durationMinutes: topicDetail.durationMinutes || 30,
    learningOutcomes,
    trainerNotes,
    materialsNeeded,
    deliveryGuidance,
    callToAction,
    trainerId,
    trainerName,
    position: topicDetail.sequenceOrder || index + 1,
  };
};

// Transform session topics to flexible sections format
export const transformSessionTopicsToSections = (
  sessionTopics: SessionTopicDetail[]
): FlexibleSessionSection[] => {
  return sessionTopics.map((topicDetail, index) => {
    const { trainerId, trainerName } = extractTrainerInfo(topicDetail);

    // Extract rich topic data from the topic relationship
    const topic = topicDetail.topic;
    const title = topic?.name || `Topic ${index + 1}`;
    const description = topic?.description || '';
    const learningOutcomes = topic?.learningOutcomes ?
      (typeof topic.learningOutcomes === 'string' ? topic.learningOutcomes.split('\n').filter(Boolean) : []) : [];
    const materialsNeeded = topic?.materialsNeeded ?
      (typeof topic.materialsNeeded === 'string' ? topic.materialsNeeded.split('\n').filter(Boolean) : []) : [];
    const suggestedActivities = topic?.callToAction ?
      (typeof topic.callToAction === 'string' ? topic.callToAction.split('\n').filter(Boolean) : []) : [];
    const deliveryGuidance = topic?.deliveryGuidance || '';

    // Use topic trainer notes if available, otherwise use session topic notes
    const trainerNotes = topic?.trainerNotes || topicDetail.notes || '';

    return {
      id: `existing-topic-${topicDetail.topicId}`,
      type: 'topic' as const,
      title,
      description,
      duration: topicDetail.durationMinutes || 30,
      learningObjectives: learningOutcomes,
      trainerNotes,
      materialsNeeded,
      suggestedActivities,
      deliveryGuidance,
      trainerId,
      trainerName,
      position: topicDetail.sequenceOrder || index + 1,
      associatedTopic: {
        id: topicDetail.topicId,
        name: title,
        description,
      },
    };
  });
};

// Create basic outline from session topics
export const createBasicOutlineFromSession = (
  session: Session,
  sessionTopics: SessionTopicDetail[]
) => {
  const sections = transformSessionTopicsToSections(sessionTopics);

  return {
    sections,
    totalDuration: sections.reduce((total, section) => total + (section.duration || 30), 0),
    suggestedSessionTitle: session.title || 'Session',
    suggestedDescription: session.subtitle || session.objective || '',
    difficulty: 'Intermediate' as const,
    recommendedAudienceSize: '10-25' as const,
    fallbackUsed: false,
    generatedAt: new Date().toISOString(),
  };
};

// Main transformation function to convert session to builder data
export const transformSessionToBuilderData = (session: Session) => {
  const sessionTopics = (session as any).sessionTopics || [];

  console.log('[transformSessionToBuilderData] Processing session:', {
    sessionId: session.id,
    sessionTopicsCount: sessionTopics.length,
    sessionTopicsSample: sessionTopics.slice(0, 2).map((t: any) => ({
      topicId: t.topicId,
      topicName: t.topic?.name,
      trainerName: t.trainer?.name,
      durationMinutes: t.durationMinutes
    }))
  });

  const metadata = transformSessionToMetadata(session);
  const outline = createBasicOutlineFromSession(session, sessionTopics);
  const topics = sessionTopics.map((topicDetail: SessionTopicDetail, index: number) =>
    transformSessionTopicDetailToDraft(topicDetail, index)
  );

  console.log('[transformSessionToBuilderData] Transformation result:', {
    topicsCount: topics.length,
    topicsSample: topics.slice(0, 2).map((t: any) => ({
      title: t.title,
      description: t.description?.substring(0, 100) + (t.description?.length > 100 ? '...' : ''),
      durationMinutes: t.durationMinutes,
      trainerId: t.trainerId,
      trainerName: t.trainerName,
      hasLearningOutcomes: !!t.learningOutcomes,
      hasMaterials: !!t.materialsNeeded
    })),
    outlineSectionsCount: outline.sections.length
  });

  return {
    metadata,
    outline,
    topics,
  };
};

// Helper to resolve topic names from topic data
export const resolveTopicNames = (
  topics: SessionTopicDraft[],
  existingTopics: any[]
): SessionTopicDraft[] => {
  return topics.map((topicDraft) => {
    const topicData = existingTopics.find(t => t.id === topicDraft.topicId);
    if (topicData) {
      return {
        ...topicDraft,
        title: topicData.name || topicDraft.title,
        description: topicData.description || topicDraft.description,
        learningOutcomes: topicData.learningOutcomes || topicDraft.learningOutcomes,
        materialsNeeded: topicData.materialsNeeded || topicDraft.materialsNeeded,
        deliveryGuidance: topicData.deliveryGuidance || topicDraft.deliveryGuidance,
        trainerNotes: topicData.trainerNotes || topicDraft.trainerNotes,
        callToAction: topicData.callToAction || topicDraft.callToAction,
      };
    }
    return topicDraft;
  });
};
