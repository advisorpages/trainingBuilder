import React, { useState, useEffect } from 'react';
import { SessionOutline, TopicSuggestion, sessionBuilderService, FlexibleSessionSection, SectionType } from '../../services/session-builder.service';
import { getSectionTypeOptions, convertSection, addSectionLocal, removeSectionLocal, moveSectionLocal, duplicateSectionLocal } from '../../utils/sectionTypeRegistry';

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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [newSectionType, setNewSectionType] = useState<SectionType>('topic');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [trainers, setTrainers] = useState<{ id: number; name: string }[]>([]);

  // Helper to limit multi-line text to max N lines
  const limitLines = (value: string, max: number) => {
    if (typeof value !== 'string') return value;
    const lines = value.split(/\r?\n/).slice(0, max);
    return lines.join('\n');
  };

  useEffect(() => {
    loadPastTopics();
    // Load trainers once (basic list)
    (async () => {
      try {
        const list = await sessionBuilderService.getTrainers(undefined, 100);
        setTrainers(list);
      } catch (e) {
        console.error('Failed to load trainers:', e);
      }
    })();
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

  // ===== Flexible Outline Editing (new) =====
  const isFlexible = sessionBuilderService.isFlexibleOutline(outline);
  if (isFlexible) {
    const handleFlexibleSectionEdit = (sectionId: string, field: keyof FlexibleSessionSection, value: any) => {
      // Enforce 3-line limit for these fields everywhere
      if (field === 'learningOutcomes' || field === 'trainerNotes' || field === 'deliveryGuidance') {
        value = limitLines(String(value ?? ''), 3);
      }
      const updatedSections = outline.sections.map((s) =>
        s.id === sectionId ? { ...s, [field]: value, updatedAt: new Date().toISOString() } : s
      );
      onOutlineChange({
        ...outline,
        sections: updatedSections,
        totalDuration: sessionBuilderService.calculateTotalDuration(updatedSections),
      } as SessionOutline);
    };

    const handleFlexibleArrayEdit = (
      sectionId: string,
      field: keyof FlexibleSessionSection,
      index: number,
      value: string
    ) => {
      const section = outline.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const arr = Array.isArray((section as any)[field]) ? ([...(section as any)[field]] as string[]) : [];
      arr[index] = value;
      handleFlexibleSectionEdit(sectionId, field, arr);
    };

    const addFlexibleArrayItem = (sectionId: string, field: keyof FlexibleSessionSection) => {
      const section = outline.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const arr = Array.isArray((section as any)[field]) ? ([...(section as any)[field]] as string[]) : [];
      arr.push('');
      handleFlexibleSectionEdit(sectionId, field, arr);
    };

    const removeFlexibleArrayItem = (sectionId: string, field: keyof FlexibleSessionSection, index: number) => {
      const section = outline.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const arr = Array.isArray((section as any)[field]) ? ([...(section as any)[field]] as string[]) : [];
      arr.splice(index, 1);
      handleFlexibleSectionEdit(sectionId, field, arr);
    };

    const sortedSections = sessionBuilderService.sortSectionsByPosition(outline.sections);

    const addSection = () => {
      const updated = addSectionLocal(outline as any, newSectionType);
      onOutlineChange(updated as any);
    };

    const deleteSection = (id: string) => {
      const section = outline.sections.find(s => s.id === id);
      if (section?.type === 'opener' || section?.type === 'closing') {
        if (!confirm('This appears to be a required section. Delete anyway?')) return;
      }
      const updated = removeSectionLocal(outline as any, id);
      onOutlineChange(updated as any);
    };

    const duplicateSection = (id: string) => {
      const updated = duplicateSectionLocal(outline as any, id);
      onOutlineChange(updated as any);
    };

    const moveSection = (id: string, dir: 'up' | 'down') => {
      const updated = moveSectionLocal(outline as any, id, dir);
      onOutlineChange(updated as any);
    };

    const changeType = (id: string, type: SectionType) => {
      const updatedSections = outline.sections.map(s => s.id === id ? convertSection(s, type) : s);
      onOutlineChange({
        ...outline,
        sections: updatedSections,
        totalDuration: sessionBuilderService.calculateTotalDuration(updatedSections)
      } as any);
    };

    const validate = async () => {
      try {
        const res = await sessionBuilderService.validateOutline(outline as any);
        setValidationErrors(res.isValid ? [] : res.errors);
      } catch (e: any) {
        setValidationErrors([e.message || 'Validation failed']);
      }
    };

    const limitLines = (value: string, max: number) => {
      const lines = value.split(/\r?\n/).slice(0, max);
      return lines.join('\n');
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
                onChange={(e) => onOutlineChange({ ...outline, suggestedSessionTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Description</label>
              <textarea
                value={outline.suggestedDescription}
                onChange={(e) => onOutlineChange({ ...outline, suggestedDescription: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Add Section:</label>
            <select
              value={newSectionType}
              onChange={(e) => setNewSectionType(e.target.value as SectionType)}
              className="px-2 py-1 border border-gray-300 rounded-md"
            >
              {getSectionTypeOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
              ))}
            </select>
            <button onClick={addSection} className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={validate} className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">Validate Outline</button>
          </div>
        </div>

        {/* Validation */}
        {validationErrors.length > 0 && (
          <div className="mt-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md p-3">
            <div className="font-medium mb-1">Validation Issues</div>
            <ul className="list-disc list-inside">
              {validationErrors.map((e, i) => (<li key={i}>{e}</li>))}
            </ul>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-4">
          {sortedSections.map((section) => (
            <div
              key={section.id}
              className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${draggingId === section.id ? 'opacity-70' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!draggingId || draggingId === section.id) return;
                // Reorder: move draggingId to the index of this section
                const ids = sortedSections.map(s => s.id);
                const from = ids.indexOf(draggingId);
                const to = ids.indexOf(section.id);
                if (from === -1 || to === -1) return;
                const newOrder = [...ids];
                const [moved] = newOrder.splice(from, 1);
                newOrder.splice(to, 0, moved);
                const reordered = newOrder.map((id, idx) => {
                  const s = outline.sections.find(x => x.id === id)!;
                  return { ...s, position: idx + 1, updatedAt: new Date().toISOString() };
                });
                onOutlineChange({ ...outline, sections: reordered, totalDuration: sessionBuilderService.calculateTotalDuration(reordered) } as any);
                setDraggingId(null);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {section.type.charAt(0).toUpperCase() + section.type.slice(1)} #{section.position}
                  </h3>
                  <p className="text-sm text-gray-500">ID: {section.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Drag handle */}
                  <span
                    className="cursor-move px-2 py-1 border rounded text-sm select-none"
                    title="Drag to reorder"
                    draggable
                    onDragStart={() => setDraggingId(section.id)}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    ≡
                  </span>
                  {section.type === 'topic' && (
                    <button
                      onClick={() => openTopicSelector(section.id)}
                      className="px-2 py-1 border rounded text-sm"
                      title="Use Past Topic"
                    >
                      Use Past Topic
                    </button>
                  )}
                  <select
                    value={section.type}
                    onChange={(e) => changeType(section.id, e.target.value as SectionType)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                    title="Change type"
                  >
                    {getSectionTypeOptions().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                    ))}
                  </select>
                  <button onClick={() => moveSection(section.id, 'up')} className="px-2 py-1 border rounded text-sm" title="Move up">↑</button>
                  <button onClick={() => moveSection(section.id, 'down')} className="px-2 py-1 border rounded text-sm" title="Move down">↓</button>
                  <button onClick={() => duplicateSection(section.id)} className="px-2 py-1 border rounded text-sm" title="Duplicate">⎘</button>
                  <button onClick={() => deleteSection(section.id)} className="px-2 py-1 border rounded text-sm text-red-600" title="Delete">🗑</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={section.duration}
                    min={5}
                    max={480}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'duration', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={section.description}
                  onChange={(e) => handleFlexibleSectionEdit(section.id, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Optional fields shown if present */}
              {Array.isArray(section.learningObjectives) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                  {section.learningObjectives.map((objective, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={objective}
                        onChange={(e) => handleFlexibleArrayEdit(section.id, 'learningObjectives', idx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Learning objective..."
                      />
                      <button
                        onClick={() => removeFlexibleArrayItem(section.id, 'learningObjectives', idx)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addFlexibleArrayItem(section.id, 'learningObjectives')}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Learning Objective
                  </button>
                </div>
              )}

              {/* Topic-specific fields */}
              {section.type === 'topic' && (
                <>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Activities</label>
                    {Array.isArray(section.suggestedActivities) && section.suggestedActivities.length > 0 ? (
                      section.suggestedActivities.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleFlexibleArrayEdit(section.id, 'suggestedActivities', idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Activity..."
                          />
                          <button onClick={() => removeFlexibleArrayItem(section.id, 'suggestedActivities', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No activities yet.</p>
                    )}
                    <button onClick={() => addFlexibleArrayItem(section.id, 'suggestedActivities')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Activity</button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Materials Needed</label>
                    {Array.isArray(section.materialsNeeded) && section.materialsNeeded.length > 0 ? (
                      section.materialsNeeded.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleFlexibleArrayEdit(section.id, 'materialsNeeded', idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Material..."
                          />
                          <button onClick={() => removeFlexibleArrayItem(section.id, 'materialsNeeded', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No materials yet.</p>
                    )}
                    <button onClick={() => addFlexibleArrayItem(section.id, 'materialsNeeded')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Material</button>
                  </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
                  <textarea
                    value={section.learningOutcomes || ''}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'learningOutcomes', limitLines(e.target.value, 3))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 3 lines.</p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Notes</label>
                  <textarea
                    value={section.trainerNotes || ''}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'trainerNotes', limitLines(e.target.value, 3))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 3 lines.</p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Guidance</label>
                  <textarea
                    value={section.deliveryGuidance || ''}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'deliveryGuidance', limitLines(e.target.value, 3))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max 3 lines.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainer (Speaker)</label>
                  <select
                    value={section.trainerId || ''}
                    onChange={(e) => {
                      const id = e.target.value ? parseInt(e.target.value) : undefined;
                      const found = trainers.find(t => t.id === id);
                      handleFlexibleSectionEdit(section.id, 'trainerId', id || undefined);
                      handleFlexibleSectionEdit(section.id, 'trainerName', found?.name || '');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {trainers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Speaker Duration (min)</label>
                  <input
                    type="number"
                    min={0}
                    value={section.speakerDuration || 0}
                    onChange={(e) => handleFlexibleSectionEdit(section.id, 'speakerDuration', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
                  />
                </div>
              </div>
                </>
              )}

              {section.isExercise && (
                <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <h4 className="font-medium text-purple-900 mb-2">Exercise Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Type</label>
                      <select
                        value={section.exerciseType || ''}
                        onChange={(e) => handleFlexibleSectionEdit(section.id, 'exerciseType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select type...</option>
                        <option value="discussion">Discussion</option>
                        <option value="activity">Activity</option>
                        <option value="workshop">Workshop</option>
                        <option value="case-study">Case Study</option>
                        <option value="role-play">Role Play</option>
                        <option value="presentation">Presentation</option>
                        <option value="reflection">Reflection</option>
                        <option value="assessment">Assessment</option>
                        <option value="group-work">Group Work</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={section.exerciseInstructions || ''}
                      onChange={(e) => handleFlexibleSectionEdit(section.id, 'exerciseInstructions', e.target.value)}
                      rows={4}
                      placeholder="Step-by-step instructions for facilitating this exercise..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Discussion fields */}
              {section.type === 'discussion' && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-md">
                  <h4 className="font-medium text-indigo-900 mb-2">Discussion Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Type</label>
                      <select
                        value={section.engagementType || 'full-group'}
                        onChange={(e) => handleFlexibleSectionEdit(section.id, 'engagementType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="individual">Individual</option>
                        <option value="pairs">Pairs</option>
                        <option value="small-groups">Small Groups</option>
                        <option value="full-group">Full Group</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discussion Prompts</label>
                    {Array.isArray(section.discussionPrompts) && section.discussionPrompts.length > 0 ? (
                      section.discussionPrompts.map((p, idx) => (
                        <div key={idx} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={p}
                            onChange={(e) => handleFlexibleArrayEdit(section.id, 'discussionPrompts', idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Prompt..."
                          />
                          <button onClick={() => removeFlexibleArrayItem(section.id, 'discussionPrompts', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No prompts yet.</p>
                    )}
                    <button onClick={() => addFlexibleArrayItem(section.id, 'discussionPrompts')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Prompt</button>
                  </div>
                </div>
              )}

              {/* Inspiration / Video / Media fields */}
              {(section.type === 'inspiration' || section.type === 'video' || section.type === 'presentation') && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-medium text-yellow-900 mb-2">Media & Suggestions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(section.type === 'inspiration' || section.type === 'video') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspiration/Media Type</label>
                        <select
                          value={section.inspirationType || (section.type === 'video' ? 'video' : 'story')}
                          onChange={(e) => handleFlexibleSectionEdit(section.id, 'inspirationType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="video">Video</option>
                          <option value="story">Story</option>
                          <option value="quote">Quote</option>
                          <option value="case-study">Case Study</option>
                          <option value="audio">Audio</option>
                          <option value="image">Image</option>
                          <option value="external-link">External Link</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
                      <input
                        type="text"
                        value={section.mediaUrl || ''}
                        onChange={(e) => handleFlexibleSectionEdit(section.id, 'mediaUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Media Duration (min)</label>
                      <input
                        type="number"
                        min={0}
                        value={section.mediaDuration || 0}
                        onChange={(e) => handleFlexibleSectionEdit(section.id, 'mediaDuration', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suggestions</label>
                    {Array.isArray(section.suggestions) && section.suggestions.length > 0 ? (
                      section.suggestions.map((sug, idx) => (
                        <div key={idx} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={sug}
                            onChange={(e) => handleFlexibleArrayEdit(section.id, 'suggestions', idx, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Content suggestion..."
                          />
                          <button onClick={() => removeFlexibleArrayItem(section.id, 'suggestions', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No suggestions yet.</p>
                    )}
                    <button onClick={() => addFlexibleArrayItem(section.id, 'suggestions')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Suggestion</button>
                  </div>
                </div>
              )}

              {/* Closing fields */}
              {section.type === 'closing' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="font-medium text-red-900 mb-2">Wrap-up Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Key Takeaways</label>
                      {Array.isArray(section.keyTakeaways) && section.keyTakeaways.length > 0 ? (
                        section.keyTakeaways.map((t, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <input type="text" value={t} onChange={(e) => handleFlexibleArrayEdit(section.id, 'keyTakeaways', idx, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                            <button onClick={() => removeFlexibleArrayItem(section.id, 'keyTakeaways', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 mb-2">No takeaways yet.</p>
                      )}
                      <button onClick={() => addFlexibleArrayItem(section.id, 'keyTakeaways')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Takeaway</button>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action Items</label>
                      {Array.isArray(section.actionItems) && section.actionItems.length > 0 ? (
                        section.actionItems.map((a, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <input type="text" value={a} onChange={(e) => handleFlexibleArrayEdit(section.id, 'actionItems', idx, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                            <button onClick={() => removeFlexibleArrayItem(section.id, 'actionItems', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 mb-2">No action items yet.</p>
                      )}
                      <button onClick={() => addFlexibleArrayItem(section.id, 'actionItems')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Action Item</button>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Next Steps</label>
                      {Array.isArray(section.nextSteps) && section.nextSteps.length > 0 ? (
                        section.nextSteps.map((n, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <input type="text" value={n} onChange={(e) => handleFlexibleArrayEdit(section.id, 'nextSteps', idx, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                            <button onClick={() => removeFlexibleArrayItem(section.id, 'nextSteps', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 mb-2">No next steps yet.</p>
                      )}
                      <button onClick={() => addFlexibleArrayItem(section.id, 'nextSteps')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Next Step</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Assessment fields */}
              {section.type === 'assessment' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
                  <h4 className="font-medium text-orange-900 mb-2">Assessment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
                      <select
                        value={section.assessmentType || 'quiz'}
                        onChange={(e) => handleFlexibleSectionEdit(section.id, 'assessmentType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="quiz">Quiz</option>
                        <option value="reflection">Reflection</option>
                        <option value="peer-review">Peer Review</option>
                        <option value="self-assessment">Self Assessment</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Criteria</label>
                      {Array.isArray(section.assessmentCriteria) && section.assessmentCriteria.length > 0 ? (
                        section.assessmentCriteria.map((c, idx) => (
                          <div key={idx} className="flex items-center space-x-2 mb-2">
                            <input type="text" value={c} onChange={(e) => handleFlexibleArrayEdit(section.id, 'assessmentCriteria', idx, e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-md" />
                            <button onClick={() => removeFlexibleArrayItem(section.id, 'assessmentCriteria', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 mb-2">No criteria yet.</p>
                      )}
                      <button onClick={() => addFlexibleArrayItem(section.id, 'assessmentCriteria')} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Criterion</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

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
  }

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
      // Handle direct property updates (like suggestedSessionTitle)
      if (field === '') {
        (updatedOutline as any)[sectionKey] = value;
      } else {
        (updatedOutline as any)[sectionKey][field] = value;
      }
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
    if (!selectedTopicForSection) return;
    // Flexible mode: selectedTopicForSection is a section id; legacy mode: key path
    if (isFlexible) {
      handleFlexibleSectionEdit(selectedTopicForSection, 'title', topic.name);
      handleFlexibleSectionEdit(selectedTopicForSection, 'description', topic.description);
    } else {
      handleSectionEdit(selectedTopicForSection, 'title', topic.name);
      handleSectionEdit(selectedTopicForSection, 'description', topic.description);
    }
    setShowTopicSelector(false);
    setSelectedTopicForSection(null);
  };

  const openTopicSelector = (sectionKeyOrId: string) => {
    setSelectedTopicForSection(sectionKeyOrId);
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

            {/* Enhanced Exercise Fields */}
            {(section.isExercise || section.exerciseInstructions) && (
              <div className="space-y-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <h4 className="font-medium text-purple-900">Enhanced Exercise Properties</h4>

                {/* Exercise Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Type</label>
                  <select
                    value={section.exerciseType || ''}
                    onChange={(e) => handleSectionEdit(sectionKey, 'exerciseType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select type...</option>
                    <option value="discussion">Discussion</option>
                    <option value="activity">Activity</option>
                    <option value="workshop">Workshop</option>
                    <option value="case-study">Case Study</option>
                    <option value="role-play">Role Play</option>
                    <option value="presentation">Presentation</option>
                  </select>
                </div>

                {/* Exercise Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Instructions</label>
                  <textarea
                    value={section.exerciseInstructions || ''}
                    onChange={(e) => handleSectionEdit(sectionKey, 'exerciseInstructions', e.target.value)}
                    rows={6}
                    placeholder="Step-by-step instructions for facilitating this exercise..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                {/* Estimated Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    value={section.estimatedDuration || ''}
                    onChange={(e) => handleSectionEdit(sectionKey, 'estimatedDuration', parseInt(e.target.value) || 0)}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* AI-Enhanced Fields */}
            {(section.learningOutcomes || section.trainerNotes) && (
              <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-900">AI-Enhanced Content</h4>

                {/* Learning Outcomes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
                  <textarea
                    value={section.learningOutcomes || ''}
                    onChange={(e) => handleSectionEdit(sectionKey, 'learningOutcomes', e.target.value)}
                    rows={3}
                    placeholder="What participants will achieve from this topic..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Trainer Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trainer Notes</label>
                  <textarea
                    value={section.trainerNotes || ''}
                    onChange={(e) => handleSectionEdit(sectionKey, 'trainerNotes', e.target.value)}
                    rows={4}
                    placeholder="Key facilitation points and guidance for trainers..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
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
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-purple-900">Interactive Exercise:</h4>
                  {section.isExercise && (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      Enhanced
                    </span>
                  )}
                </div>
                <p className="text-purple-800 text-sm mb-2">{section.exerciseDescription}</p>

                {/* Enhanced exercise properties in preview */}
                {section.exerciseInstructions && (
                  <div className="mt-3 p-2 bg-white border border-purple-200 rounded">
                    <h5 className="font-medium text-purple-900 text-xs mb-1">Instructions:</h5>
                    <p className="text-purple-800 text-xs whitespace-pre-line">{section.exerciseInstructions}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  {section.exerciseType && (
                    <span className="inline-block px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded">
                      {section.exerciseType.replace('-', ' ').toUpperCase()}
                    </span>
                  )}
                  {section.estimatedDuration && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {section.estimatedDuration} min
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* AI-Enhanced preview sections */}
            {section.learningOutcomes && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <h4 className="font-medium text-green-900 mb-2">Learning Outcomes:</h4>
                <p className="text-green-800 text-sm whitespace-pre-line">{section.learningOutcomes}</p>
              </div>
            )}

            {section.trainerNotes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="font-medium text-yellow-900 mb-2">Trainer Notes:</h4>
                <p className="text-yellow-800 text-sm whitespace-pre-line">{section.trainerNotes}</p>
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
