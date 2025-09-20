import axios, { AxiosResponse } from 'axios';
import { LoginCredentials, AuthResponse, RefreshResponse, User } from '../types/auth.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  private baseURL = API_BASE_URL;
  private refreshTimer: number | null = null;
  private readonly TOKEN_REFRESH_BUFFER = 60; // seconds before expiration to refresh
  private onUnauthorized: (() => void) | null = null;

  constructor() {
    // Setup axios interceptor for authentication
    axios.interceptors.request.use((config) => {
      const token = this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Setup response interceptor for token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry the original request with new token
              const token = this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            await this.logout();

            // Use callback function if available, otherwise fallback to window.location
            if (this.onUnauthorized) {
              this.onUnauthorized();
            } else if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await axios.post(
        `${this.baseURL}/auth/login`,
        credentials
      );

      const { accessToken, refreshToken } = response.data;

      // Store tokens securely
      this.setTokens(accessToken, refreshToken);

      // Schedule automatic token refresh
      this.scheduleTokenRefresh();

      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Invalid email or password');
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response: AxiosResponse<RefreshResponse> = await axios.post(
        `${this.baseURL}/auth/refresh`,
        { refreshToken }
      );

      const { accessToken } = response.data;
      this.setAccessToken(accessToken);

      // Reschedule token refresh with new token
      this.scheduleTokenRefresh();

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response: AxiosResponse<User> = await axios.get(`${this.baseURL}/auth/profile`);
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate session on server
      await axios.post(`${this.baseURL}/auth/logout`);
    } catch (error) {
      // Continue with client-side logout even if server call fails
      console.warn('Server logout failed, continuing with client-side logout:', error);
    } finally {
      // Clear refresh timer
      this.clearRefreshTimer();

      // Clear tokens from storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear axios authorization header
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getToken(): string | null {
    return this.getAccessToken();
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  setAccessToken(accessToken: string): void {
    localStorage.setItem('accessToken', accessToken);
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Validate JWT token structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // Simple token expiration check (decode JWT payload)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp <= currentTime;

      return !isExpired;
    } catch (error) {
      return false;
    }
  }

  getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }

  setUserInStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  private scheduleTokenRefresh(): void {
    this.clearRefreshTimer();

    const token = this.getAccessToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const refreshTime = expirationTime - (this.TOKEN_REFRESH_BUFFER * 1000);

      if (refreshTime > currentTime) {
        const timeUntilRefresh = refreshTime - currentTime;
        this.refreshTimer = window.setTimeout(async () => {
          try {
            await this.refreshToken();
          } catch (error) {
            console.error('Automatic token refresh failed:', error);
            await this.logout();
          }
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  initializeTokenRefresh(): void {
    if (this.isAuthenticated()) {
      this.scheduleTokenRefresh();
    }
  }

  getTokenExpirationTime(): Date | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  getTimeUntilExpiration(): number | null {
    const expirationTime = this.getTokenExpirationTime();
    if (!expirationTime) return null;

    return Math.max(0, expirationTime.getTime() - Date.now());
  }

  setUnauthorizedCallback(callback: () => void): void {
    this.onUnauthorized = callback;
  }

  clearUnauthorizedCallback(): void {
    this.onUnauthorized = null;
  }

  // Debug method to force clear all auth data
  forceClearAuth(): void {
    this.clearRefreshTimer();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }
}

export const authService = new AuthService();
export default authService;