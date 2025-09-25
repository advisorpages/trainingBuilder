import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { SessionForm } from '../SessionForm';
import { vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: undefined }),
  };
});

vi.mock('@/services/session.service', () => ({
  sessionService: {
    getDrafts: vi.fn().mockResolvedValue([]),
    saveDraft: vi.fn().mockResolvedValue({ id: 1 }),
  },
}));

vi.mock('@/services/trainer.service', () => ({
  trainerService: {
    getActiveTrainers: vi.fn().mockResolvedValue([
      { id: 1, firstName: 'John', lastName: 'Doe' }
    ]),
  },
}));

vi.mock('@/services/location.service', () => ({
  locationService: {
    getActiveLocations: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Location' }
    ]),
  },
}));

vi.mock('@/services/attributes.service', () => ({
  attributesService: {
    getAudiences: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Audience' }
    ]),
    getTones: vi.fn().mockResolvedValue([
      { id: 1, name: 'Professional' }
    ]),
    getCategories: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Category' }
    ]),
  },
}));

vi.mock('@/services/topic.service', () => ({
  topicService: {
    getActiveTopics: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Topic' }
    ]),
  },
}));

const renderWithContext = (component: React.ReactElement) => {
  const authValue = {
    user: {
      id: 1,
      email: 'test@example.com',
      role: {
        id: 2,
        name: 'Content Developer',
        key: 'content_developer'
      },
      isActive: true,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    },
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders session form fields', async () => {
    renderWithContext(<SessionForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/trainer/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/session date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    });
  });

  it('shows required field validation', async () => {
    renderWithContext(<SessionForm />);

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/topic is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/trainer is required/i)).toBeInTheDocument();
    });
  });

  it('saves draft with valid data', async () => {
    const { sessionService } = await import('@/services/session.service');

    renderWithContext(<SessionForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/trainer/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/session date/i), { target: { value: '2024-12-31' } });

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(sessionService.saveDraft).toHaveBeenCalled();
    });
  });

  it('navigates to AI generation on generate content click', async () => {
    renderWithContext(<SessionForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/trainer/i), { target: { value: '1' } });

    const generateButton = screen.getByText(/generate ai content/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/ai prompt generator/i)).toBeInTheDocument();
    });
  });
});