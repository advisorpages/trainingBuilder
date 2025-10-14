import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';
import { cn } from '../../lib/utils';

interface TrainerGridSelectorProps {
  value?: number | '';
  selectedLabel?: string;
  onChange: (trainer: Trainer | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeIds?: number[];
}

type SuggestionState =
  | { status: 'idle'; items: Trainer[] }
  | { status: 'loading'; items: Trainer[] }
  | { status: 'error'; items: Trainer[]; message: string }
  | { status: 'success'; items: Trainer[] };

const MAX_SUGGESTIONS = 8;
const DEBOUNCE_MS = 200;

export const TrainerGridSelector: React.FC<TrainerGridSelectorProps> = ({
  value,
  selectedLabel,
  onChange,
  placeholder = 'Type a trainer name…',
  className,
  disabled = false,
  excludeIds = [],
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<SuggestionState>({ status: 'idle', items: [] });
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<number>();
  const skipSyncRef = useRef(false);
  const excludeIdsMemo = React.useMemo(() => excludeIds ?? [], [excludeIds]);

  const fetchSuggestions = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) {
        setSuggestions({ status: 'idle', items: [] });
        return;
      }

      const requestId = ++fetchIdRef.current;
      console.log('[TrainerGridSelector] Setting status to loading');
      setSuggestions((prev) => ({ status: 'loading', items: prev.items }));

      try {
        const response = await trainerService.getTrainers({
          search: trimmed,
          limit: MAX_SUGGESTIONS,
          page: 1,
          isActive: true,
        });

        console.log('[TrainerGridSelector] API response:', response);

        if (fetchIdRef.current !== requestId) {
          console.log('[TrainerGridSelector] Request outdated, ignoring');
          return;
        }

        const filtered = (response.trainers ?? []).filter(
          (trainer) => !excludeIdsMemo.includes(trainer.id),
        );

        console.log('[TrainerGridSelector] Filtered trainers:', filtered.length, filtered);
        setSuggestions({ status: 'success', items: filtered });
        setHighlightedIndex(filtered.length > 0 ? 0 : -1);
      } catch (error) {
        console.error('[TrainerGridSelector] API error:', error);
        setSuggestions({
          status: 'error',
          items: [],
          message: 'Unable to load trainers. Try again.',
        });
        setHighlightedIndex(-1);
      }
    },
    [excludeIdsMemo],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value: next } = event.target;
    console.log('[TrainerGridSelector] Input changed:', next);
    skipSyncRef.current = true;
    setInputValue(next);
    setIsOpen(true);
    setHighlightedIndex(-1);

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      console.log('[TrainerGridSelector] Fetching suggestions for:', next);
      void fetchSuggestions(next);
    }, DEBOUNCE_MS);
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    if (inputValue.trim()) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        void fetchSuggestions(inputValue);
      }, DEBOUNCE_MS);
    }
  };

  const handleSelect = (trainer: Trainer) => {
    skipSyncRef.current = true;
    setSelectedTrainer(trainer);
    setInputValue(trainer.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSuggestions({ status: 'success', items: [trainer] });
    onChange(trainer);
  };

  const handleClear = () => {
    skipSyncRef.current = true;
    setSelectedTrainer(null);
    setInputValue('');
    setSuggestions({ status: 'idle', items: [] });
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown') {
        setIsOpen(true);
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const items = suggestions.items;
        if (items.length === 0) return -1;
        const next = prev + 1;
        return next >= items.length ? items.length - 1 : next;
      });
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? -1 : next;
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.items.length) {
        handleSelect(suggestions.items[highlightedIndex]);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }

    let isMounted = true;

    if (typeof value === 'number') {
      const loadTrainer = async () => {
        try {
          const trainer = await trainerService.getTrainer(value);
          if (!isMounted) return;
          if (excludeIdsMemo.includes(trainer.id)) {
            return;
          }
          setSelectedTrainer(trainer);
          setInputValue(trainer.name);
          setSuggestions({ status: 'success', items: [trainer] });
          setIsOpen(false);
          setHighlightedIndex(-1);
        } catch (error) {
          console.error('TrainerGridSelector: failed to fetch selected trainer', error);
        }
      };
      void loadTrainer();
      return () => {
        isMounted = false;
      };
    }

    if (isMounted) {
      setSelectedTrainer((prev) => (prev === null ? prev : null));

      if (selectedLabel) {
        setInputValue((prev) => (prev === selectedLabel ? prev : selectedLabel));
        setSuggestions({ status: 'success', items: [] });
        if (isOpen) {
          setIsOpen(false);
        }
        if (highlightedIndex !== -1) {
          setHighlightedIndex(-1);
        }
      } else {
        setSuggestions((prev) =>
          prev.status === 'idle' && prev.items.length === 0 ? prev : { status: 'idle', items: [] },
        );
      }
    }

    return () => {
      isMounted = false;
    };
  }, [value, selectedLabel, excludeIdsMemo]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => window.clearTimeout(debounceRef.current), []);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-activedescendant={
          highlightedIndex >= 0 && suggestions.items[highlightedIndex]
            ? `trainer-option-${suggestions.items[highlightedIndex].id}`
            : undefined
        }
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none',
          selectedTrainer
            ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200'
            : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      />

      {selectedTrainer && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label="Clear trainer selection"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {selectedTrainer && (
        <div
          className="mt-2 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div className="flex-1">
            <div className="font-semibold">{selectedTrainer.name}</div>
            {selectedTrainer.expertiseTags && selectedTrainer.expertiseTags.length > 0 && (
              <div className="text-xs text-emerald-700">
                {selectedTrainer.expertiseTags.slice(0, 2).join(', ')}
                {selectedTrainer.expertiseTags.length > 2
                  ? ` +${selectedTrainer.expertiseTags.length - 2} more`
                  : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mt-1 text-xs text-slate-500 border border-yellow-300 bg-yellow-50 p-2 rounded">
        DEBUG: isOpen={String(isOpen)} | status={suggestions.status} | items={suggestions.items.length} | input="{inputValue}"
      </div>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full min-h-[100px] overflow-hidden rounded-md border-4 border-blue-500 bg-white shadow-lg"
        >
          {suggestions.status === 'loading' && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Loading trainers…
            </div>
          )}

          {suggestions.status === 'error' && (
            <div className="px-3 py-2 text-sm text-red-600">{suggestions.message}</div>
          )}

          {(suggestions.status === 'success' || suggestions.status === 'loading') &&
            suggestions.items.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">
                {inputValue.trim() ? 'No trainers match that search.' : 'Start typing to search trainers.'}
              </div>
            )}

          {suggestions.items.map((trainer, index) => (
            <button
              key={trainer.id}
              id={`trainer-option-${trainer.id}`}
              type="button"
              onClick={() => handleSelect(trainer)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                'flex w-full flex-col items-start gap-1 px-3 py-2 text-left text-sm transition-colors',
                index === highlightedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50',
              )}
              role="option"
              aria-selected={index === highlightedIndex}
            >
              <span className="font-medium">{trainer.name}</span>
              {trainer.expertiseTags && trainer.expertiseTags.length > 0 && (
                <span className="text-xs text-slate-500">
                  {trainer.expertiseTags.slice(0, 3).join(', ')}
                  {trainer.expertiseTags.length > 3
                    ? ` +${trainer.expertiseTags.length - 3} more`
                    : ''}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
