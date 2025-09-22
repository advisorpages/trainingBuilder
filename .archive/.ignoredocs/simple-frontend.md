# Simple Frontend Guide: Leadership Training App

Practical React setup for a simple training app - no overengineering.

---

## 1. Simple Tech Stack

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "react-hook-form": "^7.45.0",
    "axios": "^1.5.0",
    "@heroicons/react": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.45.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 2. Simple Folder Structure

```text
packages/frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # Button, Input, etc.
│   │   ├── forms/        # SessionForm, LoginForm
│   │   └── layout/       # Header, Sidebar
│   ├── pages/            # HomePage, DashboardPage
│   ├── hooks/            # useAuth, useApi
│   ├── services/         # api.ts
│   ├── types/            # types.ts
│   ├── utils/            # helpers.ts
│   └── styles/           # globals.css
├── package.json
└── vite.config.ts
```

---

## 3. Basic Components

### Simple Button Component
```typescript
// components/ui/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading,
  className = '',
  ...props
}) => {
  const baseClasses = 'px-4 py-2 rounded font-medium transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
```

### Simple Form Component
```typescript
// components/forms/SessionForm.tsx
import { useForm } from 'react-hook-form';

interface SessionFormData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
}

interface SessionFormProps {
  onSubmit: (data: SessionFormData) => void;
  loading?: boolean;
}

export const SessionForm: React.FC<SessionFormProps> = ({ onSubmit, loading }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<SessionFormData>();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          {...register('title', { required: 'Title is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <Button type="submit" loading={loading}>
        Create Session
      </Button>
    </form>
  );
};
```

---

## 4. Simple State Management

### Auth Hook (No Complex State Management)
```typescript
// hooks/useAuth.ts
import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem('token', data.access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 5. Simple API Service

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const sessionService = {
  getAll: () => api.get('/sessions'),
  getById: (id: string) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/admin/sessions', data),
  update: (id: string, data: any) => api.patch(`/admin/sessions/${id}`, data),
  delete: (id: string) => api.delete(`/admin/sessions/${id}`),
};

export default api;
```

---

## 6. Simple Routing

```typescript
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Simple route protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />

          <Route path="/sessions/create" element={
            <ProtectedRoute>
              <CreateSessionPage />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
```

---

## 7. Simple Page Example

```typescript
// pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { sessionService } from '../services/api';
import { Button } from '../components/ui/Button';

export const DashboardPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await sessionService.getAll();
        setSessions(response.data);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button onClick={() => window.location.href = '/sessions/create'}>
          Create Session
        </Button>
      </div>

      <div className="grid gap-4">
        {sessions.map((session: any) => (
          <div key={session.id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold">{session.title}</h3>
            <p className="text-gray-600">{session.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(session.startTime).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## That's It!

Simple React app with:
1. **Basic components** (Button, Form)
2. **Simple state** (Context API for auth)
3. **Straightforward routing** (React Router)
4. **Simple API service** (Axios)
5. **Basic styling** (Tailwind)

No complex state management, no over-architected components, just a working React app for your training sessions.