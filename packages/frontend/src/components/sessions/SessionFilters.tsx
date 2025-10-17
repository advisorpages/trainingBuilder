import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Filter, X, Calendar, User, MapPin, Tag } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { transformLocationName, getShortLocationDisplay } from '../../utils/locationPrivacy';
import { maskTrainerName, getTrainerDisplayString } from '../../utils/trainerPrivacy';

export interface FilterOptions {
  dateRange: string;
  trainer: string;
  category: string;
  location: string;
}

interface SessionFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTrainers: Array<{ id: number | string; name?: string }>;
  availableCategories: Array<{ id: string; name: string }>;
  availableLocations: string[];
  isMobileFilterOpen?: boolean;
  onMobileFilterToggle?: () => void;
}

// Date range options
const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All Dates' },
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'nextWeek', label: 'Next Week' },
  { value: 'nextMonth', label: 'Next Month' },
  { value: 'custom', label: 'Custom Range' }
];

export const SessionFilters: React.FC<SessionFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTrainers,
  availableCategories,
  availableLocations,
  isMobileFilterOpen = false,
  onMobileFilterToggle
}) => {
  const breakpoint = useBreakpoint();
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    if (filters.dateRange && filters.dateRange !== 'all') count++;
    if (filters.trainer && filters.trainer !== 'all') count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.location && filters.location !== 'all') count++;
    setActiveFilterCount(count);
  }, [filters]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: 'all',
      trainer: 'all',
      category: 'all',
      location: 'all'
    });
  };

  const hasActiveFilters = activeFilterCount > 0;

  // Mobile filter button (when collapsed)
  if (breakpoint === 'mobile' && !isMobileFilterOpen) {
    return (
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={onMobileFilterToggle}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  // Main filters panel
  return (
    <Card className="h-full">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
            {breakpoint === 'mobile' && onMobileFilterToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileFilterToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Filter Content */}
      <CardContent className="space-y-6 pb-6">
        {/* Date Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4" />
            Date Range
          </div>
          <Select
            value={filters.dateRange}
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Trainer Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <User className="h-4 w-4" />
            Trainer
          </div>
          <Select
            value={filters.trainer}
            onValueChange={(value) => handleFilterChange('trainer', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All trainers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trainers</SelectItem>
              {availableTrainers
                .filter(trainer => trainer.name)
                .sort((a, b) => maskTrainerName(a.name).localeCompare(maskTrainerName(b.name)))
                .map((trainer) => (
                  <SelectItem key={trainer.id} value={trainer.id.toString()}>
                    {maskTrainerName(trainer.name)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Tag className="h-4 w-4" />
            Category
          </div>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <MapPin className="h-4 w-4" />
            Location
          </div>
          <Select
            value={filters.location}
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations
                .map(location => transformLocationName(location))
                .filter((location, index, arr) => arr.indexOf(location) === index) // Remove duplicates
                .sort((a, b) => a.localeCompare(b))
                .map((location, index) => (
                  <SelectItem key={index} value={location}>
                    {getShortLocationDisplay(location)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-500 mb-2">Active Filters:</div>
            <div className="flex flex-wrap gap-1">
              {filters.dateRange !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Date: {DATE_RANGE_OPTIONS.find(opt => opt.value === filters.dateRange)?.label}
                </Badge>
              )}
              {filters.trainer !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Trainer: {maskTrainerName(availableTrainers.find(t => t.id.toString() === filters.trainer)?.name)}
                </Badge>
              )}
              {filters.category !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Category: {availableCategories.find(c => c.id === filters.category)?.name}
                </Badge>
              )}
              {filters.location !== 'all' && (
                <Badge variant="outline" className="text-xs">
                  Location: {getShortLocationDisplay(filters.location)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionFilters;