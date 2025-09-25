import React from 'react';
import './ProfessionalErrorModal.css';

interface ErrorDetails {
  code?: string;
  field?: string;
  suggestion?: string;
  supportEmail?: string;
}

interface ProfessionalErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  details?: ErrorDetails;
  actions?: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
  showRetry?: boolean;
  onRetry?: () => void;
  showReport?: boolean;
  onReport?: () => void;
}

const ProfessionalErrorModal: React.FC<ProfessionalErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type,
  details,
  actions = [],
  showRetry = false,
  onRetry,
  showReport = false,
  onReport
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'info':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
      case 'success':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'success': return 'success';
      default: return 'info';
    }
  };

  return (
    <div className="professional-error-overlay">
      <div className="professional-error-modal">
        <div className={`error-header ${getTypeClass()}`}>
          <div className="error-icon">
            {getIcon()}
          </div>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="error-content">
          <h2 className="error-title">{title}</h2>
          <p className="error-message">{message}</p>

          {details && (
            <div className="error-details">
              {details.code && (
                <div className="detail-item">
                  <span className="detail-label">Error Code:</span>
                  <span className="detail-value">{details.code}</span>
                </div>
              )}
              {details.field && (
                <div className="detail-item">
                  <span className="detail-label">Field:</span>
                  <span className="detail-value">{details.field}</span>
                </div>
              )}
              {details.suggestion && (
                <div className="detail-item suggestion">
                  <span className="detail-label">Suggestion:</span>
                  <span className="detail-value">{details.suggestion}</span>
                </div>
              )}
            </div>
          )}

          <div className="error-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`action-button ${action.variant}`}
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}

            {showRetry && onRetry && (
              <button className="action-button primary" onClick={onRetry}>
                Try Again
              </button>
            )}

            {showReport && onReport && (
              <button className="action-button secondary" onClick={onReport}>
                Report Issue
              </button>
            )}

            <button className="action-button secondary" onClick={onClose}>
              Close
            </button>
          </div>

          {details?.supportEmail && (
            <div className="support-info">
              <p>Need help? Contact us at <a href={`mailto:${details.supportEmail}`}>{details.supportEmail}</a></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalErrorModal;
