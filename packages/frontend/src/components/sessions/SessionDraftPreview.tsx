import React, { useState, useEffect } from 'react';
import { aiIntegrationService, SessionPreviewResponse } from '../../services/ai-integration.service';

interface SessionDraftPreviewProps {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onFinalizeDraft?: () => void;
}

export const SessionDraftPreview: React.FC<SessionDraftPreviewProps> = ({
  isOpen,
  sessionId,
  onClose,
  onFinalizeDraft
}) => {
  const [sessionPreview, setSessionPreview] = useState<SessionPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (isOpen && sessionId) {
      loadSessionPreview();
    }
  }, [isOpen, sessionId]);

  const loadSessionPreview = async () => {
    setLoading(true);
    try {
      const preview = await aiIntegrationService.getSessionPreview(sessionId);
      setSessionPreview(preview);
    } catch (error) {
      console.error('Error loading session preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeDraft = async () => {
    setIsFinalizing(true);
    try {
      await aiIntegrationService.finalizeSessionDraft(sessionId);
      if (onFinalizeDraft) onFinalizeDraft();
      onClose();
    } catch (error) {
      console.error('Error finalizing draft:', error);
      alert('Failed to finalize draft. Please try again.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Final Session Preview
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Review your complete session before finalizing
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
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : sessionPreview ? (
              <div className="p-6 space-y-6">
                {/* Basic Session Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-900 mb-3">Session Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-800">Title</label>
                      <p className="mt-1 text-sm text-blue-900 font-medium">
                        {sessionPreview.previewData.title}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800">Status</label>
                      <p className="mt-1 text-sm text-blue-900">
                        {sessionPreview.session.status}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800">Start Time</label>
                      <p className="mt-1 text-sm text-blue-900">
                        {formatDate(sessionPreview.session.startTime)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-800">End Time</label>
                      <p className="mt-1 text-sm text-blue-900">
                        {formatDate(sessionPreview.session.endTime)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-blue-800">Description</label>
                    <p className="mt-1 text-sm text-blue-900">
                      {sessionPreview.previewData.description || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Promotional Content */}
                {(sessionPreview.previewData.promotionalHeadline ||
                  sessionPreview.previewData.promotionalSummary ||
                  sessionPreview.previewData.keyBenefits ||
                  sessionPreview.previewData.callToAction) && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-900 mb-3">Promotional Content</h4>
                    <div className="space-y-3">
                      {sessionPreview.previewData.promotionalHeadline && (
                        <div>
                          <label className="block text-sm font-medium text-green-800">Promotional Headline</label>
                          <p className="mt-1 text-sm text-green-900 bg-white p-2 rounded border">
                            {sessionPreview.previewData.promotionalHeadline}
                          </p>
                        </div>
                      )}

                      {sessionPreview.previewData.promotionalSummary && (
                        <div>
                          <label className="block text-sm font-medium text-green-800">Promotional Summary</label>
                          <p className="mt-1 text-sm text-green-900 bg-white p-2 rounded border">
                            {sessionPreview.previewData.promotionalSummary}
                          </p>
                        </div>
                      )}

                      {sessionPreview.previewData.keyBenefits && (
                        <div>
                          <label className="block text-sm font-medium text-green-800">Key Benefits</label>
                          <p className="mt-1 text-sm text-green-900 bg-white p-2 rounded border">
                            {sessionPreview.previewData.keyBenefits}
                          </p>
                        </div>
                      )}

                      {sessionPreview.previewData.callToAction && (
                        <div>
                          <label className="block text-sm font-medium text-green-800">Call to Action</label>
                          <p className="mt-1 text-sm text-green-900 bg-white p-2 rounded border">
                            {sessionPreview.previewData.callToAction}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Marketing Content */}
                {(sessionPreview.previewData.socialMediaContent ||
                  sessionPreview.previewData.emailMarketingContent) && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-900 mb-3">Marketing Content</h4>
                    <div className="space-y-3">
                      {sessionPreview.previewData.socialMediaContent && (
                        <div>
                          <label className="block text-sm font-medium text-purple-800">Social Media</label>
                          <p className="mt-1 text-sm text-purple-900 bg-white p-2 rounded border whitespace-pre-wrap">
                            {sessionPreview.previewData.socialMediaContent}
                          </p>
                        </div>
                      )}

                      {sessionPreview.previewData.emailMarketingContent && (
                        <div>
                          <label className="block text-sm font-medium text-purple-800">Email Marketing</label>
                          <p className="mt-1 text-sm text-purple-900 bg-white p-2 rounded border whitespace-pre-wrap">
                            {sessionPreview.previewData.emailMarketingContent}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block font-medium text-gray-700">Max Registrations</label>
                      <p className="text-gray-900">{sessionPreview.session.maxRegistrations}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700">Author</label>
                      <p className="text-gray-900">{sessionPreview.session.author?.firstName} {sessionPreview.session.author?.lastName}</p>
                    </div>
                    {sessionPreview.session.location && (
                      <div>
                        <label className="block font-medium text-gray-700">Location</label>
                        <p className="text-gray-900">{sessionPreview.session.location.name}</p>
                      </div>
                    )}
                    {sessionPreview.session.trainer && (
                      <div>
                        <label className="block font-medium text-gray-700">Trainer</label>
                        <p className="text-gray-900">{sessionPreview.session.trainer.firstName} {sessionPreview.session.trainer.lastName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className="text-gray-500">Unable to load session preview</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            {sessionPreview && (
              <button
                onClick={handleFinalizeDraft}
                disabled={isFinalizing}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isFinalizing ? 'Finalizing...' : 'Finalize Draft for Publishing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};