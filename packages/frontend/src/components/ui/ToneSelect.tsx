import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Tone } from '@leadership-training/shared';
import { toneService } from '../../services/tone.service';
import { cn } from '../../lib/utils';

interface ToneSelectProps {
  value?: number | '';
  selectedLabel?: string;
  onChange: (tone: { id: number; name: string } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ToneSelect: React.FC<ToneSelectProps> = ({
  value,
  selectedLabel,
  onChange,
  placeholder = 'Select a tone…',
  className,
  disabled = false,
}) => {
  const [tones, setTones] = useState<Tone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const loadTones = useCallback(
    async (term: string) => {
      try {
        setIsLoading(true);
        const response = await toneService.getTones({
          search: term || undefined,
          limit: 25,
          isActive: true,
        });
        setTones(response.tones || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load tones', err);
        setError('Failed to load tones');
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
      void loadTones(searchTerm);
    }, 250);

    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, loadTones, searchTerm]);

  useEffect(() => {
    if (tones.length === 0 && !isLoading) {
      void loadTones('');
    }
  }, [isLoading, loadTones, tones.length]);

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

  const selectedTone = useMemo(() => {
    if (typeof value !== 'number') {
      return undefined;
    }
    return tones.find((tone) => tone.id === value);
  }, [tones, value]);

  const displayValue = isOpen ? searchTerm : selectedTone?.name ?? selectedLabel ?? '';

  const filteredTones = tones.filter((tone) =>
    tone.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectTone = (tone: Tone) => {
    onChange({ id: tone.id, name: tone.name });
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
          placeholder={isLoading ? 'Loading tones…' : placeholder}
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
            aria-label="Clear selected tone"
          >
            ×
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
          aria-label="Toggle tones"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Loading tones…</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : filteredTones.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No tones found</div>
          ) : (
            filteredTones.map((tone) => (
              <button
                key={tone.id}
                type="button"
                onClick={() => handleSelectTone(tone)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                  value === tone.id ? 'bg-blue-50 text-blue-700' : '',
                )}
              >
                <div className="font-medium text-slate-900">{tone.name}</div>
                {tone.description && (
                  <div className="text-xs text-slate-500">{tone.description}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

