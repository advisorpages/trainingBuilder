import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Topic, Trainer } from '@leadership-training/shared';
import { SessionTopicDetail } from '@/components/sessions/EnhancedTopicCard';
import { Button } from '@/components/ui/Button';
import { TrainerGridSelector } from '@/components/ui/TrainerGridSelector';

interface EditTopicDetailsModalProps {
  isOpen: boolean;
  topicDetail: SessionTopicDetail | null;
  topic: Topic | undefined;
  trainers: Trainer[];
  onSave: (updatedDetail: SessionTopicDetail) => void;
  onClose: () => void;
}

export const EditTopicDetailsModal: React.FC<EditTopicDetailsModalProps> = ({
  isOpen,
  topicDetail,
  topic,
  trainers,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<{
    durationMinutes: number;
    assignedTrainerId?: number;
    notes: string;
  }>({
    durationMinutes: 30,
    assignedTrainerId: undefined,
    notes: '',
  });
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const durationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (topicDetail) {
      setFormData({
        durationMinutes: topicDetail.durationMinutes || 30,
        assignedTrainerId: topicDetail.assignedTrainerId,
        notes: topicDetail.notes || '',
      });
    }
  }, [topicDetail]);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAnimatingOut) {
        e.preventDefault();
        handleAnimatedClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isAnimatingOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicDetail) return;

    const updatedDetail: SessionTopicDetail = {
      ...topicDetail,
      durationMinutes: formData.durationMinutes,
      assignedTrainerId: formData.assignedTrainerId,
      notes: formData.notes.trim(),
    };

    onSave(updatedDetail);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const handleAnimatedClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsAnimatingOut(false);
      onClose();
    }, 200);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAnimatingOut) {
      handleAnimatedClose();
    }
  };

  if (!isOpen && !isAnimatingOut) return null;
  if (!topicDetail || !topic) return null;

  const modalContent = (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isAnimatingOut
          ? 'bg-slate-900/0 backdrop-blur-none'
          : 'bg-slate-900/40 backdrop-blur-sm'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-lg shadow-xl transform transition-all duration-200 ${
          isAnimatingOut
            ? 'opacity-0 scale-95 translate-y-4'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-200">
          <div>
            <h2 id="edit-modal-title" className="text-xl font-semibold text-slate-900">Edit Topic Details</h2>
            <p className="text-sm text-slate-600 mt-1">{topic.name}</p>
          </div>
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Topic Description */}
          {topic.description && (
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700">{topic.description}</p>
            </div>
          )}

          {/* Duration Slider */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration: {formatDuration(formData.durationMinutes)}
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 min-w-[3rem]">15 min</span>
              <input
                ref={durationInputRef}
                type="range"
                min="15"
                max="180"
                step="15"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, durationMinutes: Number(e.target.value) }))
                }
                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Topic duration"
              />
              <span className="text-xs text-slate-500 min-w-[3rem] text-right">3 hours</span>
            </div>
          </div>

          {/* Trainer Assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assigned Trainer (Optional)
            </label>
            <TrainerGridSelector
              value={formData.assignedTrainerId}
              selectedLabel={
                formData.assignedTrainerId
                  ? trainers.find(t => t.id === formData.assignedTrainerId)?.name
                  : undefined
              }
              onChange={(trainer) => {
                setFormData((prev) => ({
                  ...prev,
                  assignedTrainerId: trainer?.id,
                }));
              }}
              placeholder="Search and select a trainer..."
              disabled={trainers.length === 0}
            />
            {trainers.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                No active trainers found. Please add trainers in the system settings.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Special instructions, materials needed, etc..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={handleAnimatedClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render modal in a portal at document body level
  return createPortal(modalContent, document.body);
};
