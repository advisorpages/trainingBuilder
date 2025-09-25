import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { SessionForm } from '../SessionForm';
import { vi } from 'vitest';
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
  saveDraft: vi.fn().mockResolvedValue({ id: 1 }),
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

const createAuthContextValue = (): AuthContextType => ({
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
});

const renderSessionForm = (overrideProps: Partial<React.ComponentProps<typeof SessionForm>> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const props = {
    onSubmit,
    onCancel,
    isSubmitting: false,
    ...overrideProps,
  } as React.ComponentProps<typeof SessionForm>;

  const authValue = createAuthContextValue();

  const view = render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <SessionForm {...props} />
      </AuthContext.Provider>
    </BrowserRouter>
  );

  return { ...view, authValue, onSubmit, onCancel };
};

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  it('renders core session form sections and controls', async () => {
    renderSessionForm();

    expect(await screen.findByLabelText(/session title/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /basic information/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /session topics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enhance with ai/i })).toBeInTheDocument();
  });

  it('shows validation feedback when required fields are missing', async () => {
    renderSessionForm();

    const titleInput = await screen.findByLabelText(/session title/i);
    fireEvent.change(titleInput, { target: { value: ' ' } });

    fireEvent.click(screen.getByRole('button', { name: /save draft/i }));

    expect(await screen.findByText(/session title is required/i)).toBeInTheDocument();
  });

  it('submits sanitized data when the form is valid', async () => {
    const { onSubmit } = renderSessionForm();

    const titleInput = await screen.findByLabelText(/session title/i);
    fireEvent.change(titleInput, { target: { value: '  Leading with Impact  ' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save draft/i }));
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    const submission = onSubmit.mock.calls[0][0];
    expect(submission.title).toBe('Leading with Impact');
    expect(submission.startTime).toBeInstanceOf(Date);
    expect(submission.maxRegistrations).toBeGreaterThan(0);
  });

  it('expands the AI content workflow when Enhance with AI is clicked', async () => {
    renderSessionForm();

    const enhanceButton = await screen.findByRole('button', { name: /enhance with ai/i });
    fireEvent.click(enhanceButton);

    expect(await screen.findByRole('button', { name: /step 1: generate ai prompt/i })).toBeInTheDocument();
  });

  it('invokes onCancel when the cancel button is pressed', async () => {
    const { onCancel } = renderSessionForm();

    await screen.findByLabelText(/session title/i);

    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
