import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/auth.types';
import { BuilderLayout } from '../layouts/BuilderLayout';
import { ToastProvider, Button } from '../ui';
import {
  savedVariantsService,
  SavedVariant,
  SavedVariantsListResult,
  SavedVariantsListOptions
} from '../services/saved-variants.service';

const EmptyState: React.FC<{ message: string; action?: { label: string; onClick: () => void } }> = ({
  message,
  action
}) => (
  <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
    <div className="text-center max-w-md px-6">
      <div className="text-4xl mb-4">💡</div>
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  </div>
);

interface SavedVariantCardProps {
  variant: SavedVariant;
  onLoad: (variant: SavedVariant) => void;
  onEdit: (variant: SavedVariant) => void;
  onDelete: (variant: SavedVariant) => void;
  onToggleFavorite: (variant: SavedVariant) => void;
}

const SavedVariantCard: React.FC<SavedVariantCardProps> = ({
  variant,
  onLoad,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showFullOutline, setShowFullOutline] = React.useState(false);
  const sections = variant.outline?.sections ?? [];
  const visibleSections = showFullOutline ? sections : sections.slice(0, 3);

  const handleLoad = async () => {
    setIsLoading(true);
    try {
      await savedVariantsService.recordUsage(variant.id);
      onLoad(variant);
    } catch (error) {
      console.error('Error recording usage:', error);
      // Still load the variant even if usage recording fails
      onLoad(variant);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white hover:border-blue-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">{variant.title}</h3>
            <button
              onClick={() => onToggleFavorite(variant)}
              className="text-yellow-500 hover:text-yellow-600 transition-colors flex-shrink-0"
              title={variant.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {variant.isFavorite ? '⭐' : '☆'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {variant.totalDuration} min • {variant.generationSource} • Used {variant.usageCount} times
          </p>
        </div>
      </div>

      {/* Description */}
      {variant.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
          {variant.description}
        </p>
      )}

      {/* Tags */}
      {variant.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {variant.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Collection */}
      {variant.collectionName && (
        <div className="text-xs text-slate-500 mb-3">
          📁 {variant.collectionName}
        </div>
      )}

      {/* Preview */}
      <div
        className={`space-y-2 mb-3 p-3 bg-slate-50 rounded overflow-y-auto border border-slate-100 ${
          showFullOutline ? 'max-h-64' : 'max-h-48'
        }`}
      >
        <p className="text-sm font-medium text-slate-900">
          {variant.outline?.suggestedSessionTitle || 'Untitled Session'}
        </p>
        <p className="text-xs text-slate-500">
          {variant.outline?.sections?.length || 0} sections • {variant.totalDuration} min
        </p>
        {visibleSections.map((section: any, index: number) => (
          <div key={index} className="text-xs text-slate-600 border-l-2 border-blue-200 pl-2">
            • {section.title} ({section.duration} min)
          </div>
        ))}
        {!showFullOutline && sections.length > 3 && (
          <p className="text-xs text-slate-500 italic">
            ...and {sections.length - 3} more sections
          </p>
        )}
      </div>
      {sections.length > 3 && (
        <button
          type="button"
          onClick={() => setShowFullOutline(prev => !prev)}
          className="mb-4 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          {showFullOutline ? 'Hide full outline' : 'Show full outline'}
        </button>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleLoad}
          disabled={isLoading}
          className="flex-1 text-sm"
          size="sm"
        >
          {isLoading ? 'Loading...' : 'Open in Builder'}
        </Button>
        <Button
          onClick={() => onEdit(variant)}
          variant="outline"
          size="sm"
          title="Edit details"
        >
          ✏️
        </Button>
        <Button
          onClick={() => onDelete(variant)}
          variant="outline"
          size="sm"
          title="Delete"
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          🗑️
        </Button>
      </div>
    </div>
  );
};

export const SavedVariantsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedVariants, setSavedVariants] = React.useState<SavedVariant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCollection, setSelectedCollection] = React.useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);
  const [collections, setCollections] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<'createdAt' | 'updatedAt' | 'lastUsedAt' | 'usageCount' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<'ASC' | 'DESC'>('DESC');

  const fetchSavedVariants = React.useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const options: SavedVariantsListOptions = {
        page,
        limit: 12,
        sortBy,
        sortOrder,
        search: searchQuery || undefined,
        collectionName: selectedCollection || undefined,
        isFavorite: showFavoritesOnly || undefined,
      };

      const result: SavedVariantsListResult = await savedVariantsService.getSavedVariants(options);
      setSavedVariants(result.savedVariants);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Error fetching saved variants:', err);
      setError('Failed to load saved variants');
    } finally {
      setLoading(false);
    }
  }, [user, page, sortBy, sortOrder, searchQuery, selectedCollection, showFavoritesOnly]);

  const fetchCollections = React.useCallback(async () => {
    if (!user) return;

    try {
      const userCollections = await savedVariantsService.getCollections();
      setCollections(userCollections);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  }, [user]);

  React.useEffect(() => {
    fetchSavedVariants();
  }, [fetchSavedVariants]);

  React.useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleLoadVariant = (variant: SavedVariant) => {
    // Navigate to session builder with the saved variant data
    navigate('/sessions/builder/new', {
      state: { savedVariant: variant, initialStep: 'trainers-topics' },
    });
  };

  const handleEditVariant = (variant: SavedVariant) => {
    // Navigate to session builder with the saved variant for editing
    navigate('/sessions/builder/new', {
      state: { savedVariant: variant, isEditing: true, initialStep: 'trainers-topics' },
    });
  };

  const handleDeleteVariant = async (variant: SavedVariant) => {
    if (!confirm(`Are you sure you want to delete "${variant.title}"?`)) {
      return;
    }

    try {
      await savedVariantsService.deleteSavedVariant(variant.id);
      // Refresh the list
      fetchSavedVariants();
      alert(`"${variant.title}" has been deleted.`);
    } catch (err) {
      console.error('Error deleting variant:', err);
      alert('Failed to delete variant. Please try again.');
    }
  };

  const handleToggleFavorite = async (variant: SavedVariant) => {
    try {
      const updatedVariant = await savedVariantsService.updateSavedVariant(variant.id, {
        isFavorite: !variant.isFavorite,
      });

      // Update the local state
      setSavedVariants(prev =>
        prev.map(v => v.id === variant.id ? updatedVariant : v)
      );
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status. Please try again.');
    }
  };

  const userRoleName =
    (user as any)?.role?.name ||
    (user as any)?.roleName ||
    (typeof (user as any)?.role === 'string' ? (user as any).role : undefined);

  const canCreateSessions =
    userRoleName === UserRole.CONTENT_DEVELOPER || userRoleName === UserRole.BROKER;

  if (!canCreateSessions) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="text-lg font-semibold text-yellow-800">Access restricted</h2>
          <p className="mt-2 text-sm text-yellow-700">
            You need Content Developer or Broker permissions to access saved variants.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <BuilderLayout title="Saved Ideas" subtitle="Loading your saved variants...">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-sm text-gray-500">Loading your saved variants...</p>
        </div>
      </BuilderLayout>
    );
  }

  if (error) {
    return (
      <BuilderLayout title="Saved Ideas" subtitle="Error loading saved variants">
        <div className="max-w-4xl">
          <EmptyState
            message={error}
            action={{ label: 'Try Again', onClick: fetchSavedVariants }}
          />
        </div>
      </BuilderLayout>
    );
  }

  return (
    <ToastProvider>
      <BuilderLayout
        title="Saved Ideas"
        subtitle={`Your personal library of AI-generated session outlines (${total} total)`}
      >
        <div className="space-y-6 max-w-7xl">
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search saved variants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Collection Filter */}
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Collections</option>
                {collections.map(collection => (
                  <option key={collection} value={collection}>
                    {collection}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt-DESC">Newest First</option>
                <option value="createdAt-ASC">Oldest First</option>
                <option value="lastUsedAt-DESC">Recently Used</option>
                <option value="usageCount-DESC">Most Used</option>
                <option value="title-ASC">Title A-Z</option>
              </select>

              {/* Favorites Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-3 py-2 border rounded-md transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showFavoritesOnly ? '⭐ Favorites' : 'Show Favorites'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => navigate('/sessions/builder/new')}>
                Create New Session
              </Button>
            </div>
          </div>

          {/* Content */}
          {savedVariants.length === 0 ? (
            <div className="max-w-4xl">
              <EmptyState
                message={
                  searchQuery || selectedCollection || showFavoritesOnly
                    ? 'No saved variants match your filters.'
                    : 'You haven\'t saved any session ideas yet. Generate some variants in the session builder and save them for later!'
                }
                action={
                  !searchQuery && !selectedCollection && !showFavoritesOnly
                    ? { label: 'Create New Session', onClick: () => navigate('/sessions/builder/new') }
                    : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {savedVariants.map((variant) => (
                  <SavedVariantCard
                    key={variant.id}
                    variant={variant}
                    onLoad={handleLoadVariant}
                    onEdit={handleEditVariant}
                    onDelete={handleDeleteVariant}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </BuilderLayout>
    </ToastProvider>
  );
};
