// Enhanced Loading Spinner Component for Parkway.com
import React from 'react';
import { LoadingState } from '../hooks/useLoadingState';

interface EnhancedLoadingSpinnerProps {
  loadingState: LoadingState;
  size?: 'small' | 'medium' | 'large';
  variant?: 'spinner' | 'dots' | 'pulse' | 'progress';
  showMessage?: boolean;
  showProgress?: boolean;
  showTime?: boolean;
  className?: string;
}

const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  loadingState,
  size = 'medium',
  variant = 'spinner',
  showMessage = true,
  showProgress = true,
  showTime = true,
  className = ''
}) => {
  const { isLoading, error, progress, message, startTime, estimatedDuration } = loadingState;

  // Calculate elapsed time
  const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Calculate estimated time remaining
  const estimatedRemaining = estimatedDuration && startTime 
    ? Math.max(0, estimatedDuration - elapsedTime)
    : null;

  if (error) {
    return (
      <div className={`enhanced-loading-spinner error ${size} ${className}`}>
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="dots-spinner">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      
      case 'pulse':
        return (
          <div className="pulse-spinner">
            <div className="pulse-circle"></div>
          </div>
        );
      
      case 'progress':
        return (
          <div className="progress-spinner">
            <div className="progress-circle">
              <div 
                className="progress-fill"
                style={{ 
                  transform: `rotate(${(progress / 100) * 360}deg)`,
                  transition: 'transform 0.3s ease'
                }}
              ></div>
            </div>
            {showProgress && (
              <div className="progress-text">{Math.round(progress)}%</div>
            )}
          </div>
        );
      
      default: // spinner
        return (
          <div className="spinner">
            <div className="spinner-ring"></div>
          </div>
        );
    }
  };

  return (
    <div className={`enhanced-loading-spinner ${size} ${variant} ${className}`}>
      <div className="spinner-container">
        {renderSpinner()}
      </div>
      
      {showMessage && message && (
        <div className="loading-message">{message}</div>
      )}
      
      {showProgress && progress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {showTime && startTime && (
        <div className="time-info">
          <div className="elapsed-time">
            Elapsed: {formatTime(elapsedTime)}
          </div>
          {estimatedRemaining !== null && (
            <div className="estimated-time">
              Est. remaining: {formatTime(estimatedRemaining)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedLoadingSpinner;
