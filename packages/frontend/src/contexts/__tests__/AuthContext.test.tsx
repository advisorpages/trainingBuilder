import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { vi } from 'vitest';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  isAuthenticated: vi.fn(),
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

vi.mock('@/services/auth.service', () => ({
  authService: mockAuthService,
  default: mockAuthService,
}));

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

const TestComponent = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
      <div data-testid="loading">{auth.isLoading ? 'Loading' : 'Not Loading'}</div>
      <button
        onClick={() => auth.login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockAuthService.isAuthenticated.mockReturnValue(false);
    mockAuthService.getUserFromStorage.mockReturnValue(null);
    mockAuthService.getCurrentUser.mockResolvedValue(null);
    mockAuthService.getToken.mockReturnValue(null);
    mockAuthService.getAccessToken.mockReturnValue(null);
    mockAuthService.getRefreshToken.mockReturnValue(null);
    mockAuthService.refreshToken.mockResolvedValue(true);
  });

  it('provides authentication context defaults when no user is present', async () => {
    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('restores a user from storage during initialization', async () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserFromStorage.mockReturnValue(mockUser);

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(mockAuthService.initializeTokenRefresh).toHaveBeenCalled();
  });

  it('handles login successfully', async () => {
    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      accessToken: 'mock-access',
      refreshToken: 'mock-refresh',
    });

    renderWithRouter(<TestComponent />);

    const loginButton = screen.getByText('Login');

    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    expect(mockAuthService.setUserInStorage).toHaveBeenCalledWith(mockUser);
  });

  it('handles logout and clears user state', async () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserFromStorage.mockReturnValue(mockUser);
    mockAuthService.logout.mockResolvedValue(undefined);

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });

    const logoutButton = screen.getByText('Logout');

    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() => {
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
  });

  it('shows loading state while authentication is pending', async () => {
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserFromStorage.mockReturnValue(null);

    let resolveCurrentUser: (value: unknown) => void;
    const currentUserPromise = new Promise((resolve) => {
      resolveCurrentUser = resolve;
    });

    mockAuthService.getCurrentUser.mockReturnValue(currentUserPromise);

    renderWithRouter(<TestComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    await act(async () => {
      resolveCurrentUser!(mockUser);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('handles authentication errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.isAuthenticated.mockReturnValue(true);
    mockAuthService.getUserFromStorage.mockReturnValue(null);
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth failed'));

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    consoleSpy.mockRestore();
  });
});
