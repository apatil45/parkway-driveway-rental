import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import SmoothButton from './SmoothButton';
import LoadingSpinner from './LoadingSpinner';
import AnimatedContainer from './AnimatedContainer';
import ResponsiveLayout from './ResponsiveLayout';
import ResponsiveGrid from './ResponsiveGrid';
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
    <ResponsiveLayout maxWidth="xl" padding="lg" className="home-container">
      <AnimatedContainer direction="fade" delay={0.2}>
        <div className="home-hero">
          <AnimatedContainer direction="up" delay={0.4}>
            <h1 className="home-title">
              {isAuthenticated ? `Welcome back to Parkway.com!` : `Welcome to Parkway.com!`}
            </h1>
          </AnimatedContainer>
          
          <AnimatedContainer direction="up" delay={0.6}>
            <p className="home-subtitle">
              {isAuthenticated 
                ? `Continue your parking journey with us. ${user?.roles.includes('driver') 
                    ? 'Find available spots or manage your bookings.' 
                    : 'Manage your listings and track your earnings.'}`
                : 'Your premium platform for renting and listing private driveways. Find the perfect parking spot or monetize your unused driveway space with confidence.'
              }
            </p>
          </AnimatedContainer>
          
          <AnimatedContainer direction="up" delay={0.8}>
            <div className="home-actions">
              {!isAuthenticated ? (
                // Guest user actions
                <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="1rem">
                  <Link to="/register">
                    <SmoothButton variant="primary" size="xl" fullWidth>
                      Get Started
                    </SmoothButton>
                  </Link>
                  <Link to="/login">
                    <SmoothButton variant="outline" size="xl" fullWidth>
                      Sign In
                    </SmoothButton>
                  </Link>
                </ResponsiveGrid>
              ) : (
                // Logged-in user actions
                <div className="authenticated-actions">
                  <AnimatedContainer direction="up" delay={1.0}>
                    <div className="welcome-back">
                      <h3 className="welcome-message">Welcome back, {user?.name}! 👋</h3>
                      <p className="user-role-message">
                        {user?.roles.includes('driver') 
                          ? "Ready to find the perfect parking spot?" 
                          : "Ready to manage your driveway listings?"
                        }
                      </p>
                    </div>
                  </AnimatedContainer>
                  
                  <AnimatedContainer direction="up" delay={1.2}>
                    <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="1rem" className="quick-actions">
                      {user?.roles.includes('driver') ? (
                        <>
                          <SmoothButton 
                            variant="primary" 
                            size="xl" 
                            fullWidth
                            onClick={() => navigate('/driver-dashboard')}
                          >
                            Find Parking Now
                          </SmoothButton>
                          <SmoothButton 
                            variant="outline" 
                            size="xl" 
                            fullWidth
                            onClick={() => navigate('/profile')}
                          >
                            My Profile
                          </SmoothButton>
                        </>
                      ) : (
                        <>
                          <SmoothButton 
                            variant="primary" 
                            size="xl" 
                            fullWidth
                            onClick={() => navigate('/owner-dashboard')}
                          >
                            Manage Driveways
                          </SmoothButton>
                          <SmoothButton 
                            variant="outline" 
                            size="xl" 
                            fullWidth
                            onClick={() => navigate('/profile')}
                          >
                            View Earnings
                          </SmoothButton>
                        </>
                      )}
                    </ResponsiveGrid>
                  </AnimatedContainer>
                </div>
              )}
            </div>
          </AnimatedContainer>
        </div>
      </AnimatedContainer>
      
      <AnimatedContainer direction="up" delay={1.4}>
        <ResponsiveGrid 
          columns={{ mobile: 1, tablet: 2, desktop: 3 }} 
          gap="2rem" 
          className="home-features"
        >
          <AnimatedContainer direction="up" delay={1.6}>
            <div className="feature-card">
              <h3 className="feature-title">List Your Driveway</h3>
              <p className="feature-description">
                Turn your unused driveway into a source of income. Set your own prices, availability, and specify car size compatibility.
              </p>
            </div>
          </AnimatedContainer>
          
          <AnimatedContainer direction="up" delay={1.8}>
            <div className="feature-card">
              <h3 className="feature-title">Find Parking</h3>
              <p className="feature-description">
                Search for available driveways near your destination using our interactive map. Book instantly with secure payments.
              </p>
            </div>
          </AnimatedContainer>
          
          <AnimatedContainer direction="up" delay={2.0}>
            <div className="feature-card">
              <h3 className="feature-title">Earn Money</h3>
              <p className="feature-description">
                Generate passive income by renting out your driveway space to drivers in your area.
              </p>
            </div>
          </AnimatedContainer>
        </ResponsiveGrid>
      </AnimatedContainer>
    </ResponsiveLayout>
  );
};

export default Home;
