import axios, { AxiosResponse } from 'axios';
import { LoginCredentials, AuthResponse, RefreshResponse, User, UserRole, UserRoleKey } from '../types/auth.types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

class AuthService {
  private baseURL = API_BASE_URL;
  private refreshTimer: number | null = null;
  private readonly TOKEN_REFRESH_BUFFER = 60; // seconds before expiration to refresh
  private onUnauthorized: (() => void) | null = null;
  private static readonly ROLE_METADATA: Record<UserRoleKey, { id: number; name: UserRole }> = {
    broker: { id: 1, name: UserRole.BROKER },
    content_developer: { id: 2, name: UserRole.CONTENT_DEVELOPER },
    trainer: { id: 3, name: UserRole.TRAINER },
  };

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
          console.log('⚠️ 401 error, attempting token refresh...', originalRequest.url);
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              console.log('✅ Token refreshed successfully');
              // Retry the original request with new token
              const token = this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            } else {
              console.log('❌ Token refresh failed');
            }
          } catch (refreshError) {
            console.log('❌ Token refresh error:', refreshError);
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
      console.log('=== LOGIN DEBUG ===', {
        url: `${this.baseURL}/auth/login`,
        credentials: { email: credentials.email, password: '***' }
      });

      const response: AxiosResponse<AuthResponse> = await axios.post(
        `${this.baseURL}/auth/login`,
        credentials
      );

      console.log('=== LOGIN RESPONSE DEBUG ===', {
        status: response.status,
        data: response.data,
        hasAccessToken: !!response.data.accessToken,
        hasRefreshToken: !!response.data.refreshToken,
        hasUser: !!response.data.user
      });

      const { accessToken, refreshToken } = response.data;
      const normalizedUser = this.normalizeUser(response.data.user);
      const authResponse: AuthResponse = {
        ...response.data,
        user: normalizedUser,
      };

      // Store tokens securely
      this.setTokens(accessToken, refreshToken);
      this.setUserInStorage(normalizedUser);

      // Schedule automatic token refresh
      this.scheduleTokenRefresh();

      return authResponse;
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
      const normalized = this.normalizeUser(response.data);
      this.setUserInStorage(normalized);
      return normalized;
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
    if (!token) {
      console.log('🔐 isAuthenticated: no token found');
      return false;
    }

    try {
      // Validate JWT token structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('🔐 isAuthenticated: invalid token structure');
        return false;
      }

      // Simple token expiration check (decode JWT payload)
      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp <= currentTime;

      console.log('🔐 isAuthenticated check:', {
        exp: payload.exp,
        currentTime,
        isExpired,
        timeUntilExpiry: payload.exp - currentTime
      });

      return !isExpired;
    } catch (error) {
      console.log('🔐 isAuthenticated: error parsing token', error);
      return false;
    }
  }

  getUserFromStorage(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? this.normalizeUser(JSON.parse(userStr)) : null;
    } catch (error) {
      return null;
    }
  }

  setUserInStorage(user: User): User {
    const normalized = this.normalizeUser(user);
    localStorage.setItem('user', JSON.stringify(normalized));
    return normalized;
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

  private normalizeUser(user: any): User {
    if (!user) {
      return user;
    }

    // Handle already-normalized structures
    if (user.role && typeof user.role === 'object' && 'key' in user.role && user.role.key) {
      const roleKey = this.normalizeRoleKey(user.role.key);
      const roleMeta = AuthService.ROLE_METADATA[roleKey];

      return {
        ...user,
        role: {
          id: user.role.id ?? roleMeta.id,
          name: roleMeta.name,
          key: roleKey,
        },
      };
    }

    const roleKey = this.normalizeRoleKey(user.role);
    const roleMeta = AuthService.ROLE_METADATA[roleKey];

    return {
      ...user,
      role: {
        id: roleMeta.id,
        name: roleMeta.name,
        key: roleKey,
      },
    };
  }

  private normalizeRoleKey(role: unknown): UserRoleKey {
    if (typeof role === 'string') {
      const normalized = role.toLowerCase();

      if (normalized in AuthService.ROLE_METADATA) {
        return normalized as UserRoleKey;
      }

      if (normalized === 'content developer') {
        return 'content_developer';
      }

      if (normalized === 'broker') {
        return 'broker';
      }

      if (normalized === 'trainer') {
        return 'trainer';
      }
    }

    if (role && typeof role === 'object' && 'name' in (role as any)) {
      return this.normalizeRoleKey((role as any).name);
    }

    return 'content_developer';
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
