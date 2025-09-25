import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import './Home.css';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for professional feel
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading Parkway.com..." fullScreen />;
  }

  return (
    <div className="home-container">
      <div className="home-hero">
        <h1 className="home-title">
          {isAuthenticated ? `Welcome back to Parkway.com!` : `Welcome to Parkway.com!`}
        </h1>
        <p className="home-subtitle">
          {isAuthenticated 
            ? `Continue your parking journey with us. ${user?.role === 'driver' 
                ? 'Find available spots or manage your bookings.' 
                : 'Manage your listings and track your earnings.'}`
            : 'Your premium platform for renting and listing private driveways. Find the perfect parking spot or monetize your unused driveway space with confidence.'
          }
        </p>
        
        <div className="home-actions">
          {!isAuthenticated ? (
            // Guest user actions
            <>
              <Link to="/register">
                <Button variant="primary" size="xl">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="xl">
                  Sign In
                </Button>
              </Link>
            </>
          ) : (
            // Logged-in user actions
            <div className="authenticated-actions">
              <div className="welcome-back">
                <h3 className="welcome-message">Welcome back, {user?.name}! 👋</h3>
                <p className="user-role-message">
                  {user?.role === 'driver' 
                    ? "Ready to find the perfect parking spot?" 
                    : "Ready to manage your driveway listings?"
                  }
                </p>
              </div>
              
              <div className="quick-actions">
                {user?.role === 'driver' ? (
                  <>
                    <Button 
                      variant="primary" 
                      size="xl" 
                      onClick={() => navigate('/driver-dashboard')}
                    >
                      Find Parking Now
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="xl" 
                      onClick={() => navigate('/profile')}
                    >
                      My Profile
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="primary" 
                      size="xl" 
                      onClick={() => navigate('/owner-dashboard')}
                    >
                      Manage Driveways
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="xl" 
                      onClick={() => navigate('/profile')}
                    >
                      View Earnings
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="home-features">
        <div className="feature-card">
          <h3 className="feature-title">List Your Driveway</h3>
          <p className="feature-description">
            Turn your unused driveway into a source of income. Set your own prices, availability, and specify car size compatibility.
          </p>
        </div>
        
        <div className="feature-card">
          <h3 className="feature-title">Find Parking</h3>
          <p className="feature-description">
            Search for available driveways near your destination using our interactive map. Book instantly with secure payments.
          </p>
        </div>
        
        <div className="feature-card">
          <h3 className="feature-title">Earn Money</h3>
          <p className="feature-description">
            Generate passive income by renting out your driveway space to drivers in your area.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
