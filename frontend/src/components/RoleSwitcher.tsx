import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="relative">
      <button
        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-primary-500 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Switch role. Current: ${getRoleLabel(currentRole)}`}
      >
        <div className="flex items-center justify-center w-6 h-6 text-primary-600">
          {getRoleIcon(currentRole)}
        </div>
        <span className="font-semibold text-gray-900">{getRoleLabel(currentRole)}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {hasDriverRole && (
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                currentRole === 'driver' ? 'bg-primary-50 border-l-4 border-primary-500' : ''
              }`}
              onClick={() => handleRoleSwitch('driver')}
            >
              <div className="flex items-center justify-center w-6 h-6 text-gray-600">
                {getRoleIcon('driver')}
              </div>
              <span className="flex-1 font-medium text-gray-900">Driver</span>
              {currentRole === 'driver' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-600">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              )}
            </button>
          )}
          
          {hasOwnerRole && (
            <button
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                currentRole === 'owner' ? 'bg-primary-50 border-l-4 border-primary-500' : ''
              }`}
              onClick={() => handleRoleSwitch('owner')}
            >
              <div className="flex items-center justify-center w-6 h-6 text-gray-600">
                {getRoleIcon('owner')}
              </div>
              <span className="flex-1 font-medium text-gray-900">Owner</span>
              {currentRole === 'owner' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-600">
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
