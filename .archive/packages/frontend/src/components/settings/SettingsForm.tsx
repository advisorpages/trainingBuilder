import React, { useState, useEffect } from 'react';
import { SystemSetting, SettingDataType } from '../../../../shared/src/types';
import { CreateSettingRequest, UpdateSettingRequest } from '../../services/settings.service';

interface SettingsFormProps {
  setting?: SystemSetting;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  categories?: string[];
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  setting,
  onSubmit,
  onCancel,
  isSubmitting = false,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    description: '',
    category: '',
    dataType: SettingDataType.STRING,
    defaultValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (setting) {
      setFormData({
        key: setting.key,
        value: setting.value,
        description: setting.description || '',
        category: setting.category || '',
        dataType: setting.dataType,
        defaultValue: setting.defaultValue || '',
      });
    }
  }, [setting]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required';
    } else if (formData.key.length > 255) {
      newErrors.key = 'Key must be less than 255 characters';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.key)) {
      newErrors.key = 'Key can only contain letters, numbers, dots, underscores, and hyphens';
    }

    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
    } else {
      // Validate value based on data type
      if (formData.dataType === SettingDataType.NUMBER) {
        if (isNaN(parseFloat(formData.value))) {
          newErrors.value = 'Value must be a valid number';
        }
      } else if (formData.dataType === SettingDataType.BOOLEAN) {
        if (!['true', 'false'].includes(formData.value.toLowerCase())) {
          newErrors.value = 'Value must be "true" or "false"';
        }
      } else if (formData.dataType === SettingDataType.JSON) {
        try {
          JSON.parse(formData.value);
        } catch {
          newErrors.value = 'Value must be valid JSON';
        }
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (formData.category && formData.category.length > 100) {
      newErrors.category = 'Category must be less than 100 characters';
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
      const submitData: CreateSettingRequest | UpdateSettingRequest = {
        value: formData.value.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category.trim() || undefined,
        dataType: formData.dataType,
        defaultValue: formData.defaultValue.trim() || undefined,
      };

      if (!setting) {
        (submitData as CreateSettingRequest).key = formData.key.trim();
      }

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string | SettingDataType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const renderValueInput = () => {
    switch (formData.dataType) {
      case SettingDataType.BOOLEAN:
        return (
          <select
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.value ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value="">Select value...</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      case SettingDataType.JSON:
        return (
          <textarea
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.value ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={4}
            placeholder="Enter valid JSON"
            disabled={isSubmitting}
          />
        );
      default:
        return (
          <input
            type={formData.dataType === SettingDataType.NUMBER ? 'number' : 'text'}
            value={formData.value}
            onChange={(e) => handleInputChange('value', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.value ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter setting value"
            disabled={isSubmitting}
          />
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {setting ? 'Edit Setting' : 'Create New Setting'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Key Field (only for create) */}
        {!setting && (
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
              Key *
            </label>
            <input
              type="text"
              id="key"
              value={formData.key}
              onChange={(e) => handleInputChange('key', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.key ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., app.name or email.smtp.host"
              disabled={isSubmitting}
            />
            {errors.key && <p className="mt-1 text-sm text-red-600">{errors.key}</p>}
            <p className="mt-1 text-sm text-gray-500">
              Use dots to create hierarchy (e.g., category.subcategory.setting)
            </p>
          </div>
        )}

        {/* Data Type Field */}
        <div>
          <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">
            Data Type *
          </label>
          <select
            id="dataType"
            value={formData.dataType}
            onChange={(e) => handleInputChange('dataType', e.target.value as SettingDataType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value={SettingDataType.STRING}>String</option>
            <option value={SettingDataType.NUMBER}>Number</option>
            <option value={SettingDataType.BOOLEAN}>Boolean</option>
            <option value={SettingDataType.JSON}>JSON</option>
          </select>
        </div>

        {/* Value Field */}
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
            Value *
          </label>
          {renderValueInput()}
          {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            id="category"
            list="categories"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., General, Email, Security"
            disabled={isSubmitting}
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Describe what this setting controls"
            disabled={isSubmitting}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>

        {/* Default Value Field */}
        <div>
          <label htmlFor="defaultValue" className="block text-sm font-medium text-gray-700 mb-1">
            Default Value
          </label>
          <input
            type="text"
            id="defaultValue"
            value={formData.defaultValue}
            onChange={(e) => handleInputChange('defaultValue', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Default value for reset functionality"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-sm text-gray-500">
            Used when resetting the setting to its default value
          </p>
        </div>

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
                {setting ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              setting ? 'Update Setting' : 'Create Setting'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};