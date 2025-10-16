import React, { useState, useEffect } from 'react';
import { SessionBuilderInput, sessionBuilderService } from '../../services/session-builder.service';
import { attributesService } from '../../services/attributes.service';
import { locationService } from '../../services/location.service';

interface SessionBuilderInputStepProps {
  input: Partial<SessionBuilderInput>;
  onInputChange: (input: Partial<SessionBuilderInput>) => void;
  onNext: () => void;
  isLoading?: boolean;
}

export const SessionBuilderInputStep: React.FC<SessionBuilderInputStepProps> = ({
  input,
  onInputChange,
  onNext,
  isLoading = false
}) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasInitializedDefaults = React.useRef(false);

  useEffect(() => {
    loadAttributes();
  }, []);

  // After attributes load, prefill missing fields with convenient defaults
  // Only run once when attributes are loaded to prevent infinite loops
  useEffect(() => {
    // Skip if we've already initialized defaults or attributes aren't loaded yet
    if (hasInitializedDefaults.current || categories.length === 0) {
      return;
    }

    const updates: Partial<SessionBuilderInput> = {};

    if (!input.category && categories.length > 0) {
      updates.category = categories[0].name;
      updates.categoryId = categories[0].id;
    }
    if (!input.locationId && locations.length > 0) {
      updates.locationId = locations[0].id;
    }
    if (!input.audienceId && audiences.length > 0) {
      updates.audienceId = audiences[0].id;
    }

    // Ensure date/time exist (in case parent didn't set)
    const pad = (n: number) => n.toString().padStart(2, '0');
    const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const toLocalDT = (d: Date) => `${toLocalDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    if (!input.date) {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0);
      updates.date = toLocalDate(now);
    }
    if (!input.startTime || !input.endTime) {
      const start = new Date();
      start.setHours(start.getHours() + 1, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      updates.startTime = input.startTime || toLocalDT(start);
      updates.endTime = input.endTime || toLocalDT(end);
    }

    if (Object.keys(updates).length > 0) {
      hasInitializedDefaults.current = true;
      onInputChange({ ...input, ...updates });
    }
  }, [categories, locations, audiences, input, onInputChange]);

  const loadAttributes = async () => {
    try {
      const [categoriesData, locationsData, audiencesData] = await Promise.all([
        attributesService.getCategories(),
        locationService.getActiveLocations(),
        attributesService.getAudiences()
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setAudiences(audiencesData);
    } catch (error) {
      console.error('Failed to load attributes:', error);
    }
  };

  const handleInputChange = (field: keyof SessionBuilderInput, value: any) => {
    onInputChange({ ...input, [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (!input.category) newErrors.category = 'Category is required';
    if (!input.sessionType) newErrors.sessionType = 'Session type is required';
    if (!input.desiredOutcome) newErrors.desiredOutcome = 'Desired outcome is required';
    if (!input.date) newErrors.date = 'Date is required';
    if (!input.startTime) newErrors.startTime = 'Start time is required';
    if (!input.endTime) newErrors.endTime = 'End time is required';

    // Validate time logic
    if (input.startTime && input.endTime) {
      const start = new Date(input.startTime);
      const end = new Date(input.endTime);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }

      const duration = (end.getTime() - start.getTime()) / (1000 * 60);
      if (duration < 30) {
        newErrors.endTime = 'Session must be at least 30 minutes long';
      }
      if (duration > 480) {
        newErrors.endTime = 'Session cannot exceed 8 hours';
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Details</h2>
        <p className="text-gray-600">
          Provide the basic information about your training session. This will help our AI generate a tailored session outline.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Category *
          </label>
          <select
            value={input.categoryId || ''}
            onChange={(e) => {
              const selectedId = e.target.value ? parseInt(e.target.value) : undefined;
              const selectedCategory = categories.find(c => c.id === selectedId);
              if (selectedCategory) {
                onInputChange({
                  ...input,
                  categoryId: selectedCategory.id,
                  category: selectedCategory.name
                });
                // Clear error when user selects
                if (errors.category) {
                  setErrors(prev => ({ ...prev, category: '' }));
                }
              } else {
                onInputChange({
                  ...input,
                  categoryId: undefined,
                  category: ''
                });
              }
            }}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        {/* Session Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Type *
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['event', 'training', 'workshop', 'webinar'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleInputChange('sessionType', type)}
                className={`px-4 py-2 border rounded-md text-sm font-medium capitalize transition-colors ${
                  input.sessionType === type
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {errors.sessionType && <p className="mt-1 text-sm text-red-600">{errors.sessionType}</p>}
        </div>

        {/* Desired Outcome */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What do you want people to do after the session is done? *
          </label>
          <textarea
            value={input.desiredOutcome || ''}
            onChange={(e) => handleInputChange('desiredOutcome', e.target.value)}
            placeholder="e.g., Apply new sales techniques to increase client engagement by 25%"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.desiredOutcome ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.desiredOutcome && <p className="mt-1 text-sm text-red-600">{errors.desiredOutcome}</p>}
        </div>

        {/* Current Problem (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Is there a current problem you want to fix in this session?
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <textarea
            value={input.currentProblem || ''}
            onChange={(e) => handleInputChange('currentProblem', e.target.value)}
            placeholder="e.g., Team members are struggling with client objection handling"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Specific Topics (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Are there specific topics you want covered in this training?
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <textarea
            value={input.specificTopics || ''}
            onChange={(e) => handleInputChange('specificTopics', e.target.value)}
            placeholder="e.g., Prospecting techniques, follow-up strategies, closing methods"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Date *
          </label>
          <input
            type="date"
            value={input.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <select
            value={input.locationId || ''}
            onChange={(e) => handleInputChange('locationId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a location</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time *
          </label>
          <input
            type="datetime-local"
            value={input.startTime || ''}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.startTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time *
          </label>
          <input
            type="datetime-local"
            value={input.endTime || ''}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.endTime ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
        </div>

        {/* Audience (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <select
            value={input.audienceId || ''}
            onChange={(e) => handleInputChange('audienceId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select audience</option>
            {audiences.map(audience => (
              <option key={audience.id} value={audience.id}>
                {audience.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Duration Display */}
      {input.startTime && input.endTime && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Session Duration:</span> {sessionBuilderService.formatDuration(
                  sessionBuilderService.calculateSessionDuration(input.startTime, input.endTime)
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={validateAndProceed}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating Outline...
            </div>
          ) : (
            'Generate Session Outline'
          )}
        </button>
      </div>
    </div>
  );
};
