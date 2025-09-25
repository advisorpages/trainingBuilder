import React, { useState, useEffect } from 'react';
import { Location } from '@leadership-training/shared';
import { CreateLocationRequest, UpdateLocationRequest } from '../../services/location.service';

interface LocationFormProps {
  location?: Location;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        address: location.address || '',
        capacity: location.capacity ? String(location.capacity) : '',
        isActive: location.isActive,
      });
    }
  }, [location]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (formData.address && formData.address.length > 1000) {
      newErrors.address = 'Address must be less than 1000 characters';
    }

    if (formData.capacity) {
      const capacityNum = parseInt(formData.capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        newErrors.capacity = 'Capacity must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateLocationRequest | UpdateLocationRequest = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      };

      if (location) {
        (submitData as UpdateLocationRequest).isActive = formData.isActive;
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {location ? 'Edit Location' : 'Create New Location'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter location name"
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Address Field */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Enter location address"
            disabled={isSubmitting}
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
        </div>

        {/* Capacity Field */}
        <div>
          <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            type="number"
            id="capacity"
            min="1"
            value={formData.capacity}
            onChange={(e) => handleInputChange('capacity', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.capacity ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter maximum capacity (optional)"
            disabled={isSubmitting}
          />
          {errors.capacity && <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Leave empty for unlimited capacity
          </p>
        </div>

        {/* Active Status (only for edit) */}
        {location && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="rounded border-gray-300"
                disabled={isSubmitting}
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive locations won't be available for new sessions
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {location ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              location ? 'Update Location' : 'Create Location'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};