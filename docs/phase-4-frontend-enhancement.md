# Phase 4: Frontend Enhancement - Session Builder

## 🎯 **PHASE SCOPE**
Add advanced editing capabilities, topic CRUD integration, session creation workflow, and complete the session builder with full functionality including past topic selection and outline customization.

## ⚠️ **PREREQUISITES**
- ✅ Phase 1, 2 & 3 completed successfully
- ✅ Session builder basic workflow is functional
- ✅ Session outline generation is working
- ✅ Frontend components are rendering properly

## ⚠️ **DO NOT TOUCH - EXISTING FILES**
- Any existing session management components
- `packages/frontend/src/services/session.service.ts` (ONLY ADD new methods)
- Existing topic management pages
- Current session creation workflow (keep as alternative)

## 📁 **FILES TO MODIFY/CREATE**

### 1. Enhanced Session Builder Service
**File**: `packages/frontend/src/services/session-builder.service.ts`
**Action**: ADD these methods to existing SessionBuilderService class

```typescript
// ADD these interfaces to existing file
export interface CreateSessionFromOutlineRequest {
  outline: SessionOutline;
  input: SessionBuilderInput;
  customizations?: {
    modifiedSections?: string[];
    addedTopics?: number[];
    removedSections?: string[];
  };
}

export interface TopicSuggestion {
  id: number;
  name: string;
  description: string;
  category: string;
  isUsed: boolean;
  lastUsedDate?: string;
}

// ADD these methods to existing SessionBuilderService class
async createSessionFromOutline(request: CreateSessionFromOutlineRequest): Promise<any> {
  try {
    // Transform outline into session creation format
    const sessionData = this.transformOutlineToSession(request.outline, request.input);

    // Mark as builder-generated
    sessionData.builderGenerated = true;
    sessionData.sessionOutlineData = request.outline;

    // Add customization metadata
    if (request.customizations) {
      sessionData.builderCustomizations = request.customizations;
    }

    const response = await api.post('/sessions', sessionData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create session from outline');
  }
}

async getPastTopics(categoryId?: string, limit: number = 20): Promise<TopicSuggestion[]> {
  try {
    const params = new URLSearchParams();
    if (categoryId) params.append('category', categoryId);
    params.append('limit', limit.toString());
    params.append('includeUsage', 'true');

    const response = await api.get(`/topics?${params.toString()}`);

    return response.data.topics.map((topic: any) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description || '',
      category: topic.category?.name || 'Unknown',
      isUsed: topic.sessions && topic.sessions.length > 0,
      lastUsedDate: topic.sessions?.[0]?.createdAt
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load past topics');
  }
}

async getTopicDetails(topicId: number): Promise<any> {
  try {
    const response = await api.get(`/topics/${topicId}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load topic details');
  }
}

