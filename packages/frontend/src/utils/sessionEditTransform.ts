import { Session } from '@leadership-training/shared';
import { SessionMetadata, SessionTopicDraft } from '../features/session-builder/state/types';
import { FlexibleSessionSection } from '../services/session-builder.service';

type SessionTopicDetail = {
  topicId: number;
  sequenceOrder?: number | null;
  durationMinutes?: number | null;
  notes?: string | null;
  assignedTrainerId?: number | null;
  trainerId?: number | null;
  trainer?: { name?: string | null } | null;
  trainerName?: string | null;
};

const toIsoString = (value?: string | Date | null): string => {
  if (!value) {
    return '';
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
};

/**
 * Transform existing session data to builder format for editing
 */

// Transform Session to SessionMetadata
export const transformSessionToMetadata = (session: Session): SessionMetadata => {
  const startTimeIso = toIsoString((session as Session & { startTime?: string | Date | null }).startTime);
  const endTimeIso = toIsoString((session as Session & { endTime?: string | Date | null }).endTime);

  return {
    title: session.title || '',
    desiredOutcome: session.objective || '',
    category: session.category?.name || session.categoryId?.toString() || '',
    sessionType: 'workshop', // Default value, could be derived from other fields
    locationId: session.locationId || undefined,
    location: session.location?.name || 'Location TBD',
    startDate: startTimeIso ? startTimeIso.split('T')[0] : '',
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
  const rawTrainerId = topicDetail.assignedTrainerId ?? topicDetail.trainerId;
  const trainerId =
    typeof rawTrainerId === 'number' && !Number.isNaN(rawTrainerId) ? rawTrainerId : undefined;

  const trainerNameCandidate =
    topicDetail.trainer?.name ??
    (typeof topicDetail.trainerName === 'string' ? topicDetail.trainerName : undefined);
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

  return {
    sectionId: `existing-topic-${topicDetail.topicId}`,
    topicId: topicDetail.topicId,
    title: `Topic ${index + 1}`, // Will be updated when topic data is loaded
    description: '',
    durationMinutes: topicDetail.durationMinutes || 30,
    learningOutcomes: '',
    trainerNotes: topicDetail.notes || '',
    materialsNeeded: '',
    deliveryGuidance: '',
    callToAction: '',
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

    return {
      id: `existing-topic-${topicDetail.topicId}`,
      type: 'topic' as const,
      title: `Topic ${index + 1}`,
      description: '',
      duration: topicDetail.durationMinutes || 30,
      learningObjectives: [],
      trainerNotes: topicDetail.notes || '',
      materialsNeeded: [],
      suggestedActivities: [],
      deliveryGuidance: '',
      trainerId,
      trainerName,
      position: topicDetail.sequenceOrder || index + 1,
      associatedTopic: {
        id: topicDetail.topicId,
        name: `Topic ${index + 1}`,
        description: '',
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

  return {
    metadata: transformSessionToMetadata(session),
    outline: createBasicOutlineFromSession(session, sessionTopics),
    topics: sessionTopics.map((topicDetail: SessionTopicDetail, index: number) =>
      transformSessionTopicDetailToDraft(topicDetail, index)
    ),
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
