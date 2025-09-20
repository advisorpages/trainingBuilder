import { authService } from '../auth.service';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = vi.mocked(axios);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('successfully logs in and stores token', async () => {
      // Create valid JWT tokens
      const mockAccessPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const mockAccessToken = `header.${btoa(JSON.stringify(mockAccessPayload))}.signature`;

      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' },
          accessToken: mockAccessToken,
          refreshToken: 'mock-refresh-token',
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authService.login({ email: 'test@example.com', password: 'password' });

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/auth/login', {
        email: 'test@example.com',
        password: 'password',
      });

      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('accessToken')).toBe(mockAccessToken);
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
    });

    it('throws error on failed login', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login({ email: 'test@example.com', password: 'wrong-password' }))
        .rejects.toThrow('Invalid email or password');

      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('logout', () => {
    it('clears token and makes logout request', async () => {
      localStorage.setItem('accessToken', 'existing-access-token');
      localStorage.setItem('refreshToken', 'existing-refresh-token');
      mockedAxios.post.mockResolvedValue({});

      await authService.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/auth/logout');
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('clears token even if logout request fails', async () => {
      localStorage.setItem('accessToken', 'existing-access-token');
      localStorage.setItem('refreshToken', 'existing-refresh-token');
      mockedAxios.post.mockRejectedValue(new Error('Server error'));

      await authService.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('returns user data when token exists', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'CONTENT_DEVELOPER' };
      localStorage.setItem('accessToken', 'valid-token');
      mockedAxios.get.mockResolvedValue({ data: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/auth/profile');
      expect(result).toEqual(mockUser);
    });

    it('throws error when API call fails', async () => {
      localStorage.setItem('accessToken', 'invalid-token');
      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  describe('refreshToken', () => {
    it('refreshes token successfully', async () => {
      // Create valid JWT token
      const mockAccessPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const newToken = `header.${btoa(JSON.stringify(mockAccessPayload))}.signature`;
      localStorage.setItem('refreshToken', 'valid-refresh-token');
      mockedAxios.post.mockResolvedValue({ data: { accessToken: newToken } });

      const result = await authService.refreshToken();

      expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:3001/api/auth/refresh', { refreshToken: 'valid-refresh-token' });
      expect(result).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe(newToken);
    });

    it('returns false when no refresh token exists', async () => {
      const result = await authService.refreshToken();

      expect(result).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('returns false when refresh fails', async () => {
      localStorage.setItem('refreshToken', 'invalid-refresh-token');
      mockedAxios.post.mockRejectedValue(new Error('Refresh failed'));

      const result = await authService.refreshToken();

      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when valid token exists', () => {
      // Create a mock JWT token that won't expire soon
      const mockPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      localStorage.setItem('accessToken', mockToken);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns false when token is expired', () => {
      // Create a mock JWT token that is expired
      const mockPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const mockToken = `header.${btoa(JSON.stringify(mockPayload))}.signature`;
      localStorage.setItem('accessToken', mockToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns false when token is malformed', () => {
      localStorage.setItem('accessToken', 'invalid-token');
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});