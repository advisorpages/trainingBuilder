import React, { useState, useEffect } from 'react';
import { Trainer } from '../../../../shared/src/types';
import { CreateTrainerRequest, UpdateTrainerRequest } from '../../services/trainer.service';

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TrainerForm: React.FC<TrainerFormProps> = ({
  trainer,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (trainer) {
      setFormData({
        name: trainer.name,
        email: trainer.email || '',
        bio: trainer.bio || '',
        isActive: trainer.isActive,
      });
    }
  }, [trainer]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Name must be less than 255 characters';
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (formData.email.length > 255) {
        newErrors.email = 'Email must be less than 255 characters';
      }
    }

    if (formData.bio && formData.bio.length > 2000) {
      newErrors.bio = 'Bio must be less than 2000 characters';
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
      const submitData: CreateTrainerRequest | UpdateTrainerRequest = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      };

      if (trainer) {
        (submitData as UpdateTrainerRequest).isActive = formData.isActive;
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
        {trainer ? 'Edit Trainer' : 'Create New Trainer'}
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
            placeholder="Enter trainer name"
            disabled={isSubmitting}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter trainer email (optional)"
            disabled={isSubmitting}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          <p className="mt-1 text-sm text-gray-500">
            Email must be unique if provided
          </p>
        </div>

        {/* Bio Field */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.bio ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={4}
            placeholder="Enter trainer bio and background (optional)"
            disabled={isSubmitting}
          />
          {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
          <p className="mt-1 text-sm text-gray-500">
            {formData.bio.length}/2000 characters
          </p>
        </div>

        {/* Active Status (only for edit) */}
        {trainer && (
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
              Inactive trainers won't be available for new sessions
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
                {trainer ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              trainer ? 'Update Trainer' : 'Create Trainer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};