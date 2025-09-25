import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import { vi } from 'vitest';

const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
  refreshToken: vi.fn(),
  initializeTokenRefresh: vi.fn(),
};

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/services/auth.service', () => ({
  authService: mockAuthService,
  default: mockAuthService,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('completes successful login flow', async () => {
    const mockUser = {
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
    };

    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles login errors appropriately', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows validation errors for empty fields', async () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    renderWithProviders(<LoginPage />);

    const loginButton = screen.getByRole('button', { name: /sign in/i });

    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('redirects authenticated users away from login page', async () => {
    const mockUser = {
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
    };
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockAuthService.isAuthenticated.mockReturnValue(true);

    renderWithProviders(<LoginPage />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('maintains authentication state across page refreshes', async () => {
    const mockUser = {
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
    };
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

    const TestComponent = () => {
      return <div data-testid="dashboard">Dashboard</div>;
    };

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
  });
});