import React, { useState, useEffect } from 'react';
import { Topic, Audience, Tone, Category, TopicEnhancementInput, TopicAIContent } from '@leadership-training/shared';
import { CreateTopicRequest, UpdateTopicRequest } from '../../services/topic.service';
import { aiTopicService } from '../../services/aiTopicService';

interface EnhancedTopicFormProps {
  topic?: Topic;
  sessionContext?: {
    audienceId?: number;
    toneId?: number;
    categoryId?: number;
    title?: string;
    description?: string;
    existingTopics?: string[];
  };
  audiences: Audience[];
  tones: Tone[];
  categories: Category[];
  onSubmit: (data: CreateTopicRequest | UpdateTopicRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const EnhancedTopicForm: React.FC<EnhancedTopicFormProps> = ({
  topic,
  sessionContext,
  audiences,
  tones,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    learningOutcome: '',
    learningOutcomes: '',
    trainerNotes: '',
    materialsNeeded: '',
    deliveryGuidance: '',
    categoryId: sessionContext?.categoryId || 0,
    audienceId: sessionContext?.audienceId || 0,
    toneId: sessionContext?.toneId || 0,
    deliveryStyle: 'workshop' as 'workshop' | 'presentation' | 'discussion',
    specialConsiderations: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiContent, setAiContent] = useState<TopicAIContent | null>(null);
  const [hasAIEnhancement, setHasAIEnhancement] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [manualContentSnapshot, setManualContentSnapshot] = useState<{
    name: string;
    description: string;
    learningOutcomes: string;
    trainerNotes: string;
    materialsNeeded: string;
    deliveryGuidance: string;
  } | null>(null);

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name,
        description: topic.description || '',
        learningOutcome: '',
        learningOutcomes: topic.learningOutcomes || '',
        trainerNotes: topic.trainerNotes || '',
        materialsNeeded: topic.materialsNeeded || '',
        deliveryGuidance: topic.deliveryGuidance || '',
        categoryId: sessionContext?.categoryId || 0,
        audienceId: sessionContext?.audienceId || 0,
        toneId: sessionContext?.toneId || 0,
        deliveryStyle: 'workshop',
        specialConsiderations: '',
        isActive: topic.isActive,
      });

