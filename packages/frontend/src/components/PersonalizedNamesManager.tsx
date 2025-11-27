import React, { useState } from 'react';
import { PersonalizedName, PersonalizedNameType } from '@leadership-training/shared';
import { usePersonalizedNames } from '../contexts/PersonalizedNamesContext';

interface PersonalizedNamesManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAME_TYPE_LABELS: Record<PersonalizedNameType, string> = {
  [PersonalizedNameType.HUSBAND]: 'Husband',
  [PersonalizedNameType.WIFE]: 'Wife',
  [PersonalizedNameType.PARTNER]: 'Partner',
  [PersonalizedNameType.CHILD]: 'Child',
  [PersonalizedNameType.PARENT]: 'Parent',
  [PersonalizedNameType.SIBLING]: 'Sibling',
  [PersonalizedNameType.FRIEND]: 'Friend',
  [PersonalizedNameType.COLLEAGUE]: 'Colleague',
  [PersonalizedNameType.OTHER]: 'Other',
};

export const PersonalizedNamesManager: React.FC<PersonalizedNamesManagerProps> = ({
  isOpen,
  onClose,
}) => {
  const { names, addName, updateName, deleteName, isLoading } = usePersonalizedNames();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: PersonalizedNameType.HUSBAND,
    customLabel: '',
    name: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      type: PersonalizedNameType.HUSBAND,
      customLabel: '',
      name: '',
      isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await updateName(editingId, formData);
      } else {
        await addName(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save personalized name:', error);
    }
  };

  const handleEdit = (nameEntry: PersonalizedName) => {
    setFormData({
      type: nameEntry.type,
      customLabel: nameEntry.customLabel || '',
      name: nameEntry.name,
      isActive: nameEntry.isActive,
    });
    setEditingId(nameEntry.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this name?')) {
      try {
        await deleteName(id);
      } catch (error) {
        console.error('Failed to delete personalized name:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Personalized Names</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Existing Names */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Your Names</h3>
          {names.length === 0 ? (
            <p className="text-gray-500">No personalized names added yet.</p>
          ) : (
            <div className="space-y-2">
              {names.map((nameEntry) => (
                <div key={nameEntry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">
                      {NAME_TYPE_LABELS[nameEntry.type]}
                      {nameEntry.customLabel && ` (${nameEntry.customLabel})`}
                    </span>
                    <span className="text-gray-600 ml-2">→ {nameEntry.name}</span>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(nameEntry)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(nameEntry.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg font-medium">
            {editingId ? 'Edit Name' : 'Add New Name'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PersonalizedNameType }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.entries(NAME_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Label (Optional)
            </label>
            <input
              type="text"
              value={formData.customLabel}
              onChange={(e) => setFormData(prev => ({ ...prev, customLabel: e.target.value }))}
              placeholder="e.g., My amazing husband"
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter the name"
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : (editingId ? 'Update' : 'Add Name')}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};