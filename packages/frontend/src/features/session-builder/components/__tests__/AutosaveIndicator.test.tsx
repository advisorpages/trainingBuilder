import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AutosaveIndicator } from '../AutosaveIndicator';
import { AutosaveStatus } from '../../state/types';

describe('AutosaveIndicator', () => {
  const mockOnManualSave = vi.fn();

  beforeEach(() => {
    mockOnManualSave.mockClear();
  });

  it('displays idle status with helper copy', () => {
    render(
      <AutosaveIndicator
        status="idle"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Auto-save keeps your progress up to date.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save now' })).toBeInTheDocument();
  });

  it('displays pending status with loading state', () => {
    render(
      <AutosaveIndicator
        status="pending"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save now' })).toBeDisabled();
  });

  it('displays success status', () => {
    const timestamp = '2025-09-26T12:00:00.000Z';
    const expectedTime = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(timestamp));

    render(
      <AutosaveIndicator
        status="success"
        lastSavedAt={timestamp}
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText(`Saved at ${expectedTime}`)).toBeInTheDocument();
  });

  it('displays error status', () => {
    render(
      <AutosaveIndicator
        status="error"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('We could not save your latest changes.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeInTheDocument();
  });

  it('calls onManualSave when save button is clicked', () => {
    render(
      <AutosaveIndicator
        status="idle"
        onManualSave={mockOnManualSave}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save now' }));
    expect(mockOnManualSave).toHaveBeenCalledTimes(1);
  });

  it('renders undo control when provided', () => {
    const handleUndo = vi.fn();

    render(
      <AutosaveIndicator
        status="success"
        onManualSave={mockOnManualSave}
        canUndo
        onUndo={handleUndo}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });

  it('handles missing lastSavedAt gracefully', () => {
    render(
      <AutosaveIndicator
        status="success"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    // Should not display any timestamp
    expect(screen.getByText('Auto-save keeps your progress up to date.')).toBeInTheDocument();
  });

  it('has proper styling classes for different statuses', () => {
    const { rerender } = render(
      <AutosaveIndicator
        status="idle"
        onManualSave={mockOnManualSave}
      />
    );

    // Test idle status styling
    expect(screen.getByText('Saved')).toHaveClass('text-slate-600');

    // Test pending status styling
    rerender(
      <AutosaveIndicator
        status="pending"
        onManualSave={mockOnManualSave}
      />
    );
    expect(screen.getByText('Saving…')).toHaveClass('text-blue-600');

    // Test success status styling
    rerender(
      <AutosaveIndicator
        status="success"
        onManualSave={mockOnManualSave}
      />
    );
    expect(screen.getByText('Saved')).toHaveClass('text-emerald-600');

    // Test error status styling
    rerender(
      <AutosaveIndicator
        status="error"
        onManualSave={mockOnManualSave}
      />
    );
    expect(screen.getByText('Save failed')).toHaveClass('text-red-600');
  });

  it('exposes an accessible live region', () => {
    render(
      <AutosaveIndicator
        status="success"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByTestId('autosave-indicator')).toHaveAttribute('aria-live', 'polite');
  });
});
