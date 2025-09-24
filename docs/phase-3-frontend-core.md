# Phase 3: Frontend Core - Session Builder

## 🎯 **PHASE SCOPE**
Create the core frontend components for the session builder wizard. This includes the main page, input form, and basic session outline display functionality.

## ⚠️ **PREREQUISITES**
- ✅ Phase 1 & 2 must be completed successfully
- ✅ Backend API endpoints are working (`/sessions/builder/suggest-outline`)
- ✅ RAG integration is functional (with graceful fallback)
- ✅ Session outline generation is working

## ⚠️ **DO NOT TOUCH - EXISTING FILES**
- `packages/frontend/src/pages/SessionWorksheetPage.tsx`
- `packages/frontend/src/components/sessions/SessionForm.tsx`
- `packages/frontend/src/services/session.service.ts` (ONLY ADD new methods)
- Any existing session management pages/components
- Router configuration (ONLY ADD new routes)

## 📁 **FILES TO CREATE**

### 1. Session Builder Service
**File**: `packages/frontend/src/services/session-builder.service.ts`

```typescript
import { api } from './api.service';

export interface SessionBuilderInput {
  category: string;
  sessionType: 'event' | 'training' | 'workshop' | 'webinar';
  desiredOutcome: string;
  currentProblem?: string;
  specificTopics?: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId?: number;
  audienceId?: number;
  toneId?: number;
}

export interface SessionOutlineSection {
  title: string;
  duration: number;
  description: string;
}

export interface TopicSection extends SessionOutlineSection {
  learningObjectives: string[];
  suggestedActivities?: string[];
  materialsNeeded?: string[];
}

export interface ExerciseTopicSection extends TopicSection {
  exerciseDescription: string;
  engagementType: string;
}

export interface InspirationSection {
  title: string;
  duration: number;
  type: string;
  suggestions: string[];
  description?: string;
}

export interface ClosingSection extends SessionOutlineSection {
  keyTakeaways: string[];
  actionItems: string[];
  nextSteps?: string[];
}

export interface SessionOutline {
  opener: SessionOutlineSection;
  topic1: TopicSection;
  topic2: ExerciseTopicSection;
  inspirationalContent: InspirationSection;
  closing: ClosingSection;
  totalDuration: number;
  suggestedSessionTitle: string;
  suggestedDescription: string;
  difficulty: string;
  recommendedAudienceSize: string;
  ragSuggestions?: any;
  fallbackUsed: boolean;
  generatedAt: string;
}

export interface SessionOutlineResponse {
  outline: SessionOutline;
  relevantTopics: any[];
  ragAvailable: boolean;
  ragSuggestions?: any;
  generationMetadata: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
}

class SessionBuilderService {
  async generateSessionOutline(input: SessionBuilderInput): Promise<SessionOutlineResponse> {
    try {
      const response = await api.post('/sessions/builder/suggest-outline', input);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to generate session outline');
    }
  }

  async getSuggestionsForCategory(category: string): Promise<{ topics: any[], ragAvailable: boolean }> {
    try {
      const response = await api.get(`/sessions/builder/suggestions/${category}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to get category suggestions');
    }
  }

  async testRAGConnection(): Promise<{ available: boolean, response?: any }> {
    try {
      const response = await api.post('/sessions/builder/test-rag');
      return response.data;
    } catch (error: any) {
      return { available: false, response: { error: error.message } };
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
  }

  calculateSessionDuration(startTime: string, endTime: string): number {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  }
}

