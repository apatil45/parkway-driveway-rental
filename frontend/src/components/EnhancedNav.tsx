import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from './Breadcrumb';
import './EnhancedNav.css';

const EnhancedNav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging removed for production

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

  const handleLogout = () => {
    logout();
    setShowProfileDropdown(false);
    navigate('/login');
  };

  const getDashboardLinks = () => {
    if (!user) return [];
    const links = [];
    if (user.roles.includes('driver')) {
      links.push({ path: '/driver-dashboard', label: 'Driver Dashboard' });
    }
    if (user.roles.includes('owner')) {
      links.push({ path: '/owner-dashboard', label: 'Owner Dashboard' });
    }
    return links;
  };

  const getPrimaryDashboardLink = () => {
    if (!user) return '/';
    // If user has both roles, default to driver dashboard
    if (user.roles.includes('driver')) return '/driver-dashboard';
    if (user.roles.includes('owner')) return '/owner-dashboard';
    return '/';
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const isDashboardRoute = () => {
    return location.pathname.includes('dashboard') || location.pathname.includes('profile');
  };

  return (
    <>
      <nav className="enhanced-nav">
        <div className="nav-container">
          {/* Brand */}
          <div className="nav-brand">
            <Link to="/" className="brand-link">
              <div className="brand-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                  <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                </svg>
              </div>
              <span className="brand-text">Parkway.com</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-menu">
            {isAuthenticated ? (
              <>
                <Link 
                  to={getPrimaryDashboardLink()} 
                  className={`nav-link ${isActiveRoute(getPrimaryDashboardLink()) ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Dashboard
                </Link>

                {user?.roles.includes('driver') && (
                  <Link 
                    to="/driver-dashboard" 
                    className={`nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    Find Parking
                  </Link>
                )}

                {user?.roles.includes('owner') && (
                  <Link 
                    to="/owner-dashboard" 
                    className={`nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    </svg>
                    My Driveways
                  </Link>
                )}

                <Link 
                  to="/profile" 
                  className={`nav-link ${isActiveRoute('/profile') ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
                >
                  Home
                </Link>
                <Link 
                  to="/register" 
                  className={`nav-link ${isActiveRoute('/register') ? 'active' : ''}`}
                >
                  Register
                </Link>
                <Link 
                  to="/login" 
                  className={`nav-link ${isActiveRoute('/login') ? 'active' : ''}`}
                >
                  Login
                </Link>
              </>
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
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-role">{user?.role || 'User'}</span>
                  </div>
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
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-name">{user?.name || 'User'}</div>
                        <div className="dropdown-email">{user?.email || 'user@example.com'}</div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-menu">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/profile');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        My Profile
                      </button>

                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowProfileDropdown(false);
                          navigate('/profile');
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Contact Info
                      </button>

                      <div className="dropdown-divider"></div>

                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/register" className="auth-button secondary">
                  Sign Up
                </Link>
                <Link to="/login" className="auth-button primary">
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
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
                  <Link 
                    to={getPrimaryDashboardLink()} 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Dashboard
                  </Link>

                  {user?.roles.includes('driver') && (
                    <Link 
                      to="/driver-dashboard" 
                      className="mobile-nav-link"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                      Find Parking
                    </Link>
                  )}

                  {user?.roles.includes('owner') && (
                    <Link 
                      to="/owner-dashboard" 
                      className="mobile-nav-link"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                      </svg>
                      My Driveways
                    </Link>
                  )}

                  <Link 
                    to="/profile" 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </Link>

                  <div className="mobile-divider"></div>

                  <button 
                    className="mobile-nav-link logout"
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/" 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/register" 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign Up
                  </Link>
                  <Link 
                    to="/login" 
                    className="mobile-nav-link"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Breadcrumbs for dashboard pages */}
      {isAuthenticated && isDashboardRoute() && (
        <div className="breadcrumb-container">
          <Breadcrumb />
        </div>
      )}
    </>
  );
};

export default EnhancedNav;