      // Check if topic has AI enhancement
      if (topic.aiGeneratedContent) {
        setAiContent(topic.aiGeneratedContent as TopicAIContent);
        setHasAIEnhancement(true);
      }
    }
  }, [topic, sessionContext]);

  const validateForm = (options: { requireAIFields?: boolean } = {}): boolean => {
    const { requireAIFields = false } = options;
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    if (requireAIFields) {
      if (!formData.learningOutcome.trim()) {
        newErrors.learningOutcome = 'Learning outcome is required for AI enhancement';
      }

      if (!formData.categoryId) {
        newErrors.categoryId = 'Category is required for AI enhancement';
      }

      if (!formData.audienceId) {
        newErrors.audienceId = 'Audience is required for AI enhancement';
      }

      if (!formData.toneId) {
        newErrors.toneId = 'Tone is required for AI enhancement';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateTopicRequest | UpdateTopicRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        learningOutcomes: formData.learningOutcomes?.trim() || undefined,
        trainerNotes: formData.trainerNotes?.trim() || undefined,
        materialsNeeded: formData.materialsNeeded?.trim() || undefined,
        deliveryGuidance: formData.deliveryGuidance?.trim() || undefined,
      };

      // AI enhancement data overrides manual entry if available
      if (aiContent) {
        submitData.aiGeneratedContent = aiContent;
        submitData.learningOutcomes = aiTopicService.extractLearningOutcomes(aiContent);
        submitData.trainerNotes = aiTopicService.extractTrainerNotes(aiContent);
        submitData.materialsNeeded = aiTopicService.extractMaterialsNeeded(aiContent);
        submitData.deliveryGuidance = aiTopicService.extractDeliveryGuidance(aiContent);
      }

      if (topic) {
        (submitData as UpdateTopicRequest).isActive = formData.isActive;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (enhancementError) {
      setEnhancementError(null);
    }
  };

  const handleAIEnhancement = async () => {
    if (!validateForm({ requireAIFields: true })) {
      return;
    }

    try {
      setIsEnhancing(true);
      setEnhancementError(null);
      setManualContentSnapshot({
        name: formData.name,
        description: formData.description,
        learningOutcomes: formData.learningOutcomes,
        trainerNotes: formData.trainerNotes,
        materialsNeeded: formData.materialsNeeded,
        deliveryGuidance: formData.deliveryGuidance,
      });

      const response = await aiTopicService.enhanceTopic(buildEnhancementInput());
      setAiContent(response.aiContent);
      setHasAIEnhancement(true);

      // Apply enhanced content to the form
      setFormData((prev) => ({
        ...prev,
        name: response.enhancedTopic.name,
        description: response.enhancedTopic.description,
        learningOutcomes: response.enhancedTopic.learningOutcomes,
        trainerNotes: response.enhancedTopic.trainerNotes,
        materialsNeeded: response.enhancedTopic.materialsNeeded,
        deliveryGuidance: response.enhancedTopic.deliveryGuidance,
      }));
    } catch (error) {
      console.error('AI enhancement error:', error);
      setEnhancementError('Failed to generate AI enhancement. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleClearAI = () => {
    setAiContent(null);
    setHasAIEnhancement(false);
    setEnhancementError(null);
    setIsEnhancing(false);

    setFormData(prev => {
      if (manualContentSnapshot) {
        return {
          ...prev,
          name: manualContentSnapshot.name,
          description: manualContentSnapshot.description,
          learningOutcomes: manualContentSnapshot.learningOutcomes,
          trainerNotes: manualContentSnapshot.trainerNotes,
          materialsNeeded: manualContentSnapshot.materialsNeeded,
          deliveryGuidance: manualContentSnapshot.deliveryGuidance,
        };
      }

      if (topic) {
        return {
          ...prev,
          name: topic.name,
          description: topic.description || '',
          learningOutcomes: topic.learningOutcomes || '',
          trainerNotes: topic.trainerNotes || '',
          materialsNeeded: topic.materialsNeeded || '',
          deliveryGuidance: topic.deliveryGuidance || '',
        };
      }

      return {
        ...prev,
        learningOutcomes: '',
        trainerNotes: '',
        materialsNeeded: '',
        deliveryGuidance: '',
      };
    });

    setManualContentSnapshot(null);
  };

  const buildEnhancementInput = (): TopicEnhancementInput => {
    const currentContent = {
      description: formData.description?.trim() || undefined,
      learningOutcomes: formData.learningOutcomes?.trim() || undefined,
      trainerNotes: formData.trainerNotes?.trim() || undefined,
      materialsNeeded: formData.materialsNeeded?.trim() || undefined,
      deliveryGuidance: formData.deliveryGuidance?.trim() || undefined,
    };

    const hasCurrentContent = Object.values(currentContent).some(Boolean);

    return {
      name: formData.name,
      learningOutcome: formData.learningOutcome,
      categoryId: formData.categoryId,
      audienceId: formData.audienceId,
      toneId: formData.toneId,
      deliveryStyle: formData.deliveryStyle,
      specialConsiderations: formData.specialConsiderations || undefined,
      sessionContext: sessionContext
        ? {
            sessionTitle: sessionContext.title,
            sessionDescription: sessionContext.description,
            existingTopics: sessionContext.existingTopics,
          }
        : undefined,
      currentContent: hasCurrentContent ? currentContent : undefined,
    };
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-w-4xl mx-auto">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {topic ? 'Edit Topic' : 'Create New Topic'}
        {hasAIEnhancement && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            AI Enhanced
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1 */}
        <section className="rounded-lg border border-gray-200 p-6 space-y-6 bg-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              1
            </span>
            <div>
              <h4 className="text-md font-semibold text-gray-900">Draft Your Topic Content</h4>
              <p className="mt-1 text-sm text-gray-600">
                Start with your own words. Capture the core learning outcome plus all trainer-facing guidance. The AI will polish this draft in the next step.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Topic Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter topic name"
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Description Field */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Summarize the topic for attendees (optional)"
                disabled={isSubmitting}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Primary Learning Outcome */}
            <div>
              <label htmlFor="learningOutcome" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Learning Outcome *
              </label>
              <input
                type="text"
                id="learningOutcome"
                value={formData.learningOutcome}
                onChange={(e) => handleInputChange('learningOutcome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.learningOutcome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="After this topic, participants will be able to..."
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                This anchors the AI rewrite and should focus on the single biggest outcome.
              </p>
              {errors.learningOutcome && <p className="mt-1 text-sm text-red-600">{errors.learningOutcome}</p>}
            </div>

            {/* Detailed Learning Outcomes */}
            <div>
              <label htmlFor="learningOutcomes" className="block text-sm font-medium text-gray-700 mb-1">
                Detailed Learning Outcomes
              </label>
              <textarea
                id="learningOutcomes"
                value={formData.learningOutcomes}
                onChange={(e) => handleInputChange('learningOutcomes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="List the concrete takeaways participants should leave with."
                disabled={isSubmitting}
              />
            </div>

            {/* Trainer Tasks */}
            <div>
              <label htmlFor="trainerNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Trainer Tasks
              </label>
              <textarea
                id="trainerNotes"
                value={formData.trainerNotes}
                onChange={(e) => handleInputChange('trainerNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="One task per line. Example: • Facilitate story swap where leaders share recent wins"
                disabled={isSubmitting}
              />
            </div>

            {/* Materials Needed */}
            <div>
              <label htmlFor="materialsNeeded" className="block text-sm font-medium text-gray-700 mb-1">
                Materials Needed
              </label>
              <textarea
                id="materialsNeeded"
                value={formData.materialsNeeded}
                onChange={(e) => handleInputChange('materialsNeeded', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="List each item on its own line. Example: • Flip charts"
                disabled={isSubmitting}
              />
            </div>

            {/* Delivery Guidance */}
            <div>
              <label htmlFor="deliveryGuidance" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Guidance
              </label>
              <textarea
                id="deliveryGuidance"
                value={formData.deliveryGuidance}
                onChange={(e) => handleInputChange('deliveryGuidance', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Include timing tips, facilitation style, or checkpoints."
                disabled={isSubmitting}
              />
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="rounded-lg border border-gray-200 p-6 space-y-6 bg-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              2
            </span>
            <div>
              <h4 className="text-md font-semibold text-gray-900">Set AI Context & Generate</h4>
              <p className="mt-1 text-sm text-gray-600">
                Once your draft looks solid, give the AI the right context so it can polish each section without losing your intent.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.categoryId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value={0}>Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Saved with the topic and used to tailor the rewrite.
              </p>
            </div>

            {/* Audience */}
            <div>
              <label htmlFor="audienceId" className="block text-sm font-medium text-gray-700 mb-1">
                Audience *
              </label>
              <select
                id="audienceId"
                value={formData.audienceId}
                onChange={(e) => handleInputChange('audienceId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.audienceId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value={0}>Select audience</option>
                {audiences.map((audience) => (
                  <option key={audience.id} value={audience.id}>
                    {audience.name}
                  </option>
                ))}
              </select>
              {errors.audienceId && <p className="mt-1 text-sm text-red-600">{errors.audienceId}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Helps the AI match examples and tone to the right group.
              </p>
            </div>

            {/* Tone */}
            <div>
              <label htmlFor="toneId" className="block text-sm font-medium text-gray-700 mb-1">
                Tone *
              </label>
              <select
                id="toneId"
                value={formData.toneId}
                onChange={(e) => handleInputChange('toneId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.toneId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value={0}>Select tone</option>
                {tones.map((tone) => (
                  <option key={tone.id} value={tone.id}>
                    {tone.name}
                  </option>
                ))}
              </select>
              {errors.toneId && <p className="mt-1 text-sm text-red-600">{errors.toneId}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Ensures the voice matches the vibe you want in the room.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Delivery Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Style
              </label>
              <div className="mt-2 flex flex-wrap gap-3">
                {['workshop', 'presentation', 'discussion'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => handleInputChange('deliveryStyle', style)}
                    className={`px-3 py-2 text-sm rounded-md border transition ${
                      formData.deliveryStyle === style
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                    disabled={isSubmitting}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Guides how interactive or facilitative the rewrite should be.
              </p>
            </div>

            {/* Special Considerations */}
            <div>
              <label htmlFor="specialConsiderations" className="block text-sm font-medium text-gray-700 mb-1">
                Special Considerations
              </label>
              <textarea
                id="specialConsiderations"
                value={formData.specialConsiderations}
                onChange={(e) => handleInputChange('specialConsiderations', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Call out constraints, prerequisites, or sensitive topics to respect."
                disabled={isSubmitting}
              />
            </div>
          </div>

          {enhancementError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {enhancementError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <p className="text-sm text-gray-500">
              Ready? We'll send your draft and this context to AI, then bring the improved copy right back here.
            </p>
            <button
              type="button"
              onClick={handleAIEnhancement}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Polishing...
                </>
              ) : hasAIEnhancement ? (
                'Run Enhancement Again'
              ) : (
                'Generate AI Enhancement'
              )}
            </button>
          </div>
        </section>

        {/* Step 3 */}
        <section className="rounded-lg border border-gray-200 p-6 space-y-4 bg-white shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
              3
            </span>
            <div>
              <h4 className="text-md font-semibold text-gray-900">Review & Decide</h4>
              <p className="mt-1 text-sm text-gray-600">
                Compare the polished copy with your original intent. Keep editing here or roll back to your draft.
              </p>
            </div>
          </div>

          {hasAIEnhancement && aiContent ? (
            <div className="flex flex-col gap-3 rounded-md border border-green-200 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-semibold text-green-800">AI enhancement applied</h5>
                  <p className="mt-1 text-sm text-green-700">
                    The fields above now reflect the refined copy. Make any final edits and save when ready.
                  </p>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleClearAI}
                  className="text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none"
                  disabled={isSubmitting}
                >
                  Undo enhancement and restore my original draft
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              After you run the enhancement, you'll see a confirmation here along with the undo option.
            </p>
          )}
        </section>

        {/* Active Status (only for edit) */}
        {topic && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive topics won't be available for new sessions
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {topic ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              topic ? 'Update Topic' : 'Create Topic'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
