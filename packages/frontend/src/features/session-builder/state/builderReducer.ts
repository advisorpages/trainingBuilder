import { BuilderAction, BuilderState } from './types';

export const initialBuilderState: BuilderState = {
  status: 'idle',
  aiStatus: 'idle',
  draft: null,
  error: undefined,
  publishStatus: 'idle',
  publishError: undefined,
  publishedSessionId: undefined,
};

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        status: 'loading',
        error: undefined,
      };
    case 'INIT_SUCCESS':
      return {
        status: 'ready',
        aiStatus: 'idle',
        error: undefined,
        draft: action.payload,
        publishStatus: 'idle',
        publishError: undefined,
        publishedSessionId: action.payload.sessionId !== 'new' ? action.payload.sessionId : undefined,
      };
    case 'INIT_FAILURE':
      return {
        ...state,
        status: 'error',
        error: action.payload,
        publishStatus: 'idle',
      };
    case 'UPDATE_TOPICS':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          metadata: {
            ...state.draft.metadata,
            topics: action.payload,
          },
          isDirty: true,
        }
      };

    case 'UPDATE_METADATA':
      if (!state.draft) return state;
      return {
        ...state,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          metadata: { ...state.draft.metadata, ...action.payload },
          isDirty: true,
        },
      };
    case 'UPDATE_PROMPT':
      if (!state.draft) return state;
      return {
        ...state,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          aiPrompt: action.payload,
          isDirty: true,
        },
      };
    case 'UPDATE_OUTLINE':
      if (!state.draft) return state;
      return {
        ...state,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          outline: action.payload,
          isDirty: true,
        },
      };
    case 'AI_REQUEST_START':
      return {
        ...state,
        aiStatus: 'pending',
        error: undefined,
      };
    case 'AI_REQUEST_SUCCESS':
      if (!state.draft) return state;
      return {
        ...state,
        aiStatus: 'idle',
        error: undefined,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          aiVersions: [action.payload, ...state.draft.aiVersions.filter((version) => version.id !== action.payload.id)],
          selectedVersionId: action.payload.id,
          isDirty: true,
        },
      };
    case 'AI_REQUEST_FAILURE':
      return {
        ...state,
        aiStatus: 'error',
        error: action.payload,
      };
    case 'SELECT_AI_VERSION':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          selectedVersionId: action.payload,
        },
      };
    case 'AUTOSAVE_SUCCESS':
      if (!state.draft) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          lastAutosaveAt: action.payload.savedAt,
          isDirty: false,
        },
      };
    case 'ACCEPT_AI_VERSION':
      if (!state.draft) return state;
      return {
        ...state,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          acceptedVersionId: action.payload,
          selectedVersionId: action.payload,
          isDirty: true,
        },
      };
    case 'CLEAR_ACCEPTED_VERSION':
      if (!state.draft) return state;
      return {
        ...state,
        publishStatus: state.publishStatus === 'success' ? 'idle' : state.publishStatus,
        draft: {
          ...state.draft,
          acceptedVersionId: undefined,
          isDirty: true,
        },
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
      if (!state.draft) return {
        ...state,
        publishStatus: 'success',
        publishError: undefined,
        publishedSessionId: action.payload.sessionId,
      };
      return {
        ...state,
        publishStatus: 'success',
        publishError: undefined,
        publishedSessionId: action.payload.sessionId,
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
