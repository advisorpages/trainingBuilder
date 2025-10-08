import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Location } from '@leadership-training/shared';
import { locationService } from '../../services/location.service';
import { cn } from '../../lib/utils';

interface LocationSelectProps {
  value?: number | '';
  selectedLabel?: string;
  onChange: (location: { id: number; name: string } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
}

export const LocationSelect: React.FC<LocationSelectProps> = ({
  value,
  selectedLabel,
  onChange,
  placeholder = 'Select a location…',
  className,
  disabled = false,
  required = false,
  hasError = false,
}) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadTimeoutRef = useRef<number | null>(null);

  const loadLocations = useCallback(
    async (term: string) => {
      try {
        setIsLoading(true);
        const response = await locationService.getLocations({
          search: term || undefined,
          limit: 25,
          isActive: true,
        });
        setLocations(response.locations || []);
        setError(null);
      } catch (err) {
        console.error('Failed to load locations', err);
        setError('Failed to load locations');
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
      void loadLocations(searchTerm);
    }, 250);

    return () => {
      if (loadTimeoutRef.current) {
        window.clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    };
  }, [isOpen, loadLocations, searchTerm]);

  useEffect(() => {
    if (locations.length === 0 && !isLoading) {
      void loadLocations('');
    }
  }, [loadLocations, locations.length, isLoading]);

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

  const selectedLocation = useMemo(() => {
    if (typeof value !== 'number') {
      return undefined;
    }

    return locations.find((location) => location.id === value);
  }, [locations, value]);

  const displayValue = isOpen
    ? searchTerm
    : selectedLocation?.name ?? selectedLabel ?? '';

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectLocation = (location: Location) => {
    onChange({ id: location.id, name: location.name });
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
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={isLoading ? 'Loading locations…' : placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md shadow-sm placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            'disabled:cursor-not-allowed disabled:opacity-60',
            required && !value ? 'border-red-300' : null,
          )}
          autoComplete="off"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClearSelection}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear selected location"
          >
            ×
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
          aria-label="Toggle locations"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-500">Loading locations…</div>
          ) : error ? (
            <div className="px-3 py-2 text-sm text-red-600">{error}</div>
          ) : filteredLocations.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500">No locations found</div>
          ) : (
            filteredLocations.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => handleSelectLocation(location)}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
                  value === location.id ? 'bg-blue-50 text-blue-700' : '',
                )}
              >
                <div className="font-medium text-slate-900">{location.name}</div>
                {location.address && (
                  <div className="text-xs text-slate-500">{location.address}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
