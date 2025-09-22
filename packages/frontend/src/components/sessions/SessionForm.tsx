import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session, Trainer, Location, Audience, Tone, Category, Topic } from '../../../../shared/src/types';
import { CreateSessionRequest, UpdateSessionRequest, sessionService } from '../../services/session.service';
import { trainerService } from '../../services/trainer.service';
import { locationService } from '../../services/location.service';
import { attributesService } from '../../services/attributes.service';
import { topicService } from '../../services/topic.service';
import { useDraftRecovery } from '../../hooks/useDraftRecovery';
import { DraftRecoveryModal } from './DraftRecoveryModal';
import { AIContentSection } from './AIContentSection';
import { EnhancedTopicSelection } from './EnhancedTopicSelection';
import { SessionTopicDetail } from './EnhancedTopicCard';

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
  // Toronto timezone helper functions
  const getTorontoTime = (date?: Date): Date => {
    const targetDate = date || new Date();
    // Toronto is in America/Toronto timezone (EST/EDT)
    return new Date(targetDate.toLocaleString("en-US", {timeZone: "America/Toronto"}));
  };

  const formatDateForInput = (date: Date): string => {
    // Format for datetime-local input in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getDefaultStartTime = (): string => {
    if (session?.startTime) {
      return new Date(session.startTime).toISOString().slice(0, 16);
    }
    // Default to today at 7:00 PM Toronto time
    const today = getTorontoTime();
    today.setHours(19, 0, 0, 0); // 7:00 PM
    return formatDateForInput(today);
  };

  const getDefaultEndTime = (): string => {
    if (session?.endTime) {
      return new Date(session.endTime).toISOString().slice(0, 16);
    }
    // Default to today at 8:30 PM Toronto time
    const today = getTorontoTime();
    today.setHours(20, 30, 0, 0); // 8:30 PM
    return formatDateForInput(today);
  };

  const [formData, setFormData] = useState({
    title: session?.title || '',
    description: session?.description || '',
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
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
  const [sessionTopicDetails, setSessionTopicDetails] = useState<SessionTopicDetail[]>([]);

  // Auto-save and draft management state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(true);

  // Refs for auto-save functionality
  const autoSaveTimeoutRef = useRef<number | null>(null);
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

  // AI content section state
  const [isAIContentExpanded, setIsAIContentExpanded] = useState(false);

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
          topicService.getActiveTopics()
        ]);

        setTrainers(trainersResponse);
        setLocations(locationsResponse);
        setAudiences(audiencesResponse);
        setTones(tonesResponse);
        setCategories(categoriesResponse);
        setTopics(topicsResponse);

        // Debug logging for topics
        console.log('Topics loaded:', topicsResponse);
        console.log('Topics count:', topicsResponse.length);
      } catch (error) {
        console.error('Failed to load form data:', error);
        console.error('Error details:', error.response?.data || error.message);
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

  // Set initial form data for comparison
  useEffect(() => {
    initialFormDataRef.current = { ...formData };
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
      autoSaveTimeoutRef.current = window.setTimeout(() => {
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

  // Date validation helper functions
  const isValidDate = (date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  const parseDateTime = (dateTimeString: string): Date | null => {
    if (!dateTimeString || dateTimeString.trim() === '') {
      return null;
    }

    try {
      // For datetime-local inputs, ensure we have the right format
      // Expected format: YYYY-MM-DDTHH:mm
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateTimeString)) {
        console.warn('Invalid datetime-local format:', dateTimeString);
        return null;
      }

      const date = new Date(dateTimeString);
      return isValidDate(date) ? date : null;
    } catch (error) {
      console.error('Error parsing datetime:', error, dateTimeString);
      return null;
    }
  };

  const validateDateTimeRange = (startTimeStr: string, endTimeStr: string): string | null => {
    // If either is empty, we handle that in the main validation
    if (!startTimeStr || !endTimeStr) {
      return null;
    }

    const startDate = parseDateTime(startTimeStr);
    const endDate = parseDateTime(endTimeStr);

    // Check for invalid date formats
    if (startTimeStr && !startDate) {
      return 'Start time has an invalid format';
    }

    if (endTimeStr && !endDate) {
      return 'End time has an invalid format';
    }

    // Both dates are valid, check the logical relationship
    if (startDate && endDate) {
      if (startDate >= endDate) {
        return 'End time must be after start time';
      }

      // Optional: Check if dates are reasonable (not too far in the past)
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (startDate < oneMonthAgo) {
        return 'Start time seems too far in the past';
      }
    }

    return null;
  };

  const validateForm = (isDraft = false) => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Session title is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    } else {
      // Validate start time format
      const startDate = parseDateTime(formData.startTime);
      if (!startDate) {
        newErrors.startTime = 'Start time has an invalid format';
      }
    }

    // Only require endTime for final submissions (when not saving as draft)
    if (!isDraft && !formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.endTime) {
      // Validate end time format
      const endDate = parseDateTime(formData.endTime);
      if (!endDate) {
        newErrors.endTime = 'End time has an invalid format';
      }
    }

    // Validate date range relationship
    const dateRangeError = validateDateTimeRange(formData.startTime, formData.endTime);
    if (dateRangeError) {
      newErrors.endTime = dateRangeError;
    }

    if (formData.maxRegistrations < 1) {
      newErrors.maxRegistrations = 'Maximum registrations must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine if this is a draft save (new session) or final submission (existing session)
    const isDraft = !session?.id;

    if (!validateForm(isDraft)) {
      return;
    }

    // Clear auto-save timeout when manually submitting
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const submissionData = {
      title: formData.title.trim(),
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

  // AI content handlers
  const handleToggleAIContent = () => {
    setIsAIContentExpanded(!isAIContentExpanded);
  };

  const handleAIContentGenerated = (content: any) => {
    // Apply AI-generated content to form fields
    if (content.title) {
      handleInputChange('title', content.title);
    }
    if (content.description) {
      handleInputChange('description', content.description);
    }
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

  const handleSessionTopicDetailsChange = useCallback((details: SessionTopicDetail[]) => {
    setSessionTopicDetails(details);
    // Update form data with topic IDs in the correct order
    const orderedTopicIds = details
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
      .map(detail => detail.topicId.toString());

    setFormData(prev => ({
      ...prev,
      topicIds: orderedTopicIds
    }));
  }, []);

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
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                {!errors.startTime && (
                  <p className="mt-1 text-xs text-gray-500">Select the session start date and time</p>
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
                {!errors.endTime && (
                  <p className="mt-1 text-xs text-gray-500">
                    Select the session end date and time (must be after start time)
                  </p>
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

          {/* Enhanced Topics Section */}
          {topics.length > 0 ? (
            <EnhancedTopicSelection
              topics={topics}
              trainers={trainers}
              initialSelectedTopics={formData.topicIds.map(id => Number(id))}
              onSelectionChange={handleSessionTopicDetailsChange}
            />
          ) : isLoadingData ? (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Session Topics</h3>
              <div className="flex items-center space-x-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-sm">Loading topics...</span>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Session Topics</h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Topics Not Available</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Unable to load topic options. Please refresh the page or contact support if this persists.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* AI Content Enhancement Section */}
          <div>
            <AIContentSection
              sessionData={formData}
              audiences={audiences}
              tones={tones}
              categories={categories}
              topics={topics}
              isExpanded={isAIContentExpanded}
              onToggle={handleToggleAIContent}
              onContentGenerated={handleAIContentGenerated}
            />
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

    </form>
  );
};