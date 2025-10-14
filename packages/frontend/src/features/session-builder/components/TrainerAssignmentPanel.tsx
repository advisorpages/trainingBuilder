import * as React from 'react';
import type { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../../services/trainer.service';
import type { FlexibleSessionSection } from '../../../services/session-builder.service';
import type { SessionTopicDraft } from '../state/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Progress } from '../../../ui';
import { TrainerSelect } from '../../../components/ui/TrainerSelect';
import { cn } from '../../../lib/utils';

type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

interface TrainerAssignmentPanelProps {
  topics: SessionTopicDraft[];
  sections: FlexibleSessionSection[];
  onAssignTrainer: (topicIndex: number, trainer: { id: number; name: string } | null) => Promise<void> | void;
  title?: string;
  description?: string;
}

interface TopicAssignmentInfo {
  index: number;
  topic: SessionTopicDraft;
  trainerId?: number;
  trainerName?: string;
  sectionId?: string;
}

const getDurationLabel = (minutes?: number) => {
  if (!minutes || minutes <= 0) return 'Duration TBD';
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (remainder === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainder} min`;
};

export const TrainerAssignmentPanel: React.FC<TrainerAssignmentPanelProps> = ({
  topics,
  sections,
  onAssignTrainer,
  title = 'Assign Trainers',
  description = 'Match each topic with the right trainer. Start with unassigned topics and use search to quickly find the best fit.',
}) => {
  const [filter, setFilter] = React.useState<AssignmentFilter>('unassigned');
  const trainerCache = React.useRef(new Map<number, Trainer>());
  const [resolvedTrainerNames, setResolvedTrainerNames] = React.useState<Record<number, string>>({});

  const assignments = React.useMemo<TopicAssignmentInfo[]>(() => {
    return (topics ?? []).map((topic, index) => {
      const associatedSection = sections.find((section) => {
        if (section.type !== 'topic') return false;
        if (topic.topicId && section.associatedTopic?.id) {
          return section.associatedTopic.id === topic.topicId;
        }
        if (section.associatedTopic?.name && topic.title) {
          return section.associatedTopic.name.trim().toLowerCase() === topic.title.trim().toLowerCase();
        }
        if (section.title && topic.title) {
          return section.title.trim().toLowerCase() === topic.title.trim().toLowerCase();
        }
        return false;
      });

      const trainerId = topic.trainerId ?? associatedSection?.trainerId ?? undefined;
      const trainerName = associatedSection?.trainerName ?? (trainerId ? resolvedTrainerNames[trainerId] : undefined);

      return {
        index,
        topic,
        trainerId,
        trainerName,
        sectionId: associatedSection?.id,
      };
    });
  }, [topics, sections, resolvedTrainerNames]);

  const totalTopics = assignments.length;
  const assignedCount = assignments.filter((item) => Boolean(item.trainerId)).length;
  const unassignedCount = totalTopics - assignedCount;

  React.useEffect(() => {
    if (filter === 'unassigned' && unassignedCount === 0 && totalTopics > 0) {
      setFilter('all');
    }
  }, [filter, totalTopics, unassignedCount]);

  const filteredAssignments = React.useMemo(() => {
    switch (filter) {
      case 'assigned':
        return assignments.filter((item) => Boolean(item.trainerId));
      case 'unassigned':
        return assignments.filter((item) => !item.trainerId);
      default:
        return assignments;
    }
  }, [assignments, filter]);

  React.useEffect(() => {
    const missing = assignments.filter(
      (item) => item.trainerId && !item.trainerName && !trainerCache.current.has(item.trainerId),
    );
    if (!missing.length) {
      return;
    }

    let cancelled = false;

    const loadMissing = async () => {
      await Promise.all(missing.map(async (item) => {
        if (!item.trainerId) {
          return;
        }
        try {
          const trainer = await trainerService.getTrainer(item.trainerId);
          if (cancelled) return;
          trainerCache.current.set(trainer.id, trainer);
          setResolvedTrainerNames((prev) => {
            if (prev[trainer.id] === trainer.name) {
              return prev;
            }
            return {
              ...prev,
              [trainer.id]: trainer.name,
            };
          });
        } catch (error) {
          console.error('TrainerAssignmentPanel: failed to resolve trainer', error);
        }
      }));
    };

    void loadMissing();

    return () => {
      cancelled = true;
    };
  }, [assignments]);

  const handleTrainerChange = React.useCallback(async (index: number, trainer: Trainer | null) => {
    if (trainer) {
      trainerCache.current.set(trainer.id, trainer);
      setResolvedTrainerNames((prev) => ({
        ...prev,
        [trainer.id]: trainer.name,
      }));
    }
    const trainerPayload = trainer
      ? { id: trainer.id, name: trainer.name }
      : null;
    await onAssignTrainer(index, trainerPayload);
  }, [onAssignTrainer]);

  return (
    <Card className="border border-purple-200/70 bg-gradient-to-br from-white via-white to-purple-50 shadow-sm">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex items-center gap-2 text-xl text-purple-900">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.4 15a2.4 2.4 0 10-4.8 0c0 .879.474 1.64 1.176 2.054C16.436 17.359 18 18.098 18 19v.5a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V19c0-.902 1.564-1.641 2.224-1.946A2.401 2.401 0 0022 15a2.4 2.4 0 10-4.8 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.4 15a2.4 2.4 0 10-4.8 0c0 .879.474 1.64 1.176 2.054C2.436 17.359 4 18.098 4 19v.5a.5.5 0 00.5.5h2a.5.5 0 00.5-.5V19c0-.902 1.564-1.641 2.224-1.946A2.401 2.401 0 007 15a2.4 2.4 0 10-4.8 0z"
                />
              </svg>
            </span>
            {title}
          </CardTitle>
          <p className="text-sm text-purple-800/90">{description}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          <div className="rounded-lg border border-purple-200 bg-white/80 p-3">
            <div className="text-xs uppercase tracking-wide text-purple-400">Progress</div>
            <div className="mt-1 text-lg font-semibold text-purple-900">
              {assignedCount} / {totalTopics || 0}
            </div>
            <Progress value={totalTopics ? (assignedCount / totalTopics) * 100 : 0} className="mt-2" />
          </div>
          <div className="rounded-lg border border-purple-200 bg-white/80 p-3">
            <div className="text-xs uppercase tracking-wide text-purple-400">Unassigned</div>
            <div className={cn(
              'mt-1 text-lg font-semibold',
              unassignedCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            )}>
              {unassignedCount}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {unassignedCount > 0 ? 'Assign these next' : 'All topics have trainers'}
            </p>
          </div>
          <div className="rounded-lg border border-purple-200 bg-white/80 p-3">
            <div className="text-xs uppercase tracking-wide text-purple-400">Filter</div>
            <div className="mt-2 flex gap-2">
              {(totalTopics > 0 ? (['unassigned', 'assigned', 'all'] as AssignmentFilter[]) : (['all'] as AssignmentFilter[])).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={filter === option ? 'default' : 'outline'}
                  className={cn(
                    'capitalize',
                    option === 'unassigned' && filter === option && 'bg-rose-600 hover:bg-rose-500',
                    option === 'assigned' && filter === option && 'bg-emerald-600 hover:bg-emerald-500'
                  )}
                  onClick={() => setFilter(option)}
                  disabled={option === 'unassigned' && unassignedCount === 0}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {totalTopics === 0 ? (
          <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/60 p-6 text-center text-sm text-purple-700">
            Add topics in step 1 to start assigning trainers.
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/60 p-6 text-center text-sm text-purple-700">
            No topics match this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssignments.map(({ index, topic, trainerId, trainerName }) => {
              const isAssigned = Boolean(trainerId);
              return (
                <div
                  key={`${topic.topicId ?? topic.title ?? index}-${index}`}
                  className="rounded-lg border border-purple-100 bg-white/90 p-4 shadow-sm"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left Column - Topic Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-base font-semibold text-slate-900 flex-1">
                          {topic.title || `Topic ${index + 1}`}
                        </h4>
                        <div className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0',
                          isAssigned
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        )}>
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            {isAssigned ? (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            ) : (
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z"
                              />
                            )}
                          </svg>
                          {isAssigned ? 'Assigned' : 'Unassigned'}
                        </div>
                      </div>

                      {topic.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {topic.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>{getDurationLabel(topic.durationMinutes)}</span>
                        </div>
                        {topic.topicId && (
                          <div className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                            <span>From library</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Trainer Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                        <svg className="h-3.5 w-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Assign Trainer
                      </label>
                      <TrainerSelect
                        value={trainerId || ''}
                        onChange={(trainer) => handleTrainerChange(index, trainer)}
                        placeholder={isAssigned ? 'Change trainer...' : 'Type trainer name to assign...'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
