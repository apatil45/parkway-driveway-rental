import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RoleSwitcher.css';

const RoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for users with multiple roles
  if (!user?.roles || user.roles.length < 2) {
    return null;
  }

  const hasDriverRole = user.roles.includes('driver');
  const hasOwnerRole = user.roles.includes('owner');
  const isDriverDashboard = location.pathname === '/driver-dashboard';
  const isOwnerDashboard = location.pathname === '/owner-dashboard';

  const getCurrentRole = () => {
    if (isDriverDashboard) return 'driver';
    if (isOwnerDashboard) return 'owner';
    return hasDriverRole ? 'driver' : 'owner';
  };

  const getRoleLabel = (role: string) => {
    return role === 'driver' ? 'Driver' : 'Owner';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'driver') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v4.5L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
          <path d="M7 17h10"/>
        </svg>
      );
    } else {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      );
    }
  };

  const handleRoleSwitch = (role: string) => {
    const route = role === 'driver' ? '/driver-dashboard' : '/owner-dashboard';
    navigate(route);
    setIsOpen(false);
  };

  const currentRole = getCurrentRole();

  return (
    <div className="role-switcher">
      <button
        className="role-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Switch role. Current: ${getRoleLabel(currentRole)}`}
      >
        <span className="role-icon">{getRoleIcon(currentRole)}</span>
        <span className="role-label">{getRoleLabel(currentRole)}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`role-arrow ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="role-dropdown">
          {hasDriverRole && (
            <button
              className={`role-option ${currentRole === 'driver' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('driver')}
            >
              <span className="role-icon">{getRoleIcon('driver')}</span>
              <span>Driver</span>
              {currentRole === 'driver' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              )}
            </button>
          )}
          
          {hasOwnerRole && (
            <button
              className={`role-option ${currentRole === 'owner' ? 'active' : ''}`}
              onClick={() => handleRoleSwitch('owner')}
            >
              <span className="role-icon">{getRoleIcon('owner')}</span>
              <span>Owner</span>
              {currentRole === 'owner' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
