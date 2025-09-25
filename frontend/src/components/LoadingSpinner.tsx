import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `loading-spinner-${size}`,
    fullScreen ? 'loading-spinner-fullscreen' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses}>
      <div className="spinner-container">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
