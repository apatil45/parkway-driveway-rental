import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import './Nav.css';

const Nav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Close dropdowns on Escape
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
        setShowMobileMenu(false);
        setFocusedElement(null);
      }
      
      // Handle Tab navigation for mobile menu
      if (showMobileMenu && event.key === 'Tab') {
        const mobileMenu = mobileMenuRef.current;
        if (mobileMenu) {
          const focusableElements = mobileMenu.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMobileMenu]);

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
    <>
      {/* Skip Links for Accessibility */}
      <div className="skip-links">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <a href="#navigation" className="skip-link">
          Skip to navigation
        </a>
        {isAuthenticated && (
          <a href="#user-menu" className="skip-link">
            Skip to user menu
          </a>
        )}
      </div>

      <nav className="nav" id="navigation" role="navigation" aria-label="Main navigation">
        <div className="nav-container">
          {/* Brand */}
          <Link 
            to="/" 
            className="brand"
            aria-label="Parkway - Go to homepage"
            onFocus={() => setFocusedElement('brand')}
            onBlur={() => setFocusedElement(null)}
          >
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
        <div className="nav-links" role="menubar">
          {isAuthenticated ? (
            <>
              {user?.roles?.includes('driver') && (
                <Link 
                  to="/driver-dashboard" 
                  className={`nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/driver-dashboard') ? 'page' : undefined}
                  onFocus={() => setFocusedElement('find-parking')}
                  onBlur={() => setFocusedElement(null)}
                >
                  Find Parking
                </Link>
              )}
              
              {user?.roles?.includes('owner') && (
                <Link 
                  to="/owner-dashboard" 
                  className={`nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/owner-dashboard') ? 'page' : undefined}
                  onFocus={() => setFocusedElement('my-driveways')}
                  onBlur={() => setFocusedElement(null)}
                >
                  My Driveways
                </Link>
              )}
            </>
          ) : (
            <Link 
              to="/" 
              className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
              role="menuitem"
              aria-current={isActiveRoute('/') ? 'page' : undefined}
              onFocus={() => setFocusedElement('home')}
              onBlur={() => setFocusedElement(null)}
            >
              Home
            </Link>
          )}
          
          <Link 
            to="/help" 
            className={`nav-link ${isActiveRoute('/help') ? 'active' : ''}`}
            role="menuitem"
            aria-current={isActiveRoute('/help') ? 'page' : undefined}
            onFocus={() => setFocusedElement('help')}
            onBlur={() => setFocusedElement(null)}
          >
            Help
          </Link>
        </div>

        {/* User Actions */}
        <div className="nav-actions" id="user-menu">
          {isAuthenticated && <NotificationCenter />}
          {isAuthenticated ? (
            <div className="profile-section" ref={dropdownRef}>
              <button 
                className="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                aria-expanded={showProfileDropdown}
                aria-haspopup="true"
                aria-label={`User menu for ${user?.name || 'User'}. ${showProfileDropdown ? 'Close' : 'Open'} menu`}
                onFocus={() => setFocusedElement('profile-button')}
                onBlur={() => setFocusedElement(null)}
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
                <div 
                  className="profile-dropdown"
                  role="menu"
                  aria-label="User menu"
                >
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setShowProfileDropdown(false)}
                    onFocus={() => setFocusedElement('profile-link')}
                    onBlur={() => setFocusedElement(null)}
                  >
                    Profile
                  </Link>
                  
                  <div className="dropdown-divider" role="separator"></div>
                  
                  <button
                    className="dropdown-item logout"
                    role="menuitem"
                    onClick={handleLogout}
                    onFocus={() => setFocusedElement('logout-button')}
                    onBlur={() => setFocusedElement(null)}
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
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
            aria-label={`${showMobileMenu ? 'Close' : 'Open'} mobile menu`}
            onFocus={() => setFocusedElement('mobile-menu-toggle')}
            onBlur={() => setFocusedElement(null)}
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
        <div 
          className="mobile-menu"
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
        >
          <div className="mobile-menu-content">
            <h2 id="mobile-menu-title" className="sr-only">Mobile Navigation Menu</h2>
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

                <div className="mobile-nav-links" role="menu">
                  {user?.roles?.includes('driver') && (
                    <Link 
                      to="/driver-dashboard" 
                      className={`mobile-nav-link ${isActiveRoute('/driver-dashboard') ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActiveRoute('/driver-dashboard') ? 'page' : undefined}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Find Parking
                    </Link>
                  )}
                  
                  {user?.roles?.includes('owner') && (
                    <Link 
                      to="/owner-dashboard" 
                      className={`mobile-nav-link ${isActiveRoute('/owner-dashboard') ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActiveRoute('/owner-dashboard') ? 'page' : undefined}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      My Driveways
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className={`mobile-nav-link ${isActiveRoute('/profile') ? 'active' : ''}`}
                    role="menuitem"
                    aria-current={isActiveRoute('/profile') ? 'page' : undefined}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Profile
                  </Link>
                  
                  <Link 
                    to="/help" 
                    className={`mobile-nav-link ${isActiveRoute('/help') ? 'active' : ''}`}
                    role="menuitem"
                    aria-current={isActiveRoute('/help') ? 'page' : undefined}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Help
                  </Link>
                  
                  <button 
                    className="mobile-logout-button" 
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-auth-links" role="menu">
                <Link 
                  to="/" 
                  className={`mobile-nav-link ${isActiveRoute('/') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/login" 
                  className={`mobile-nav-link ${isActiveRoute('/login') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/login') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className={`mobile-nav-link ${isActiveRoute('/register') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/register') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign Up
                </Link>
                <Link 
                  to="/help" 
                  className={`mobile-nav-link ${isActiveRoute('/help') ? 'active' : ''}`}
                  role="menuitem"
                  aria-current={isActiveRoute('/help') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Help
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

export default Nav;
