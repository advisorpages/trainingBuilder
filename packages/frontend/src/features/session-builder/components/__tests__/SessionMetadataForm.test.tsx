import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SessionMetadataForm } from '../SessionMetadataForm';
import { SessionMetadata } from '../../state/types';

describe('SessionMetadataForm', () => {
  const mockOnChange = vi.fn();
  const mockOnTriggerAI = vi.fn();
  const mockOnAutosave = vi.fn();

  const defaultMetadata: SessionMetadata = {
    title: 'Test Session',
    sessionType: 'workshop',
    category: 'Leadership',
    desiredOutcome: 'Improve team collaboration',
    currentProblem: 'Communication gaps',
    specificTopics: 'Active listening, feedback',
    startDate: '2025-09-26',
    startTime: '2025-09-26T09:00:00.000Z',
    endTime: '2025-09-26T10:30:00.000Z',
    timezone: 'America/New_York',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields with correct values', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
      />
    );

    expect(screen.getByDisplayValue('Test Session')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Leadership')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /session type/i })).toHaveValue('workshop');
    expect(screen.getByDisplayValue('Improve team collaboration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Communication gaps')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Active listening, feedback')).toBeInTheDocument();
  });

  it('calls onChange when title is updated', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
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
        onTriggerAI={mockOnTriggerAI}
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
        onTriggerAI={mockOnTriggerAI}
      />
    );

    const sessionTypeSelect = screen.getByRole('combobox', { name: /session type/i });
    fireEvent.change(sessionTypeSelect, { target: { value: 'training' } });

    expect(mockOnChange).toHaveBeenCalledWith({ sessionType: 'training' });
  });

  it('calls onTriggerAI when Generate Outline button is clicked', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
      />
    );

    const generateButton = screen.getByRole('button', { name: 'Generate Outline' });
    fireEvent.click(generateButton);

    expect(mockOnTriggerAI).toHaveBeenCalledTimes(1);
  });

  it('displays autosave button when onAutosave is provided', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
        onAutosave={mockOnAutosave}
      />
    );

    expect(screen.getByRole('button', { name: 'Save Now' })).toBeInTheDocument();
  });

  it('calls onAutosave when Save Draft button is clicked', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
        onAutosave={mockOnAutosave}
      />
    );

    const saveButton = screen.getByRole('button', { name: 'Save Now' });
    fireEvent.click(saveButton);

    expect(mockOnAutosave).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on autosave button when isAutosaving is true', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
        onAutosave={mockOnAutosave}
        isAutosaving={true}
      />
    );

    const savingButton = screen.getByRole('button', { name: /saving/i });
    expect(savingButton).toBeDisabled();
  });

  it('handles textarea inputs correctly', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
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
        onTriggerAI={mockOnTriggerAI}
      />
    );

    const sessionTypeSelect = screen.getByRole('combobox', { name: /session type/i });

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
        onTriggerAI={mockOnTriggerAI}
      />
    );

    // Check that date input is rendered
    const dateInput = screen.getByDisplayValue('2025-09-26');
    expect(dateInput).toBeInTheDocument();

    // Test date change
    fireEvent.change(dateInput, { target: { value: '2025-10-01' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('does not show autosave button when onAutosave is not provided', () => {
    render(
      <SessionMetadataForm
        metadata={defaultMetadata}
        onChange={mockOnChange}
        onTriggerAI={mockOnTriggerAI}
      />
    );

    expect(screen.queryByRole('button', { name: 'Save Now' })).not.toBeInTheDocument();
  });
});