async saveOutlineDraft(outlineId: string, outline: SessionOutline, input: SessionBuilderInput): Promise<void> {
  try {
    // Save to localStorage for now, could be enhanced to save to backend
    const draftData = {
      outlineId,
      outline,
      input,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(`sessionBuilder_draft_${outlineId}`, JSON.stringify(draftData));
  } catch (error) {
    console.warn('Failed to save outline draft:', error);
  }
}

async loadOutlineDraft(outlineId: string): Promise<{ outline: SessionOutline; input: SessionBuilderInput } | null> {
  try {
    const draftData = localStorage.getItem(`sessionBuilder_draft_${outlineId}`);
    if (draftData) {
      const parsed = JSON.parse(draftData);
      return {
        outline: parsed.outline,
        input: parsed.input
      };
    }
    return null;
  } catch (error) {
    console.warn('Failed to load outline draft:', error);
    return null;
  }
}

private transformOutlineToSession(outline: SessionOutline, input: SessionBuilderInput): any {
  // Create session data structure that matches existing CreateSessionDto
  return {
    title: outline.suggestedSessionTitle,
    description: outline.suggestedDescription,
    startTime: input.startTime,
    endTime: input.endTime,
    locationId: input.locationId,
    audienceId: input.audienceId,
    toneId: input.toneId,
    categoryId: this.findCategoryIdByName(input.category), // Helper method needed
    maxRegistrations: 25, // Default value, could be made configurable

    // AI-related fields
    aiPrompt: this.generatePromptFromInput(input),
    aiGeneratedContent: {
      outline,
      generatedAt: new Date().toISOString(),
      source: 'session-builder',
      version: 1
    },

    // Topic associations - will be handled separately if needed
    topicIds: [], // Can be populated from outline if topics are selected
  };
}

private generatePromptFromInput(input: SessionBuilderInput): string {
  return `Generate content for a ${input.sessionType} session about ${input.category}.
    Desired outcome: ${input.desiredOutcome}
    ${input.currentProblem ? `Problem to address: ${input.currentProblem}` : ''}
    ${input.specificTopics ? `Specific topics: ${input.specificTopics}` : ''}`;
}

private findCategoryIdByName(categoryName: string): number | undefined {
  // This would need to be implemented based on your category data structure
  // For now, return undefined and handle in backend
  return undefined;
}
```

### 2. Session Outline Editor Component
**File**: `packages/frontend/src/components/session-builder/SessionOutlineEditor.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { SessionOutline, TopicSuggestion, sessionBuilderService } from '../../services/session-builder.service';

interface SessionOutlineEditorProps {
  outline: SessionOutline;
  onOutlineChange: (outline: SessionOutline) => void;
  onSave: () => void;
  onCancel: () => void;
  categoryName?: string;
}

export const SessionOutlineEditor: React.FC<SessionOutlineEditorProps> = ({
  outline,
  onOutlineChange,
  onSave,
  onCancel,
  categoryName
}) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [pastTopics, setPastTopics] = useState<TopicSuggestion[]>([]);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [selectedTopicForSection, setSelectedTopicForSection] = useState<string | null>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);

  useEffect(() => {
    loadPastTopics();
  }, [categoryName]);

  const loadPastTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const topics = await sessionBuilderService.getPastTopics(categoryName, 50);
      setPastTopics(topics);
    } catch (error) {
      console.error('Failed to load past topics:', error);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  const handleSectionEdit = (sectionKey: string, field: string, value: any) => {
    const updatedOutline = { ...outline };

    if (sectionKey.includes('.')) {
      // Handle nested properties
      const [section, subfield] = sectionKey.split('.');
      (updatedOutline as any)[section] = {
        ...(updatedOutline as any)[section],
        [subfield]: value
      };
    } else {
      (updatedOutline as any)[sectionKey][field] = value;
    }

    onOutlineChange(updatedOutline);
  };

  const handleArrayEdit = (sectionKey: string, field: string, index: number, value: string) => {
    const updatedOutline = { ...outline };
    const section = (updatedOutline as any)[sectionKey];

    if (section[field] && Array.isArray(section[field])) {
      section[field][index] = value;
      onOutlineChange(updatedOutline);
    }
  };

  const addArrayItem = (sectionKey: string, field: string) => {
    const updatedOutline = { ...outline };
    const section = (updatedOutline as any)[sectionKey];

    if (section[field] && Array.isArray(section[field])) {
      section[field].push('');
      onOutlineChange(updatedOutline);
    }
  };

  const removeArrayItem = (sectionKey: string, field: string, index: number) => {
    const updatedOutline = { ...outline };
    const section = (updatedOutline as any)[sectionKey];

    if (section[field] && Array.isArray(section[field])) {
      section[field].splice(index, 1);
      onOutlineChange(updatedOutline);
    }
  };

  const handleTopicSelection = (topic: TopicSuggestion) => {
    if (selectedTopicForSection) {
      handleSectionEdit(selectedTopicForSection, 'title', topic.name);
      handleSectionEdit(selectedTopicForSection, 'description', topic.description);

      setShowTopicSelector(false);
      setSelectedTopicForSection(null);
    }
  };

  const openTopicSelector = (sectionKey: string) => {
    setSelectedTopicForSection(sectionKey);
    setShowTopicSelector(true);
  };

  const EditableSection: React.FC<{
    sectionKey: string;
    section: any;
    title: string;
    icon: string;
  }> = ({ sectionKey, section, title, icon }) => {
    const isEditing = editingSection === sectionKey;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">{icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{sessionBuilderService.formatDuration(section.duration)}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {sectionKey.includes('topic') && (
              <button
                onClick={() => openTopicSelector(sectionKey)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Use Past Topic
              </button>
            )}
            <button
              onClick={() => setEditingSection(isEditing ? null : sectionKey)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleSectionEdit(sectionKey, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <input
                type="number"
                value={section.duration}
                onChange={(e) => handleSectionEdit(sectionKey, 'duration', parseInt(e.target.value) || 0)}
                min="5"
                max="180"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={section.description}
                onChange={(e) => handleSectionEdit(sectionKey, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Learning Objectives (for topic sections) */}
            {section.learningObjectives && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                {section.learningObjectives.map((objective: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleArrayEdit(sectionKey, 'learningObjectives', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Learning objective..."
                    />
                    <button
                      onClick={() => removeArrayItem(sectionKey, 'learningObjectives', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem(sectionKey, 'learningObjectives')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Learning Objective
                </button>
              </div>
            )}

            {/* Exercise Description (for topic2) */}
            {section.exerciseDescription && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Description</label>
                <textarea
                  value={section.exerciseDescription}
                  onChange={(e) => handleSectionEdit(sectionKey, 'exerciseDescription', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Suggestions (for inspirational content) */}
            {section.suggestions && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content Suggestions</label>
                {section.suggestions.map((suggestion: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={suggestion}
                      onChange={(e) => handleArrayEdit(sectionKey, 'suggestions', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Content suggestion..."
                    />
                    <button
                      onClick={() => removeArrayItem(sectionKey, 'suggestions', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem(sectionKey, 'suggestions')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Suggestion
                </button>
              </div>
            )}

            {/* Key Takeaways (for closing) */}
            {section.keyTakeaways && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Takeaways</label>
                {section.keyTakeaways.map((takeaway: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={takeaway}
                      onChange={(e) => handleArrayEdit(sectionKey, 'keyTakeaways', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Key takeaway..."
                    />
                    <button
                      onClick={() => removeArrayItem(sectionKey, 'keyTakeaways', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem(sectionKey, 'keyTakeaways')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Takeaway
                </button>
              </div>
            )}

            {/* Action Items (for closing) */}
            {section.actionItems && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Action Items</label>
                {section.actionItems.map((action: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={action}
                      onChange={(e) => handleArrayEdit(sectionKey, 'actionItems', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Action item..."
                    />
                    <button
                      onClick={() => removeArrayItem(sectionKey, 'actionItems', index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem(sectionKey, 'actionItems')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Action Item
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-700">{section.description}</p>

            {section.learningObjectives && section.learningObjectives.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Learning Objectives:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.learningObjectives.map((objective: string, index: number) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}

            {section.exerciseDescription && (
              <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                <h4 className="font-medium text-purple-900 mb-1">Interactive Exercise:</h4>
                <p className="text-purple-800 text-sm">{section.exerciseDescription}</p>
              </div>
            )}

            {section.suggestions && section.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Content Suggestions:</h4>
                <ul className="space-y-1">
                  {section.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {section.keyTakeaways && section.keyTakeaways.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Takeaways:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.keyTakeaways.map((takeaway: string, index: number) => (
                    <li key={index}>{takeaway}</li>
                  ))}
                </ul>
              </div>
            )}

            {section.actionItems && section.actionItems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Action Items:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {section.actionItems.map((action: string, index: number) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customize Your Session Outline</h2>
        <div className="text-sm text-gray-500">
          Total Duration: {sessionBuilderService.formatDuration(outline.totalDuration)}
        </div>
      </div>

      {/* Session Header Editing */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Title</label>
            <input
              type="text"
              value={outline.suggestedSessionTitle}
              onChange={(e) => handleSectionEdit('suggestedSessionTitle', '', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Description</label>
            <textarea
              value={outline.suggestedDescription}
              onChange={(e) => handleSectionEdit('suggestedDescription', '', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <EditableSection
          sectionKey="opener"
          section={outline.opener}
          title={outline.opener.title}
          icon="🎯"
        />

        <EditableSection
          sectionKey="topic1"
          section={outline.topic1}
          title={outline.topic1.title}
          icon="📚"
        />

        <EditableSection
          sectionKey="topic2"
          section={outline.topic2}
          title={outline.topic2.title}
          icon="🎮"
        />

        <EditableSection
          sectionKey="inspirationalContent"
          section={outline.inspirationalContent}
          title={outline.inspirationalContent.title}
          icon="🎥"
        />

        <EditableSection
          sectionKey="closing"
          section={outline.closing}
          title={outline.closing.title}
          icon="✨"
        />
      </div>

      {/* Topic Selector Modal */}
      {showTopicSelector && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select a Past Topic</h3>
              <button
                onClick={() => setShowTopicSelector(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingTopics ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading topics...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastTopics.map(topic => (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicSelection(topic)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{topic.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Category: {topic.category}</span>
                          {topic.isUsed && <span>✓ Previously used</span>}
                          {topic.lastUsedDate && (
                            <span>Last used: {new Date(topic.lastUsedDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {pastTopics.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No past topics found for this category.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Cancel Changes
        </button>

        <button
          onClick={onSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
```

### 3. Update Main Session Builder Page
**File**: `packages/frontend/src/pages/SessionBuilderPage.tsx`
**Action**: REPLACE the existing handleEditOutline and handleApproveOutline methods

```typescript
// REPLACE these existing methods in SessionBuilderPage.tsx

const handleEditOutline = () => {
  setCurrentStep('edit');
  // Remove the notification about editing functionality - it's now available
};

const handleApproveOutline = async () => {
  if (!sessionOutline || !sessionInput) return;

  setIsLoading(true);
  try {
    const sessionData = await sessionBuilderService.createSessionFromOutline({
      outline: sessionOutline,
      input: sessionInput as SessionBuilderInput
    });

    showNotification('success', 'Session created successfully!');

    // Navigate to the created session
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/sessions/${sessionData.id}`, {
        state: {
          fromBuilder: true,
          justCreated: true
        }
      });
    }, 1500);
  } catch (error: any) {
    showNotification('error', error.message || 'Failed to create session');
    setIsLoading(false);
  }
};

// ADD this new method for handling outline editing
const handleOutlineChange = (updatedOutline: SessionOutline) => {
  setSessionOutline(updatedOutline);

  // Auto-save draft
  if (updatedOutline && sessionInput) {
    sessionBuilderService.saveOutlineDraft(
      `outline_${Date.now()}`,
      updatedOutline,
      sessionInput as SessionBuilderInput
    );
  }
};

const handleSaveOutlineChanges = () => {
  setCurrentStep('outline');
  showNotification('success', 'Outline customizations saved!');
};

const handleCancelOutlineChanges = () => {
  setCurrentStep('outline');
};

// UPDATE the edit step content in the render method
{currentStep === 'edit' && sessionOutline && (
  <SessionOutlineEditor
    outline={sessionOutline}
    onOutlineChange={handleOutlineChange}
    onSave={handleSaveOutlineChanges}
    onCancel={handleCancelOutlineChanges}
    categoryName={sessionInput.category}
  />
)}
```

### 4. Enhanced Session Creation Integration
**File**: `packages/frontend/src/services/session.service.ts`
**Action**: ADD these methods to existing SessionService class

```typescript
// ADD these methods to existing SessionService class (don't modify existing methods)

async createSessionFromBuilder(sessionData: any): Promise<any> {
  try {
    // Ensure we mark this as builder-generated
    const builderSessionData = {
      ...sessionData,
      builderGenerated: true,
      sessionOutlineData: sessionData.sessionOutlineData
    };

    const response = await api.post('/sessions', builderSessionData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create session from builder');
  }
}

async getSessionWithOutline(sessionId: string): Promise<any> {
  try {
    const response = await api.get(`/sessions/${sessionId}?includeOutline=true`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to load session with outline');
  }
}

// Helper method to check if session was created with builder
isBuilderGenerated(session: any): boolean {
  return session.builderGenerated === true || !!session.sessionOutlineData;
}

// Get the original outline data if available
getSessionOutlineData(session: any): any | null {
  return session.sessionOutlineData || null;
}
```

### 5. Update Navigation for Better UX
**File**: Update your main navigation to include the session builder link
**Action**: ADD enhanced navigation link

```typescript
// In your main navigation component, enhance the session builder link
{(user?.role?.name === UserRole.CONTENT_DEVELOPER || user?.role?.name === UserRole.BROKER) && (
  <div className="relative">
    <Link
      to="/sessions/builder"
      className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
    >
      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-3.847-3.21l-.548-.547z" />
      </svg>
      AI Session Builder
      <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
        New
      </span>
    </Link>
  </div>
)}
```

### 6. Add Session Builder Badge to Created Sessions
**File**: Update your session list/card components to show builder badge
**Action**: ADD builder indicator

```typescript
// In your session list/card component, add this indicator
{sessionService.isBuilderGenerated(session) && (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
    <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a9 9 0 117.072 0l-.548.547A3.374 3.374 0 0014.846 21H9.154a3.374 3.374 0 00-3.847-3.21l-.548-.547z" />
    </svg>
    AI Generated
  </span>
)}
```

## ✅ **TESTING PHASE 4**

### 1. Build Test
```bash
cd packages/frontend
npm run build
```

### 2. Full Workflow Test
- Complete session input form
- Generate session outline
- Edit session outline (all sections)
- Use past topic selection
- Save customizations
- Create final session
- Verify session appears in session list with builder badge

### 3. Topic Integration Test
- Test past topic loading by category
- Verify topic selection updates outline sections
- Test topic details loading

### 4. Draft Saving Test
- Make outline changes
- Verify auto-save functionality
- Test draft recovery (if implemented)

### 5. Session Creation Test
- Verify session is created with correct data
- Check that builder metadata is saved
- Test navigation to created session

## 🎯 **SUCCESS CRITERIA**

- ✅ Complete session builder workflow functions end-to-end
- ✅ Outline editing works for all sections and arrays
- ✅ Past topic selection integrates properly
- ✅ Session creation from outline works correctly
- ✅ Builder-generated sessions are properly marked
- ✅ Draft auto-saving functions (localStorage)
- ✅ All form validations and error handling work
- ✅ Mobile responsiveness maintained
- ✅ Performance is acceptable with larger topic lists
- ✅ Integration with existing session management is seamless

## 📌 **NEXT PHASE DEPENDENCIES**

Phase 5 will add the final polish features: training kit generation, marketing kit generation, analytics integration, and advanced UX enhancements.

## 🚨 **IMPORTANT NOTES**

- Test thoroughly with different session types and categories
- Verify that existing session workflows remain unaffected
- Check that all TypeScript types are properly defined
- Ensure error boundaries are in place for robustness
- Test with both RAG available and unavailable scenarios
- Verify responsive design on mobile devices
- Check accessibility features (keyboard navigation, screen readers)
- Performance test with large numbers of past topics