import * as React from 'react';
import { NavLink } from 'react-router-dom';

// Mock user context - in real app, this would come from auth context
const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'content_developer', // content_developer, trainer, admin
};

interface BuilderLayoutProps {
  title: string;
  subtitle?: string;
  statusSlot?: React.ReactNode;
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  description: string;
  to: string;
  roles: string[];
  icon?: string;
}

const getDashboardRoute = (userRole: string) => {
  return userRole === 'trainer' ? '/trainer/dashboard' : '/dashboard';
};

const allNavItems: NavItem[] = [
  {
    label: 'Home',
    description: 'Dashboard and overview',
    to: '/dashboard', // Will be dynamically set based on user role
    roles: ['content_developer', 'trainer', 'admin'],
    icon: '🏠',
  },
  {
    label: 'Session Builder',
    description: 'Craft AI-assisted training sessions',
    to: '/sessions/builder/new',
    roles: ['content_developer', 'admin'],
    icon: '🎯',
  },
  {
    label: 'Sessions',
    description: 'Manage existing sessions and drafts',
    to: '/sessions',
    roles: ['content_developer', 'admin'],
    icon: '📋',
  },
  {
    label: 'Topics',
    description: 'Maintain topic catalog and references',
    to: '/topics',
    roles: ['content_developer', 'admin'],
    icon: '🏷️',
  },
  {
    label: 'Incentives',
    description: 'Configure attendance incentives',
    to: '/incentives',
    roles: ['content_developer', 'admin'],
    icon: '🎁',
  },
  {
    label: 'Trainer Dashboard',
    description: 'View your session assignments',
    to: '/trainer/dashboard',
    roles: ['trainer'],
    icon: '👨‍🏫',
  },
  {
    label: 'Analytics',
    description: 'View performance metrics',
    to: '/analytics',
    roles: ['content_developer', 'admin'],
    icon: '📊',
  },
];

export const BuilderLayout: React.FC<BuilderLayoutProps> = ({
  title,
  subtitle,
  statusSlot,
  children,
}) => {
  // Filter nav items based on user role and set correct dashboard route
  const navItems = allNavItems
    .filter(item => item.roles.includes(mockUser.role))
    .map(item => {
      if (item.label === 'Home') {
        return { ...item, to: getDashboardRoute(mockUser.role) };
      }
      return item;
    });

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'content_developer': return 'Content Developer';
      case 'trainer': return 'Trainer';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white px-6 py-8 lg:flex lg:flex-col lg:space-y-8">
          {/* Header */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Training Builder
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              {mockUser.role === 'trainer' ? 'Trainer Portal' : 'Builder Workspace'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {mockUser.role === 'trainer'
                ? 'Access your assignments and training materials.'
                : 'Navigate the core tools for launching training experiences.'
              }
            </p>
          </div>

          {/* User Info */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                {mockUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{mockUser.name}</p>
                <p className="text-xs text-slate-500 truncate">{getRoleDisplayName(mockUser.role)}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'block rounded-lg border px-4 py-3 transition-colors',
                    isActive
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-100',
                  ].join(' ')
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon && <span className="text-lg">{item.icon}</span>}
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                </div>
              </NavLink>
            ))}
          </nav>

          {/* Footer Tip */}
          <div className="mt-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold">
              {mockUser.role === 'trainer' ? 'Trainer Tip' : 'Workflow Tip'}
            </p>
            <p className="mt-1">
              {mockUser.role === 'trainer'
                ? 'Check your dashboard regularly for new assignments and updates to session materials.'
                : 'Autosave keeps drafts safe every few seconds. Use the AI prompt editor to experiment without losing prior versions.'
              }
            </p>
          </div>

          {/* Logout Link */}
          <div className="pt-4 border-t border-slate-200">
            <button className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex w-full flex-1 flex-col">
          <header className="flex flex-col border-b border-slate-200 bg-white px-6 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
              {subtitle ? (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            {statusSlot ? <div className="mt-4 sm:mt-0">{statusSlot}</div> : null}
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
            {children}
          </main>
        </div>
      </div>
  );
};
