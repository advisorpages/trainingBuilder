import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Audience,
  AudienceExperienceLevel,
  AudienceCommunicationStyle,
  AudienceVocabularyLevel,
} from '@leadership-training/shared';

interface EditAudienceModalProps {
  audience: Audience | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Audience>) => Promise<void>;
}

export const EditAudienceModal: React.FC<EditAudienceModalProps> = ({
  audience,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Audience>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [exampleTypesText, setExampleTypesText] = useState('');
  const [avoidTopicsText, setAvoidTopicsText] = useState('');

  useEffect(() => {
    if (audience) {
      setFormData(audience);
      setExampleTypesText(audience.exampleTypes?.join(', ') || '');
      setAvoidTopicsText(audience.avoidTopics?.join(', ') || '');
    }
  }, [audience]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // Only send updateable fields, exclude read-only fields like id, createdAt, updatedAt, sessions
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        experienceLevel: formData.experienceLevel,
        technicalDepth: formData.technicalDepth,
        preferredLearningStyle: formData.preferredLearningStyle,
        communicationStyle: formData.communicationStyle,
        vocabularyLevel: formData.vocabularyLevel,
        promptInstructions: formData.promptInstructions,
        isActive: formData.isActive,
        exampleTypes: exampleTypesText
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
        avoidTopics: avoidTopicsText
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
      };

      await onSave(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving audience:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Audience</DialogTitle>
          <DialogDescription>
            Update the audience profile and characteristics
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* Experience & Technical Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Experience Level
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.experienceLevel || AudienceExperienceLevel.INTERMEDIATE}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceLevel: e.target.value as AudienceExperienceLevel,
                  })
                }
              >
                <option value={AudienceExperienceLevel.BEGINNER}>Beginner</option>
                <option value={AudienceExperienceLevel.INTERMEDIATE}>Intermediate</option>
                <option value={AudienceExperienceLevel.ADVANCED}>Advanced</option>
                <option value={AudienceExperienceLevel.MIXED}>Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Technical Depth (1-5)
              </label>
              <Input
                type="number"
                min="1"
                max="5"
                value={formData.technicalDepth || 3}
                onChange={(e) =>
                  setFormData({ ...formData, technicalDepth: parseInt(e.target.value) })
                }
              />
            </div>
          </div>

          {/* Communication Style */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Communication Style
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.communicationStyle || AudienceCommunicationStyle.CONVERSATIONAL}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    communicationStyle: e.target.value as AudienceCommunicationStyle,
                  })
                }
              >
                <option value={AudienceCommunicationStyle.FORMAL}>Formal</option>
                <option value={AudienceCommunicationStyle.CONVERSATIONAL}>Conversational</option>
                <option value={AudienceCommunicationStyle.TECHNICAL}>Technical</option>
                <option value={AudienceCommunicationStyle.SIMPLIFIED}>Simplified</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Vocabulary Level
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.vocabularyLevel || AudienceVocabularyLevel.PROFESSIONAL}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vocabularyLevel: e.target.value as AudienceVocabularyLevel,
                  })
                }
              >
                <option value={AudienceVocabularyLevel.BASIC}>Basic</option>
                <option value={AudienceVocabularyLevel.PROFESSIONAL}>Professional</option>
                <option value={AudienceVocabularyLevel.EXPERT}>Expert</option>
                <option value={AudienceVocabularyLevel.INDUSTRY_SPECIFIC}>
                  Industry Specific
                </option>
              </select>
            </div>
          </div>

          {/* Learning Style */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Preferred Learning Style
            </label>
            <Input
              placeholder="e.g., visual, hands-on, theoretical, discussion-based"
              value={formData.preferredLearningStyle || ''}
              onChange={(e) =>
                setFormData({ ...formData, preferredLearningStyle: e.target.value })
              }
            />
          </div>

          {/* Example Types */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Example Types (comma-separated)
            </label>
            <Input
              placeholder="e.g., retail, healthcare, remote-teams"
              value={exampleTypesText}
              onChange={(e) => setExampleTypesText(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Relevant contexts for examples
            </p>
          </div>

          {/* Avoid Topics */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Topics to Avoid (comma-separated)
            </label>
            <Input
              placeholder="e.g., politics, religion, controversial topics"
              value={avoidTopicsText}
              onChange={(e) => setAvoidTopicsText(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Sensitive or irrelevant topics to avoid
            </p>
          </div>

          {/* AI Prompt Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              AI Prompt Instructions
            </label>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Direct instructions for AI when generating content for this audience..."
              value={formData.promptInstructions || ''}
              onChange={(e) =>
                setFormData({ ...formData, promptInstructions: e.target.value })
              }
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !formData.name}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
