import { Button } from '@/components/ui/Button';
import { TopicInput } from './TopicInput';
interface Topic {
  title: string;
  description?: string;
  durationMinutes: number;
}

interface TopicInputRepeaterProps {
  topics: Topic[];
  onChange: (topics: Topic[]) => void;
}

export const TopicInputRepeater = ({ topics, onChange }: TopicInputRepeaterProps) => {
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
      <Button
        type="button"
        onClick={addTopic}
        variant="outline"
        size="sm"
        className="mt-2"
      >
        Add Topic
      </Button>
    </div>
  );
};