interface TopicInputProps {
  value: {
    title: string;
    description?: string;
    durationMinutes: number;
  };
  onChange: (value: {
    title: string;
    description?: string;
    durationMinutes: number;
  }) => void;
}

export const TopicInput = ({ value, onChange }: TopicInputProps) => {
  const handleDurationChange = (minutes: number) => {
    onChange({ ...value, durationMinutes: Math.round(minutes / 5) * 5 });
  };

  return (
    <div className="space-y-2 border p-4 rounded-lg mb-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Topic Title
        </label>
        <input
          type="text"
          className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value.title}
          onChange={(e) => onChange({ ...value, title: e.target.value })}
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Description (Optional)
        </label>
        <textarea
          className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={value.description || ''}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">
          Duration (minutes)
        </label>
        <input
          type="number"
          className="h-10 w-32 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={value.durationMinutes}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          min={5}
          step={5}
        />
      </div>
    </div>
  );
};