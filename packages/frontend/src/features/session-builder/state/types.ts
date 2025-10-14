import { SessionOutline } from '../../../services/session-builder.service';
import type { LocationType, MeetingPlatform } from '@leadership-training/shared';

export type BuilderStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AutosaveStatus = 'idle' | 'pending' | 'success' | 'error';
export type AIRequestStatus = 'idle' | 'pending' | 'error';
export type PublishStatus = 'idle' | 'pending' | 'success' | 'error';

export interface SessionTopicDraft {
  title: string;
  description?: string;
  durationMinutes: number;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  callToAction?: string;
  topicId?: number;
  trainerId?: number;
}

export interface SessionMetadata {
  title: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar' | null;
  category: string; // Category name for display and API calls
  categoryId?: number;
  desiredOutcome: string;
  currentProblem: string;
  specificTopics: string;
  startDate: string; // yyyy-mm-dd
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone: string;
  location: string; // Human-readable location name
  locationId?: number;
  locationType?: LocationType;
  meetingPlatform?: MeetingPlatform;
  locationCapacity?: number;
  locationTimezone?: string;
  locationNotes?: string;
  audienceId?: number;
  audienceName?: string;
  toneId?: number;
  toneName?: string;
  topics?: SessionTopicDraft[];
}

export interface AIContentBlock {
  id: string;
  heading: string;
  body: string;
}

export interface TopicReference {
  id: number;
  name: string;
  description?: string;
  learningOutcomes?: string;
  trainerNotes?: string;
  materialsNeeded?: string;
  deliveryGuidance?: string;
  matchScore?: number;
}

export interface TopicBasedSection {
  id: string;
  type: 'opener' | 'topic' | 'exercise' | 'closing';
  position: number;
  title: string;
  duration: number;
  description: string;
  learningObjectives?: string[];
  suggestedActivities?: string[];
  associatedTopic?: TopicReference;
  isTopicSuggestion?: boolean;
}

export interface AIContentVersion {
  id: string;
  prompt: string;
  summary: string;
  blocks: AIContentBlock[];
  sections?: TopicBasedSection[];
  suggestedTopics?: TopicReference[];
  createdAt: string;
  status: 'pending' | 'ready' | 'error';
  source: 'ai' | 'user' | 'template' | 'mock';
}

export interface SessionDraftData {
  sessionId: string;
  metadata: SessionMetadata;
  outline: SessionOutline | null;
  aiPrompt: string;
  aiVersions: AIContentVersion[];
  acceptedVersionId?: string;
  selectedVersionId?: string;
  readinessScore: number;
  lastAutosaveAt?: string;
  isDirty: boolean;
}

export interface BuilderState {
  status: BuilderStatus;
  autosaveStatus: AutosaveStatus;
  aiStatus: AIRequestStatus;
  error?: string;
  draft: SessionDraftData | null;
  lastGenerationSource?: 'ai' | 'template' | 'mock';
  lastGenerationError?: string;
  publishStatus: PublishStatus;
  publishError?: string;
  publishedSessionId?: string;
}

export type BuilderAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: SessionDraftData }
  | { type: 'INIT_FAILURE'; payload: string }
  | { type: 'UPDATE_TOPICS'; payload: SessionTopicDraft[] }
  | { type: 'UPDATE_METADATA'; payload: Partial<SessionMetadata> }
  | { type: 'UPDATE_PROMPT'; payload: string }
  | { type: 'UPDATE_OUTLINE'; payload: SessionOutline }
  | { type: 'AI_REQUEST_START' }
  | { type: 'AI_REQUEST_SUCCESS'; payload: AIContentVersion }
  | { type: 'AI_REQUEST_FAILURE'; payload: string }
  | { type: 'SELECT_AI_VERSION'; payload: string }
  | { type: 'ACCEPT_AI_VERSION'; payload: string }
  | { type: 'CLEAR_ACCEPTED_VERSION' }
  | { type: 'AUTOSAVE_PENDING' }
  | { type: 'AUTOSAVE_SUCCESS'; payload: string }
  | { type: 'AUTOSAVE_FAILURE'; payload: string }
  | { type: 'AUTOSAVE_IDLE' }
  | { type: 'UPDATE_READINESS'; payload: number }
  | { type: 'RESTORE_DRAFT'; payload: SessionDraftData }
  | { type: 'PUBLISH_SESSION_START' }
  | { type: 'PUBLISH_SESSION_SUCCESS'; payload: { sessionId: string } }
  | { type: 'PUBLISH_SESSION_FAILURE'; payload: string };
