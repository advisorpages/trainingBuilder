import * as React from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRoleKey } from '../types/auth.types';

interface BuilderLayoutProps {
  title: string;
  subtitle?: string;
  statusSlot?: React.ReactNode;
  children: React.ReactNode;
}

type BuilderRole = UserRoleKey;

interface NavItem {
  label: string;
  description: string;
  to: string;
  roles: BuilderRole[];
  icon?: string;
}

const getDashboardRoute = (userRole: BuilderRole) => {
  if (userRole === 'trainer') {
    return '/trainer/dashboard';
  }

  return '/dashboard';
};

const allNavItems: NavItem[] = [
  {
    label: 'Home',
    description: 'Dashboard and overview',
    to: '/dashboard', // Will be dynamically set based on user role
    roles: ['content_developer', 'trainer', 'broker'],
    icon: '🏠',
  },
  {
    label: 'Guided Session Builder',
    description: 'AI-assisted session creation',
    to: '/sessions/builder/new',
    roles: ['content_developer', 'broker'],
    icon: '🤖',
  },
  {
    label: 'Classic Session Builder',
    description: 'Manual session creation',
    to: '/sessions/builder/classic/new',
    roles: ['content_developer', 'broker'],
    icon: '🛠️',
  },
  {
    label: 'Sessions',
    description: 'Manage existing sessions and drafts',
    to: '/sessions',
    roles: ['content_developer', 'broker'],
    icon: '📋',
  },
  {
    label: 'Saved Ideas',
    description: 'Manage your AI-generated session outlines',
    to: '/sessions/saved-variants',
    roles: ['content_developer', 'broker'],
    icon: '💡',
  },
  {
    label: 'Topics',
    description: 'Maintain topic catalog and references',
    to: '/topics',
    roles: ['content_developer', 'broker'],
    icon: '🏷️',
  },
  {
    label: 'Locations',
    description: 'Manage training venues and locations',
    to: '/locations',
    roles: ['content_developer', 'broker'],
    icon: '🏢',
  },
  {
    label: 'Trainers',
    description: 'Manage trainer profiles and assignments',
    to: '/trainers',
    roles: ['content_developer', 'broker'],
    icon: '👨‍🏫',
  },
  {
    label: 'Incentives',
    description: 'Configure attendance incentives',
    to: '/incentives',
    roles: ['content_developer', 'broker'],
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
    label: 'Admin Dashboard',
    description: 'System settings and monitoring',
    to: '/admin/dashboard',
    roles: ['content_developer', 'broker'],
    icon: '🛠️',
  },
];

export const BuilderLayout: React.FC<BuilderLayoutProps> = ({
  title,
  subtitle,
  statusSlot,
  children,
}) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const effectiveRole: BuilderRole = user?.role?.key ?? 'content_developer';
  const userDisplayName = user?.displayName || user?.email || 'User';
  const userInitial = userDisplayName.charAt(0).toUpperCase();
  const userEmail = user?.email;

  // Filter nav items based on user role and set correct dashboard route
  const navItems = allNavItems
    .filter(item => item.roles.includes(effectiveRole))
    .map(item => {
      if (item.label === 'Home') {
        return { ...item, to: getDashboardRoute(effectiveRole) };
      }
      return item;
    });

  const getRoleDisplayName = (role: BuilderRole) => {
    switch (role) {
      case 'content_developer': return 'Content Developer';
      case 'trainer': return 'Trainer';
      case 'broker': return 'Broker';
      default: return 'User';
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar - slides in from right */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 transform bg-white border-l border-slate-200 px-6 py-8 transition-transform duration-300 ease-in-out flex flex-col space-y-8 shadow-lg
        ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Training Builder
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {effectiveRole === 'trainer' ? 'Trainer Portal' : 'Builder Workspace'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {effectiveRole === 'trainer'
              ? 'Access your assignments and training materials.'
              : 'Navigate the core tools for launching training experiences.'
            }
          </p>
        </div>


        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-2 pr-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
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
          </div>
        </nav>

        {/* Logout Link */}
        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={() => void logout()}
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex w-full flex-1 flex-col lg:ml-0">
        {/* Header with hamburger menu */}
        <header className="flex items-center justify-between gap-2 sm:gap-4 border-b border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4 sm:py-4 lg:px-6 lg:py-5">
          {/* Title and subtitle */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold sm:text-xl md:text-2xl truncate">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-500 line-clamp-1">{subtitle}</p>
            ) : null}
          </div>

          {/* Status slot */}
          {statusSlot ? <div className="flex-shrink-0 hidden sm:block">{statusSlot}</div> : null}

          {/* Hamburger menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex-shrink-0 p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        {/* Status slot for mobile - shown below header */}
        {statusSlot && (
          <div className="sm:hidden border-b border-slate-200 bg-white px-3 py-2">
            {statusSlot}
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
};
