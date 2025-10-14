import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import OnboardingFlow from './OnboardingFlow';

interface OnboardingWrapperProps {
  children: React.ReactNode;
}

const OnboardingWrapper: React.FC<OnboardingWrapperProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isAuthenticated && user) {
        // Check if user has completed onboarding
        const hasCompletedOnboarding = user.onboardingCompleted === true;
        
        if (!hasCompletedOnboarding) {
          setShowOnboarding(true);
        }
      }
      setIsCheckingOnboarding(false);
    };

    checkOnboardingStatus();
  }, [isAuthenticated, user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner-lg mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showOnboarding && (
        <OnboardingFlow 
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      )}
    </>
  );
};

export default OnboardingWrapper;
