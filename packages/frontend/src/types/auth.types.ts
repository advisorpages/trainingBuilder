export type UserRoleKey = 'broker' | 'content_developer' | 'trainer';

export interface UserRoleInfo {
  id: number;
  name: UserRole;
  key: UserRoleKey;
}

export interface User {
  id: string;
  email: string;
  role: UserRoleInfo;
  displayName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export enum UserRole {
  BROKER = 'Broker',
  CONTENT_DEVELOPER = 'Content Developer',
  TRAINER = 'Trainer',
}
