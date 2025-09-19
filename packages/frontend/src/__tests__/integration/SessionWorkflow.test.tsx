import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { SessionForm } from '@/components/sessions/SessionForm';
import { vi } from 'vitest';

const mockSessionService = {
  getDrafts: vi.fn().mockResolvedValue([]),
  saveDraft: vi.fn().mockResolvedValue({ id: 1 }),
  getTopics: vi.fn().mockResolvedValue([
    { id: 1, name: 'Test Topic' }
  ]),
  getLocations: vi.fn().mockResolvedValue([
    { id: 1, name: 'Test Location' }
  ]),
  getTrainers: vi.fn().mockResolvedValue([
    { id: 1, firstName: 'John', lastName: 'Doe' }
  ]),
  getAudiences: vi.fn().mockResolvedValue([
    { id: 1, name: 'Test Audience' }
  ]),
  getTones: vi.fn().mockResolvedValue([
    { id: 1, name: 'Professional' }
  ]),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: 'Test Category' }
  ]),
};

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
  sessionService: mockSessionService,
}));

const mockAuthValue = {
  user: { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' },
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
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
  });

  it('completes full session creation workflow', async () => {
    renderWithProviders(<SessionForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/trainer/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/session date/i), { target: { value: '2024-12-31' } });
    fireEvent.change(screen.getByLabelText(/start time/i), { target: { value: '10:00' } });

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSessionService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          topicId: 1,
          locationId: 1,
          trainerId: 1,
          sessionDate: '2024-12-31',
          startTime: '10:00',
        })
      );
    });

    expect(screen.getByText(/draft saved successfully/i)).toBeInTheDocument();
  });

  it('handles validation errors gracefully', async () => {
    renderWithProviders(<SessionForm />);

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/topic is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/trainer is required/i)).toBeInTheDocument();
    });

    expect(mockSessionService.saveDraft).not.toHaveBeenCalled();
  });

  it('navigates to AI generation when requirements are met', async () => {
    renderWithProviders(<SessionForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/trainer/i), { target: { value: '1' } });

    const generateButton = screen.getByText(/generate ai content/i);
    expect(generateButton).not.toBeDisabled();

    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText(/ai prompt generator/i)).toBeInTheDocument();
    });
  });
});