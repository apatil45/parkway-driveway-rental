import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './OnboardingTour.css';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Define tour steps based on user role
  const getTourSteps = (): TourStep[] => {
    if (user?.roles.includes('driver')) {
      return [
        {
          id: 'search-intro',
          title: '🔍 Find Parking',
          description: 'Search for available driveways by location, date, and time. Use the map to see nearby options.',
          target: '.search-section',
          position: 'bottom'
        },
        {
          id: 'filters-intro',
          title: '🎯 Smart Filters',
          description: 'Filter by car size, price range, and availability to find the perfect spot.',
          target: '.filter-section',
          position: 'bottom'
        },
        {
          id: 'booking-intro',
          title: '📅 Easy Booking',
          description: 'Click "Book Now" to reserve your spot. We\'ll capture your location automatically!',
          target: '.booking-section',
          position: 'top'
        },
        {
          id: 'profile-intro',
          title: '👤 Your Profile',
          description: 'Manage your bookings, payment methods, and preferences here.',
          target: '.profile-section',
          position: 'left'
        }
      ];
    } else {
      return [
        {
          id: 'list-intro',
          title: '🏠 List Your Driveway',
          description: 'Add your driveway to start earning money. Set your availability and pricing.',
          target: '.list-section',
          position: 'bottom'
        },
        {
          id: 'manage-intro',
          title: '📊 Manage Listings',
          description: 'View and edit your driveway listings, check availability, and update pricing.',
          target: '.manage-section',
          position: 'bottom'
        },
        {
          id: 'earnings-intro',
          title: '💰 Track Earnings',
          description: 'Monitor your bookings, earnings, and performance analytics.',
          target: '.earnings-section',
          position: 'top'
        },
        {
          id: 'profile-intro',
          title: '👤 Your Profile',
          description: 'Update your information, payment details, and account settings.',
          target: '.profile-section',
          position: 'left'
        }
      ];
    }
  };

  const tourSteps = getTourSteps();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
    if (!hasCompletedOnboarding && user) {
      setIsVisible(true);
    }
  }, [user]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-completed', 'true');
    onComplete();
  };

  if (!isVisible || !tourSteps[currentStep]) {
    return null;
  }

  const currentStepData = tourSteps[currentStep];
  const targetElement = document.querySelector(currentStepData.target);

  if (!targetElement) {
    // If target element not found, skip to next step
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 20;

    let top = rect.top + scrollTop;
    let left = rect.left + scrollLeft;

    switch (currentStepData.position) {
      case 'top':
        top = rect.top + scrollTop - tooltipHeight - padding;
        left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + scrollTop + padding;
        left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left + scrollLeft - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + scrollTop + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + scrollLeft + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return { top, left };
  };

  const position = getTooltipPosition();

  return (
    <>
      {/* Overlay */}
      <div className="onboarding-overlay" />
      
      {/* Highlight */}
      <div
        className="onboarding-highlight"
        style={{
          top: rect.top + scrollTop - 4,
          left: rect.left + scrollLeft - 4,
          width: rect.width + 8,
          height: rect.height + 8
        }}
      />

      {/* Tooltip */}
      <div
        className="onboarding-tooltip"
        style={{
          top: position.top,
          left: position.left
        }}
      >
        <div className="tooltip-content">
          <div className="tooltip-header">
            <h3 className="tooltip-title">{currentStepData.title}</h3>
            <button 
              className="tooltip-close"
              onClick={handleSkip}
              aria-label="Skip tour"
            >
              ×
            </button>
          </div>
          
          <p className="tooltip-description">
            {currentStepData.description}
          </p>
          
          <div className="tooltip-footer">
            <div className="tooltip-progress">
              <span className="progress-text">
                {currentStep + 1} of {tourSteps.length}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="tooltip-actions">
              <button 
                className="btn-skip"
                onClick={handleSkip}
              >
                Skip Tour
              </button>
              <button 
                className="btn-next"
                onClick={handleNext}
              >
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
