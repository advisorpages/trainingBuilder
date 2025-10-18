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

export const MIN_PUBLISH_SCORE = 100;

export function getReadinessItems(
  metadata: SessionMetadata,
  options: ReadinessItemOptions
): ReadinessItem[] {
  const { hasOutline, hasAcceptedVersion } = options;

  return [
    {
      id: 'trainers',
      label: 'Trainer Assignment',
      description: 'All topics have trainers assigned',
      completed: !!(metadata.topics && metadata.topics.length > 0 && metadata.topics.every(topic => topic.trainerIds && topic.trainerIds.length > 0)),
      required: true,
      weight: 40,
    },
    {
      id: 'schedule',
      label: 'Scheduling',
      description: 'Date and time for the session',
      completed: !!metadata.startDate && !!metadata.startTime && !!metadata.endTime,
      required: true,
      weight: 35,
    },
    {
      id: 'location',
      label: 'Location Assignment',
      description: 'Session has a location assigned',
      completed: !!metadata.locationId,
      required: true,
      weight: 25,
    },
  ];
}

export function getDraftReadinessItems(draft: SessionDraftData | null): ReadinessItem[] {
  if (!draft) {
    return [];
  }

  return getReadinessItems(draft.metadata, { hasOutline: false, hasAcceptedVersion: false });
}

export function calculateReadinessScore(items: ReadinessItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const completedWeight = items
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

export function areRequiredItemsComplete(items: ReadinessItem[]): boolean {
  return items.filter((item) => item.required).every((item) => item.completed);
}
