import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trainer } from '@leadership-training/shared';
import { trainerService } from '../../services/trainer.service';
import { cn } from '../../lib/utils';

interface TrainerSelectProps {
  value?: number | '';
  selectedLabel?: string;
  onChange: (trainer: Trainer | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  excludeIds?: number[]; // IDs to exclude from the list (e.g., already assigned trainers)
}

export const TrainerSelect: React.FC<TrainerSelectProps> = ({
  value,
  selectedLabel,
  onChange,
  placeholder = 'Select a trainer…',
  className,
  disabled = false,
  excludeIds = [],
}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const loadTrainers = useCallback(
    async (term: string) => {
      try {
        setIsLoading(true);
        const response = await trainerService.getTrainers({
          search: term || undefined,
          limit: 25,
          isActive: true,
        });
        setTrainers(response.trainers || []);
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
    }, 250);

    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, loadTrainers, searchTerm]);

  useEffect(() => {
    if (trainers.length === 0 && !isLoading) {
      void loadTrainers('');
    }
  }, [loadTrainers, trainers.length, isLoading]);

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

  const selectedTrainer = useMemo(() => {
    if (typeof value !== 'number') {
      return undefined;
    }

    return trainers.find((trainer) => trainer.id === value);
  }, [trainers, value]);

  const displayValue = isOpen
    ? searchTerm
    : selectedTrainer?.name ?? selectedLabel ?? '';

  const filteredTrainers = trainers
    .filter((trainer) => !excludeIds.includes(trainer.id))
    .filter((trainer) =>
      trainer.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

  const handleSelectTrainer = (trainer: Trainer) => {
    onChange(trainer);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = () => {
    onChange(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={isLoading ? 'Loading trainers…' : placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
          autoComplete="off"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear selected trainer"
          >
            ×
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
          aria-label="Toggle trainers"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Loading trainers…</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : filteredTrainers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No trainers found</div>
          ) : (
            filteredTrainers.map((trainer) => (
              <button
                key={trainer.id}
                type="button"
                onClick={() => handleSelectTrainer(trainer)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                  value === trainer.id ? 'bg-blue-50 text-blue-700' : '',
                )}
              >
                <div className="font-medium text-slate-900">{trainer.name}</div>
                {trainer.expertiseTags && trainer.expertiseTags.length > 0 && (
                  <div className="text-xs text-slate-500">
                    {trainer.expertiseTags.join(', ')}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
