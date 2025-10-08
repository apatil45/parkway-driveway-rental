import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  fullScreen = false,
  className = ''
}) => {
  const spinnerClass = `loading-spinner ${size} ${fullScreen ? 'full-screen' : ''} ${className}`;

  if (fullScreen) {
    return (
      <div className={spinnerClass} role="status" aria-live="polite">
        <div className="spinner-container">
          <div className="spinner" aria-hidden="true"></div>
          <p className="loading-message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={spinnerClass} role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;