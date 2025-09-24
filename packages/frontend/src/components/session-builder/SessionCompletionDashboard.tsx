import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionBuilderService } from '../../services/session-builder.service';

interface SessionCompletionDashboardProps {
  sessionId: string;
}

export const SessionCompletionDashboard: React.FC<SessionCompletionDashboardProps> = ({
  sessionId
}) => {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime] = useState(new Date());

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const data = await sessionBuilderService.getCompleteSessionData(sessionId);
      setSessionData(data);
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCompletionColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionBgColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading session data...</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load session data.</p>
      </div>
    );
  }

  const { session, completionStatus } = sessionData;
  const timeToComplete = sessionBuilderService.calculateTimeToComplete(startTime);

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-semibold text-green-900">Session Created Successfully!</h2>
            <p className="text-green-700">
              "{session.title}" has been created and is ready for promotion and delivery.
            </p>
            {timeToComplete <= 10 && (
              <p className="text-sm text-green-600 mt-1">
                ⚡ Completed in {timeToComplete} minutes - Goal achieved!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Completion Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Session Completion Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompletionBgColor(completionStatus.completionPercentage)} ${getCompletionColor(completionStatus.completionPercentage)}`}>
            {completionStatus.completionPercentage}% Complete
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Basic Session Info</span>
            <span className="text-green-600">✓ Complete</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Session Outline</span>
            <span className={completionStatus.hasOutline ? "text-green-600" : "text-gray-400"}>
              {completionStatus.hasOutline ? "✓ Complete" : "○ Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Training Kit</span>
            <span className={completionStatus.hasTrainingKit ? "text-green-600" : "text-gray-400"}>
              {completionStatus.hasTrainingKit ? "✓ Complete" : "○ Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-gray-700">Marketing Kit</span>
            <span className={completionStatus.hasMarketingKit ? "text-green-600" : "text-gray-400"}>
              {completionStatus.hasMarketingKit ? "✓ Complete" : "○ Pending"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionStatus.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
        <div className="space-y-3">
          {!completionStatus.hasTrainingKit && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium text-blue-900">Generate Training Kit</h4>
                <p className="text-sm text-blue-700">Help trainers deliver this session effectively</p>
              </div>
              <Link
                to={`/sessions/${sessionId}/training-kit`}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Generate
              </Link>
            </div>
          )}

          {!completionStatus.hasMarketingKit && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <h4 className="font-medium text-purple-900">Generate Marketing Kit</h4>
                <p className="text-sm text-purple-700">Create promotional materials for this session</p>
              </div>
              <Link
                to={`/sessions/${sessionId}/marketing-kit`}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Generate
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">View Complete Session</h4>
              <p className="text-sm text-gray-600">Review all session details and make final adjustments</p>
            </div>
            <Link
              to={`/sessions/${sessionId}`}
              className="px-4 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
            >
              View Session
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        <Link
          to="/sessions/builder"
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create Another Session
        </Link>
        <Link
          to="/dashboard"
          className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};