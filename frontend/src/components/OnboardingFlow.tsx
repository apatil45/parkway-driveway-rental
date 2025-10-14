import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './OnboardingFlow.css';

interface OnboardingData {
  step: number;
  role: 'driver' | 'owner' | 'both';
  preferences: {
    carSize?: 'small' | 'medium' | 'large' | 'extra-large';
    drivewaySize?: 'small' | 'medium' | 'large' | 'extra-large';
    phoneNumber?: string;
    address?: string;
    notifications: boolean;
    marketing: boolean;
  };
  completed: boolean;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onComplete }) => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    step: 1,
    role: 'driver',
    preferences: {
      notifications: true,
      marketing: false
    },
    completed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect user role from registration
  useEffect(() => {
    if (user?.roles) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
      if (userRoles.includes('owner') && userRoles.includes('driver')) {
        setOnboardingData(prev => ({ ...prev, role: 'both' }));
      } else if (userRoles.includes('owner')) {
        setOnboardingData(prev => ({ ...prev, role: 'owner' }));
      } else {
        setOnboardingData(prev => ({ ...prev, role: 'driver' }));
      }
    }
  }, [user]);

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      updateOnboardingData({ step: currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      updateOnboardingData({ step: currentStep - 1 });
    }
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Update user profile with onboarding data
      const profileData = {
        carSize: onboardingData.preferences.carSize,
        drivewaySize: onboardingData.preferences.drivewaySize,
        phoneNumber: onboardingData.preferences.phoneNumber,
        address: onboardingData.preferences.address,
        onboardingCompleted: true
      };

      // Call backend to update user profile
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser.user);
        
        // Mark onboarding as completed
        updateOnboardingData({ completed: true });
        
        // Navigate based on user role
        if (onboardingData.role === 'owner') {
          navigate('/owner-dashboard');
        } else if (onboardingData.role === 'driver') {
          navigate('/');
        } else {
          navigate('/'); // Both roles - let them choose
        }
        
        onComplete();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Onboarding completion error:', error);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Progress Indicator */}
        <div className="onboarding-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="progress-steps">
            {[1, 2, 3, 4].map(step => (
              <div 
                key={step}
                className={`progress-step ${currentStep >= step ? 'active' : ''}`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="onboarding-content">
          {currentStep === 1 && (
            <WelcomeStep 
              role={onboardingData.role}
              onRoleChange={(role) => updateOnboardingData({ role })}
              onNext={nextStep}
            />
          )}

          {currentStep === 2 && (
            <PreferencesStep 
              role={onboardingData.role}
              preferences={onboardingData.preferences}
              onPreferencesChange={(preferences) => 
                updateOnboardingData({ preferences: { ...onboardingData.preferences, ...preferences } })
              }
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 3 && (
            <ProfileStep 
              preferences={onboardingData.preferences}
              onPreferencesChange={(preferences) => 
                updateOnboardingData({ preferences: { ...onboardingData.preferences, ...preferences } })
              }
              onNext={nextStep}
              onPrev={prevStep}
            />
          )}

          {currentStep === 4 && (
            <CompletionStep 
              role={onboardingData.role}
              preferences={onboardingData.preferences}
              onComplete={completeOnboarding}
              onPrev={prevStep}
              isLoading={isLoading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Welcome & Role Selection
const WelcomeStep: React.FC<{
  role: 'driver' | 'owner' | 'both';
  onRoleChange: (role: 'driver' | 'owner' | 'both') => void;
  onNext: () => void;
}> = ({ role, onRoleChange, onNext }) => {
  return (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Welcome to Parkway! 🚗</h2>
        <p>Let's get you set up in just a few steps</p>
      </div>

      <div className="step-content">
        <div className="role-selection">
          <h3>How will you be using Parkway?</h3>
          <div className="role-options">
            <div 
              className={`role-option ${role === 'driver' ? 'selected' : ''}`}
              onClick={() => onRoleChange('driver')}
            >
              <div className="role-icon">🚗</div>
              <h4>Find Parking</h4>
              <p>Book driveways for your parking needs</p>
            </div>

            <div 
              className={`role-option ${role === 'owner' ? 'selected' : ''}`}
              onClick={() => onRoleChange('owner')}
            >
              <div className="role-icon">🏠</div>
              <h4>List Driveway</h4>
              <p>Earn money by renting out your driveway</p>
            </div>

            <div 
              className={`role-option ${role === 'both' ? 'selected' : ''}`}
              onClick={() => onRoleChange('both')}
            >
              <div className="role-icon">🔄</div>
              <h4>Both</h4>
              <p>Find parking and list your driveway</p>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!role}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

// Step 2: Preferences
const PreferencesStep: React.FC<{
  role: 'driver' | 'owner' | 'both';
  preferences: OnboardingData['preferences'];
  onPreferencesChange: (preferences: Partial<OnboardingData['preferences']>) => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ role, preferences, onPreferencesChange, onNext, onPrev }) => {
  return (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Tell us about your preferences</h2>
        <p>This helps us personalize your experience</p>
      </div>

      <div className="step-content">
        <div className="preferences-form">
          {(role === 'driver' || role === 'both') && (
            <div className="form-group">
              <label className="form-label">Vehicle Size</label>
              <select 
                className="form-select"
                value={preferences.carSize || ''}
                onChange={(e) => onPreferencesChange({ carSize: e.target.value as any })}
              >
                <option value="">Select your vehicle size</option>
                <option value="small">Small (Compact car, motorcycle)</option>
                <option value="medium">Medium (Sedan, SUV)</option>
                <option value="large">Large (Truck, large SUV)</option>
                <option value="extra-large">Extra Large (RV, trailer)</option>
              </select>
            </div>
          )}

          {(role === 'owner' || role === 'both') && (
            <div className="form-group">
              <label className="form-label">Driveway Size</label>
              <select 
                className="form-select"
                value={preferences.drivewaySize || ''}
                onChange={(e) => onPreferencesChange({ drivewaySize: e.target.value as any })}
              >
                <option value="">Select your driveway size</option>
                <option value="small">Small (1 car)</option>
                <option value="medium">Medium (2 cars)</option>
                <option value="large">Large (3+ cars)</option>
                <option value="extra-large">Extra Large (RV/trailer friendly)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <input 
              type="tel"
              className="form-input"
              placeholder="+1 (555) 123-4567"
              value={preferences.phoneNumber || ''}
              onChange={(e) => onPreferencesChange({ phoneNumber: e.target.value })}
            />
            <small className="form-help">For booking confirmations and updates</small>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-outline" onClick={onPrev}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
};

// Step 3: Profile Setup
const ProfileStep: React.FC<{
  preferences: OnboardingData['preferences'];
  onPreferencesChange: (preferences: Partial<OnboardingData['preferences']>) => void;
  onNext: () => void;
  onPrev: () => void;
}> = ({ preferences, onPreferencesChange, onNext, onPrev }) => {
  return (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>Complete your profile</h2>
        <p>Add your location for better parking recommendations</p>
      </div>

      <div className="step-content">
        <div className="profile-form">
          <div className="form-group">
            <label className="form-label">Your Address (Optional)</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter your home address"
              value={preferences.address || ''}
              onChange={(e) => onPreferencesChange({ address: e.target.value })}
            />
            <small className="form-help">Helps us find parking near your location</small>
          </div>

          <div className="notification-preferences">
            <h4>Notification Preferences</h4>
            
            <div className="form-checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => onPreferencesChange({ notifications: e.target.checked })}
                  className="checkbox-input"
                />
                <span className="checkbox-custom">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </span>
                <span className="checkbox-text">
                  <strong>Booking notifications</strong>
                  <small>Get notified about booking confirmations and updates</small>
                </span>
              </label>
            </div>

            <div className="form-checkbox-field">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => onPreferencesChange({ marketing: e.target.checked })}
                  className="checkbox-input"
                />
                <span className="checkbox-custom">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                </span>
                <span className="checkbox-text">
                  <strong>Marketing updates</strong>
                  <small>Receive tips, promotions, and new feature announcements</small>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="step-actions">
        <button className="btn btn-outline" onClick={onPrev}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          Continue
        </button>
      </div>
    </div>
  );
};

// Step 4: Completion
const CompletionStep: React.FC<{
  role: 'driver' | 'owner' | 'both';
  preferences: OnboardingData['preferences'];
  onComplete: () => void;
  onPrev: () => void;
  isLoading: boolean;
  error: string | null;
}> = ({ role, preferences, onComplete, onPrev, isLoading, error }) => {
  return (
    <div className="onboarding-step">
      <div className="step-header">
        <h2>You're all set! 🎉</h2>
        <p>Let's review your setup and get started</p>
      </div>

      <div className="step-content">
        <div className="completion-summary">
          <div className="summary-card">
            <h4>Your Parkway Profile</h4>
            <div className="summary-details">
              <div className="summary-item">
                <span className="label">Role:</span>
                <span className="value">
                  {role === 'driver' && '🚗 Driver'}
                  {role === 'owner' && '🏠 Owner'}
                  {role === 'both' && '🔄 Driver & Owner'}
                </span>
              </div>
              
              {preferences.carSize && (
                <div className="summary-item">
                  <span className="label">Vehicle:</span>
                  <span className="value">{preferences.carSize}</span>
                </div>
              )}
              
              {preferences.drivewaySize && (
                <div className="summary-item">
                  <span className="label">Driveway:</span>
                  <span className="value">{preferences.drivewaySize}</span>
                </div>
              )}
              
              {preferences.phoneNumber && (
                <div className="summary-item">
                  <span className="label">Phone:</span>
                  <span className="value">{preferences.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="next-steps">
            <h4>What's next?</h4>
            <ul>
              {role === 'driver' && (
                <li>🔍 Search for parking near your destination</li>
              )}
              {role === 'owner' && (
                <li>🏠 List your driveway to start earning</li>
              )}
              {role === 'both' && (
                <>
                  <li>🔍 Search for parking when you need it</li>
                  <li>🏠 List your driveway to earn money</li>
                </>
              )}
              <li>📱 Download our mobile app for easier access</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
      </div>

      <div className="step-actions">
        <button className="btn btn-outline" onClick={onPrev} disabled={isLoading}>
          Back
        </button>
        <button 
          className="btn btn-primary btn-lg"
          onClick={onComplete}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="loading-spinner" />
              Setting up...
            </>
          ) : (
            'Get Started'
          )}
        </button>
      </div>
    </div>
  );
};

export default OnboardingFlow;
