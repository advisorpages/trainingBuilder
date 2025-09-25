import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { SessionForm } from '@/components/sessions/SessionForm';
import { AuthContextType, UserRole } from '@/types/auth.types';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: undefined }),
  };
});

const mockSessionService = vi.hoisted(() => ({
  autoSaveDraft: vi.fn().mockResolvedValue({ success: true, lastSaved: new Date().toISOString() }),
  getDrafts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/services/session.service', () => ({
  sessionService: mockSessionService,
}));

const trainerFixtures = vi.hoisted(() => ([
  {
    id: 1,
    firstName: 'Alex',
    lastName: 'Morgan',
    name: 'Alex Morgan',
    expertise: 'Leadership',
    specialization: 'Coaching',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

const locationFixtures = vi.hoisted(() => ([
  {
    id: 1,
    name: 'Downtown Campus',
    address: '123 Main St',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

const audienceFixtures = vi.hoisted(() => ([
  {
    id: 1,
    name: 'New Managers',
    description: 'Leaders with 1-3 years experience',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

const toneFixtures = vi.hoisted(() => ([
  {
    id: 1,
    name: 'Professional',
    description: 'Confident and concise',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

const categoryFixtures = vi.hoisted(() => ([
  {
    id: 1,
    name: 'Leadership',
    description: 'Leadership development topics',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

const topicFixtures = vi.hoisted(() => ([
  {
    id: 101,
    name: 'Leading Through Change',
    description: 'Help teams navigate organizational change effectively.',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]));

vi.mock('@/services/trainer.service', () => ({
  trainerService: {
    getActiveTrainers: vi.fn().mockResolvedValue(trainerFixtures),
  },
}));

vi.mock('@/services/location.service', () => ({
  locationService: {
    getActiveLocations: vi.fn().mockResolvedValue(locationFixtures),
  },
}));

vi.mock('@/services/attributes.service', () => ({
  attributesService: {
    getAudiences: vi.fn().mockResolvedValue(audienceFixtures),
    getTones: vi.fn().mockResolvedValue(toneFixtures),
    getCategories: vi.fn().mockResolvedValue(categoryFixtures),
  },
}));

vi.mock('@/services/topic.service', () => ({
  topicService: {
    getActiveTopics: vi.fn().mockResolvedValue(topicFixtures),
  },
}));

const mockAuthValue: AuthContextType = {
  user: {
    id: '1',
    email: 'test@example.com',
    role: {
      id: 2,
      name: UserRole.CONTENT_DEVELOPER,
      key: 'content_developer',
    },
    isActive: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  refreshToken: vi.fn().mockResolvedValue(true),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Session Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('completes full session creation workflow', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    renderWithProviders(
      <SessionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/session title/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/session title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Training Session' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
    });

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    const submission = mockOnSubmit.mock.calls[0][0];
    expect(submission.title).toBe('Test Training Session');
    expect(submission.startTime).toBeInstanceOf(Date);
  });

  it('handles validation errors gracefully', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    renderWithProviders(
      <SessionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    // Wait for form to load completely (no longer showing skeleton/loading state)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save draft/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    // Wait for validation messages to appear
    await waitFor(() => {
      // Look for the specific validation message we can see in the HTML output
      expect(screen.getByText(/session title is required/i)).toBeInTheDocument();
    });

    // Verify the form didn't submit due to validation
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('navigates to AI generation when requirements are met', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    renderWithProviders(
      <SessionForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
      />
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/session title/i)).toBeInTheDocument();
    });

    // Look for the AI enhancement section
    const enhanceButton = await screen.findByRole('button', { name: /enhance with ai/i });
    fireEvent.click(enhanceButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /step 1: generate ai prompt/i })).toBeInTheDocument();
    });
  });
});
