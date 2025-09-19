import { authService } from '../auth.service';
import { vi, beforeEach, describe, it, expect } from 'vitest';

const mockApiClient = {
  post: vi.fn(),
  get: vi.fn(),
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
};

vi.mock('../api', () => ({
  apiClient: mockApiClient,
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('successfully logs in and stores token', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' },
          access_token: 'mock-token',
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.login('test@example.com', 'password');

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual({
        user: mockResponse.data.user,
        token: 'mock-token',
      });

      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith('mock-token');
    });

    it('throws error on failed login', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login('test@example.com', 'wrong-password'))
        .rejects.toThrow('Invalid credentials');

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears token and makes logout request', async () => {
      localStorage.setItem('token', 'existing-token');
      mockApiClient.post.mockResolvedValue({});

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
    });

    it('clears token even if logout request fails', async () => {
      localStorage.setItem('token', 'existing-token');
      mockApiClient.post.mockRejectedValue(new Error('Server error'));

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('returns user data when token exists', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' };
      localStorage.setItem('token', 'valid-token');
      mockApiClient.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });

    it('returns null when no token exists', async () => {
      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('clears invalid token and returns null', async () => {
      localStorage.setItem('token', 'invalid-token');
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.getCurrentUser();

      expect(result).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      const newToken = 'new-token';
      mockApiClient.post.mockResolvedValue({ data: { access_token: newToken } });

      const result = await authService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh');
      expect(result).toBe(newToken);
      expect(localStorage.getItem('token')).toBe(newToken);
      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(newToken);
    });

    it('throws error when refresh fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Refresh failed'));

      await expect(authService.refreshToken()).rejects.toThrow('Refresh failed');
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token exists', () => {
      localStorage.setItem('token', 'valid-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});