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

  it('displays idle status correctly', () => {
    render(
      <AutosaveIndicator
        status="idle"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
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
  });

  it('displays success status', () => {
    render(
      <AutosaveIndicator
        status="success"
        lastSavedAt="2025-09-26T12:00:00.000Z"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    // Check that timestamp is displayed (exact format may vary by locale)
    expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('displays error status', () => {
    render(
      <AutosaveIndicator
        status="error"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Save failed')).toBeInTheDocument();
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

  it('handles missing lastSavedAt gracefully', () => {
    render(
      <AutosaveIndicator
        status="success"
        onManualSave={mockOnManualSave}
      />
    );

    expect(screen.getByText('Saved')).toBeInTheDocument();
    // Should not display any timestamp
    expect(screen.queryByText(/\d{1,2}:\d{2}:\d{2}/)).not.toBeInTheDocument();
  });

  it('has proper styling classes for different statuses', () => {
    const { rerender } = render(
      <AutosaveIndicator
        status="idle"
        onManualSave={mockOnManualSave}
      />
    );

    // Test idle status styling
    expect(screen.getByText('Saved')).toHaveClass('text-slate-500');

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
    expect(screen.getByText('Saved')).toHaveClass('text-green-600');

    // Test error status styling
    rerender(
      <AutosaveIndicator
        status="error"
        onManualSave={mockOnManualSave}
      />
    );
    expect(screen.getByText('Save failed')).toHaveClass('text-red-600');
  });
});