import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // For users with multiple roles, show both options
      if (user?.roles?.includes('driver') && user?.roles?.includes('owner')) {
        // User has both roles - they can choose from navigation
        return;
      } else if (user?.roles?.includes('driver')) {
        navigate('/driver-dashboard');
      } else if (user?.roles?.includes('owner')) {
        navigate('/owner-dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              {isAuthenticated ? (
                <>Welcome back, {user?.name || 'User'}!</>
              ) : (
                <>Find & Rent Driveways<br />Instantly</>
              )}
            </h1>
            
            <p className="hero-subtitle">
              {isAuthenticated ? (
                user?.roles?.includes('driver') && user?.roles?.includes('owner')
                  ? 'Access your driver and owner dashboards from the navigation above.'
                  : user?.roles?.includes('driver') 
                    ? 'Ready to find your next parking spot?'
                    : 'Manage your driveway listings and earnings.'
              ) : (
                'Connect drivers with homeowners for secure, convenient parking solutions.'
              )}
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={handleGetStarted}>
                {isAuthenticated ? (
                  user?.roles?.includes('driver') && user?.roles?.includes('owner')
                    ? 'Choose Dashboard'
                    : 'Go to Dashboard'
                ) : 'Get Started'}
              </button>
              
              {!isAuthenticated && (
                <Link to="/login" className="btn btn-outline">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          <div className="hero-visual">
            <div className="parking-demo">
              <div className="house">
                <div className="roof"></div>
                <div className="door"></div>
                <div className="window"></div>
              </div>
              <div className="driveway">
                <div className="car"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>For Drivers</h3>
                <p>Search for available driveways near your destination and book instantly.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>For Owners</h3>
                <p>List your unused driveway and earn money from drivers who need parking.</p>
              </div>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Secure & Easy</h3>
                <p>All transactions are secure with instant payments and real-time availability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Us?</h2>
          
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3>Easy Search</h3>
              <p>Find driveways by location, price, and car size compatibility.</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Earn Money</h3>
              <p>Turn your unused driveway into a steady income stream.</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Secure Payments</h3>
              <p>Safe transactions with instant payment processing.</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3>Mobile Friendly</h3>
              <p>Access everything from your phone, anywhere, anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <h2>Ready to Start?</h2>
            <p>Join thousands of drivers and homeowners already using our platform.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-outline">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;