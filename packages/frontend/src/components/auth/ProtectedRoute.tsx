import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, UserRoleKey } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ROLE_NAME_BY_KEY: Record<UserRoleKey, UserRole> = {
  broker: UserRole.BROKER,
  content_developer: UserRole.CONTENT_DEVELOPER,
  trainer: UserRole.TRAINER,
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('🔒 ProtectedRoute check:', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    userRole: user?.role?.key
  });

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('❌ Not authenticated, redirecting to login from:', location.pathname);
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if roles are specified
  if (requiredRoles.length > 0) {
    const userRoleName = user.role?.name as UserRole | undefined;
    const userRoleKey = user.role?.key;
    const effectiveRole = userRoleName ?? (userRoleKey ? ROLE_NAME_BY_KEY[userRoleKey] : undefined);
    const hasRequiredRole = effectiveRole ? requiredRoles.includes(effectiveRole) : false;

    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user's role
      const isTrainer = effectiveRole === UserRole.TRAINER || userRoleKey === 'trainer';
      const redirectPath = isTrainer
        ? '/trainer/dashboard'
        : '/dashboard';

      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
