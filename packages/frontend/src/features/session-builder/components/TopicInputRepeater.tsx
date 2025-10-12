import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { TopicInput } from './TopicInput';
import type { TopicInputValue } from './TopicInput';
import { TopicLibraryModal } from './TopicLibraryModal';
import { TopicSuggestion } from '../../../services/session-builder.service';

interface TopicInputRepeaterProps {
  topics: TopicInputValue[];
  onChange: (topics: TopicInputValue[]) => void;
  category?: string;
}

export const TopicInputRepeater = ({ topics, onChange, category }: TopicInputRepeaterProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);

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

  return (
    <div className="space-y-4">
      {topics.map((topic, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className="flex-1">
            <TopicInput
              value={topic}
              onChange={(updated) => updateTopic(index, updated)}
            />
          </div>
          <button
            type="button"
            onClick={() => removeTopic(index)}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
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
