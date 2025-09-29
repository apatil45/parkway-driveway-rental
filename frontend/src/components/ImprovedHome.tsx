import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import './ImprovedHome.css';

const ImprovedHome: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Quick loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (user?.roles?.includes('driver')) {
        navigate('/driver-dashboard');
      } else if (user?.roles?.includes('owner')) {
        navigate('/owner-dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  if (isLoading) {
    return (
      <div className="home-loading">
        <LoadingSpinner />
        <p className="loading-text">Welcome to Parkway...</p>
      </div>
    );
  }

  return (
    <div className="improved-home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              Premium Parking Platform
            </div>

            <h1 className="hero-title">
              {isAuthenticated ? (
                <>Welcome back to <span className="brand-highlight">Parkway</span></>
              ) : (
                <>Find Perfect Parking with <span className="brand-highlight">Parkway</span></>
              )}
            </h1>

            <p className="hero-description">
              {isAuthenticated ? (
                user?.roles?.includes('driver') 
                  ? 'Ready to find your next parking spot? Browse available driveways in your area and book instantly.'
                  : 'Manage your driveway listings, track earnings, and connect with drivers looking for parking.'
              ) : (
                'Connect drivers with homeowners for secure, convenient parking. List your driveway or find the perfect spot in seconds.'
              )}
            </p>

            <div className="hero-actions">
              <button 
                className="cta-button primary"
                onClick={handleGetStarted}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
              </button>

              {!isAuthenticated && (
                <Link to="/login" className="cta-button secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  Sign In
                </Link>
              )}
            </div>

            {isAuthenticated && (
              <div className="user-welcome">
                <div className="user-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">Hi, {user?.name || 'User'}!</span>
                  <span className="user-role">
                    {user?.roles?.map(role => 
                      role.charAt(0).toUpperCase() + role.slice(1)
                    ).join(' & ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="hero-visual">
            <div className="hero-image">
              <div className="parking-illustration">
                <svg width="300" height="200" viewBox="0 0 300 200" fill="none">
                  {/* Car */}
                  <rect x="50" y="120" width="80" height="40" rx="8" fill="#3b82f6" opacity="0.8"/>
                  <circle cx="65" cy="170" r="8" fill="#1f2937"/>
                  <circle cx="115" cy="170" r="8" fill="#1f2937"/>
                  
                  {/* Driveway */}
                  <rect x="30" y="100" width="120" height="80" rx="4" fill="#e5e7eb" opacity="0.6"/>
                  
                  {/* House */}
                  <rect x="180" y="80" width="90" height="80" rx="4" fill="#f3f4f6"/>
                  <polygon points="175,80 225,40 275,80" fill="#3b82f6" opacity="0.7"/>
                  <rect x="200" y="120" width="20" height="40" fill="#6b7280"/>
                  <circle cx="260" cy="100" r="4" fill="#fbbf24"/>
                  
                  {/* Background elements */}
                  <circle cx="280" cy="30" r="20" fill="#fbbf24" opacity="0.3"/>
                  <rect x="10" y="180" width="280" height="20" fill="#10b981" opacity="0.2"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Parkway?</h2>
            <p className="section-description">
              Experience the future of parking with our comprehensive platform
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon driver">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3 className="feature-title">Find Parking</h3>
              <p className="feature-description">
                Search and book available driveways near your destination. Filter by price, car size, and amenities.
              </p>
              {!isAuthenticated && (
                <Link to="/register" className="feature-link">
                  Start searching →
                </Link>
              )}
            </div>

            <div className="feature-card">
              <div className="feature-icon owner">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                  <path d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                </svg>
              </div>
              <h3 className="feature-title">List Your Driveway</h3>
              <p className="feature-description">
                Turn your unused driveway into income. Set your own prices and availability with full control.
              </p>
              {!isAuthenticated && (
                <Link to="/register" className="feature-link">
                  Start earning →
                </Link>
              )}
            </div>

            <div className="feature-card">
              <div className="feature-icon secure">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="feature-title">Secure Payments</h3>
              <p className="feature-description">
                Safe and secure transactions with instant payment processing. Your money is protected every step of the way.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon support">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h3 className="feature-title">24/7 Support</h3>
              <p className="feature-description">
                Get help when you need it with our dedicated customer support team available around the clock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Listed Driveways</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Successful Bookings</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">99%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Get Started?</h2>
              <p className="cta-description">
                Join thousands of users who trust Parkway for their parking needs
              </p>
              <div className="cta-actions">
                <Link to="/register" className="cta-button primary large">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Create Account
                </Link>
                <Link to="/login" className="cta-button secondary large">
                  Sign In Instead
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ImprovedHome;
