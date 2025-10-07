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
import { Trainer } from '@leadership-training/shared';

interface EditTrainerModalProps {
  trainer: Trainer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Trainer>) => Promise<void>;
}

export const EditTrainerModal: React.FC<EditTrainerModalProps> = ({
  trainer,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Trainer>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');

  useEffect(() => {
    if (open) {
      if (trainer) {
        setFormData(trainer);
        setExpertiseInput(trainer.expertiseTags?.join(', ') || '');
      } else {
        // Default values for new trainer
        setFormData({
          isActive: true,
          timezone: 'America/Toronto',
        });
        setExpertiseInput('');
      }
    }
  }, [trainer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      // Convert comma-separated expertise string to array
      const expertiseTags = expertiseInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Strip out read-only fields that shouldn't be sent to the backend
      const { id, createdAt, updatedAt, sessions, ...dataToSave } = formData;

      await onSave({
        ...dataToSave,
        expertiseTags: expertiseTags.length > 0 ? expertiseTags : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving trainer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={trainer?.id || 'new'} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trainer ? 'Edit Trainer' : 'Add Trainer'}</DialogTitle>
          <DialogDescription>
            {trainer ? 'Update the trainer details and profile information' : 'Create a new trainer profile'}
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
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timezone
              </label>
              <Input
                value={formData.timezone || 'America/Toronto'}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="e.g., America/Toronto, America/New_York"
              />
              <p className="text-xs text-slate-500 mt-1">
                Used for scheduling sessions in the trainer's local time
              </p>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold text-slate-900">Professional Information</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Bio
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief professional background and qualifications..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expertise Tags
              </label>
              <Input
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                placeholder="Leadership, Communication, Change Management"
              />
              <p className="text-xs text-slate-500 mt-1">
                Enter expertise areas separated by commas
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 border-t border-slate-200 pt-4">
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
            <p className="text-xs text-slate-500 ml-2">
              Inactive trainers won't appear in session assignment dropdowns
            </p>
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
            <Button type="submit" disabled={isSaving || !formData.name || !formData.email}>
              {isSaving ? 'Saving...' : trainer ? 'Save Changes' : 'Create Trainer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
