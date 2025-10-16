import { vi, beforeEach, describe, expect, it } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionMetadataForm } from '../SessionMetadataForm';
import { SessionMetadata } from '../../state/types';
import { LocationType, MeetingPlatform, TONE_DEFAULTS } from '@leadership-training/shared';

vi.mock('@/components/ui/CategorySelect', () => {
  const Component: React.FC<any> = ({ value, onChange, onCategoryChange, placeholder }) => (
    <input
      data-testid="category-select"
      value={value === undefined || value === '' ? '' : String(value)}
      placeholder={placeholder ?? 'Category'}
      onChange={(event) => {
        const rawValue = event.target.value;
        const parsedValue = rawValue ? Number(rawValue) : '';
        onChange(parsedValue);
        if (onCategoryChange) {
          onCategoryChange(parsedValue === '' ? null : { id: Number(parsedValue), name: 'Mock Category' });
        }
      }}
    />
  );
  return { __esModule: true, default: Component, CategorySelect: Component };
});

vi.mock('@/components/ui/LocationSelect', () => {
  const Component: React.FC<any> = ({ value, onChange }) => (
    <input
      data-testid="location-select"
      value={value === undefined || value === '' ? '' : String(value)}
      onChange={(event) => {
        const rawValue = event.target.value;
        onChange(
          rawValue
            ? {
                id: Number(rawValue),
                name: 'Mock Location',
                locationType: 'physical',
                meetingPlatform: 'zoom',
                capacity: 25,
                timezone: 'America/New_York',
                notes: 'Arrive early',
                accessInstructions: 'Check in at reception',
              }
            : null
        );
      }}
    />
  );
  return { __esModule: true, default: Component, LocationSelect: Component };
});

vi.mock('@/components/ui/AudienceSelect', () => {
  const Component: React.FC<any> = ({ value, onChange }) => (
    <input
      data-testid="audience-select"
      value={value === undefined || value === '' ? '' : String(value)}
      onChange={(event) => {
        const rawValue = event.target.value;
        onChange(rawValue ? { id: Number(rawValue), name: 'Mock Audience' } : null);
      }}
    />
  );
  return { __esModule: true, default: Component, AudienceSelect: Component };
});

vi.mock('../../../services/location.service', () => ({
  locationService: {
    getLocations: vi.fn().mockResolvedValue({ locations: [] })
  }
}));

vi.mock('../../../services/tone.service', () => ({
  toneService: {
    getTones: vi.fn().mockResolvedValue({ tones: [] })
  }
}));

describe('SessionMetadataForm', () => {
  const mockOnChange = vi.fn();

  const defaultMetadata: SessionMetadata = {
  title: 'Test Session',
  sessionType: null,
  category: 'Leadership',
  categoryId: 42,
  desiredOutcome: 'Improve team collaboration',
  currentProblem: 'Communication gaps',
  specificTopics: 'Active listening, feedback',
  startDate: '2025-09-26',
  startTime: '2025-09-26T09:00:00.000Z',
  endTime: '2025-09-26T10:30:00.000Z',
  timezone: 'America/New_York',
  location: 'Main Auditorium',
  locationId: 12,
  locationType: LocationType.PHYSICAL,
  meetingPlatform: MeetingPlatform.ZOOM,
  locationCapacity: 40,
  locationTimezone: 'America/New_York',
  locationNotes: 'Arrive 15 minutes early',
  audienceId: 5,
  audienceName: 'Team Leads',
  toneId: undefined,
  toneName: undefined,
  marketingToneId: undefined,
  marketingToneName: TONE_DEFAULTS.MARKETING,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields with correct values', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByDisplayValue('Test Session')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /session type/i })).toHaveValue('');
    expect(screen.getByDisplayValue('Improve team collaboration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Communication gaps')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active listening, feedback')).toBeInTheDocument();
  });

  it('calls onChange when title is updated', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    const titleInput = screen.getByDisplayValue('Test Session');
    fireEvent.change(titleInput, { target: { value: 'Updated Session Title' } });

    expect(mockOnChange).toHaveBeenCalledWith({ title: 'Updated Session Title' });
  });

  it('calls onChange when desired outcome is updated', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    const outcomeInput = screen.getByDisplayValue('Improve team collaboration');
    fireEvent.change(outcomeInput, { target: { value: 'Enhanced communication skills' } });

    expect(mockOnChange).toHaveBeenCalledWith({ desiredOutcome: 'Enhanced communication skills' });
  });

  it('calls onChange when session type is changed', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    const sessionTypeSelect = screen.getByRole('combobox', { name: /session type/i });
    fireEvent.change(sessionTypeSelect, { target: { value: 'training' } });

    expect(mockOnChange).toHaveBeenCalledWith({ sessionType: 'training' });
  });

  it('passes enriched location details when location changes', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    mockOnChange.mockClear();
    const locationInput = screen.getByTestId('location-select');
    fireEvent.change(locationInput, { target: { value: '21' } });

    expect(mockOnChange).toHaveBeenCalledWith({
      locationId: 21,
      location: 'Mock Location',
      locationType: 'physical',
      meetingPlatform: 'zoom',
      locationCapacity: 25,
      locationTimezone: 'America/New_York',
      locationNotes: 'Arrive early',
    });
  });

  it('handles textarea inputs correctly', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    const problemTextarea = screen.getByDisplayValue('Communication gaps');
    fireEvent.change(problemTextarea, { target: { value: 'New problem description' } });

    expect(mockOnChange).toHaveBeenCalledWith({ currentProblem: 'New problem description' });

    const topicsTextarea = screen.getByDisplayValue('Active listening, feedback');
    fireEvent.change(topicsTextarea, { target: { value: 'Conflict resolution, empathy' } });

    expect(mockOnChange).toHaveBeenCalledWith({ specificTopics: 'Conflict resolution, empathy' });
  });

  it('displays all session type options', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    // Check that all expected options are present
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Event')).toBeInTheDocument();
    expect(screen.getByText('Webinar')).toBeInTheDocument();
  });

  it('handles date and time inputs', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
      />
    );

    // Check that date input is rendered
    const dateInput = screen.getByDisplayValue('2025-09-26');
    expect(dateInput).toBeInTheDocument();

    // Test date change
    fireEvent.change(dateInput, { target: { value: '2025-10-01' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

});
