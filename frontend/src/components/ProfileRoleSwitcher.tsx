import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileRoleSwitcher.css';

const ProfileRoleSwitcher: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Only show for users with multiple roles
  if (!user?.roles || user.roles.length < 2) {
    return null;
  }

  const hasDriverRole = user.roles.includes('driver');
  const hasOwnerRole = user.roles.includes('owner');
  const isDriverDashboard = location.pathname === '/driver-dashboard';
  const isOwnerDashboard = location.pathname === '/owner-dashboard';

  return (
    <div className="profile-role-switcher">
      <div className="role-switcher-header">
        <h4>Switch Role</h4>
        <p>You have access to both driver and owner features</p>
      </div>
      
      <div className="role-options">
        {hasDriverRole && (
          <Link
            to="/driver-dashboard"
            className={`role-option ${isDriverDashboard ? 'active' : ''}`}
            aria-current={isDriverDashboard ? 'page' : undefined}
          >
            <div className="role-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </div>
            <div className="role-content">
              <span className="role-title">Driver Mode</span>
              <span className="role-description">Find and book parking spots</span>
              {isDriverDashboard && <span className="current-badge">Current</span>}
            </div>
          </Link>
        )}

        {hasOwnerRole && (
          <Link
            to="/owner-dashboard"
            className={`role-option ${isOwnerDashboard ? 'active' : ''}`}
            aria-current={isOwnerDashboard ? 'page' : undefined}
          >
            <div className="role-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <div className="role-content">
              <span className="role-title">Owner Mode</span>
              <span className="role-description">Manage driveways and earnings</span>
              {isOwnerDashboard && <span className="current-badge">Current</span>}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileRoleSwitcher;
