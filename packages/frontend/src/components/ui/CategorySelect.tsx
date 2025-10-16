import React, { useState, useEffect } from 'react';
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
  onError?: (error: string) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  selectedLabel,
  onCategoryChange,
  placeholder = 'Select a category...',
  className,
  disabled = false,
  required = false,
  onError,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
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

  const handleSelectCategory = (categoryId: number) => {
    const selected = categories.find(cat => cat.id === categoryId) ?? null;
    onChange(categoryId);
    onCategoryChange?.(selected);
  };

  const handleClearSelection = () => {
    onChange('');
    onCategoryChange?.(null);
  };

  // Find selected category for display
  const selectedCategory = categories.find(cat => cat.id === value);

  return (
    <div className={cn('w-full space-y-4', className)}>


      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-lg animate-pulse">
              <div className="h-4 bg-slate-200 rounded mb-2"></div>
              <div className="h-3 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Categories grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
         {categories.length > 0 ? (
           categories.map((category) => (
             <button
               key={category.id}
               type="button"
               onClick={() => handleSelectCategory(category.id)}
               disabled={disabled}
               className={cn(
                 'p-4 text-left border rounded-lg transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                 value === category.id
                   ? 'border-blue-500 bg-blue-50 text-blue-900'
                   : 'border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
               )}
             >
               <div className="font-medium">{category.name}</div>
               {category.description && (
                 <div className="text-xs text-slate-500 mt-1 line-clamp-2">{category.description}</div>
               )}
             </button>
           ))
         ) : (
           <div className="text-center py-8">
             <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
             <p className="text-sm text-slate-500">No categories available</p>
           </div>
         )}
        </div>
      )}
    </div>
  );
};
