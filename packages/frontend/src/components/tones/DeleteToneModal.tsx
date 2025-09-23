import React from 'react';
import { Tone } from '@leadership-training/shared';

interface DeleteToneModalProps {
  tone: Tone;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteToneModal: React.FC<DeleteToneModalProps> = ({
  tone,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      console.error('Delete confirmation error:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 text-center mt-4">
            {tone.isActive ? 'Deactivate Tone' : 'Delete Tone'}
          </h3>

          {/* Content */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {tone.isActive ? (
                <>
                  Are you sure you want to deactivate "<strong>{tone.name}</strong>"?
                  This tone will no longer be available for new sessions.
                </>
              ) : (
                <>
                  Are you sure you want to permanently delete "<strong>{tone.name}</strong>"?
                  This action cannot be undone.
                </>
              )}
            </p>

            {tone.description && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-500">Description:</p>
                <p className="text-sm text-gray-700">{tone.description}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {tone.isActive ? 'Deactivating...' : 'Deleting...'}
                </span>
              ) : (
                tone.isActive ? 'Deactivate' : 'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};