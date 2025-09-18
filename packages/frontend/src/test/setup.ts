import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock environment variables
beforeAll(() => {
  // Set test environment variables
  process.env.VITE_API_BASE_URL = 'http://localhost:3001';

  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock window.scrollTo
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: () => {},
  });

  // Mock localStorage
  const localStorageMock = {
    getItem: (key: string) => {
      return localStorageMock[key] || null;
    },
    setItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    removeItem: (key: string) => {
      delete localStorageMock[key];
    },
    clear: () => {
      Object.keys(localStorageMock).forEach(key => {
        if (key !== 'getItem' && key !== 'setItem' && key !== 'removeItem' && key !== 'clear') {
          delete localStorageMock[key];
        }
      });
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
});

// Cleanup after each test
afterEach(() => {
  cleanup();

  // Clear localStorage after each test
  window.localStorage.clear();

  // Clear any timers
  vi.clearAllTimers();
});

afterAll(() => {
  // Global cleanup
});

// Global test utilities
export const testUtils = {
  // Mock user with different roles
  mockUser: (role: 'broker' | 'content_developer' | 'trainer' = 'trainer') => ({
    id: 1,
    email: `${role}@test.com`,
    role: role,
    name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
  }),

  // Mock session data
  mockSession: (overrides = {}) => ({
    id: 1,
    title: 'Test Session',
    description: 'Test Description',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    status: 'published',
    trainerId: 1,
    locationId: 1,
    location: {
      id: 1,
      name: 'Test Location',
      address: '123 Test St',
    },
    trainer: {
      id: 1,
      name: 'Test Trainer',
      email: 'trainer@test.com',
    },
    ...overrides,
  }),

  // Mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {},
  }),

  // Wait for async operations
  waitFor: (condition: () => boolean, timeout = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for condition`));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },
};