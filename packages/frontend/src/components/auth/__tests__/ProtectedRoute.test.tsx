import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import ProtectedRoute from '../ProtectedRoute';
import { vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement, authValue: any) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user is authenticated', () => {
    const authValue = {
      user: { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    };

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      authValue
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
    const authValue = {
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    };

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      authValue
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading spinner when authentication is loading', () => {
    const authValue = {
      user: null,
      loading: true,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    };

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>,
      authValue
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('blocks access when user role is insufficient', () => {
    const authValue = {
      user: { id: 1, email: 'test@example.com', role: 'TRAINER' },
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    };

    renderWithRouter(
      <ProtectedRoute requiredRole="CONTENT_DEVELOPER">
        <div>Admin Content</div>
      </ProtectedRoute>,
      authValue
    );

    expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
  });
});