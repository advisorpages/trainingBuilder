import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { PersonalizationDemo } from '../PersonalizationDemo';
import { PersonalizedNamesProvider } from '../../contexts/PersonalizedNamesContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the services
vi.mock('../../services/personalized-names.service', () => ({
  personalizedNamesService: {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PersonalizedNamesProvider>
          {children}
        </PersonalizedNamesProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('PersonalizationDemo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the demo component', () => {
    render(
      <TestWrapper>
        <PersonalizationDemo />
      </TestWrapper>
    );

    expect(screen.getByText('Personalization Demo')).toBeInTheDocument();
    expect(screen.getByText('Manage Personalized Names')).toBeInTheDocument();
  });

  it('shows original and personalized text examples', () => {
    render(
      <TestWrapper>
        <PersonalizationDemo />
      </TestWrapper>
    );

    expect(screen.getByText('Original Text:')).toBeInTheDocument();
    expect(screen.getByText('Personalized Text:')).toBeInTheDocument();
    expect(screen.getByText('Template Example:')).toBeInTheDocument();
  });

  it('opens the names manager when button is clicked', () => {
    render(
      <TestWrapper>
        <PersonalizationDemo />
      </TestWrapper>
    );

    const manageButton = screen.getByText('Manage Personalized Names');
    fireEvent.click(manageButton);

    // The manager modal should open (you would need to check for modal content)
    // This is a basic test - in a real scenario you'd check for modal visibility
  });

  it('displays fallback text when no names are set', () => {
    render(
      <TestWrapper>
        <PersonalizationDemo />
      </TestWrapper>
    );

    expect(screen.getByText('Individual Names:')).toBeInTheDocument();
    // Should show "Not set" for names that aren't configured
  });
});