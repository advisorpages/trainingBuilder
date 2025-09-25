import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, AuthContext } from '../AuthContext';
import { useContext } from 'react';
import { vi } from 'vitest';

const mockAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
};

vi.mock('@/services/auth.service', () => ({
  authService: mockAuthService,
}));

const TestComponent = () => {
  const auth = useContext(AuthContext);
  if (!auth) return <div>No Auth Context</div>;

  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
      <div data-testid="loading">{auth.loading ? 'Loading' : 'Not Loading'}</div>
      <button onClick={() => auth.login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={auth.logout}>Logout</button>
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
  });

  it('provides authentication context', () => {
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    renderWithRouter(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('No User');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
  });

  it('loads user on initialization', async () => {
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

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
    });
  });

  it('handles login successfully', async () => {
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
    mockAuthService.login.mockResolvedValue({
      user: mockUser,
      token: 'mock-token',
    });
    mockAuthService.getCurrentUser.mockResolvedValue(null);

    renderWithRouter(<TestComponent />);

    const loginButton = screen.getByText('Login');

    await act(async () => {
      loginButton.click();
    });

    await waitFor(() => {
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password');
    });
  });

  it('handles logout', async () => {
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

  it('shows loading state during authentication', async () => {
    let resolvePromise: (value: any) => void;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockAuthService.getCurrentUser.mockReturnValue(pendingPromise);

    renderWithRouter(<TestComponent />);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    await act(async () => {
      resolvePromise(null);
      await pendingPromise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });
  });

  it('handles authentication errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockAuthService.getCurrentUser.mockRejectedValue(new Error('Auth failed'));

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    });

    consoleSpy.mockRestore();
  });
});