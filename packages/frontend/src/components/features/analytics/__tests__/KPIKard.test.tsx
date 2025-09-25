import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KPIKard from '../KPIKard';

describe('KPIKard', () => {
  const mockProps = {
    title: 'Total Sessions',
    value: 42,
    change: 15.5,
    trend: 'up' as const,
    icon: '📊',
  };

  it('renders KPI card with all props', () => {
    render(<KPIKard {...mockProps} />);

    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('15.5%')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('shows positive trend with up arrow', () => {
    render(<KPIKard {...mockProps} trend="up" change={10} />);

    expect(screen.getByText('↗')).toBeInTheDocument();
    expect(screen.getByText('10%')).toHaveClass('text-green-600');
  });

  it('shows negative trend with down arrow', () => {
    render(<KPIKard {...mockProps} trend="down" change={-5.2} />);

    expect(screen.getByText('↘')).toBeInTheDocument();
    expect(screen.getByText('-5.2%')).toHaveClass('text-red-600');
  });

  it('shows stable trend with neutral styling', () => {
    render(<KPIKard {...mockProps} trend="stable" change={0} />);

    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('0%')).toHaveClass('text-gray-600');
  });

  it('formats large numbers correctly', () => {
    render(<KPIKard {...mockProps} value={1500} />);

    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    render(<KPIKard {...mockProps} value={0} change={0} trend="stable" />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies correct CSS classes for styling', () => {
    render(<KPIKard {...mockProps} />);

    const card = screen.getByText('Total Sessions').closest('div');
    expect(card).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow');
  });
});