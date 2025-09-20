import React, { useState, useEffect } from 'react';
import { SystemSetting, SettingDataType } from '../../../../shared/src/types';
import { settingsService, SettingQueryParams } from '../../services/settings.service';

interface SettingsListProps {
  onEdit: (setting: SystemSetting) => void;
  onDelete: (setting: SystemSetting) => void;
  onReset: (setting: SystemSetting) => void;
}

export const SettingsList: React.FC<SettingsListProps> = ({ onEdit, onDelete, onReset }) => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDataType, setSelectedDataType] = useState<SettingDataType | ''>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSettings = async (params?: SettingQueryParams) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams: SettingQueryParams = {
        page: currentPage,
        limit: 20,
        ...params,
      };

      if (searchTerm) {
        queryParams.search = searchTerm;
      }

      if (selectedCategory) {
        queryParams.category = selectedCategory;
      }

      if (selectedDataType) {
        queryParams.dataType = selectedDataType;
      }

      const response = await settingsService.getSettings(queryParams);
      setSettings(response.settings);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await settingsService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory, selectedDataType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSettings();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatValue = (setting: SystemSetting): string => {
    const maxLength = 50;
    let displayValue = setting.value;

    if (setting.dataType === SettingDataType.JSON) {
      try {
        displayValue = JSON.stringify(JSON.parse(setting.value), null, 0);
      } catch {
        // Keep original value if not valid JSON
      }
    }

    return displayValue.length > maxLength
      ? `${displayValue.substring(0, maxLength)}...`
      : displayValue;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={() => fetchSettings()}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by key or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value as SettingDataType | '')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value={SettingDataType.STRING}>String</option>
                <option value={SettingDataType.NUMBER}>Number</option>
                <option value={SettingDataType.BOOLEAN}>Boolean</option>
                <option value={SettingDataType.JSON}>JSON</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Info */}
      <div className="text-sm text-gray-600">
        Showing {settings.length} of {total} settings
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {settings.map((setting) => (
              <tr key={setting.key} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{setting.key}</div>
                  {setting.description && (
                    <div className="text-sm text-gray-500">{setting.description}</div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 font-mono">
                    {formatValue(setting)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {setting.dataType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {setting.category || 'Uncategorized'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(setting)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    {setting.defaultValue && (
                      <button
                        onClick={() => onReset(setting)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(setting)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {settings.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No settings found. {searchTerm && 'Try adjusting your search criteria.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 border rounded-md ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};