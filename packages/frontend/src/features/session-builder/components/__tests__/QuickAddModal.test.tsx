import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuickAddModal } from '../QuickAddModal';
import { SectionType } from '../../../../services/session-builder.service';

describe('QuickAddModal', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(
      <QuickAddModal
        open={false}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    expect(screen.queryByText('Quick Add Section')).not.toBeInTheDocument();
  });

  it('renders when open is true', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    expect(screen.getByText('Quick Add Section')).toBeInTheDocument();
    expect(
      screen.getByText('Choose a block to append to your draft outline. You can refine details after adding.')
    ).toBeInTheDocument();
  });

  it('displays all section type options', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    // Check that all section types are rendered
    expect(screen.getByText('Opener')).toBeInTheDocument();
    expect(screen.getByText('Topic Block')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
    expect(screen.getByText('Discussion')).toBeInTheDocument();
    expect(screen.getByText('Closing')).toBeInTheDocument();
    expect(screen.getByText('Custom Block')).toBeInTheDocument();

    // Check descriptions
    expect(screen.getByText('Kick off energy and context setting.')).toBeInTheDocument();
    expect(screen.getByText('Teaching moments with learning objectives.')).toBeInTheDocument();
    expect(screen.getByText('Hands-on practice with guided facilitation.')).toBeInTheDocument();
  });

  it('calls onAdd and onClose when section option is clicked', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const openerButton = screen.getByRole('button', { name: /Opener.*Kick off energy/ });
    fireEvent.click(openerButton);

    expect(mockOnAdd).toHaveBeenCalledWith('opener');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const closeButton = screen.getByLabelText('Close quick add');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Space' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls onAdd with correct section types for different options', () => {
    const { unmount } = render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    // Test different section types
    const topicButton = screen.getByRole('button', { name: /Topic Block.*Teaching moments/ });
    fireEvent.click(topicButton);

    expect(mockOnAdd).toHaveBeenCalledWith('topic');

    // Reset mocks and test another type
    vi.clearAllMocks();
    unmount();

    // Re-render since clicking closes the modal
    render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const [exerciseButton] = screen.getAllByRole('button', { name: /Exercise.*Hands-on practice/ });
    fireEvent.click(exerciseButton);

    expect(mockOnAdd).toHaveBeenCalledWith('exercise');
  });

  it('has proper modal overlay styling', () => {
    const { container } = render(
      <QuickAddModal
        open={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
  });
});
