import React, { useState, useEffect, useRef } from 'react';
import { Category } from '@leadership-training/shared';
import { categoryService } from '../../services/category.service';
import { cn } from '../../lib/utils';

interface CategorySelectProps {
  value?: number | '';
  onChange: (categoryId: number | '') => void;
  selectedLabel?: string;
  onCategoryChange?: (category: Category | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  allowCreate?: boolean;
  onError?: (error: string) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  selectedLabel,
  onCategoryChange,
  placeholder = 'Select category...',
  className,
  disabled = false,
  required = false,
  allowCreate = true,
  onError,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const activeCategories = await categoryService.getActiveCategories();
      setCategories(activeCategories);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to load categories';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!searchTerm.trim() || creating) return;

    try {
      setCreating(true);
      const newCategory = await categoryService.createCategory({
        name: searchTerm.trim(),
        description: `Category created from session form: ${searchTerm.trim()}`,
      });

      // Add the new category to the list and select it
      setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(newCategory.id);
      onCategoryChange?.(newCategory);
      setSearchTerm('');
      setIsOpen(false);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to create category';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Error creating category:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleSelectCategory = (categoryId: number) => {
    const selected = categories.find(cat => cat.id === categoryId) ?? null;
    onChange(categoryId);
    onCategoryChange?.(selected);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleClearSelection = () => {
    onChange('');
    onCategoryChange?.(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find selected category for display
  const selectedCategory = categories.find(cat => cat.id === value);

  // Check if search term exactly matches an existing category
  const exactMatch = categories.some(cat =>
    cat.name.toLowerCase() === searchTerm.toLowerCase()
  );

  // Show create option when there's a search term, no exact match, and allowCreate is true
  const showCreateOption = allowCreate && searchTerm.trim() && !exactMatch && !loading;

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : (selectedCategory?.name || selectedLabel || '')}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={loading ? 'Loading categories...' : placeholder}
          disabled={disabled || loading}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          autoComplete="off"
        />

        {/* Clear button */}
        {value && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}

        {/* Dropdown arrow */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Loading categories...</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : (
            <>
              {filteredCategories.length > 0 && (
                <>
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => handleSelectCategory(category.id)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                        value === category.id && 'bg-blue-50 text-blue-700'
                      )}
                    >
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-slate-500 truncate">{category.description}</div>
                      )}
                    </button>
                  ))}
                </>
              )}

              {showCreateOption && (
                <>
                  {filteredCategories.length > 0 && (
                    <div className="border-t border-slate-200" />
                  )}
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={creating}
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none disabled:opacity-60"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create "{searchTerm}"
                      </span>
                    )}
                  </button>
                </>
              )}

              {filteredCategories.length === 0 && !showCreateOption && (
                <div className="px-3 py-2 text-sm text-slate-500">
                  {searchTerm ? 'No categories match your search' : 'No categories available'}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {error && !isOpen && (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
};
