import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = []
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role permissions if required
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role.name as UserRole);

    if (!hasRequiredRole) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#721c24',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          margin: '1rem'
        }}>
          <h3>Access Denied</h3>
          <p>You don't have permission to access this page.</p>
          <p>Required roles: {requiredRoles.join(', ')}</p>
          <p>Your role: {user.role.name}</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;