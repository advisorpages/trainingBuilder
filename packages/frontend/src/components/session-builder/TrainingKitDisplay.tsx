import React, { useState, useEffect } from 'react';
import { sessionBuilderService } from '../../services/session-builder.service';

interface TrainingKitDisplayProps {
  sessionId: string;
  onGenerateKit: () => void;
  onSaveKit: (kitData: any) => void;
}

export interface TrainingKit {
  trainerPreparation: string;
  deliveryTips: string[];
  materialsList: string[];
  timingGuidance: string;
  troubleshooting: string[];
  resourceLinks: string[];
}

export const TrainingKitDisplay: React.FC<TrainingKitDisplayProps> = ({
  sessionId,
  onGenerateKit,
  onSaveKit
}) => {
  const [trainingKit, setTrainingKit] = useState<TrainingKit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedKit, setEditedKit] = useState<TrainingKit | null>(null);
  const [hasKit, setHasKit] = useState(false);

  useEffect(() => {
    loadTrainingKit();
  }, [sessionId]);

  const loadTrainingKit = async () => {
    try {
      const response = await sessionBuilderService.getTrainingKit(sessionId);
      if (response.hasTrainingKit) {
        setTrainingKit(response.trainingKit);
        setHasKit(true);
      }
    } catch (error) {
      console.error('Failed to load training kit:', error);
    }
  };

  const handleGenerateKit = async () => {
    setIsLoading(true);
    try {
      const response = await sessionBuilderService.generateTrainingKit(sessionId);
      setTrainingKit(response.trainingKit);
      setHasKit(true);
      onGenerateKit();
    } catch (error) {
      console.error('Failed to generate training kit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditKit = () => {
    setEditedKit({ ...trainingKit! });
    setIsEditing(true);
  };

  const handleSaveKit = async () => {
    if (!editedKit) return;

    try {
      await sessionBuilderService.saveTrainingKit(sessionId, editedKit);
      setTrainingKit(editedKit);
      setIsEditing(false);
      onSaveKit(editedKit);
    } catch (error) {
      console.error('Failed to save training kit:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedKit(null);
    setIsEditing(false);
  };

  const updateEditedKit = (field: keyof TrainingKit, value: any) => {
    if (!editedKit) return;
    setEditedKit({ ...editedKit, [field]: value });
  };

  const updateArrayItem = (field: keyof TrainingKit, index: number, value: string) => {
    if (!editedKit || !Array.isArray(editedKit[field])) return;
    const newArray = [...(editedKit[field] as string[])];
    newArray[index] = value;
    setEditedKit({ ...editedKit, [field]: newArray });
  };

  const addArrayItem = (field: keyof TrainingKit) => {
    if (!editedKit || !Array.isArray(editedKit[field])) return;
    const newArray = [...(editedKit[field] as string[]), ''];
    setEditedKit({ ...editedKit, [field]: newArray });
  };

  const removeArrayItem = (field: keyof TrainingKit, index: number) => {
    if (!editedKit || !Array.isArray(editedKit[field])) return;
    const newArray = (editedKit[field] as string[]).filter((_, i) => i !== index);
    setEditedKit({ ...editedKit, [field]: newArray });
  };

  if (!hasKit && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Training Kit Generated</h3>
        <p className="mt-1 text-sm text-gray-500">
          Generate a comprehensive training kit to help trainers deliver this session effectively.
        </p>
        <div className="mt-6">
          <button
            onClick={handleGenerateKit}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Generate Training Kit
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Generating training kit...</p>
      </div>
    );
  }

  const kitToDisplay = isEditing ? editedKit! : trainingKit!;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Training Kit</h3>
        <div className="flex space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleEditKit}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit Kit
              </button>
              <button
                onClick={handleGenerateKit}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Regenerate
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKit}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trainer Preparation */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Trainer Preparation Guide</h4>
        {isEditing ? (
          <textarea
            value={kitToDisplay.trainerPreparation}
            onChange={(e) => updateEditedKit('trainerPreparation', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-line">{kitToDisplay.trainerPreparation}</p>
        )}
      </div>

      {/* Delivery Tips */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Tips</h4>
        {isEditing ? (
          <div className="space-y-2">
            {kitToDisplay.deliveryTips.map((tip, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tip}
                  onChange={(e) => updateArrayItem('deliveryTips', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeArrayItem('deliveryTips', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('deliveryTips')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Tip
            </button>
          </div>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {kitToDisplay.deliveryTips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Materials List */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Required Materials</h4>
        {isEditing ? (
          <div className="space-y-2">
            {kitToDisplay.materialsList.map((material, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={material}
                  onChange={(e) => updateArrayItem('materialsList', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeArrayItem('materialsList', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('materialsList')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Material
            </button>
          </div>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {kitToDisplay.materialsList.map((material, index) => (
              <li key={index}>{material}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Timing Guidance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Timing Guidance</h4>
        {isEditing ? (
          <textarea
            value={kitToDisplay.timingGuidance}
            onChange={(e) => updateEditedKit('timingGuidance', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-line">{kitToDisplay.timingGuidance}</p>
        )}
      </div>

      {/* Troubleshooting */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Troubleshooting Guide</h4>
        {isEditing ? (
          <div className="space-y-2">
            {kitToDisplay.troubleshooting.map((issue, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={issue}
                  onChange={(e) => updateArrayItem('troubleshooting', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeArrayItem('troubleshooting', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('troubleshooting')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Issue
            </button>
          </div>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {kitToDisplay.troubleshooting.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Resource Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Additional Resources</h4>
        {isEditing ? (
          <div className="space-y-2">
            {kitToDisplay.resourceLinks.map((resource, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={resource}
                  onChange={(e) => updateArrayItem('resourceLinks', index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeArrayItem('resourceLinks', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => addArrayItem('resourceLinks')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Resource
            </button>
          </div>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {kitToDisplay.resourceLinks.map((resource, index) => (
              <li key={index}>{resource}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};