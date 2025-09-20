import React, { useState } from 'react';

interface PromptEditModalProps {
  isOpen: boolean;
  currentPrompt: string;
  onSave: (prompt: string) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}

export const PromptEditModal: React.FC<PromptEditModalProps> = ({
  isOpen,
  currentPrompt,
  onSave,
  onClose,
  isSaving = false
}) => {
  const [editedPrompt, setEditedPrompt] = useState(currentPrompt);

  React.useEffect(() => {
    setEditedPrompt(currentPrompt);
  }, [currentPrompt]);

  const handleSave = async () => {
    if (editedPrompt.trim() !== currentPrompt) {
      await onSave(editedPrompt.trim());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Edit AI Prompt</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Refine your AI prompt to get better content generation results
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  AI Prompt
                </label>
                <textarea
                  id="prompt"
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  rows={16}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
                  placeholder="Enter your AI prompt here..."
                />
                <div className="mt-2 flex justify-between text-sm text-gray-500">
                  <span>
                    Characters: {editedPrompt.length}
                  </span>
                  <span>
                    {editedPrompt.length > 10000 && (
                      <span className="text-red-600">Prompt may be too long for some AI services</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Prompt Writing Tips</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Be specific about the desired output format</li>
                        <li>Include clear context about your audience and goals</li>
                        <li>Use examples to guide the AI's response style</li>
                        <li>Specify any constraints (length, tone, structure)</li>
                        <li>Ask for specific sections or bullet points if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaving || editedPrompt.trim() === ''}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Prompt'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};