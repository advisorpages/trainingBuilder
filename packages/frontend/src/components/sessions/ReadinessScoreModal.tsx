import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { sessionService } from '../../services/session.service';
import { CheckCircle, XCircle, Clock, Users, MapPin, AlertCircle, Loader2 } from 'lucide-react';

interface ReadinessCheck {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  weight: number;
  category: string;
}

interface ReadinessScore {
  score: number;
  maxScore: number;
  percentage: number;
  checks: ReadinessCheck[];
  canPublish: boolean;
  recommendedActions: string[];
}

interface ReadinessScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
  sessionTitle?: string;
}

export const ReadinessScoreModal: React.FC<ReadinessScoreModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  sessionTitle
}) => {
  const [readinessData, setReadinessData] = useState<ReadinessScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchReadinessData();
    } else {
      // Reset state when modal closes
      setReadinessData(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, sessionId]);

  const fetchReadinessData = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await sessionService.getSessionReadiness(sessionId);
      setReadinessData(data);
    } catch (err: any) {
      console.error('Failed to fetch readiness data:', err);
      setError(err.message || 'Failed to load readiness information');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100';
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getIconForCheck = (checkName: string) => {
    if (checkName.toLowerCase().includes('trainer')) {
      return Users;
    }
    if (checkName.toLowerCase().includes('schedule') || checkName.toLowerCase().includes('date')) {
      return Clock;
    }
    if (checkName.toLowerCase().includes('location')) {
      return MapPin;
    }
    return CheckCircle;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${readinessData ? getScoreBgColor(readinessData.percentage) : 'bg-gray-100'}`}>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              ) : readinessData ? (
                <span className={`text-lg font-bold ${getScoreColor(readinessData.percentage)}`}>
                  {readinessData.percentage}%
                </span>
              ) : (
                <span className="text-lg font-bold text-gray-600">--</span>
              )}
            </div>
            <div>
              <div>Session Readiness Score</div>
              {sessionTitle && (
                <div className="text-sm font-normal text-slate-600 truncate max-w-xs">
                  {sessionTitle}
                </div>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            Detailed breakdown of your session's readiness for publishing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading readiness information...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReadinessData}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {readinessData && !loading && !error && (
            <>
              {/* Overall Status */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  readinessData.canPublish
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {readinessData.canPublish ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Ready to Publish</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Not Ready to Publish</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {readinessData.score} out of {readinessData.maxScore} points earned
                </p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Scoring Breakdown</h3>
                <div className="space-y-2">
                  {readinessData.checks.map((check) => {
                    const Icon = getIconForCheck(check.name);
                    const isCompleted = check.passed;

                    return (
                      <div
                        key={check.id}
                        className="flex items-center gap-3 p-3 rounded-lg border ${
                          isCompleted ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }"
                      >
                        <div className={`p-1 rounded-full ${
                          isCompleted ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            isCompleted ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">
                              {check.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-slate-600">
                                {check.weight}pts
                              </span>
                              {isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {check.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Actions */}
              {readinessData.recommendedActions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {readinessData.canPublish ? 'Great Job!' : 'Recommended Actions'}
                  </h3>
                  <div className={`space-y-2 ${
                    readinessData.canPublish
                      ? 'p-4 bg-green-50 border border-green-200 rounded-lg'
                      : 'p-4 bg-amber-50 border border-amber-200 rounded-lg'
                  }`}>
                    {readinessData.recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2">
                        {readinessData.canPublish ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-amber-400 mt-0.5 flex-shrink-0" />
                        )}
                        <p className={`text-sm ${
                          readinessData.canPublish ? 'text-green-800' : 'text-amber-800'
                        }`}>
                          {action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <Button onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadinessScoreModal;