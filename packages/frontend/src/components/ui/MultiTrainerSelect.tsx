import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';
import { cn } from '../../lib/utils';

interface MultiTrainerSelectProps {
  value?: number[];
  selectedLabels?: string[];
  onChange: (trainers: Trainer[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeIds?: number[]; // IDs to exclude from the list (e.g., already assigned trainers)
  allowUnassigned?: boolean; // Whether to show "Clear All" option
  maxSelections?: number; // Maximum number of trainers that can be selected
}

// Cache for storing previously fetched trainers
const trainerCache = new Map<string, { trainers: Trainer[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const MultiTrainerSelect: React.FC<MultiTrainerSelectProps> = ({
  value = [],
  selectedLabels = [],
  onChange,
  placeholder = 'Select trainers…',
  className,
  disabled = false,
  excludeIds = [],
  allowUnassigned = false,
  maxSelections,
}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const calculateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();

    // Calculate position for the dropdown using fixed positioning
    // getBoundingClientRect already returns coordinates relative to viewport
    const top = rect.bottom + 4; // 4px gap below the trigger
    const left = rect.left;
    const width = rect.width;

    // Ensure dropdown doesn't go off-screen
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const estimatedDropdownHeight = 300; // max-h-60 is 240px + padding

    let adjustedTop = top;
    if (top + estimatedDropdownHeight > viewportHeight) {
      // Show dropdown above the trigger if there's not enough space below
      adjustedTop = rect.top - estimatedDropdownHeight - 4;
      // Ensure it doesn't go above viewport
      adjustedTop = Math.max(4, adjustedTop);
    }

    let adjustedLeft = left;
    if (left + width > viewportWidth) {
      // Adjust left position to prevent horizontal overflow
      adjustedLeft = Math.max(4, viewportWidth - width - 8);
    }

    setDropdownPosition({
      top: adjustedTop,
      left: adjustedLeft,
      width: Math.min(width, viewportWidth - 16) // Ensure it doesn't touch viewport edges
    });
  }, []);

  const loadTrainers = useCallback(
    async (term: string) => {
      try {
        const cacheKey = term || 'all';
        const now = Date.now();

        // Check cache first
        const cached = trainerCache.get(cacheKey);
        if (cached && now - cached.timestamp < CACHE_DURATION) {
          setTrainers(cached.trainers);
          setError(null);
          return;
        }

        setIsLoading(true);
        const response = await trainerService.getTrainers({
          search: term || undefined,
          limit: 25,
          isActive: true,
        });

        const fetchedTrainers = response.trainers || [];
        setTrainers(fetchedTrainers);

        // Cache the results
        trainerCache.set(cacheKey, {
          trainers: fetchedTrainers,
          timestamp: now,
        });

        setError(null);
      } catch (err) {
        console.error('Failed to load trainers', err);
        setError('Failed to load trainers');
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Initial load effect - only runs once
  useEffect(() => {
    if (!initialLoadDone && trainers.length === 0 && !isLoading) {
      setInitialLoadDone(true);
      void loadTrainers('');
    }
  }, [initialLoadDone, trainers.length, isLoading, loadTrainers]);

  // Debounced search effect - only when dropdown is open and search term changes
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (loadTimeoutRef.current) {
      window.clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }

    loadTimeoutRef.current = window.setTimeout(() => {
      void loadTrainers(searchTerm);
    }, 300); // Increased debounce time slightly to reduce flickering

    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, searchTerm, loadTrainers]);

  // Calculate dropdown position when it opens and on window resize
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen, calculateDropdownPosition]);

  // Handle window resize (no need for scroll with fixed positioning)
  useEffect(() => {
    const handleResize = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, calculateDropdownPosition]);

  // Stable click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside both the trigger and the dropdown
      const clickOutsideTrigger = triggerRef.current && !triggerRef.current.contains(event.target as Node);
      const clickOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target as Node);

      if (isOpen && clickOutsideTrigger && clickOutsideDropdown) {
        setIsOpen(false);
        // Don't immediately clear search term to avoid flickering
        setTimeout(() => setSearchTerm(''), 100);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedTrainers = useMemo(() => {
    return trainers.filter((trainer) => value.includes(trainer.id));
  }, [trainers, value]);

  const displayValue = useMemo(() => {
    // When dropdown is open and we have a search term, show it
    // Otherwise show selected trainers or placeholder
    if (isOpen && searchTerm) return searchTerm;

    const names = selectedTrainers.map(t => t.name);
    if (names.length > 0) return names.join(', ');
    if (selectedLabels.length > 0) return selectedLabels.join(', ');
    return '';
  }, [isOpen, searchTerm, selectedTrainers, selectedLabels]);

  const filteredTrainers = useMemo(() => {
    return trainers
      .filter((trainer) => !excludeIds.includes(trainer.id))
      .filter((trainer) =>
        trainer.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [trainers, excludeIds, searchTerm]);

  const handleToggleTrainer = useCallback((trainer: Trainer) => {
    const isSelected = value.includes(trainer.id);
    let newSelectedTrainers: Trainer[];

    if (isSelected) {
      // Remove trainer
      newSelectedTrainers = selectedTrainers.filter(t => t.id !== trainer.id);
    } else {
      // Check max selections limit
      if (maxSelections && selectedTrainers.length >= maxSelections) {
        return;
      }
      // Add trainer
      newSelectedTrainers = [...selectedTrainers, trainer];
    }

    onChange(newSelectedTrainers);
  }, [value, selectedTrainers, maxSelections, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
    setIsOpen(false);
    // Delay search term clearing to prevent flickering
    setTimeout(() => setSearchTerm(''), 150);
  }, [onChange]);

  const handleToggleDropdown = useCallback(() => {
    if (!disabled) {
      const newIsOpen = !isOpen;
      setIsOpen(newIsOpen);
      if (newIsOpen) {
        // Calculate position immediately
        calculateDropdownPosition();
        // Focus search input after a brief delay to allow DOM to update
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 10);
      }
    }
  }, [disabled, isOpen, calculateDropdownPosition]);

  const removeTrainer = useCallback((trainerId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelectedTrainers = selectedTrainers.filter(t => t.id !== trainerId);
    onChange(newSelectedTrainers);
  }, [selectedTrainers, onChange]);

  const hasReachedMax = maxSelections ? selectedTrainers.length >= maxSelections : false;

  return (
    <>
      <div ref={dropdownRef} className={cn('relative w-full', className)}>
        <div ref={triggerRef} className="relative">
          <div
            onClick={handleToggleDropdown}
            className={cn(
              'w-full h-auto min-h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'transition-all duration-150',
              isOpen && 'ring-2 ring-blue-500 border-blue-500'
            )}
          >
          {selectedTrainers.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTrainers.map((trainer) => (
                <span
                  key={trainer.id}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md transition-colors"
                >
                  {trainer.name}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeTrainer(trainer.id, e)}
                      className="text-blue-500 hover:text-blue-700 ml-1 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400">
              {isLoading && isOpen ? 'Loading trainers…' : placeholder}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleDropdown();
          }}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed transition-colors"
          aria-label="Toggle trainers"
        >
          <svg className={cn('w-4 h-4 transition-transform duration-150', isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      </div>

      {/* Portal for dropdown */}
      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg transition-all duration-150"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {/* Search input inside dropdown */}
          <div className="p-3 border-b border-slate-100">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search trainers..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Loading trainers…</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : hasReachedMax ? (
            <div className="px-3 py-2 text-sm text-slate-500">
              Maximum {maxSelections} trainer{maxSelections > 1 ? 's' : ''} can be selected
            </div>
          ) : (
            <>
              {allowUnassigned && selectedTrainers.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none border-b border-slate-100'
                  )}
                >
                  <div className="font-medium text-slate-900">
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Selections
                    </span>
                  </div>
                </button>
              )}
              {filteredTrainers.length === 0 && !allowUnassigned ? (
                <div className="px-3 py-2 text-sm text-slate-500">No trainers found</div>
              ) : filteredTrainers.length === 0 && allowUnassigned ? (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  No trainers match your search
                </div>
              ) : (
                filteredTrainers.map((trainer) => {
                  const isSelected = value.includes(trainer.id);
                  return (
                    <button
                      key={trainer.id}
                      type="button"
                      onClick={() => handleToggleTrainer(trainer)}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                        isSelected ? 'bg-blue-50 text-blue-700' : '',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-slate-900">{trainer.name}</div>
                            {trainer.expertiseTags && trainer.expertiseTags.length > 0 && (
                              <div className="text-xs text-slate-500">
                                {trainer.expertiseTags.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
