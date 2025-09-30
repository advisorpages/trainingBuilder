import { SessionDraftData, SessionMetadata } from '../state/types';

export interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  weight: number;
}

interface ReadinessItemOptions {
  hasOutline: boolean;
  hasAcceptedVersion: boolean;
}

const OPTIONAL_BONUS_CAP = 10;

export const MIN_PUBLISH_SCORE = 90;

export function getReadinessItems(
  metadata: SessionMetadata,
  options: ReadinessItemOptions
): ReadinessItem[] {
  const { hasOutline, hasAcceptedVersion } = options;

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
    {
      id: 'outline',
      label: 'Session Outline',
      description: 'Generated session structure with sections',
      completed: hasOutline,
      required: true,
      weight: 20,
    },
    {
      id: 'accepted_content',
      label: 'Approved Content',
      description: 'Accepted AI-generated version for your session',
      completed: hasAcceptedVersion,
      required: true,
      weight: 25,
    },
  ];
}

export function getDraftReadinessItems(draft: SessionDraftData | null): ReadinessItem[] {
  if (!draft) {
    return [];
  }

  const hasOutline = !!draft.outline && draft.outline.sections.length > 0;
  const hasAcceptedVersion = !!draft.acceptedVersionId;

  return getReadinessItems(draft.metadata, { hasOutline, hasAcceptedVersion });
}

export function calculateReadinessScore(items: ReadinessItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  const requiredItems = items.filter((item) => item.required);
  const optionalItems = items.filter((item) => !item.required);

  const totalRequiredWeight = requiredItems.reduce((sum, item) => sum + item.weight, 0);
  const completedRequiredWeight = requiredItems
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  const baseScore = totalRequiredWeight
    ? (completedRequiredWeight / totalRequiredWeight) * 100
    : 0;

  const totalOptionalWeight = optionalItems.reduce((sum, item) => sum + item.weight, 0);
  const completedOptionalWeight = optionalItems
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  const optionalBonus = totalOptionalWeight
    ? (completedOptionalWeight / totalOptionalWeight) * OPTIONAL_BONUS_CAP
    : 0;

  return Math.round(Math.min(100, baseScore + optionalBonus));
}

export function areRequiredItemsComplete(items: ReadinessItem[]): boolean {
  return items.filter((item) => item.required).every((item) => item.completed);
}
