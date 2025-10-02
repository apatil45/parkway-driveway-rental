import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import Button from './Button';
import './BookingDurationModal.css';

interface BookingDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number, startTime: string, endTime: string) => void;
  driveway: {
    id: string;
    address: string;
    description: string;
    pricePerHour: number;
    availability: Array<{
      date: string;
      startTime: string;
      endTime: string;
      pricePerHour: number;
    }>;
  };
  selectedDate: string;
  selectedTimeSlot: {
    startTime: string;
    endTime: string;
    pricePerHour: number;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const BookingDurationModal: React.FC<BookingDurationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  driveway,
  selectedDate,
  selectedTimeSlot,
  driverLocation
}) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useError();
  const [selectedDuration, setSelectedDuration] = useState<number>(1);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Predefined duration options (in hours)
  const durationOptions = [
    { value: 0.5, label: '30 minutes', price: selectedTimeSlot.pricePerHour * 0.5 },
    { value: 1, label: '1 hour', price: selectedTimeSlot.pricePerHour * 1 },
    { value: 2, label: '2 hours', price: selectedTimeSlot.pricePerHour * 2 },
    { value: 4, label: '4 hours', price: selectedTimeSlot.pricePerHour * 4 },
    { value: 8, label: '8 hours', price: selectedTimeSlot.pricePerHour * 8 },
    { value: 12, label: '12 hours', price: selectedTimeSlot.pricePerHour * 12 },
    { value: 24, label: '24 hours', price: selectedTimeSlot.pricePerHour * 24 }
  ];

  const [totalPrice, setTotalPrice] = useState(selectedTimeSlot.pricePerHour);

  useEffect(() => {
    if (selectedDuration > 0) {
      setTotalPrice(selectedTimeSlot.pricePerHour * selectedDuration);
    }
  }, [selectedDuration, selectedTimeSlot.pricePerHour]);

  const handleDurationSelect = (duration: number) => {
    setSelectedDuration(duration);
    setCustomDuration('');
  };

  const handleCustomDurationChange = (value: string) => {
    setCustomDuration(value);
    const duration = parseFloat(value);
    if (!isNaN(duration) && duration > 0) {
      setSelectedDuration(duration);
    }
  };

  const calculateEndTime = (startTime: string, duration: number): string => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  const handleConfirmBooking = async () => {
    if (selectedDuration <= 0) {
      showError('Please select a valid booking duration');
      return;
    }

    // Check if the selected duration fits within the available time slot
    const slotStartTime = new Date(`2000-01-01T${selectedTimeSlot.startTime}:00`);
    const slotEndTime = new Date(`2000-01-01T${selectedTimeSlot.endTime}:00`);
    const requestedEndTime = new Date(`2000-01-01T${calculateEndTime(selectedTimeSlot.startTime, selectedDuration)}:00`);

    if (requestedEndTime > slotEndTime) {
      showError(`Selected duration exceeds available time slot. Maximum duration: ${Math.floor((slotEndTime.getTime() - slotStartTime.getTime()) / (1000 * 60 * 60))} hours`);
      return;
    }

    setIsLoading(true);
    try {
      const endTime = calculateEndTime(selectedTimeSlot.startTime, selectedDuration);
      await onConfirm(selectedDuration, selectedTimeSlot.startTime, endTime);
      showSuccess('Booking confirmed successfully!');
      onClose();
    } catch (error) {
      console.error('Booking confirmation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="booking-duration-overlay">
      <div className="booking-duration-modal">
        <div className="modal-header">
          <h2>Complete Your Booking</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-content">
          {/* Booking Summary */}
          <div className="booking-summary">
            <h3>Booking Details</h3>
            <div className="summary-item">
              <span className="label">Location:</span>
              <span className="value">{driveway.address}</span>
            </div>
            <div className="summary-item">
              <span className="label">Date:</span>
              <span className="value">{new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="summary-item">
              <span className="label">Available Time:</span>
              <span className="value">{selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}</span>
            </div>
            <div className="summary-item">
              <span className="label">Price per Hour:</span>
              <span className="value">${selectedTimeSlot.pricePerHour.toFixed(2)}</span>
            </div>
            {driverLocation && (
              <div className="summary-item">
                <span className="label">Your Location:</span>
                <span className="value">{driverLocation.address}</span>
              </div>
            )}
          </div>

          {/* Duration Selection */}
          <div className="duration-selection">
            <h3>How long would you like to book?</h3>
            
            <div className="duration-options">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  className={`duration-option ${selectedDuration === option.value ? 'selected' : ''}`}
                  onClick={() => handleDurationSelect(option.value)}
                >
                  <div className="duration-label">{option.label}</div>
                  <div className="duration-price">${option.price.toFixed(2)}</div>
                </button>
              ))}
            </div>

            <div className="custom-duration">
              <label htmlFor="custom-duration">Or enter custom duration (hours):</label>
              <input
                id="custom-duration"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={customDuration}
                onChange={(e) => handleCustomDurationChange(e.target.value)}
                placeholder="e.g., 1.5 for 1.5 hours"
                className="custom-duration-input"
              />
            </div>
          </div>

          {/* Price Summary */}
          <div className="price-summary">
            <div className="price-breakdown">
              <div className="price-item">
                <span>Duration:</span>
                <span>{selectedDuration} hour{selectedDuration !== 1 ? 's' : ''}</span>
              </div>
              <div className="price-item">
                <span>Rate:</span>
                <span>${selectedTimeSlot.pricePerHour.toFixed(2)}/hour</span>
              </div>
              <div className="price-total">
                <span>Total:</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBooking}
              loading={isLoading}
              disabled={selectedDuration <= 0}
            >
              {isLoading ? 'Processing...' : `Book for $${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDurationModal;
