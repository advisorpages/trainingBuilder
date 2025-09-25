import { vi } from 'vitest';
import { User, UserRole } from '../../types/auth.types';

/**
 * Test fixtures for User auth shape to avoid duplication across tests
 */

export const mockContentDeveloperUser: User = {
  id: '1',
  email: 'content.dev@example.com',
  role: {
    id: 2,
    name: UserRole.CONTENT_DEVELOPER,
    key: 'content_developer'
  },
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

export const mockBrokerUser: User = {
  id: '2',
  email: 'broker@example.com',
  role: {
    id: 1,
    name: UserRole.BROKER,
    key: 'broker'
  },
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

export const mockTrainerUser: User = {
  id: '3',
  email: 'trainer@example.com',
  role: {
    id: 3,
    name: UserRole.TRAINER,
    key: 'trainer'
  },
  displayName: 'John Trainer',
  isActive: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

/**
 * Creates a user fixture with custom overrides
 */
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  ...mockContentDeveloperUser,
  ...overrides
});

/**
 * Mock auth context value for testing
 */
export const createMockAuthContext = (user: User | null = mockContentDeveloperUser) => ({
  user,
  token: user ? 'mock-access-token' : null,
  isAuthenticated: !!user,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
});