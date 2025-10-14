import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/Button';
import { TopicInput } from './TopicInput';
import type { TopicInputValue } from './TopicInput';
import { TopicLibraryModal } from './TopicLibraryModal';
import { TopicEditModal } from './TopicEditModal';
import { TopicSuggestion } from '../../../services/session-builder.service';

interface TopicInputRepeaterProps {
  topics: TopicInputValue[];
  onChange: (topics: TopicInputValue[]) => void;
  category?: string;
  mode?: 'guided' | 'classic';
}

export const TopicInputRepeater = ({
  topics,
  onChange,
  category,
  mode = 'guided',
}: TopicInputRepeaterProps) => {
  const isClassic = mode === 'classic';
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);

  // Log when topics prop changes
  React.useEffect(() => {
    console.log('[TopicInputRepeater] Received topics prop:', topics);
    console.log('[TopicInputRepeater] Topic count:', topics.length);
  }, [topics]);

  const parseBulletList = (value?: string | null): string[] =>
    (value || '')
      .split('\n')
      .map((item) => item.replace(/^•\s*/, '').trim())
      .filter(Boolean);

  const toBulletString = (items: string[]): string =>
    items.length ? items.map((item) => `• ${item}`).join('\n') : '';

  const addTopic = () => {
    onChange([...topics, {
      title: '',
      durationMinutes: 15,
      description: undefined,
      trainerNotes: '',
      learningOutcomes: '',
      materialsNeeded: '',
      deliveryGuidance: '',
      callToAction: '',
      topicId: undefined,
    }]);
  };

  const updateTopic = (index: number, updatedTopic: TopicInputValue) => {
    const newTopics = [...topics];
    newTopics[index] = updatedTopic;
    onChange(newTopics);
  };

  const removeTopic = (index: number) => {
    const newTopics = topics.filter((_, i) => i !== index);
    onChange(newTopics);
  };

  const upsertFromLibrary = (libraryTopic: TopicSuggestion) => {
    const normalizedName = libraryTopic.name.trim().toLowerCase();
    const existingIndex = topics.findIndex(
      topic => topic.title.trim().toLowerCase() === normalizedName,
    );

    const duration = Math.max(5, Math.round((libraryTopic.defaultDurationMinutes ?? 30) / 5) * 5);

    const trainerTasksList = parseBulletList(libraryTopic.trainerNotes);
    const materialsList = parseBulletList(libraryTopic.materialsNeeded);

    const topicData: TopicInputValue = {
      title: libraryTopic.name,
      description: libraryTopic.description || undefined,
      durationMinutes: duration,
      learningOutcomes: libraryTopic.learningOutcomes || '',
      trainerNotes: trainerTasksList.length
        ? toBulletString(trainerTasksList)
        : (libraryTopic.trainerNotes || ''),
      materialsNeeded: materialsList.length
        ? toBulletString(materialsList)
        : (libraryTopic.materialsNeeded || ''),
      deliveryGuidance: libraryTopic.deliveryGuidance || '',
      callToAction: libraryTopic.aiGeneratedContent?.enhancedContent?.callToAction || '',
      topicId: libraryTopic.id,
    };

    if (existingIndex >= 0) {
      const updated = [...topics];
      updated[existingIndex] = topicData;
      onChange(updated);
    } else {
      onChange([...topics, topicData]);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(topics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  const handleEditTopic = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveTopic = (updatedTopic: TopicInputValue) => {
    if (editingIndex !== null) {
      updateTopic(editingIndex, updatedTopic);
      setEditingIndex(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="space-y-4">
      {topics.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
          </svg>
          Drag topics to reorder them
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="topics-list">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-4 transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50/50 rounded-lg p-2' : ''
              }`}
            >
              {topics.map((topic, index) => (
                <Draggable
                  key={index}
                  draggableId={`topic-${index}`}
                  index={index}
                >
                  {(providedDraggable, snapshotDraggable) => (
                    <div
                      ref={providedDraggable.innerRef}
                      {...providedDraggable.draggableProps}
                      className={`flex items-start gap-3 transition-all ${
                        snapshotDraggable.isDragging ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Drag Handle and Number Badge */}
                      <div className="flex flex-col items-center gap-2 pt-4">
                        <div
                          {...providedDraggable.dragHandleProps}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 cursor-grab active:cursor-grabbing transition-colors"
                          title="Drag to reorder"
                        >
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM7 8a1 1 0 000 2h6a1 1 0 100-2H7zM7 14a1 1 0 100 2h6a1 1 0 100-2H7z" />
                          </svg>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {index + 1}
                        </div>
                      </div>

                      {/* Topic Input */}
                      <div className="flex-1">
                        <TopicInput
                          value={topic}
                          onChange={(updated) => updateTopic(index, updated)}
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeTopic(index)}
                        className="mt-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove topic"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex flex-wrap gap-2">
        {isClassic ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                console.log('🔘 Add from Library button clicked');
                setIsLibraryOpen(true);
              }}
            >
              Add from Library
            </Button>
            <Button
              type="button"
              onClick={addTopic}
              variant="outline"
              size="sm"
            >
              Create New Topic
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              onClick={addTopic}
              variant="outline"
              size="sm"
            >
              Add Topic
            </Button>
            <Button
              type="button"
              onClick={() => {
                console.log('🔘 Add from Library button clicked');
                setIsLibraryOpen(true);
              }}
              variant="ghost"
              size="sm"
            >
              Add from Library
            </Button>
          </>
        )}
      </div>
      <TopicLibraryModal
        open={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelect={upsertFromLibrary}
        category={category}
      />
    </div>
  );
};
