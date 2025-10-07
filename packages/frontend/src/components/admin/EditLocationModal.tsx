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
  Location,
  LocationType,
  MeetingPlatform,
} from '@leadership-training/shared';

interface EditLocationModalProps {
  location: Location | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Location>) => Promise<void>;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
  location,
  open,
  onOpenChange,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Location>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (location) {
        setFormData(location);
      } else {
        // Default values for new location
        setFormData({
          locationType: LocationType.PHYSICAL,  // Default to physical location
          timezone: 'America/Toronto',
          isActive: true,
        });
      }
    }
  }, [location, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      // Strip out read-only fields that shouldn't be sent to the backend
      const { id, createdAt, updatedAt, ...dataToSave } = formData;
      await onSave(dataToSave);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving location:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const showPhysicalFields =
    formData.locationType === LocationType.PHYSICAL ||
    formData.locationType === LocationType.HYBRID;

  const showVirtualFields =
    formData.locationType === LocationType.VIRTUAL ||
    formData.locationType === LocationType.HYBRID;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent key={location?.id || 'new'} className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? 'Edit Location' : 'Add Location'}</DialogTitle>
          <DialogDescription>
            {location ? 'Update the location details for physical or virtual venues' : 'Create a new location for physical or virtual venues'}
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location Type *
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.locationType || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationType: e.target.value as LocationType,
                  })
                }
                required
              >
                <option value="" disabled>Select location type...</option>
                <option value={LocationType.PHYSICAL}>Physical Location</option>
                <option value={LocationType.VIRTUAL}>Virtual/Online</option>
                <option value={LocationType.HYBRID}>Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Timezone
              </label>
              <Input
                placeholder="e.g., America/Toronto, America/New_York"
                value={formData.timezone || 'America/Toronto'}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              />
            </div>
          </div>

          {/* Physical Location Fields */}
          {showPhysicalFields && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Physical Location Details</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <textarea
                  className="w-full min-h-[60px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State/Province
                  </label>
                  <Input
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  <Input
                    value={formData.country || ''}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Postal Code
                  </label>
                  <Input
                    value={formData.postalCode || ''}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Capacity
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Maximum number of attendees"
                  value={formData.capacity || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
          )}

          {/* Virtual Meeting Fields */}
          {showVirtualFields && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">Virtual Meeting Details</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Meeting Platform
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.meetingPlatform || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      meetingPlatform: e.target.value as MeetingPlatform,
                    })
                  }
                >
                  <option value="">Select platform...</option>
                  <option value={MeetingPlatform.ZOOM}>Zoom</option>
                  <option value={MeetingPlatform.MICROSOFT_TEAMS}>Microsoft Teams</option>
                  <option value={MeetingPlatform.GOOGLE_MEET}>Google Meet</option>
                  <option value={MeetingPlatform.OTHER}>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Meeting Link
                </label>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={formData.meetingLink || ''}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meeting ID
                  </label>
                  <Input
                    placeholder="Meeting ID or Room Number"
                    value={formData.meetingId || ''}
                    onChange={(e) => setFormData({ ...formData, meetingId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Meeting Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Optional password"
                    value={formData.meetingPassword || ''}
                    onChange={(e) => setFormData({ ...formData, meetingPassword: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Dial-in Number
                </label>
                <Input
                  placeholder="Phone number for audio dial-in"
                  value={formData.dialInNumber || ''}
                  onChange={(e) => setFormData({ ...formData, dialInNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Access Instructions */}
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Access Instructions
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions for accessing this location (e.g., parking, building entry, waiting room)..."
                value={formData.accessInstructions || ''}
                onChange={(e) =>
                  setFormData({ ...formData, accessInstructions: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Additional Notes
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal notes or comments about this location..."
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
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
              {isSaving ? 'Saving...' : location ? 'Save Changes' : 'Create Location'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