export const sessionBuilderService = new SessionBuilderService();
```

### 2. Session Builder Input Step Component
**File**: `packages/frontend/src/components/session-builder/SessionBuilderInputStep.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { SessionBuilderInput } from '../../services/session-builder.service';
import { attributesService } from '../../services/attributes.service';

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
  const [tones, setTones] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadAttributes();
  }, []);

  const loadAttributes = async () => {
    try {
      const [categoriesData, locationsData, audiencesData, tonesData] = await Promise.all([
        attributesService.getCategories(),
        attributesService.getLocations(),
        attributesService.getAudiences(),
        attributesService.getTones()
      ]);

      setCategories(categoriesData);
      setLocations(locationsData);
      setAudiences(audiencesData);
      setTones(tonesData);
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
            value={input.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.name}>
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

        {/* Tone (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Session Tone
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <select
            value={input.toneId || ''}
            onChange={(e) => handleInputChange('toneId', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select tone</option>
            {tones.map(tone => (
              <option key={tone.id} value={tone.id}>
                {tone.name}
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
```

### 3. Session Outline Display Component
**File**: `packages/frontend/src/components/session-builder/SessionOutlineDisplay.tsx`

```typescript
import React from 'react';
import { SessionOutline, sessionBuilderService } from '../../services/session-builder.service';

interface SessionOutlineDisplayProps {
  outline: SessionOutline;
  generationMetadata?: {
    processingTime: number;
    ragQueried: boolean;
    fallbackUsed: boolean;
    topicsFound: number;
  };
  onEdit: () => void;
  onApprove: () => void;
  onRegenerate: () => void;
  isProcessing?: boolean;
}

export const SessionOutlineDisplay: React.FC<SessionOutlineDisplayProps> = ({
  outline,
  generationMetadata,
  onEdit,
  onApprove,
  onRegenerate,
  isProcessing = false
}) => {
  const formatDuration = (minutes: number) => sessionBuilderService.formatDuration(minutes);

  const SectionCard: React.FC<{
    title: string;
    duration: number;
    children: React.ReactNode;
    icon: React.ReactNode;
  }> = ({ title, duration, children, icon }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{formatDuration(duration)}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {outline.suggestedSessionTitle}
            </h2>
            <p className="text-gray-700 mb-4">{outline.suggestedDescription}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <strong>Total:</strong> {formatDuration(outline.totalDuration)}
              </span>
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Level:</strong> {outline.difficulty.charAt(0).toUpperCase() + outline.difficulty.slice(1)}
              </span>
              <span className="flex items-center">
                <svg className="h-4 w-4 text-gray-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                <strong>Size:</strong> {outline.recommendedAudienceSize}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Metadata */}
      {generationMetadata && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Generated in {generationMetadata.processingTime}ms</span>
              <span>•</span>
              <span>{generationMetadata.topicsFound} relevant topics found</span>
              {generationMetadata.ragQueried && (
                <>
                  <span>•</span>
                  <span className="text-green-600">✓ AI-enhanced with knowledge base</span>
                </>
              )}
              {generationMetadata.fallbackUsed && (
                <>
                  <span>•</span>
                  <span className="text-amber-600">⚠ Limited content sources available</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session Outline Sections */}
      <div className="space-y-4">
        {/* Opener */}
        <SectionCard
          title={outline.opener.title}
          duration={outline.opener.duration}
          icon={
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">🎯</span>
            </div>
          }
        >
          <p className="text-gray-700">{outline.opener.description}</p>
        </SectionCard>

        {/* Topic 1 */}
        <SectionCard
          title={outline.topic1.title}
          duration={outline.topic1.duration}
          icon={
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">📚</span>
            </div>
          }
        >
          <p className="text-gray-700 mb-4">{outline.topic1.description}</p>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {outline.topic1.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
            {outline.topic1.suggestedActivities && outline.topic1.suggestedActivities.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Suggested Activities:</h4>
                <div className="flex flex-wrap gap-2">
                  {outline.topic1.suggestedActivities.map((activity, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Topic 2 (Exercise) */}
        <SectionCard
          title={outline.topic2.title}
          duration={outline.topic2.duration}
          icon={
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">🎮</span>
            </div>
          }
        >
          <p className="text-gray-700 mb-4">{outline.topic2.description}</p>
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
              <h4 className="font-medium text-purple-900 mb-2">Interactive Exercise:</h4>
              <p className="text-purple-800 text-sm">{outline.topic2.exerciseDescription}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded">
                {outline.topic2.engagementType.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {outline.topic2.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* Inspirational Content */}
        <SectionCard
          title={outline.inspirationalContent.title}
          duration={outline.inspirationalContent.duration}
          icon={
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-sm">🎥</span>
            </div>
          }
        >
          <p className="text-gray-700 mb-4">{outline.inspirationalContent.description}</p>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Content Suggestions:</h4>
            <ul className="space-y-2">
              {outline.inspirationalContent.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></span>
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* Closing */}
        <SectionCard
          title={outline.closing.title}
          duration={outline.closing.duration}
          icon={
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">✨</span>
            </div>
          }
        >
          <p className="text-gray-700 mb-4">{outline.closing.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Takeaways:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {outline.closing.keyTakeaways.map((takeaway, index) => (
                  <li key={index}>{takeaway}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Action Items:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {outline.closing.actionItems.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onRegenerate}
          disabled={isProcessing}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Regenerate Outline
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onEdit}
            disabled={isProcessing}
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Customize Outline
          </button>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Creating Session...' : 'Approve & Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 4. Main Session Builder Page
**File**: `packages/frontend/src/pages/SessionBuilderPage.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { SessionBuilderInputStep } from '../components/session-builder/SessionBuilderInputStep';
import { SessionOutlineDisplay } from '../components/session-builder/SessionOutlineDisplay';
import { sessionBuilderService, SessionBuilderInput, SessionOutline, SessionOutlineResponse } from '../services/session-builder.service';

type WizardStep = 'input' | 'outline' | 'edit';

export const SessionBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<WizardStep>('input');
  const [sessionInput, setSessionInput] = useState<Partial<SessionBuilderInput>>({});
  const [sessionOutline, setSessionOutline] = useState<SessionOutline | null>(null);
  const [outlineResponse, setOutlineResponse] = useState<SessionOutlineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Check access permissions
  const canCreateSessions = user?.role?.name === UserRole.CONTENT_DEVELOPER || user?.role?.name === UserRole.BROKER;

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputComplete = async () => {
    setIsLoading(true);
    try {
      const response = await sessionBuilderService.generateSessionOutline(sessionInput as SessionBuilderInput);
      setOutlineResponse(response);
      setSessionOutline(response.outline);
      setCurrentStep('outline');

      if (response.generationMetadata.fallbackUsed) {
        showNotification('info', 'Generated using database content. For enhanced suggestions, check your knowledge base connection.');
      } else if (response.ragAvailable) {
        showNotification('success', 'Session outline generated with AI-enhanced content from your knowledge base!');
      } else {
        showNotification('success', 'Session outline generated successfully!');
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to generate session outline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditOutline = () => {
    setCurrentStep('edit');
    showNotification('info', 'Editing functionality will be available in the next update.');
  };

  const handleRegenerateOutline = async () => {
    setIsLoading(true);
    try {
      const response = await sessionBuilderService.generateSessionOutline(sessionInput as SessionBuilderInput);
      setOutlineResponse(response);
      setSessionOutline(response.outline);
      showNotification('success', 'Session outline regenerated successfully!');
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to regenerate session outline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveOutline = async () => {
    setIsLoading(true);
    try {
      // For now, just show success and navigate
      // In Phase 4, this will create the actual session
      showNotification('success', 'Session outline approved! Proceeding to session creation...');

      // Simulate processing time
      setTimeout(() => {
        setIsLoading(false);
        navigate('/sessions/worksheet', {
          state: {
            fromBuilder: true,
            outline: sessionOutline,
            input: sessionInput
          }
        });
      }, 2000);
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to create session');
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'input', label: 'Session Details', completed: currentStep !== 'input' },
      { key: 'outline', label: 'Review Outline', completed: false },
      { key: 'edit', label: 'Customize', completed: false }
    ];

    return (
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.key} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                <div className="flex items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.completed || currentStep === step.key
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-300 bg-white text-gray-500'
                  }`}>
                    {step.completed ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{stepIdx + 1}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    step.completed || currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div className="absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-300" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    );
  };

  if (!canCreateSessions) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
                <p className="mt-1 text-sm text-yellow-700">
                  You need Content Developer or Broker permissions to use the Session Builder.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Session Builder</h1>
              <p className="mt-1 text-sm text-gray-500">
                Create comprehensive training sessions with AI-powered content suggestions
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="flex mt-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-500">Session Builder</span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-md border ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {notification.type === 'success' && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'error' && (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{notification.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Main Content */}
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {currentStep === 'input' && (
              <SessionBuilderInputStep
                input={sessionInput}
                onInputChange={setSessionInput}
                onNext={handleInputComplete}
                isLoading={isLoading}
              />
            )}

            {currentStep === 'outline' && sessionOutline && (
              <SessionOutlineDisplay
                outline={sessionOutline}
                generationMetadata={outlineResponse?.generationMetadata}
                onEdit={handleEditOutline}
                onApprove={handleApproveOutline}
                onRegenerate={handleRegenerateOutline}
                isProcessing={isLoading}
              />
            )}

            {currentStep === 'edit' && (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Customization Coming Soon</h3>
                <p className="text-gray-600 mb-4">
                  Advanced editing features will be available in the next update.
                </p>
                <button
                  onClick={() => setCurrentStep('outline')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Back to Outline
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 5. Add Route to App Router
**File**: `packages/frontend/src/App.tsx`
**Action**: ADD this route (keep all existing routes)

```typescript
// ADD this import
import { SessionBuilderPage } from './pages/SessionBuilderPage';

// ADD this route in your Routes component (keep all existing routes)
<Route path="/sessions/builder" element={<SessionBuilderPage />} />
```

### 6. Add Navigation Link
**File**: Update your navigation component to include a link to the session builder
**Action**: ADD navigation link (location depends on your nav structure)

```typescript
// Add this link in your navigation menu for Content Developers and Brokers
<Link
  to="/sessions/builder"
  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
>
  AI Session Builder
</Link>
```

## ✅ **TESTING PHASE 3**

### 1. Build Test
```bash
cd packages/frontend
npm run build
```

### 2. Component Test
- Navigate to `/sessions/builder`
- Fill out the input form
- Verify form validation works
- Test session outline generation

### 3. Integration Test
- Test with valid backend API
- Verify error handling when backend is down
- Test RAG connection status display

### 4. UI/UX Test
- Test responsive design on mobile
- Verify step navigation works
- Test notification system

## 🎯 **SUCCESS CRITERIA**

- ✅ Session builder page loads without errors
- ✅ Input form validates properly
- ✅ API calls to backend work correctly
- ✅ Session outline displays formatted content
- ✅ Navigation between steps functions
- ✅ Error handling shows appropriate messages
- ✅ Responsive design works on mobile
- ✅ Components are properly typed with TypeScript
- ✅ Loading states provide good UX

## 📌 **NEXT PHASE DEPENDENCIES**

Phase 4 will add advanced editing capabilities, topic management integration, and complete the session creation workflow.

## 🚨 **IMPORTANT NOTES**

- All new components are completely separate from existing session management
- Use existing services (attributesService) for dropdown data
- Maintain consistent styling with existing pages
- Ensure proper TypeScript typing throughout
- Test all error conditions and edge cases
- Verify mobile responsiveness
- Check accessibility features (ARIA labels, keyboard navigation)