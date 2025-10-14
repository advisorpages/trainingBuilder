import type { SessionOutline } from '../../../services/session-builder.service';
import type {
  SessionMetadata as GuidedSessionMetadata,
  BuilderStatus,
  AutosaveStatus,
  PublishStatus,
} from '../../session-builder/state/types';

export type ClassicBuilderStatus = BuilderStatus;
export type ClassicAutosaveStatus = AutosaveStatus;
export type ClassicPublishStatus = PublishStatus;

export type ClassicSessionMetadata = GuidedSessionMetadata;

export interface ClassicSessionDraft {
  sessionId: string;
  metadata: ClassicSessionMetadata;
  outline: SessionOutline | null;
  aiPrompt: string;
  readinessScore: number;
  lastAutosaveAt?: string;
  isDirty: boolean;
}

export interface ClassicBuilderState {
  status: ClassicBuilderStatus;
  autosaveStatus: ClassicAutosaveStatus;
  publishStatus: ClassicPublishStatus;
  error?: string;
  publishError?: string;
  draft: ClassicSessionDraft | null;
}

export type ClassicBuilderAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: ClassicSessionDraft }
  | { type: 'INIT_FAILURE'; payload: string }
  | { type: 'UPDATE_METADATA'; payload: Partial<ClassicSessionMetadata>; aiPrompt?: string }
  | { type: 'UPDATE_OUTLINE'; payload: SessionOutline }
  | { type: 'AUTOSAVE_PENDING' }
  | { type: 'AUTOSAVE_SUCCESS'; payload: string }
  | { type: 'AUTOSAVE_FAILURE'; payload: string }
  | { type: 'AUTOSAVE_IDLE' }
  | { type: 'UPDATE_READINESS'; payload: number }
  | { type: 'RESTORE_DRAFT'; payload: ClassicSessionDraft }
  | { type: 'PUBLISH_SESSION_START' }
  | { type: 'PUBLISH_SESSION_SUCCESS'; payload: { sessionId: string } }
  | { type: 'PUBLISH_SESSION_FAILURE'; payload: string };

export const initialClassicBuilderState: ClassicBuilderState = {
  status: 'idle',
  autosaveStatus: 'idle',
  publishStatus: 'idle',
  draft: null,
};

export function classicBuilderReducer(
  state: ClassicBuilderState,
  action: ClassicBuilderAction,
): ClassicBuilderState {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        status: 'loading',
        error: undefined,
      };
    case 'INIT_SUCCESS':
      return {
        ...state,
        status: 'ready',
        autosaveStatus: 'idle',
        publishStatus: 'idle',
        error: undefined,
        publishError: undefined,
        draft: action.payload,
      };
    case 'INIT_FAILURE':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        publishStatus: 'idle',
      };
    case 'UPDATE_METADATA':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          metadata: {
            ...state.draft.metadata,
            ...action.payload,
          },
          aiPrompt: action.aiPrompt ?? state.draft.aiPrompt,
          isDirty: true,
        },
      };
    case 'UPDATE_OUTLINE':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          outline: action.payload,
          isDirty: true,
        },
      };
    case 'AUTOSAVE_PENDING':
      return {
        ...state,
        autosaveStatus: 'pending',
      };
    case 'AUTOSAVE_SUCCESS':
      if (!state.draft) return state;
      return {
        ...state,
        autosaveStatus: 'success',
        draft: {
          ...state.draft,
          lastAutosaveAt: action.payload,
          isDirty: false,
        },
      };
    case 'AUTOSAVE_FAILURE':
      return {
        ...state,
        autosaveStatus: 'error',
        error: action.payload,
      };
    case 'AUTOSAVE_IDLE':
      return {
        ...state,
        autosaveStatus: 'idle',
      };
    case 'UPDATE_READINESS':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          readinessScore: action.payload,
        },
      };
    case 'RESTORE_DRAFT':
      return {
        ...state,
        status: 'ready',
        draft: action.payload,
        error: undefined,
        publishStatus: 'idle',
        publishError: undefined,
      };
    case 'PUBLISH_SESSION_START':
      return {
        ...state,
        publishStatus: 'pending',
        publishError: undefined,
      };
    case 'PUBLISH_SESSION_SUCCESS':
      if (!state.draft) {
        return {
          ...state,
          publishStatus: 'success',
        };
      }
      return {
        ...state,
        publishStatus: 'success',
        draft: {
          ...state.draft,
          sessionId: action.payload.sessionId,
          isDirty: false,
        },
      };
    case 'PUBLISH_SESSION_FAILURE':
      return {
        ...state,
        publishStatus: 'error',
        publishError: action.payload,
      };
    default:
      return state;
  }
}
