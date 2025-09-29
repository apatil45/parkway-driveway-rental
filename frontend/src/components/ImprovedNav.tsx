import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ImprovedNav.css';

const ImprovedNav: React.FC = () => {
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
    // Close mobile menu when route changes
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
    
    // Priority: driver first, then owner
    if (user.roles.includes('driver')) return '/driver-dashboard';
    if (user.roles.includes('owner')) return '/owner-dashboard';
    return '/';
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const getUserRoleDisplay = () => {
    if (!user || !user.roles) return 'User';
    
    if (user.roles.length === 1) {
      return user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1);
    }
    
    return user.roles.map(role => 
      role.charAt(0).toUpperCase() + role.slice(1)
    ).join(' & ');
  };

  return (
    <>
      <nav className="improved-nav">
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
              <span className="brand-text">Parkway</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-menu">
            {isAuthenticated ? (
              <>
                {/* Dashboard Link */}
                <Link 
                  to={getDashboardRoute()} 
                  className={`nav-link ${isActiveRoute(getDashboardRoute()) ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Dashboard
                </Link>

                {/* Role-specific Navigation */}
                {user?.roles?.includes('driver') && (
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

                {user?.roles?.includes('owner') && (
                  <Link 
                    to="/owner-dashboard" 
                    className={`nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                      <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                    </svg>
                    My Driveways
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  Home
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
                  aria-expanded={showProfileDropdown}
                  aria-haspopup="true"
                >
                  <div className="user-avatar">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-role">{getUserRoleDisplay()}</span>
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
                        <div className="dropdown-role">{getUserRoleDisplay()}</div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <div className="dropdown-menu">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        My Profile
                      </Link>

                      {user?.roles?.includes('driver') && (
                        <Link
                          to="/driver-dashboard"
                          className="dropdown-item"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                          </svg>
                          Driver Dashboard
                        </Link>
                      )}

                      {user?.roles?.includes('owner') && (
                        <Link
                          to="/owner-dashboard"
                          className="dropdown-item"
                          onClick={() => setShowProfileDropdown(false)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                            <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                          </svg>
                          Owner Dashboard
                        </Link>
                      )}

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
                        Sign Out
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
              aria-expanded={showMobileMenu}
              aria-label="Toggle mobile menu"
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
                      <div className="mobile-role">{getUserRoleDisplay()}</div>
                    </div>
                  </div>

                  <div className="mobile-divider"></div>

                  <div className="mobile-nav-links">
                    <Link 
                      to={getDashboardRoute()} 
                      className={`mobile-nav-link ${isActiveRoute(getDashboardRoute()) ? 'active' : ''}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Dashboard
                    </Link>

                    {user?.roles?.includes('driver') && (
                      <Link 
                        to="/driver-dashboard" 
                        className={`mobile-nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8"/>
                          <path d="m21 21-4.35-4.35"/>
                        </svg>
                        Find Parking
                      </Link>
                    )}

                    {user?.roles?.includes('owner') && (
                      <Link 
                        to="/owner-dashboard" 
                        className={`mobile-nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                          <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                        </svg>
                        My Driveways
                      </Link>
                    )}

                    <Link 
                      to="/profile" 
                      className={`mobile-nav-link ${isActiveRoute('/profile') ? 'active' : ''}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      My Profile
                    </Link>
                  </div>

                  <div className="mobile-divider"></div>

                  <button className="mobile-logout-button" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="mobile-auth-links">
                  <Link to="/" className={`mobile-nav-link ${isActiveRoute('/') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    Home
                  </Link>
                  
                  <Link to="/register" className={`mobile-nav-link ${isActiveRoute('/register') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Sign Up
                  </Link>
                  
                  <Link to="/login" className={`mobile-nav-link ${isActiveRoute('/login') ? 'active' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default ImprovedNav;
