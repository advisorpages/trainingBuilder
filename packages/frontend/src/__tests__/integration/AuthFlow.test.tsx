import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/pages/LoginPage';
import { vi } from 'vitest';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(),
  refreshToken: vi.fn(),
  initializeTokenRefresh: vi.fn(),
  setUnauthorizedCallback: vi.fn(),
  clearUnauthorizedCallback: vi.fn(),
  getUserFromStorage: vi.fn(),
  setUserInStorage: vi.fn(),
  getToken: vi.fn(),
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  setTokens: vi.fn(),
  setAccessToken: vi.fn(),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

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

const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: {
    id: 2,
    name: 'Content Developer',
    key: 'content_developer',
  },
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockReset();

    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getUserFromStorage.mockReturnValue(null);
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.getAccessToken.mockReturnValue(null);
    mockAuthService.getRefreshToken.mockReturnValue(null);
    mockAuthService.refreshToken.mockResolvedValue(true);
  });

  it('allows users to log in successfully and navigates to the dashboard', async () => {
    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
    });

    renderWithProviders(<LoginPage />);

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /^login$/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);
    });

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(mockAuthService.setUserInStorage).toHaveBeenCalledWith(mockUser);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('surface API errors when the login attempt fails', async () => {
    mockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

    renderWithProviders(<LoginPage />);

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    const loginButton = screen.getByRole('button', { name: /^login$/i });

    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while validating an existing session', async () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserFromStorage.mockReturnValue(null);

    let resolveCurrentUser: (value: unknown) => void;
    const currentUserPromise = new Promise((resolve) => {
      resolveCurrentUser = resolve;
    });

    mockAuthService.getCurrentUser.mockReturnValue(currentUserPromise);

    renderWithProviders(<LoginPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      resolveCurrentUser!(mockUser);
    });

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    expect(mockAuthService.initializeTokenRefresh).toHaveBeenCalled();
    expect(mockAuthService.setUserInStorage).toHaveBeenCalledWith(mockUser);
  });
});
