import React from 'react';
import './ProgressIndicator.css';

interface ProgressIndicatorProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  steps, 
  currentStep, 
  className = '' 
}) => {
  return (
    <div className={`progress-indicator ${className}`}>
      <div className="progress-steps">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`progress-step ${
              index < currentStep ? 'completed' : 
              index === currentStep ? 'active' : 'pending'
            }`}
          >
            <div className="step-number">
              {index < currentStep ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="step-label">{step}</div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${index < currentStep ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressIndicator;
