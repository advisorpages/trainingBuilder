import { SessionOutline } from '../../../services/session-builder.service';

export type BuilderStatus = 'idle' | 'loading' | 'ready' | 'error';
export type AutosaveStatus = 'idle' | 'pending' | 'success' | 'error';
export type AIRequestStatus = 'idle' | 'pending' | 'error';

export interface SessionMetadata {
  title: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  category: string;
  desiredOutcome: string;
  currentProblem: string;
  specificTopics: string;
  startDate: string; // yyyy-mm-dd
  startTime: string; // ISO string
  endTime: string; // ISO string
  timezone: string;
  locationId?: number;
  audienceId?: number;
  toneId?: number;
}

export interface AIContentBlock {
  id: string;
  heading: string;
  body: string;
}

export interface AIContentVersion {
  id: string;
  prompt: string;
  summary: string;
  blocks: AIContentBlock[];
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
}

export type BuilderAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: SessionDraftData }
  | { type: 'INIT_FAILURE'; payload: string }
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
  | { type: 'RESTORE_DRAFT'; payload: SessionDraftData };
