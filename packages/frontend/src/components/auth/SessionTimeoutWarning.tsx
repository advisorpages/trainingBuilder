import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SessionTimeoutWarningProps {
  warningThreshold?: number; // Minutes before expiry to show warning
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  warningThreshold = 5
}) => {
  const { user, isAuthenticated, refreshToken, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowWarning(false);
      return;
    }

    const checkTokenExpiry = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        // Decode JWT token to get expiry
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        const warningTime = warningThreshold * 60 * 1000; // Convert to milliseconds

        if (timeUntilExpiry <= warningTime && timeUntilExpiry > 0) {
          setShowWarning(true);
          setTimeLeft(Math.ceil(timeUntilExpiry / 1000 / 60)); // Convert to minutes
        } else if (timeUntilExpiry <= 0) {
          // Token has expired
          handleExpiry();
        } else {
          setShowWarning(false);
        }
      } catch (error) {
        console.error('Error checking token expiry:', error);
      }
    };

    const handleExpiry = async () => {
      setShowWarning(false);
      await logout();
    };

    const handleExtendSession = async () => {
      try {
        const success = await refreshToken();
        if (success) {
          setShowWarning(false);
        }
      } catch (error) {
        console.error('Failed to refresh token:', error);
        await logout();
      }
    };

    // Check immediately and then every minute
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [isAuthenticated, user, warningThreshold, refreshToken, logout]);

  const handleExtendSession = async () => {
    try {
      const success = await refreshToken();
      if (success) {
        setShowWarning(false);
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await logout();
    }
  };

  const handleLogoutNow = async () => {
    await logout();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session Expiring Soon
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Your session will expire in approximately {timeLeft} minute{timeLeft !== 1 ? 's' : ''}.
            Would you like to extend your session?
          </p>
          <div className="flex space-x-3">
            <button
              onClick={handleExtendSession}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Extend Session
            </button>
            <button
              onClick={handleLogoutNow}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Logout Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;