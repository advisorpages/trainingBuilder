import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Incentive, Audience, Tone, Category } from '@leadership-training/shared';
import { attributesService } from '../../services/attributes.service';
import { incentiveService, UpdateIncentiveRequest, CreateIncentiveRequest } from '../../services/incentive.service';
import { IncentiveAIContentGenerator } from './IncentiveAIContentGenerator';
import { IncentiveGeneratedContent } from '../../services/incentive-ai.service';

interface IncentiveFormProps {
  incentive?: Incentive;
  onSubmit: (data: CreateIncentiveRequest | UpdateIncentiveRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const IncentiveForm: React.FC<IncentiveFormProps> = ({
  incentive,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    title: incentive?.title || '',
    description: incentive?.description || '',
    rules: incentive?.rules || '',
    startDate: incentive?.startDate ? new Date(incentive.startDate).toISOString().slice(0, 16) : '',
    endDate: incentive?.endDate ? new Date(incentive.endDate).toISOString().slice(0, 16) : '',
    audienceId: '', // TODO: Extract from incentive when backend supports it
    toneId: '', // TODO: Extract from incentive when backend supports it
    categoryId: '', // TODO: Extract from incentive when backend supports it
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading states for dropdown data
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tones, setTones] = useState<Tone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Auto-save and draft management state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

  // Refs for auto-save functionality
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const initialFormDataRef = useRef<any>(null);

  // AI generation state
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoadingData(true);

        // Load all dropdown data in parallel
        const [
          audiencesResponse,
          tonesResponse,
          categoriesResponse
        ] = await Promise.all([
          attributesService.getAudiences(),
          attributesService.getTones(),
          attributesService.getCategories()
        ]);

        setAudiences(audiencesResponse);
        setTones(tonesResponse);
        setCategories(categoriesResponse);
      } catch (error) {
        console.error('Failed to load form data:', error);
        // Keep loading false to show form even if data fails to load
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  // Set initial form data for comparison
  useEffect(() => {
    initialFormDataRef.current = { ...formData };
  }, [incentive]);

  // Auto-save functionality (similar to SessionForm)
  const performAutoSave = useCallback(async () => {
    if (!incentive?.id || !isAutoSaveEnabled || !hasUnsavedChanges) {
      return;
    }

    try {
      setAutoSaveStatus('saving');

      // Convert form data to update request
      const updateData: Partial<UpdateIncentiveRequest> = {
        title: formData.title.trim() || undefined,
        description: formData.description.trim() || undefined,
        rules: formData.rules.trim() || undefined,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        audienceId: formData.audienceId ? Number(formData.audienceId) : undefined,
        toneId: formData.toneId ? Number(formData.toneId) : undefined,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      };

      await incentiveService.autoSaveDraft(incentive.id, updateData);

      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [incentive?.id, formData, isAutoSaveEnabled, hasUnsavedChanges]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!incentive?.id) return;

    // Check if form data has changed
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    setHasUnsavedChanges(hasChanges);

    if (hasChanges && isAutoSaveEnabled) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (3 seconds after user stops typing)
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        performAutoSave();
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, performAutoSave, incentive?.id, isAutoSaveEnabled]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Incentive title is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear auto-save timeout when manually submitting
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const submissionData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      rules: formData.rules.trim() || undefined,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      audienceId: formData.audienceId ? Number(formData.audienceId) : undefined,
      toneId: formData.toneId ? Number(formData.toneId) : undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
    };

    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
    onSubmit(submissionData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // AI Content Generation Handlers
  const handleOpenAIGenerator = () => {
    setShowAIGenerator(true);
  };

  const handleCloseAIGenerator = () => {
    setShowAIGenerator(false);
  };

  const handleApplyAIContent = (generatedContent: IncentiveGeneratedContent) => {
    // Apply the generated content to the form
    if (generatedContent.title) {
      handleInputChange('title', generatedContent.title.replace(/^[🎯⚡🚀🎁💫]\s*/u, '')); // Remove emoji prefixes for form field
    }

    if (generatedContent.longDescription) {
      handleInputChange('description', generatedContent.longDescription);
    }

    if (generatedContent.rulesText) {
      handleInputChange('rules', generatedContent.rulesText);
    }

    // Show success feedback
    setAutoSaveStatus('saved');
    setTimeout(() => setAutoSaveStatus('idle'), 2000);
  };

  // Prepare data for AI generation
  const prepareAIData = () => {
    const selectedAudience = audiences.find(a => a.id === Number(formData.audienceId));
    const selectedTone = tones.find(t => t.id === Number(formData.toneId));
    const selectedCategory = categories.find(c => c.id === Number(formData.categoryId));

    return {
      title: formData.title,
      description: formData.description || undefined,
      rules: formData.rules || undefined,
      startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      endDate: formData.endDate ? new Date(formData.endDate) : new Date(),
      audience: selectedAudience ? { name: selectedAudience.name } : undefined,
      tone: selectedTone ? { name: selectedTone.name } : undefined,
      category: selectedCategory ? { name: selectedCategory.name } : undefined,
    };
  };

  if (isLoadingData) {
    return (
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {incentive ? 'Edit Incentive' : 'Create New Incentive'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the details below to create your incentive worksheet
              </p>
            </div>

            {/* Draft Status Indicator */}
            {incentive && (
              <div className="flex flex-col items-end space-y-2">
                {/* Auto-save Status */}
                <div className="flex items-center space-x-2">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm text-blue-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-600">Saved</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-red-600">Save failed</span>
                    </>
                  )}
                  {hasUnsavedChanges && autoSaveStatus === 'idle' && (
                    <>
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-yellow-600">Unsaved changes</span>
                    </>
                  )}
                </div>

                {/* Last Saved Time */}
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}

                {/* Auto-save Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Auto-save:</span>
                  <button
                    type="button"
                    onClick={() => setIsAutoSaveEnabled(!isAutoSaveEnabled)}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                      isAutoSaveEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        isAutoSaveEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Basic Information Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Incentive Title */}
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Incentive Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter a compelling title for your incentive"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Provide an overview of this incentive and what it offers..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: This can be enhanced with AI-generated content later
                </p>
              </div>

              {/* Rules */}
              <div className="sm:col-span-2">
                <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
                  Rules & Conditions
                </label>
                <textarea
                  id="rules"
                  rows={4}
                  value={formData.rules}
                  onChange={(e) => handleInputChange('rules', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Define the terms and conditions for this incentive..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: Specify eligibility criteria, restrictions, and how to claim
                </p>
              </div>
            </div>
          </div>

          {/* Timing Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Timing</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.startDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  End Date *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.endDate ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Content Attributes Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Content Attributes</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Audience */}
              <div>
                <label htmlFor="audienceId" className="block text-sm font-medium text-gray-700">
                  Target Audience
                </label>
                <select
                  id="audienceId"
                  value={formData.audienceId}
                  onChange={(e) => handleInputChange('audienceId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select audience...</option>
                  {audiences.map((audience) => (
                    <option key={audience.id} value={audience.id}>
                      {audience.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label htmlFor="toneId" className="block text-sm font-medium text-gray-700">
                  Tone
                </label>
                <select
                  id="toneId"
                  value={formData.toneId}
                  onChange={(e) => handleInputChange('toneId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select tone...</option>
                  {tones.map((tone) => (
                    <option key={tone.id} value={tone.id}>
                      {tone.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* AI Content Generation Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Content Generation
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">One-Step AI Content Generation</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Generate compelling promotional content including titles, descriptions, social media copy, and email marketing content in a single step
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleOpenAIGenerator}
                    disabled={!formData.title.trim() || isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate AI Content
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {!formData.title.trim()
                    ? 'Add a title and dates to enable AI content generation'
                    : 'Generate multiple content types including enhanced titles, descriptions, rules, and marketing copy'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                incentive ? 'Update Incentive' : 'Save Draft'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Content Generator Modal */}
      <IncentiveAIContentGenerator
        isOpen={showAIGenerator}
        onClose={handleCloseAIGenerator}
        onApplyContent={handleApplyAIContent}
        incentiveData={prepareAIData()}
        isSubmitting={isSubmitting}
      />
    </form>
  );
};