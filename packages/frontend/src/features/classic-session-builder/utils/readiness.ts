import {
  ReadinessItem,
  calculateReadinessScore,
  areRequiredItemsComplete,
} from '../../session-builder/utils/readiness';
import type { ClassicSessionDraft } from '../state/types';

export const MIN_CLASSIC_PUBLISH_SCORE = 80;

const buildClassicReadinessItems = (draft: ClassicSessionDraft): ReadinessItem[] => {
  const { metadata, outline } = draft;
  const hasOutline = !!outline && outline.sections.length > 0;

  return [
    {
      id: 'title',
      label: 'Session Title',
      description: 'Clear, descriptive title for your session',
      completed: !!metadata.title?.trim(),
      required: true,
      weight: 15,
    },
    {
      id: 'outcome',
      label: 'Desired Outcome',
      description: 'What participants will be able to do after the session',
      completed: !!metadata.desiredOutcome?.trim(),
      required: true,
      weight: 20,
    },
    {
      id: 'category',
      label: 'Category',
      description: 'Training category for proper classification',
      completed: !!metadata.category?.trim(),
      required: true,
      weight: 10,
    },
    {
      id: 'sessionType',
      label: 'Session Type',
      description: 'Format of your training session',
      completed: !!metadata.sessionType,
      required: true,
      weight: 10,
    },
    {
      id: 'schedule',
      label: 'Schedule',
      description: 'Date and time for the session',
      completed: !!metadata.startDate && !!metadata.startTime && !!metadata.endTime,
      required: true,
      weight: 10,
    },
    {
      id: 'outline',
      label: 'Session Outline',
      description: 'Manually built session structure with sections',
      completed: hasOutline,
      required: true,
      weight: 20,
    },
    {
      id: 'problem',
      label: 'Current Problem',
      description: 'Challenge or issue the session addresses',
      completed: !!metadata.currentProblem?.trim(),
      required: false,
      weight: 10,
    },
    {
      id: 'topics',
      label: 'Specific Topics',
      description: 'Key topics, frameworks, or skills to cover',
      completed: !!metadata.specificTopics?.trim(),
      required: false,
      weight: 10,
    },
  ];
};

export const getClassicDraftReadinessItems = (
  draft: ClassicSessionDraft | null,
): ReadinessItem[] => {
  if (!draft) return [];
  return buildClassicReadinessItems(draft);
};

export const calculateClassicReadiness = (draft: ClassicSessionDraft | null): number => {
  if (!draft) return 0;
  const items = buildClassicReadinessItems(draft);
  return calculateReadinessScore(items);
};

export const areClassicRequiredItemsComplete = (
  draft: ClassicSessionDraft | null,
): boolean => {
  if (!draft) return false;
  const items = buildClassicReadinessItems(draft);
  return areRequiredItemsComplete(items);
};
