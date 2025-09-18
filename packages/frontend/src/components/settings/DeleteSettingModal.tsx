import React from 'react';
import { SystemSetting } from '../../../../shared/src/types';

interface DeleteSettingModalProps {
  setting: SystemSetting;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const DeleteSettingModal: React.FC<DeleteSettingModalProps> = ({
  setting,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Setting
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to permanently delete the setting "<strong>{setting.key}</strong>"?
            This action cannot be undone.
          </p>

          {setting.description && (
            <p className="text-xs text-gray-400 mb-4">
              Description: {setting.description}
            </p>
          )}

          <div className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded">
            Current value: {setting.value}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
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
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </span>
            ) : (
              'Delete Setting'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};