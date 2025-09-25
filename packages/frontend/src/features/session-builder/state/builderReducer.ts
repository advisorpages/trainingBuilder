import { BuilderAction, BuilderState } from './types';

export const initialBuilderState: BuilderState = {
  status: 'idle',
  autosaveStatus: 'idle',
  aiStatus: 'idle',
  draft: null,
  error: undefined,
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
        autosaveStatus: 'idle',
        aiStatus: 'idle',
        error: undefined,
        draft: action.payload,
      };
    case 'INIT_FAILURE':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };
    case 'UPDATE_METADATA':
      if (!state.draft) return state;
      return {
        ...state,
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
    case 'ACCEPT_AI_VERSION':
      if (!state.draft) return state;
      return {
        ...state,
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
        draft: {
          ...state.draft,
          acceptedVersionId: undefined,
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
      };
    default:
      return state;
  }
}
