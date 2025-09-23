import React, { useState } from 'react';
import { Session } from '@leadership-training/shared';
import { SessionStatus, getStatusTransitions, getStatusConfig } from '../common/SessionStatusIndicator';
import { sessionService } from '../../services/session.service';

interface SessionStatusUpdateProps {
  session: Session;
  onStatusUpdate?: (updatedSession: Session) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface StatusChangeRequest {
  status: SessionStatus;
  reason?: string;
}

export const SessionStatusUpdate: React.FC<SessionStatusUpdateProps> = ({
  session,
  onStatusUpdate,
  onError,
  className = ''
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<StatusChangeRequest | null>(null);
  const [reason, setReason] = useState('');

  const currentStatus = session.status as SessionStatus;
  const availableTransitions = getStatusTransitions(currentStatus);

  const handleStatusSelect = (newStatus: SessionStatus) => {
    // For publishing, we need extra validation and confirmation
    if (newStatus === SessionStatus.PUBLISHED || newStatus === SessionStatus.CANCELLED) {
      setPendingStatusChange({ status: newStatus, reason: '' });
      setReason('');
      setShowConfirmModal(true);
    } else {
      // For other transitions, update immediately
      handleStatusUpdate(newStatus);
    }
  };

  const handleStatusUpdate = async (newStatus: SessionStatus, updateReason?: string) => {
    setIsUpdating(true);
    try {
      const updatedSession = await sessionService.updateSessionStatus(session.id, {
        status: newStatus,
        reason: updateReason
      });

      onStatusUpdate?.(updatedSession);
      setShowConfirmModal(false);
      setPendingStatusChange(null);
      setReason('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to update session status`;
      onError?.(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      handleStatusUpdate(pendingStatusChange.status, reason);
    }
  };

  const handleCancelStatusChange = () => {
    setShowConfirmModal(false);
    setPendingStatusChange(null);
    setReason('');
  };

  const getButtonText = (status: SessionStatus): string => {
    const config = getStatusConfig(status);
    return `Mark as ${config.label}`;
  };

  const getButtonColor = (status: SessionStatus): string => {
    switch (status) {
      case SessionStatus.PUBLISHED:
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case SessionStatus.COMPLETED:
        return 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500';
      case SessionStatus.CANCELLED:
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  if (availableTransitions.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No status changes available
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {availableTransitions.map((status) => (
          <button
            key={status}
            onClick={() => handleStatusSelect(status)}
            disabled={isUpdating}
            className={`
              px-3 py-2 text-sm font-medium text-white rounded-md
              focus:outline-none focus:ring-2 focus:ring-offset-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getButtonColor(status)}
            `}
          >
            {isUpdating ? 'Updating...' : getButtonText(status)}
          </button>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingStatusChange && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCancelStatusChange}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirm Status Change
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to change the status of "{session.title || 'Untitled Session'}" to{' '}
                        <strong>{getStatusConfig(pendingStatusChange.status).label}</strong>?
                      </p>

                      {pendingStatusChange.status === SessionStatus.PUBLISHED && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm text-blue-800">
                            📢 This will make the session publicly available for registration.
                          </p>
                        </div>
                      )}

                      {pendingStatusChange.status === SessionStatus.CANCELLED && (
                        <div className="mt-3 p-3 bg-red-50 rounded-md">
                          <p className="text-sm text-red-800">
                            ⚠️ This will cancel the session and make it unavailable for registration.
                          </p>
                        </div>
                      )}

                      <div className="mt-4">
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                          Reason (optional)
                        </label>
                        <textarea
                          id="reason"
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter a reason for this status change..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`
                    w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white
                    focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                    ${getButtonColor(pendingStatusChange.status)}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  onClick={handleConfirmStatusChange}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleCancelStatusChange}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionStatusUpdate;