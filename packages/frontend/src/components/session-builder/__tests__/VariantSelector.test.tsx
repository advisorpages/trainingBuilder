import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VariantSelector } from '../VariantSelector';

const buildVariant = (overrides: Partial<any> = {}) => ({
  id: overrides.id ?? 'variant-1',
  label: overrides.label ?? 'Knowledge Base-Driven',
  description: overrides.description ?? 'Based on your training materials',
  generationSource: overrides.generationSource ?? 'rag',
  ragWeight: overrides.ragWeight ?? 0.8,
  ragSourcesUsed: overrides.ragSourcesUsed ?? 3,
  outline: {
    suggestedSessionTitle: overrides.outline?.suggestedSessionTitle ?? 'Leadership Session',
    totalDuration: overrides.outline?.totalDuration ?? 90,
    sections: overrides.outline?.sections ?? [
      { id: 'sec-1', title: 'Opening', duration: 15, description: 'Kick things off.' },
      { id: 'sec-2', title: 'Workshop', duration: 60, description: 'Hands-on practice.' },
    ],
  },
  ...overrides,
});

describe('VariantSelector', () => {
  it('updates loading stage when progress increases', async () => {
    const { rerender } = render(
      <VariantSelector
        variants={[]}
        onSelect={vi.fn()}
        isLoading
        loadingProgress={0}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Looking for your best ideas/)).toBeInTheDocument();
    });

    rerender(
      <VariantSelector
        variants={[]}
        onSelect={vi.fn()}
        isLoading
        loadingProgress={65}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Building Version 1/)).toBeInTheDocument();
    });

    rerender(
      <VariantSelector
        variants={[]}
        onSelect={vi.fn()}
        isLoading
        loadingProgress={100}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Your four session ideas are ready/)).toBeInTheDocument();
    });
  });

  it('syncs loading stage with external progress', async () => {
    await act(async () => {
      render(
        <VariantSelector
          variants={[]}
          onSelect={vi.fn()}
          isLoading
          loadingProgress={85}
        />
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Building Version 3 — bold and creative/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Generating 4 variants... 85%/)).toBeInTheDocument();
  });

  it('renders live progress log when loadingStage provided', async () => {
    await act(async () => {
      render(
        <VariantSelector
          variants={[]}
          onSelect={vi.fn()}
          isLoading
          loadingStage="Generating creative outline"
        />
      );
    });

    expect(screen.getByText(/Generating creative outline/)).toBeInTheDocument();
    expect(screen.getByText(/RAG query sent/)).toBeInTheDocument();
  });

  it('renders variants and triggers callbacks', () => {
    const onSelect = vi.fn();
    const onSave = vi.fn();
    const variants = [
      buildVariant({ id: 'variant-1', label: 'Knowledge Base-Driven' }),
      buildVariant({
        id: 'variant-2',
        label: 'Creative Approach',
        generationSource: 'baseline',
        description: 'Fresh perspective',
      }),
    ];

    render(
      <VariantSelector
        variants={variants}
        onSelect={onSelect}
        onSaveForLater={onSave}
      />
    );

    expect(screen.getByText('Knowledge Base-Driven')).toBeInTheDocument();
    expect(screen.getByText('Creative Approach')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Select & Edit' })).toHaveLength(2);
    expect(screen.getAllByText('RAG')).toHaveLength(1);
    expect(screen.getAllByText('AI')).toHaveLength(1);

    fireEvent.click(screen.getAllByRole('button', { name: 'Select & Edit' })[0]);
    expect(onSelect).toHaveBeenCalledWith('variant-1');

    fireEvent.click(screen.getAllByTitle('Save for later')[0]);
    expect(onSave).toHaveBeenCalledWith('variant-1');
  });

  it('omits save-for-later action when handler not provided', () => {
    const variant = buildVariant();

    render(
      <VariantSelector
        variants={[variant]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByTitle('Save for later')).not.toBeInTheDocument();
  });
});
