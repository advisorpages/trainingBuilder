import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { TopicInput } from './TopicInput';
import { TopicLibraryModal } from './TopicLibraryModal';
import { TopicSuggestion } from '../../../services/session-builder.service';

interface Topic {
  title: string;
  description?: string;
  durationMinutes: number;
}

interface TopicInputRepeaterProps {
  topics: Topic[];
  onChange: (topics: Topic[]) => void;
  category?: string;
}

export const TopicInputRepeater = ({ topics, onChange, category }: TopicInputRepeaterProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);

  const addTopic = () => {
    onChange([...topics, {
      title: '',
      durationMinutes: 15,
      description: undefined
    }]);
  };

  const updateTopic = (index: number, updatedTopic: Topic) => {
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

    const descriptionParts = [
      libraryTopic.description,
      libraryTopic.learningOutcomes,
      libraryTopic.trainerNotes,
    ].filter(Boolean);

    const combinedDescription = descriptionParts.join('\n\n');
    const duration = Math.max(5, Math.round((libraryTopic.defaultDurationMinutes ?? 30) / 5) * 5);

    const topicData: Topic = {
      title: libraryTopic.name,
      description: combinedDescription || undefined,
      durationMinutes: duration,
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
