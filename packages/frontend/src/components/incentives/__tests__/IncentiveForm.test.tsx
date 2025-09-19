import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { IncentiveForm } from '../IncentiveForm';
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

vi.mock('@/services/incentive.service', () => ({
  incentiveService: {
    getDrafts: vi.fn().mockResolvedValue([]),
    saveDraft: vi.fn().mockResolvedValue({ id: 1 }),
    generateContent: vi.fn().mockResolvedValue({
      title: 'Generated Title',
      description: 'Generated description',
      termsAndConditions: 'Generated terms',
    }),
    getTopics: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Topic' }
    ]),
    getLocations: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Location' }
    ]),
    getCategories: vi.fn().mockResolvedValue([
      { id: 1, name: 'Test Category' }
    ]),
  },
}));

const renderWithContext = (component: React.ReactElement) => {
  const authValue = {
    user: { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' },
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

describe('IncentiveForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders incentive form fields', async () => {
    renderWithContext(<IncentiveForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/incentive title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });
  });

  it('shows required field validation', async () => {
    renderWithContext(<IncentiveForm />);

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/topic is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
    });
  });

  it('generates AI content successfully', async () => {
    const { incentiveService } = await import('@/services/incentive.service');

    renderWithContext(<IncentiveForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });

    const generateButton = screen.getByText(/generate ai content/i);
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(incentiveService.generateContent).toHaveBeenCalled();
      expect(screen.getByDisplayValue('Generated Title')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Generated description')).toBeInTheDocument();
    });
  });

  it('saves draft with valid data', async () => {
    const { incentiveService } = await import('@/services/incentive.service');

    renderWithContext(<IncentiveForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/incentive title/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/incentive title/i), { target: { value: 'Test Incentive' } });
    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });

    const saveButton = screen.getByText(/save draft/i);
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(incentiveService.saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Incentive',
          topicId: 1,
          locationId: 1,
          categoryId: 1,
        })
      );
    });
  });

  it('shows loading state during AI generation', async () => {
    const { incentiveService } = await import('@/services/incentive.service');

    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    incentiveService.generateContent.mockReturnValue(pendingPromise);

    renderWithContext(<IncentiveForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/topic/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/topic/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: '1' } });

    const generateButton = screen.getByText(/generate ai content/i);
    fireEvent.click(generateButton);

    expect(screen.getByText(/generating content/i)).toBeInTheDocument();

    resolvePromise({
      title: 'Generated Title',
      description: 'Generated description',
      termsAndConditions: 'Generated terms',
    });

    await waitFor(() => {
      expect(screen.queryByText(/generating content/i)).not.toBeInTheDocument();
    });
  });
});