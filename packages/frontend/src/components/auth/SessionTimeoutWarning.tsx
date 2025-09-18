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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>
          ⚠️ Session Expiring Soon
        </h3>
        <p style={{ marginBottom: '1.5rem' }}>
          Your session will expire in <strong>{timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}</strong>.
          Would you like to extend your session?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={handleExtendSession}
            className="btn"
            style={{ backgroundColor: '#28a745' }}
          >
            Extend Session
          </button>
          <button
            onClick={handleLogout}
            className="btn"
            style={{ backgroundColor: '#dc3545' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;