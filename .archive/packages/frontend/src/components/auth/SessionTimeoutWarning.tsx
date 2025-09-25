import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/auth.service';

interface SessionTimeoutWarningProps {
  warningThreshold?: number; // minutes before expiration to show warning
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  warningThreshold = 5
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const { isAuthenticated, refreshToken, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const checkTokenExpiration = () => {
      const timeUntilExpiration = authService.getTimeUntilExpiration();

      if (timeUntilExpiration !== null) {
        const minutesRemaining = Math.floor(timeUntilExpiration / (1000 * 60));
        setTimeRemaining(minutesRemaining);

        if (minutesRemaining <= warningThreshold && minutesRemaining > 0) {
          setShowWarning(true);
        } else {
          setShowWarning(false);
        }

        if (timeUntilExpiration <= 0) {
          logout();
        }
      }
    };

    // Check immediately
    checkTokenExpiration();

    // Check every minute
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, warningThreshold, logout]);

  const handleExtendSession = async () => {
    try {
      await refreshToken();
      setShowWarning(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
      logout();
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm text-center">
        <h3 className="text-red-600 text-xl font-semibold mb-4">
          ⚠️ Session Expiring Soon
        </h3>
        <p className="text-gray-700 mb-6">
          Your session will expire in <strong>{timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}</strong>.
          Would you like to extend your session?
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleExtendSession}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Extend Session
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;