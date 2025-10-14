import * as React from 'react';
import { Button, Card, CardContent } from '../../../ui';
import { SessionOutline, sessionBuilderService } from '../../../services/session-builder.service';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';

interface SessionPreviewProps {
  outline: SessionOutline;
  metadata: SessionMetadata;
  readinessScore: number;
  onPublish?: () => void;
  onEdit: () => void;
  isPublishing?: boolean;
  isPublished?: boolean;
}

export const SessionPreview: React.FC<SessionPreviewProps> = ({
  outline,
  metadata,
  readinessScore,
  onPublish,
  onEdit,
  isPublishing = false,
  isPublished = false,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(outline.sections.map(s => s.id));
    setExpandedSections(allIds);
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  const sortedSections = React.useMemo(() => {
    return sessionBuilderService.sortSectionsByPosition(outline.sections || []);
  }, [outline.sections]);

  const totalDuration = React.useMemo(() => {
    return sessionBuilderService.calculateTotalDuration(outline.sections || []);
  }, [outline.sections]);

  const scheduledDuration = React.useMemo(() => {
    if (metadata.startTime && metadata.endTime) {
      const start = new Date(metadata.startTime);
      const end = new Date(metadata.endTime);
      return Math.floor((end.getTime() - start.getTime()) / 60000);
    }
    return null;
  }, [metadata.startTime, metadata.endTime]);

  // Calculate trainer roster
  const trainerRoster = React.useMemo(() => {
    const trainers = new Map<string, { name: string; sections: number; duration: number }>();

    sortedSections.forEach((section) => {
      if (section.trainerName && section.trainerId) {
        const key = `${section.trainerId}`;
        if (trainers.has(key)) {
          const existing = trainers.get(key)!;
          existing.sections += 1;
          existing.duration += section.duration;
        } else {
          trainers.set(key, {
            name: section.trainerName,
            sections: 1,
            duration: section.duration,
          });
        }
      }
    });

    return Array.from(trainers.values());
  }, [sortedSections]);

  // Calculate cumulative time for agenda
  const agendaItems = React.useMemo(() => {
    let cumulativeTime = 0;
    return sortedSections.map((section) => {
      const startTime = cumulativeTime;
      const endTime = cumulativeTime + section.duration;
      cumulativeTime = endTime;
      return {
        section,
        startTime,
        endTime,
      };
    });
  }, [sortedSections]);

  const getReadinessColor = () => {
    if (readinessScore >= 90) return 'text-green-700 bg-green-100 border-green-200';
    if (readinessScore >= 70) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-orange-700 bg-orange-100 border-orange-200';
  };

  const getReadinessMessage = () => {
    if (readinessScore >= 90) return 'Session Ready';
    if (readinessScore >= 70) return 'Almost Ready';
    return 'Needs Attention';
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  const getIconForSection = (type: string) => {
    const iconMap: { [key: string]: string } = {
      opener: '🎯',
      topic: '📚',
      exercise: '🎮',
      video: '🎥',
      discussion: '💬',
      presentation: '🎤',
      inspiration: '✨',
      break: '☕',
      assessment: '📋',
      closing: '🏁',
      custom: '⚙️'
    };
    return iconMap[type] || '📄';
  };

  // Check session completeness
  const completenessChecks = React.useMemo(() => {
    const checks = [
      {
        label: 'Session details complete',
        passed: !!(metadata.desiredOutcome && metadata.category && metadata.sessionType && metadata.locationId),
      },
      {
        label: 'All sections have descriptions',
        passed: sortedSections.every(s => s.description?.trim()),
      },
      {
        label: 'Duration matches schedule',
        passed: !scheduledDuration || Math.abs(totalDuration - scheduledDuration) <= 5,
      },
      {
        label: 'Trainers assigned',
        passed: trainerRoster.length > 0,
      },
    ];

    return checks;
  }, [metadata, sortedSections, totalDuration, scheduledDuration, trainerRoster]);

  const passedChecks = completenessChecks.filter(c => c.passed).length;

  return (
    <div className="space-y-6">
      {/* Header with Success Theme */}
      <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-1">{outline.suggestedSessionTitle}</h1>
                <p className="text-sm text-slate-700">{outline.suggestedDescription}</p>
              </div>
              <span className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2',
                getReadinessColor()
              )}>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {readinessScore}% {getReadinessMessage()}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-slate-900 capitalize">
                  {metadata.sessionType ?? 'Not set'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold text-slate-900">
                  {sessionBuilderService.formatDuration(totalDuration)}
                </span>
                {scheduledDuration && totalDuration !== scheduledDuration && (
                  <span className="text-xs text-slate-600">
                    (scheduled: {sessionBuilderService.formatDuration(scheduledDuration)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-slate-900">{sortedSections.length} sections</span>
              </div>
              {metadata.category && (
                <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-lg">
                  <svg className="h-4 w-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <span className="font-medium text-slate-900">{metadata.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Session Agenda Timeline */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Complete Session Agenda
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="text-xs text-slate-600 hover:text-slate-700 font-medium px-2 py-1 hover:bg-slate-100 rounded"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {agendaItems.map((item, index) => {
                  const { section, startTime, endTime } = item;
                  const isExpanded = expandedSections.has(section.id);
                  const hasDetails =
                    (section.learningObjectives && section.learningObjectives.length > 0) ||
                    (section.materialsNeeded && section.materialsNeeded.length > 0) ||
                    (section.suggestedActivities && section.suggestedActivities.length > 0) ||
                    section.trainerNotes ||
                    section.deliveryGuidance ||
                    (section.keyTakeaways && section.keyTakeaways.length > 0) ||
                    (section.actionItems && section.actionItems.length > 0) ||
                    (section.nextSteps && section.nextSteps.length > 0) ||
                    (section.discussionPrompts && section.discussionPrompts.length > 0) ||
                    section.exerciseInstructions;

                  return (
                    <div key={section.id} className="relative pl-12 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0">
                      {/* Timeline dot and time */}
                      <div className="absolute left-0 -ml-[9px] flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="absolute left-6 -mt-0.5 text-xs font-mono font-semibold text-slate-500">
                        {formatTime(startTime)} - {formatTime(endTime)}
                      </div>

                      {/* Section content */}
                      <div className="mt-6 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        {/* Section header - clickable to expand/collapse */}
                        <div
                          className={cn(
                            "p-4 bg-white border-b border-slate-200",
                            hasDetails && "cursor-pointer hover:bg-slate-50 transition-colors"
                          )}
                          onClick={hasDetails ? () => toggleSection(section.id) : undefined}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-sm">
                                {getIconForSection(section.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-semibold text-slate-900">{section.title}</h4>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                                    {section.type}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600">{section.description}</p>

                                {/* Trainer assignment */}
                                <div className="mt-2 flex items-center gap-4 text-xs">
                                  {section.trainerName ? (
                                    <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                      </svg>
                                      <span className="font-medium">{section.trainerName}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                      </svg>
                                      <span className="italic">No trainer assigned</span>
                                    </div>
                                  )}
                                  {hasDetails && (
                                    <button
                                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 ml-auto"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSection(section.id);
                                      }}
                                    >
                                      {isExpanded ? (
                                        <>
                                          <span className="text-xs font-medium">Hide details</span>
                                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                          </svg>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-xs font-medium">Show details</span>
                                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                          </svg>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold">
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                {section.duration} min
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Section details - collapsible */}
                        {hasDetails && isExpanded && (
                          <div className="p-4 space-y-4 bg-slate-50">
                            {/* Learning Objectives */}
                            {section.learningObjectives && section.learningObjectives.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  Learning Objectives
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.learningObjectives.map((obj, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <svg className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      {obj}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Materials Needed */}
                            {section.materialsNeeded && section.materialsNeeded.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">📦</span> Materials Needed
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.materialsNeeded.map((material, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {material}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggested Activities */}
                            {section.suggestedActivities && section.suggestedActivities.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">🎪</span> Suggested Activities
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.suggestedActivities.map((activity, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {activity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Trainer Notes */}
                            {section.trainerNotes && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">👨‍🏫</span> Trainer Notes
                                </h5>
                                <p className="text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-200 whitespace-pre-wrap">
                                  {section.trainerNotes}
                                </p>
                              </div>
                            )}

                            {/* Delivery Guidance */}
                            {section.deliveryGuidance && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">💡</span> Delivery Tips
                                </h5>
                                <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                  {section.deliveryGuidance}
                                </p>
                              </div>
                            )}

                            {/* Exercise Instructions */}
                            {section.exerciseInstructions && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">🎮</span> Exercise Instructions
                                </h5>
                                <p className="text-sm text-slate-700 bg-purple-50 p-3 rounded-lg border border-purple-200">
                                  {section.exerciseInstructions}
                                </p>
                              </div>
                            )}

                            {/* Discussion Prompts */}
                            {section.discussionPrompts && section.discussionPrompts.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">💬</span> Discussion Prompts
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.discussionPrompts.map((prompt, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {prompt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Key Takeaways (Closing) */}
                            {section.keyTakeaways && section.keyTakeaways.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">⭐</span> Key Takeaways
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.keyTakeaways.map((takeaway, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {takeaway}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Action Items (Closing) */}
                            {section.actionItems && section.actionItems.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">✅</span> Action Items
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.actionItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Next Steps (Closing) */}
                            {section.nextSteps && section.nextSteps.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                  <span className="text-base">🎯</span> Next Steps
                                </h5>
                                <ul className="space-y-1.5">
                                  {section.nextSteps.map((step, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                      <span className="text-slate-400 mt-0.5">•</span>
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Readiness Checklist */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Readiness Checklist
              </h3>
              <div className="space-y-3">
                {completenessChecks.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {check.passed ? (
                      <svg className="h-5 w-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={cn('text-sm', check.passed ? 'text-slate-700' : 'text-slate-400')}>
                      {check.label}
                    </span>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 mb-1">Overall Progress</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-300"
                        style={{ width: `${(passedChecks / completenessChecks.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {passedChecks}/{completenessChecks.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trainer Roster */}
          {trainerRoster.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Trainer Roster
                </h3>
                <div className="space-y-3">
                  {trainerRoster.map((trainer, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {trainer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{trainer.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {trainer.sections} section{trainer.sections > 1 ? 's' : ''} • {trainer.duration} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Details */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Session Details
              </h3>

              <div className="space-y-3 text-sm">
                {metadata.startTime && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
                    <p className="text-slate-900">{formatDateTime(metadata.startTime)}</p>
                  </div>
                )}
                {metadata.endTime && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">End Time</label>
                    <p className="text-slate-900">{formatDateTime(metadata.endTime)}</p>
                  </div>
                )}
                {metadata.location && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                    <p className="text-slate-900">{metadata.location}</p>
                  </div>
                )}
                {metadata.audienceName && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Target Audience</label>
                    <p className="text-slate-900">{metadata.audienceName}</p>
                  </div>
                )}
                {metadata.desiredOutcome && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Desired Outcome</label>
                    <p className="text-slate-900">{metadata.desiredOutcome}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-2">
        <Button
          onClick={onEdit}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Edit
        </Button>
        {onPublish && (
          <Button
            onClick={onPublish}
            disabled={isPublishing || isPublished}
            size="lg"
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-lg px-8"
          >
            {isPublishing ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Publishing...
              </>
            ) : isPublished ? (
              <>
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Published
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Continue to Publish
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
