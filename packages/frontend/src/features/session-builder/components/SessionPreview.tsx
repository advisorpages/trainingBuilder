import * as React from 'react';
import { Button, Card, CardContent } from '../../../ui';
import { SessionOutline, sessionBuilderService } from '../../../services/session-builder.service';
import { SessionMetadata } from '../state/types';
import { cn } from '../../../lib/utils';

interface SessionPreviewProps {
  outline: SessionOutline;
  metadata: SessionMetadata;
  readinessScore: number;
  onPublish: () => void;
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

  const getReadinessColor = () => {
    if (readinessScore >= 90) return 'text-green-600 bg-green-100';
    if (readinessScore >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getReadinessMessage = () => {
    if (readinessScore >= 90) return 'Ready to publish';
    if (readinessScore >= 70) return 'Almost ready';
    return 'Needs attention';
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

  return (
    <div className="space-y-6">
      {/* Header with Readiness Score */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900">{outline.suggestedSessionTitle}</h1>
              <span className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                getReadinessColor()
              )}>
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {readinessScore}% {getReadinessMessage()}
              </span>
            </div>
            <p className="text-sm text-slate-700 mb-4">{outline.suggestedDescription}</p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-slate-700 capitalize">{metadata.sessionType}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-600">
                  {sessionBuilderService.formatDuration(totalDuration)}
                  {scheduledDuration && totalDuration !== scheduledDuration && (
                    <span className="text-xs ml-1">
                      (scheduled: {sessionBuilderService.formatDuration(scheduledDuration)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-600">{sortedSections.length} sections</span>
              </div>
              {metadata.category && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  <span className="text-slate-600">{metadata.category}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Session Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Desired Outcome</label>
                <p className="text-slate-900">{metadata.desiredOutcome}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Outline */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Session Outline
          </h3>

          <div className="space-y-3">
            {sortedSections.map((section, index) => (
              <div key={section.id} className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-medium">
                  <span>{getIconForSection(section.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900">{section.title}</h4>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {section.duration} min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{section.description}</p>
                  {section.learningObjectives && section.learningObjectives.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span>{section.learningObjectives.length} learning objective{section.learningObjectives.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button
          onClick={onEdit}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Make Changes
        </Button>
        <Button
          onClick={onPublish}
          disabled={isPublishing || isPublished}
          size="lg"
          className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
        >
          {isPublishing ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
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
              Publish Session
            </>
          )}
        </Button>
      </div>

      {/* Readiness Info */}
      {readinessScore < 90 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 mb-1">
                Session needs some attention
              </h4>
              <p className="text-xs text-amber-800">
                Your session is at {readinessScore}% readiness. Consider reviewing the content to ensure all required fields are complete before publishing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
