// Application constants
export const APP_CONFIG = {
  NAME: 'Leadership Training App',
  VERSION: '1.0.0',
  DESCRIPTION: 'Mobile-first platform for creating and promoting training sessions',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    STATUS: '/auth/status',
  },

  // Users
  USERS: {
    BASE: '/users',
    STATUS: '/users/status',
    PROFILE: '/users/profile',
  },

  // Sessions
  SESSIONS: {
    BASE: '/sessions',
    STATUS: '/sessions/status',
    PUBLIC: '/sessions/public',
    ADMIN: '/admin/sessions',
  },

  // Resources
  LOCATIONS: '/admin/locations',
  TRAINERS: '/admin/trainers',
  TOPICS: '/admin/topics',
  AUDIENCES: '/admin/audiences',
  TONES: '/admin/tones',
  CATEGORIES: '/admin/categories',
  SETTINGS: '/admin/settings',

  // Analytics
  ANALYTICS: '/admin/analytics',

  // AI
  AI: '/ai',

  // Incentives
  INCENTIVES: '/incentives',

  // Health
  HEALTH: '/health',
} as const;

// User roles
export const USER_ROLES = {
  BROKER: 'Broker',
  CONTENT_DEVELOPER: 'Content Developer',
  TRAINER: 'Trainer',
} as const;

// Session statuses
export const SESSION_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// Validation constants
export const VALIDATION = {
  EMAIL: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100,
  },
  SESSION: {
    TITLE_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 2000,
    MIN_DURATION_MINUTES: 15,
    MAX_DURATION_MINUTES: 480, // 8 hours
  },
  GENERAL: {
    NAME_MAX_LENGTH: 255,
    DESCRIPTION_MAX_LENGTH: 2000,
  },
} as const;

// Default pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Environment variables
export const ENV_KEYS = {
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  DATABASE_HOST: 'DATABASE_HOST',
  DATABASE_PORT: 'DATABASE_PORT',
  DATABASE_NAME: 'DATABASE_NAME',
  DATABASE_USER: 'DATABASE_USER',
  DATABASE_PASSWORD: 'DATABASE_PASSWORD',
  JWT_SECRET: 'JWT_SECRET',
  VITE_API_URL: 'VITE_API_URL',
} as const;

// Default values
export const DEFAULTS = {
  SESSION_DURATION_MINUTES: 120,
  MAX_REGISTRATIONS_PER_SESSION: 50,
  LOCATION_CAPACITY: 30,
} as const;

export const TONE_DEFAULTS = {
  INSTRUCTIONAL: 'Instructional',
  MARKETING: 'Conversational',
} as const;
