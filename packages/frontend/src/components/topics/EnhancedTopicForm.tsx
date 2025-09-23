import React, { useState, useEffect } from 'react';
import { Topic, Audience, Tone, Category, TopicEnhancementInput, TopicAIContent } from '@leadership-training/shared';
import { CreateTopicRequest, UpdateTopicRequest } from '../../services/topic.service';
import { aiTopicService } from '../../services/aiTopicService';
import { AITopicEnhancementSection } from './AITopicEnhancementSection';

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
    categoryId: sessionContext?.categoryId || 0,
    audienceId: sessionContext?.audienceId || 0,
    toneId: sessionContext?.toneId || 0,
    deliveryStyle: 'workshop' as 'workshop' | 'presentation' | 'discussion',
    specialConsiderations: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiContent, setAiContent] = useState<TopicAIContent | null>(null);
  const [showAISection, setShowAISection] = useState(false);
  const [hasAIEnhancement, setHasAIEnhancement] = useState(false);

  useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name,
        description: topic.description || '',
        learningOutcome: '',
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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // AI Enhancement validation
    if (showAISection) {
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
      };

      // Include AI enhancement data if available
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
  };

  const handleAIEnhancement = async () => {
    if (!validateForm()) {
      return;
    }

    setShowAISection(true);
  };

  const handleAIContentGenerated = (content: TopicAIContent) => {
    setAiContent(content);
    setHasAIEnhancement(true);

    // Update form with enhanced content
    setFormData(prev => ({
      ...prev,
      name: content.enhancedContent.attendeeSection.enhancedName,
      description: content.enhancedContent.enhancedDescription,
    }));
  };

  const handleClearAI = () => {
    setAiContent(null);
    setHasAIEnhancement(false);
    setShowAISection(false);

    // Reset to original content if editing
    if (topic) {
      setFormData(prev => ({
        ...prev,
        name: topic.name,
        description: topic.description || '',
      }));
    }
  };

  const buildEnhancementInput = (): TopicEnhancementInput => ({
    name: formData.name,
    learningOutcome: formData.learningOutcome,
    categoryId: formData.categoryId,
    audienceId: formData.audienceId,
    toneId: formData.toneId,
    deliveryStyle: formData.deliveryStyle,
    specialConsiderations: formData.specialConsiderations || undefined,
    sessionContext: sessionContext ? {
      sessionTitle: sessionContext.title,
      sessionDescription: sessionContext.description,
      existingTopics: sessionContext.existingTopics,
    } : undefined,
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {topic ? 'Edit Topic' : 'Create New Topic'}
        {hasAIEnhancement && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            AI Enhanced
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Topic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h4>

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
              placeholder="Enter topic description (optional)"
              disabled={isSubmitting}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Maximum 2000 characters
            </p>
          </div>
        </div>

        {/* AI Enhancement Section */}
        {!showAISection && !hasAIEnhancement && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">AI Enhancement Available</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Generate comprehensive topic content for both attendees and trainers using AI assistance.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleAIEnhancement}
                    className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Enhance with AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Enhancement Form */}
        {showAISection && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              AI Enhancement Context
            </h4>

            {/* Learning Outcome */}
            <div>
              <label htmlFor="learningOutcome" className="block text-sm font-medium text-gray-700 mb-1">
                Learning Outcome *
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
              {errors.learningOutcome && <p className="mt-1 text-sm text-red-600">{errors.learningOutcome}</p>}
            </div>

            {/* Context Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </div>

            {/* Delivery Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Style
              </label>
              <div className="mt-2 space-x-4">
                {['workshop', 'presentation', 'discussion'].map((style) => (
                  <label key={style} className="inline-flex items-center">
                    <input
                      type="radio"
                      name="deliveryStyle"
                      value={style}
                      checked={formData.deliveryStyle === style}
                      onChange={(e) => handleInputChange('deliveryStyle', e.target.value)}
                      className="form-radio h-4 w-4 text-blue-600"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{style}</span>
                  </label>
                ))}
              </div>
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
                rows={2}
                placeholder="Any special preparation notes or challenges (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* AI Enhancement Component */}
            <AITopicEnhancementSection
              input={buildEnhancementInput()}
              onContentGenerated={handleAIContentGenerated}
              isExpanded={true}
              onToggle={() => {}}
            />
          </div>
        )}

        {/* Show AI content preview if available */}
        {hasAIEnhancement && aiContent && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-green-800">AI Enhancement Applied</h3>
                <p className="mt-1 text-sm text-green-700">
                  Topic has been enhanced with AI-generated content for both attendees and trainers.
                </p>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleClearAI}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    disabled={isSubmitting}
                  >
                    Remove AI Enhancement
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="flex justify-end space-x-3 pt-4">
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