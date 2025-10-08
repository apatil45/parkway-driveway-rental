import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Nav.css';

const Nav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowProfileDropdown(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    setShowMobileMenu(false);
    navigate('/', { replace: true });
  };

  const getDashboardRoute = () => {
    if (!user || !user.roles) return '/';
    // For users with multiple roles, default to driver dashboard
    if (user.roles.includes('driver')) return '/driver-dashboard';
    if (user.roles.includes('owner')) return '/owner-dashboard';
    return '/';
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav">
      <div className="nav-container">
        {/* Brand */}
        <Link to="/" className="brand">
          <div className="brand-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <span className="brand-text">Parkway</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              {user?.roles?.includes('driver') && (
                <Link 
                  to="/driver-dashboard" 
                  className={`nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                >
                  Find Parking
                </Link>
              )}
              
              {user?.roles?.includes('owner') && (
                <Link 
                  to="/owner-dashboard" 
                  className={`nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                >
                  My Driveways
                </Link>
              )}
            </>
          ) : (
            <Link 
              to="/" 
              className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
            >
              Home
            </Link>
          )}
        </div>

        {/* User Actions */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="profile-section" ref={dropdownRef}>
              <button 
                className="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-name">{user?.name || 'User'}</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`}
                >
                  <polyline points="6,9 12,15 18,9"/>
                </svg>
              </button>

              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    Profile
                  </Link>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {showMobileMenu ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <div className="mobile-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="mobile-user-details">
                    <div className="mobile-name">{user?.name || 'User'}</div>
                    <div className="mobile-email">{user?.email || 'user@example.com'}</div>
                  </div>
                </div>

                <div className="mobile-nav-links">
                  {user?.roles?.includes('driver') && (
                    <Link 
                      to="/driver-dashboard" 
                      className={`mobile-nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                    >
                      Find Parking
                    </Link>
                  )}
                  
                  {user?.roles?.includes('owner') && (
                    <Link 
                      to="/owner-dashboard" 
                      className={`mobile-nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                    >
                      My Driveways
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className={`mobile-nav-link ${isActiveRoute('/profile') ? 'active' : ''}`}
                  >
                    Profile
                  </Link>
                  
                  <button className="mobile-logout-button" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-links">
                <Link to="/" className={`mobile-nav-link ${isActiveRoute('/') ? 'active' : ''}`}>
                  Home
                </Link>
                <Link to="/login" className={`mobile-nav-link ${isActiveRoute('/login') ? 'active' : ''}`}>
                  Sign In
                </Link>
                <Link to="/register" className={`mobile-nav-link ${isActiveRoute('/register') ? 'active' : ''}`}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Nav;
