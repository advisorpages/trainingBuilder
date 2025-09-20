import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials } from '../types/auth.types';
import authService from '../services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      if (authService.isAuthenticated()) {
        // Try to get current user from storage first
        const storedUser = authService.getUserFromStorage();
        if (storedUser) {
          setUser(storedUser);
          // Initialize automatic token refresh
          authService.initializeTokenRefresh();
        } else {
          // Fetch current user from API
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          authService.setUserInStorage(currentUser);
          // Initialize automatic token refresh
          authService.initializeTokenRefresh();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear any invalid tokens
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      authService.setUserInStorage(authResponse.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const success = await authService.refreshToken();
      if (!success) {
        await logout();
      }
      return success;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};