import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import RoleSwitcher from './RoleSwitcher';
// CSS import removed - now using Tailwind CSS

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
      <div className="sr-only">
        <a href="#main-content" className="sr-only">
          Skip to main content
        </a>
        <a href="#navigation" className="sr-only">
          Skip to navigation
        </a>
        {isAuthenticated && (
          <a href="#user-menu" className="sr-only">
            Skip to user menu
          </a>
        )}
      </div>

      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40" id="navigation" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Brand */}
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-150 flex-shrink-0"
              aria-label="Parkway - Go to homepage"
              onFocus={() => setFocusedElement('brand')}
              onBlur={() => setFocusedElement(null)}
            >
              <div className="w-8 h-8 text-blue-600">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <span>Parkway</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-6 ml-4 xl:ml-8" role="menubar">
              {isAuthenticated ? (
                <>
                  {user?.roles?.includes('driver') && (
                    <Link 
                      to="/driver-dashboard" 
                      className={`btn ${isActiveRoute('/driver-dashboard') ? 'btn-primary' : 'btn-ghost'} btn-sm`}
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
                      className={`btn ${isActiveRoute('/owner-dashboard') ? 'btn-primary' : 'btn-ghost'} btn-sm`}
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
                  className={`btn ${isActiveRoute('/') ? 'btn-primary' : 'btn-ghost'} btn-sm`}
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
                className={`btn ${isActiveRoute('/help') ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                role="menuitem"
                aria-current={isActiveRoute('/help') ? 'page' : undefined}
                onFocus={() => setFocusedElement('help')}
                onBlur={() => setFocusedElement(null)}
              >
                Help
              </Link>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 ml-auto" id="user-menu">
              {isAuthenticated && <NotificationCenter />}
              {isAuthenticated ? (
                <>
                  <RoleSwitcher />
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      className="btn btn-ghost btn-sm flex items-center space-x-2"
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      aria-expanded={showProfileDropdown}
                      aria-haspopup="true"
                      aria-label={`User menu for ${user?.name || 'User'}. ${showProfileDropdown ? 'Close' : 'Open'} menu`}
                      onFocus={() => setFocusedElement('profile-button')}
                      onBlur={() => setFocusedElement(null)}
                    >
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="hidden md:block">{user?.name || 'User'}</span>
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`transition-transform duration-150 ${showProfileDropdown ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6,9 12,15 18,9"/>
                      </svg>
                    </button>

                    {showProfileDropdown && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                        role="menu"
                        aria-label="User menu"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                          role="menuitem"
                          onClick={() => setShowProfileDropdown(false)}
                          onFocus={() => setFocusedElement('profile-link')}
                          onBlur={() => setFocusedElement(null)}
                        >
                          Profile
                        </Link>
                        
                        <div className="border-t border-gray-100" role="separator"></div>
                        
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
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
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="btn btn-outline btn-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden btn btn-ghost btn-sm"
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
            className="lg:hidden bg-white border-t border-gray-200 shadow-lg"
            id="mobile-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="px-4 py-6 space-y-4">
              <h2 id="mobile-menu-title" className="sr-only">Mobile Navigation Menu</h2>
            {isAuthenticated ? (
              <>
                {/* User Info Section */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-semibold">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-gray-900 truncate">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-2" role="menu">
                  {user?.roles?.includes('driver') && (
                    <Link 
                      to="/driver-dashboard" 
                      className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                        isActiveRoute('/driver-dashboard') 
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                      aria-current={isActiveRoute('/driver-dashboard') ? 'page' : undefined}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Find Parking
                    </Link>
                  )}
                  
                  {user?.roles?.includes('owner') && (
                    <Link 
                      to="/owner-dashboard" 
                      className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                        isActiveRoute('/owner-dashboard') 
                          ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                      aria-current={isActiveRoute('/owner-dashboard') ? 'page' : undefined}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      My Driveways
                    </Link>
                  )}
                  
                  <Link 
                    to="/profile" 
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                      isActiveRoute('/profile') 
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                    aria-current={isActiveRoute('/profile') ? 'page' : undefined}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  
                  <Link 
                    to="/help" 
                    className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                      isActiveRoute('/help') 
                        ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                    aria-current={isActiveRoute('/help') ? 'page' : undefined}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Help
                  </Link>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <button 
                    className="flex items-center w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-150" 
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2" role="menu">
                <Link 
                  to="/" 
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                    isActiveRoute('/') 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                  aria-current={isActiveRoute('/') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
                <Link 
                  to="/login" 
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                    isActiveRoute('/login') 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                  aria-current={isActiveRoute('/login') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                    isActiveRoute('/register') 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                  aria-current={isActiveRoute('/register') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Sign Up
                </Link>
                <Link 
                  to="/help" 
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors duration-150 ${
                    isActiveRoute('/help') 
                      ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  role="menuitem"
                  aria-current={isActiveRoute('/help') ? 'page' : undefined}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
