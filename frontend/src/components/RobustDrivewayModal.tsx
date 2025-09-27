import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import RobustDrivewayCreator from './RobustDrivewayCreator';
import './RobustDrivewayModal.css';

interface RobustDrivewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  existingDriveway?: any;
  isEdit?: boolean;
}

const RobustDrivewayModal: React.FC<RobustDrivewayModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingDriveway,
  isEdit = false
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle success
  const handleSuccess = () => {
    notificationService.showNotification({
      type: 'success',
      title: isEdit ? 'Driveway Updated' : 'Driveway Created',
      message: isEdit 
        ? 'Your driveway has been updated successfully!' 
        : 'Your driveway has been created successfully!',
      context: 'upload'
    });

    if (onSuccess) {
      onSuccess();
    }

    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`robust-modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`robust-modal-content ${isClosing ? 'closing' : ''}`}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Edit Driveway' : 'Create New Driveway'}
          </h2>
          <button
            className="modal-close-button"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <RobustDrivewayCreator
            onSuccess={handleSuccess}
            onCancel={handleClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default RobustDrivewayModal;
