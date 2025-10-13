import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
      <div className="mb-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-2">Switch Role</h4>
        <p className="text-gray-600">You have access to both driver and owner features</p>
      </div>
      
      <div className="space-y-3">
        {hasDriverRole && (
          <Link
            to="/driver-dashboard"
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
              isDriverDashboard 
                ? 'border-primary-500 bg-primary-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            aria-current={isDriverDashboard ? 'page' : undefined}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10.5V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v4.5L3.5 11.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
                <path d="M7 17h10"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">Driver Mode</span>
                {isDriverDashboard && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-600">Find and book parking spots</span>
            </div>
          </Link>
        )}

        {hasOwnerRole && (
          <Link
            to="/owner-dashboard"
            className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all duration-200 ${
              isOwnerDashboard 
                ? 'border-primary-500 bg-primary-50 shadow-md' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            aria-current={isOwnerDashboard ? 'page' : undefined}
          >
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">Owner Mode</span>
                {isOwnerDashboard && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-600">Manage driveways and earnings</span>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProfileRoleSwitcher;
