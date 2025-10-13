import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Topic, Category } from '@leadership-training/shared';
import { TopicForm } from '@/components/topics/TopicForm';
import { topicService, CreateTopicRequest } from '@/services/topic.service';
import { categoryService } from '@/services/category.service';

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: Topic) => void;
  availableTopics: Topic[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onTopicCreated?: (newTopic: Topic) => void;
}

export const TopicSelectionModal: React.FC<TopicSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
  availableTopics,
  searchTerm = '',
  onSearchChange,
  onTopicCreated,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [filteredTopics, setFilteredTopics] = useState(availableTopics);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);
  const [previewTopicId, setPreviewTopicId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update filtered topics when search term or available topics change
  useEffect(() => {
    if (!localSearchTerm.trim()) {
      setFilteredTopics(availableTopics);
    } else {
      const filtered = availableTopics.filter(topic =>
        topic.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        (topic.description && topic.description.toLowerCase().includes(localSearchTerm.toLowerCase()))
      );
      setFilteredTopics(filtered);
    }
  }, [localSearchTerm, availableTopics]);

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearchTerm);
    }
  };

  const handleTopicSelect = (topic: Topic) => {
    onSelectTopic(topic);
    onClose();
  };

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setCategoryLoading(true);
      const activeCategories = await categoryService.getActiveCategories();
      setCategories(activeCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Helper functions to extract topic content
  const getTopicCategoryId = (topic: Topic): number | null => {
    return topic.aiGeneratedContent?.enhancementContext?.categoryId || null;
  };

  const getTopicCategoryName = (topic: Topic): string | null => {
    return topic.aiGeneratedContent?.enhancementContext?.categoryName || null;
  };

  const getTopicObjective = (topic: Topic): string | null => {
    // Try AI generated content first
    if (topic.aiGeneratedContent?.enhancedContent?.attendeeSection?.whatYoullLearn) {
      return topic.aiGeneratedContent.enhancedContent.attendeeSection.whatYoullLearn;
    }
    // Fall back to learning outcomes
    return topic.learningOutcomes || null;
  };

  const getTopicTakeaways = (topic: Topic): string[] => {
    if (topic.aiGeneratedContent?.enhancedContent?.attendeeSection?.keyTakeaways) {
      return topic.aiGeneratedContent.enhancedContent.attendeeSection.keyTakeaways.slice(0, 4);
    }
    return [];
  };

  const getTopicActivities = (topic: Topic): string[] => {
    if (topic.aiGeneratedContent?.enhancedContent?.trainerSection?.recommendedActivities) {
      return topic.aiGeneratedContent.enhancedContent.trainerSection.recommendedActivities.slice(0, 4);
    }
    return [];
  };

  const handleClose = () => {
    // Start exit animation
    setIsAnimatingOut(true);
    setTimeout(() => {
      setLocalSearchTerm('');
      setShowCreateForm(false);
      setExpandedTopicId(null);
      setPreviewTopicId(null);
      setIsAnimatingOut(false);
      onClose();
    }, 200); // Match animation duration
  };

  const handleCreateTopic = async (data: CreateTopicRequest) => {
    try {
      setIsCreating(true);
      const newTopic = await topicService.createTopic(data);

      // Notify parent component of new topic (so it can be added to the list)
      if (onTopicCreated) {
        onTopicCreated(newTopic);
      }

      // Automatically select the newly created topic and add it to the session
      onSelectTopic(newTopic);

      // Close modal
      setShowCreateForm(false);
      onClose();
    } catch (error) {
      console.error('Failed to create topic:', error);
      // Error will be handled by TopicForm
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isOpen && !showCreateForm && searchInputRef.current) {
      // Delay focus to after animation starts
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showCreateForm]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isAnimatingOut) {
        e.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isAnimatingOut]);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isAnimatingOut) {
      handleClose();
    }
  };

  if (!isOpen && !isAnimatingOut) return null;

  const modalContent = (

    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 transition-all duration-200 ${
        isAnimatingOut
          ? 'bg-slate-900/0 backdrop-blur-none'
          : 'bg-slate-900/40 backdrop-blur-sm'
      }`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`w-full max-w-4xl bg-white rounded-lg sm:rounded-xl shadow-xl transform transition-all duration-200 ${
          isAnimatingOut
            ? 'opacity-0 scale-95 translate-y-4'
            : 'opacity-100 scale-100 translate-y-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-slate-200">
          <div>
            <h2 id="modal-title" className="text-xl font-semibold text-slate-900">
              {showCreateForm ? 'Create New Topic' : 'Topic Library'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              {showCreateForm
                ? 'Create a new topic and add it to your session'
                : 'Browse and select topics to add to your session'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close topic library"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Conditional Content: Create Form or Browse */}
        {showCreateForm ? (
          /* Create New Topic Form */
          <div className="p-4 sm:p-6">
            <TopicForm
              onSubmit={handleCreateTopic}
              onCancel={() => setShowCreateForm(false)}
              isSubmitting={isCreating}
            />
          </div>
        ) : (
          <>
            {/* Search Section */}
            <div className="p-4 sm:p-6 border-b border-slate-200">
              <div className="flex flex-col gap-3">
                {/* Create New Topic Button */}
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full sm:w-auto"
                  variant="outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Create New Topic
                </Button>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={localSearchTerm}
                      onChange={(e) => setLocalSearchTerm(e.target.value)}
                      placeholder="Search by keyword or category..."
                      className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                      aria-label="Search topics"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocalSearchTerm('')}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Topic Cards */}
            <div className="p-4 sm:p-6 max-h-96 overflow-y-auto">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <div className="text-slate-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
              </div>
              <p className="text-slate-600 mb-2">
                {localSearchTerm ? 'No topics match your search' : 'No topics available'}
              </p>
              <p className="text-sm text-slate-500">
                {localSearchTerm ? 'Try adjusting your search terms' : 'Publish sessions to grow your library'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {filteredTopics.map((topic, index) => {
                const objective = getTopicObjective(topic);
                const takeaways = getTopicTakeaways(topic);
                const activities = getTopicActivities(topic);
                const isExpanded = expandedTopicId === topic.id;
                const hasExpandableContent = takeaways.length > 0 || activities.length > 0;

                return (
                  <div
                    key={topic.id}
                    className={`group rounded-lg border border-slate-200 p-4 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
                      isExpanded
                        ? 'border-blue-300 shadow-lg ring-2 ring-blue-100'
                        : 'hover:border-blue-300 hover:shadow-md hover:scale-[1.02]'
                    }`}
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                  >
                    <div className="space-y-3">
                      {/* Header with Title and Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 truncate">{topic.name}</h4>
                          <p className="text-sm text-slate-500">
                            General • 30 min
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Preview Icon */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewTopicId(topic.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Preview full details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                          </button>
                          {/* Add Button */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleTopicSelect(topic)}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Description */}
                      {topic.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {topic.description}
                        </p>
                      )}

                      {/* Objective Preview (Always Shown) */}
                      {objective && (
                        <div className="bg-blue-50 border border-blue-100 rounded-md p-2">
                          <div className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">🎯</span>
                            <p className={`text-sm text-blue-900 ${isExpanded ? '' : 'line-clamp-1'}`}>
                              {objective}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-top-2">
                          {/* Key Takeaways */}
                          {takeaways.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                <span>✨</span> Key Takeaways
                              </h5>
                              <ul className="space-y-1">
                                {takeaways.map((takeaway, i) => (
                                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span className="flex-1">{takeaway}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Activities/Tasks */}
                          {activities.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                                <span>✅</span> Recommended Activities
                              </h5>
                              <ul className="space-y-1">
                                {activities.map((activity, i) => (
                                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span className="flex-1">{activity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expand/Collapse Button */}
                      {hasExpandableContent && (
                        <button
                          type="button"
                          onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <span>Show Less</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
                              </svg>
                            </>
                          ) : (
                            <>
                              <span>Show Details</span>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </>
                          )}
                        </button>
                      )}

                      {/* Materials Badge (if no expandable content) */}
                      {!hasExpandableContent && topic.materialsNeeded && (
                        <div className="flex flex-wrap gap-2 text-sm">
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-slate-600">
                            <span className="text-xs">📋</span>
                            <span className="text-xs font-medium">Materials Needed</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </div>
          </>
        )}

        {/* Modal Footer - Only show when not creating */}
        {!showCreateForm && (
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-200">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>

      {/* Preview Drawer */}
      {previewTopicId !== null && (() => {
        const previewTopic = filteredTopics.find(t => t.id === previewTopicId);
        if (!previewTopic) return null;

        const objective = getTopicObjective(previewTopic);
        const takeaways = getTopicTakeaways(previewTopic);
        const activities = getTopicActivities(previewTopic);
        const allActivities = previewTopic.aiGeneratedContent?.enhancedContent?.trainerSection?.recommendedActivities || [];
        const allTakeaways = previewTopic.aiGeneratedContent?.enhancedContent?.attendeeSection?.keyTakeaways || [];
        const materials = previewTopic.aiGeneratedContent?.enhancedContent?.trainerSection?.materialsNeeded || [];

        return (
          <div
            className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-60 transform transition-transform duration-300 ease-in-out overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 leading-tight">{previewTopic.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Full Topic Details</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTopicId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  aria-label="Close preview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4">
              {/* Description */}
              {previewTopic.description && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                  <p className="text-sm text-slate-600">{previewTopic.description}</p>
                </div>
              )}

              {/* Learning Objective */}
              {objective && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1.5">
                    <span>🎯</span> Learning Objective
                  </h4>
                  <p className="text-sm text-blue-800">{objective}</p>
                </div>
              )}

              {/* Key Takeaways */}
              {allTakeaways.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>✨</span> Key Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {allTakeaways.map((takeaway, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span className="flex-1">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Activities */}
              {allActivities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>✅</span> Recommended Activities
                  </h4>
                  <ul className="space-y-2">
                    {allActivities.map((activity, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span className="flex-1">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Materials Needed */}
              {materials.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>📋</span> Materials Needed
                  </h4>
                  <ul className="space-y-2">
                    {materials.map((material, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">•</span>
                        <span className="flex-1">{material}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trainer Notes */}
              {previewTopic.trainerNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-1.5">
                    <span>📝</span> Trainer Notes
                  </h4>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">{previewTopic.trainerNotes}</p>
                </div>
              )}

              {/* Delivery Guidance */}
              {previewTopic.deliveryGuidance && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                    <span>💡</span> Delivery Guidance
                  </h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{previewTopic.deliveryGuidance}</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4">
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  handleTopicSelect(previewTopic);
                  setPreviewTopicId(null);
                }}
              >
                Add to Session
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  // Render modal in a portal at document body level
  return createPortal(modalContent, document.body);
};