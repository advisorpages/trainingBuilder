import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, Trainer, Location, Audience, Tone, Category, Topic } from '../../../../shared/src/types';
import { CreateSessionRequest, UpdateSessionRequest, sessionService } from '../../services/session.service';
import { trainerService } from '../../services/trainer.service';
import { locationService } from '../../services/location.service';
import { attributesService } from '../../services/attributes.service';
import { useDraftRecovery } from '../../hooks/useDraftRecovery';
import { DraftRecoveryModal } from './DraftRecoveryModal';
import { AIPromptGenerator } from './AIPromptGenerator';

interface SessionFormProps {
  session?: Session;
  onSubmit: (data: CreateSessionRequest | UpdateSessionRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({
  session,
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    title: session?.title || '',
    description: session?.description || '',
    startTime: session?.startTime ? new Date(session.startTime).toISOString().slice(0, 16) : '',
    endTime: session?.endTime ? new Date(session.endTime).toISOString().slice(0, 16) : '',
    locationId: session?.locationId || '',
    trainerId: session?.trainerId || '',
    audienceId: session?.audienceId || '',
    toneId: session?.toneId || '',
    categoryId: session?.categoryId || '',
    topicIds: session?.topics?.map(t => t.id.toString()) || [] as string[],
    maxRegistrations: session?.maxRegistrations || 50,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading states for dropdown data
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tones, setTones] = useState<Tone[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Auto-save and draft management state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

  // Refs for auto-save functionality
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<any>(null);

  // Draft recovery functionality
  const {
    hasRecoverableDraft,
    saveDraftLocally,
    clearLocalDraft,
    recoverDraft,
    getDraftAge
  } = useDraftRecovery(session?.id);

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  // AI prompt generation state
  const [showAIPromptGenerator, setShowAIPromptGenerator] = useState(false);
  const [currentAIPrompt, setCurrentAIPrompt] = useState<string>('');
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('');

  useEffect(() => {
    const loadFormData = async () => {
      try {
        setIsLoadingData(true);

        // Load all dropdown data in parallel
        const [
          trainersResponse,
          locationsResponse,
          audiencesResponse,
          tonesResponse,
          categoriesResponse,
          topicsResponse
        ] = await Promise.all([
          trainerService.getActiveTrainers(),
          locationService.getActiveLocations(),
          attributesService.getAudiences(),
          attributesService.getTones(),
          attributesService.getCategories(),
          attributesService.getTopics()
        ]);

        setTrainers(trainersResponse);
        setLocations(locationsResponse);
        setAudiences(audiencesResponse);
        setTones(tonesResponse);
        setCategories(categoriesResponse);
        setTopics(topicsResponse);
      } catch (error) {
        console.error('Failed to load form data:', error);
        // Keep loading false to show form even if data fails to load
      } finally {
        setIsLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  // Check for recoverable draft when form loads
  useEffect(() => {
    if (hasRecoverableDraft && !session) {
      setShowRecoveryModal(true);
    }
  }, [hasRecoverableDraft, session]);

  // Set initial form data for comparison and initialize AI prompt
  useEffect(() => {
    initialFormDataRef.current = { ...formData };

    // Initialize AI prompt if it exists
    if (session?.aiPrompt) {
      setCurrentAIPrompt(session.aiPrompt);
    }
  }, [session]);

  // Save form data locally on changes (for crash recovery)
  useEffect(() => {
    if (!session && Object.keys(formData).some(key => {
      const value = formData[key as keyof typeof formData];
      return value !== '' && value !== null && value !== undefined;
    })) {
      const saveTimeout = setTimeout(() => {
        saveDraftLocally(formData);
      }, 1000);

      return () => clearTimeout(saveTimeout);
    }
  }, [formData, session, saveDraftLocally]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!session?.id || !isAutoSaveEnabled || !hasUnsavedChanges) {
      return;
    }

    try {
      setAutoSaveStatus('saving');

      const submissionData = {
        title: formData.title.trim() || undefined,
        description: formData.description.trim() || undefined,
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
        locationId: formData.locationId ? Number(formData.locationId) : undefined,
        trainerId: formData.trainerId ? Number(formData.trainerId) : undefined,
        audienceId: formData.audienceId ? Number(formData.audienceId) : undefined,
        toneId: formData.toneId ? Number(formData.toneId) : undefined,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        topicIds: formData.topicIds.length > 0 ? formData.topicIds.map((id: string) => Number(id)) : undefined,
        maxRegistrations: formData.maxRegistrations,
      };

      const result = await sessionService.autoSaveDraft(session.id, submissionData);

      if (result.success) {
        setAutoSaveStatus('saved');
        setLastSaved(new Date(result.lastSaved));
        setHasUnsavedChanges(false);
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [session?.id, formData, isAutoSaveEnabled, hasUnsavedChanges]);

  // Debounced auto-save trigger
  useEffect(() => {
    if (!session?.id) return;

    // Check if form data has changed
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
    setHasUnsavedChanges(hasChanges);

    if (hasChanges && isAutoSaveEnabled) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save (3 seconds after user stops typing)
      autoSaveTimeoutRef.current = setTimeout(() => {
        performAutoSave();
      }, 3000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, performAutoSave, session?.id, isAutoSaveEnabled]);

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
      newErrors.title = 'Session title is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (formData.maxRegistrations < 1) {
      newErrors.maxRegistrations = 'Maximum registrations must be at least 1';
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
      startTime: new Date(formData.startTime),
      endTime: new Date(formData.endTime),
      locationId: formData.locationId ? Number(formData.locationId) : undefined,
      trainerId: formData.trainerId ? Number(formData.trainerId) : undefined,
      audienceId: formData.audienceId ? Number(formData.audienceId) : undefined,
      toneId: formData.toneId ? Number(formData.toneId) : undefined,
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      topicIds: formData.topicIds.length > 0 ? formData.topicIds.map((id: string) => Number(id)) : undefined,
      maxRegistrations: formData.maxRegistrations,
    };

    // Clear local draft on successful submission
    clearLocalDraft();

    // Reset unsaved changes flag
    setHasUnsavedChanges(false);
    onSubmit(submissionData);
  };

  // Draft recovery handlers
  const handleRecoverDraft = () => {
    const recoveredData = recoverDraft();
    if (recoveredData) {
      setFormData(recoveredData);
      setShowRecoveryModal(false);
    }
  };

  const handleDiscardDraft = () => {
    clearLocalDraft();
    setShowRecoveryModal(false);
  };

  // AI prompt handlers
  const handleOpenAIPromptGenerator = () => {
    setShowAIPromptGenerator(true);
  };

  const handlePromptGenerated = (prompt: string, templateId: string) => {
    setCurrentAIPrompt(prompt);
    setSelectedPromptTemplate(templateId);

    // Save the prompt to the session
    handleInputChange('aiPrompt', prompt);
  };

  const handleCloseAIPromptGenerator = () => {
    setShowAIPromptGenerator(false);
  };

  const handleClearPrompt = () => {
    setCurrentAIPrompt('');
    setSelectedPromptTemplate('');
    handleInputChange('aiPrompt', '');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTopicChange = (topicId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      topicIds: checked
        ? [...prev.topicIds, topicId]
        : prev.topicIds.filter((id: string) => id !== topicId)
    }));
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
                {session ? 'Edit Session' : 'Create New Session'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill in the details below to create your training session worksheet
              </p>
            </div>

            {/* Draft Status Indicator */}
            {session && (
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
              {/* Session Title */}
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Session Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.title ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter a compelling title for your training session"
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
                  placeholder="Provide an overview of what this session will cover..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: This can be enhanced with AI-generated content later
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Scheduling</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {/* Start Time */}
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time *
                </label>
                <input
                  type="datetime-local"
                  id="startTime"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.startTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time *
                </label>
                <input
                  type="datetime-local"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.endTime ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
                )}
              </div>

              {/* Max Registrations */}
              <div>
                <label htmlFor="maxRegistrations" className="block text-sm font-medium text-gray-700">
                  Max Registrations
                </label>
                <input
                  type="number"
                  id="maxRegistrations"
                  min="1"
                  value={formData.maxRegistrations}
                  onChange={(e) => handleInputChange('maxRegistrations', parseInt(e.target.value) || 0)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                    errors.maxRegistrations ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                {errors.maxRegistrations && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxRegistrations}</p>
                )}
              </div>
            </div>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Resources</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Location */}
              <div>
                <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <select
                  id="locationId"
                  value={formData.locationId}
                  onChange={(e) => handleInputChange('locationId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a location...</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.address}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {locations.length === 0 ? 'Loading locations...' : 'Choose from available training locations'}
                </p>
              </div>

              {/* Trainer */}
              <div>
                <label htmlFor="trainerId" className="block text-sm font-medium text-gray-700">
                  Trainer
                </label>
                <select
                  id="trainerId"
                  value={formData.trainerId}
                  onChange={(e) => handleInputChange('trainerId', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a trainer...</option>
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName} - {trainer.expertise}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {trainers.length === 0 ? 'Loading trainers...' : 'Choose from available trainers'}
                </p>
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

          {/* Topics Section */}
          {topics.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Topics</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topics.map((topic) => (
                  <label key={topic.id} className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={formData.topicIds.includes(topic.id.toString())}
                        onChange={(e) => handleTopicChange(topic.id.toString(), e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <span className="text-gray-700">{topic.name}</span>
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Select relevant topics to help with AI content generation
              </p>
            </div>
          )}

          {/* AI Content Generation Section */}
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
              <span className="mr-2">🤖</span>
              AI Content Generation
            </h3>

            {currentAIPrompt ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Generated AI Prompt</h4>
                      <div className="text-sm text-blue-800 bg-white rounded border p-3 max-h-32 overflow-y-auto font-mono">
                        {currentAIPrompt.length > 200
                          ? `${currentAIPrompt.substring(0, 200)}...`
                          : currentAIPrompt}
                      </div>
                      {selectedPromptTemplate && (
                        <p className="mt-2 text-xs text-blue-600">
                          Template: {selectedPromptTemplate.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        type="button"
                        onClick={handleOpenAIPromptGenerator}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit Prompt
                      </button>
                      <button
                        type="button"
                        onClick={handleClearPrompt}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Clear Prompt
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Ready for AI Generation</h3>
                      <div className="mt-1 text-sm text-yellow-700">
                        <p>Your AI prompt is ready! You can now proceed to the next step to generate marketing copy, trainer guides, or session content using this prompt.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Generate AI Prompt</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Create an AI prompt based on your session details to generate compelling content
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleOpenAIPromptGenerator}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate AI Prompt
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Fill in the session details above for better AI prompt generation
                  </p>
                </div>
              </div>
            )}
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
                session ? 'Update Session' : 'Save Draft'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        isOpen={showRecoveryModal}
        draftAge={getDraftAge()}
        onRecover={handleRecoverDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* AI Prompt Generator Modal */}
      {showAIPromptGenerator && (
        <AIPromptGenerator
          session={session}
          sessionData={formData}
          onPromptGenerated={handlePromptGenerated}
          onClose={handleCloseAIPromptGenerator}
        />
      )}
    </form>
  );
};