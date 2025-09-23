import React from 'react';
import { Topic } from '@leadership-training/shared';

interface ReadOnlyTopicsDisplayProps {
  selectedTopics: Topic[];
}

export const ReadOnlyTopicsDisplay: React.FC<ReadOnlyTopicsDisplayProps> = ({
  selectedTopics,
}) => {
  if (selectedTopics.length === 0) {
    return (
      <div>
        <h3 className="text-md font-medium text-gray-900 mb-4">Session Topics</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <p className="text-gray-500 italic text-center">No topics selected for this session</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-md font-medium text-gray-900 mb-4">Session Topics</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="space-y-3">
          {selectedTopics.map((topic, index) => (
            <div key={topic.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">{topic.name}</h4>
                {topic.description && (
                  <p className="mt-1 text-sm text-gray-600">{topic.description}</p>
                )}
                <div className="mt-1 flex items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    topic.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {topic.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        These topics are locked for this session. To modify topics, please contact an administrator.
      </p>
    </div>
  );
};