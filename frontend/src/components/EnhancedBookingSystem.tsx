import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import ResponsiveForm, { FormField, FormButton } from './ResponsiveForm';
import './EnhancedBookingSystem.css';

interface Driveway {
  id: string;
  address: string;
  description: string;
  drivewaySize: string;
  carSizeCompatibility: string[];
  images: string[];
  availability: any[];
  amenities: string[];
  pricePerHour: number;
  owner: string;
  ownerInfo?: {
    name: string;
    email: string;
  };
}

interface BookingFormData {
  selectedDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  specialRequests: string;
  driverLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface BookingValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: Array<{
    type: 'time' | 'availability' | 'size';
    message: string;
    severity: 'error' | 'warning';
  }>;
}

interface EnhancedBookingSystemProps {
  driveway: Driveway;
  onBookingSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

const EnhancedBookingSystem: React.FC<EnhancedBookingSystemProps> = ({
  driveway,
  onBookingSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<BookingFormData>({
    selectedDate: '',
    startTime: '',
    endTime: '',
    totalPrice: 0,
    specialRequests: '',
    driverLocation: {
      latitude: 0,
      longitude: 0,
      address: ''
    }
  });

  const [validation, setValidation] = useState<BookingValidation>({
    isValid: false,
    errors: [],
    warnings: [],
    conflicts: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // Get user's current location
  const getUserLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      notificationService.showWarning('Geolocation is not supported by this browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocoding to get address
      const response = await fetch(`/api/geocoding/reverse?lat=${latitude}&lng=${longitude}`);
      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        driverLocation: {
          latitude,
          longitude,
          address: data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
        }
      }));

      setIsLocationEnabled(true);
    } catch (error) {
      console.error('Location error:', error);
      notificationService.showWarning('Could not get your location. You can still proceed without it.');
    }
  }, []);

  // Check availability for selected date and time
  const checkAvailability = useCallback(async () => {
    if (!formData.selectedDate || !formData.startTime || !formData.endTime) {
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const response = await fetch(`/api/driveways/${driveway.id}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: formData.selectedDate,
          startTime: formData.startTime,
          endTime: formData.endTime
        })
      });

      if (response.ok) {
        const data = await response.json();
        setExistingBookings(data.conflicts || []);
      }
    } catch (error) {
      console.error('Availability check error:', error);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [driveway.id, formData.selectedDate, formData.startTime, formData.endTime]);

  // Validate booking request
  const validateBooking = useCallback((): BookingValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: Array<{
      type: 'time' | 'availability' | 'size';
      message: string;
      severity: 'error' | 'warning';
    }> = [];

    // Required field validation
    if (!formData.selectedDate) {
      errors.push('Please select a date');
    }

    if (!formData.startTime) {
      errors.push('Please select a start time');
    }

    if (!formData.endTime) {
      errors.push('Please select an end time');
    }

    // Date validation
    if (formData.selectedDate) {
      const selectedDate = new Date(formData.selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        errors.push('Cannot book for past dates');
      }

      // Check if date is too far in advance (e.g., 6 months)
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 6);
      if (selectedDate > maxDate) {
        warnings.push('Booking is more than 6 months in advance');
      }
    }

    // Time validation
    if (formData.startTime && formData.endTime) {
      const startTime = new Date(`2000-01-01T${formData.startTime}`);
      const endTime = new Date(`2000-01-01T${formData.endTime}`);

      if (startTime >= endTime) {
        errors.push('End time must be after start time');
      }

      // Check minimum booking duration (e.g., 1 hour)
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (duration < 1) {
        errors.push('Minimum booking duration is 1 hour');
      }

      // Check maximum booking duration (e.g., 24 hours)
      if (duration > 24) {
        warnings.push('Booking duration is longer than 24 hours');
      }

      // Check if times are within driveway availability
      const selectedDate = new Date(formData.selectedDate);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const dayAvailability = driveway.availability.find(av => av.dayOfWeek === dayOfWeek);

      if (dayAvailability && dayAvailability.isAvailable) {
        const availableStart = new Date(`2000-01-01T${dayAvailability.startTime}`);
        const availableEnd = new Date(`2000-01-01T${dayAvailability.endTime}`);

        if (startTime < availableStart || endTime > availableEnd) {
          conflicts.push({
            type: 'availability',
            message: `Driveway is only available from ${dayAvailability.startTime} to ${dayAvailability.endTime}`,
            severity: 'error'
          });
        }
      } else {
        conflicts.push({
          type: 'availability',
          message: 'Driveway is not available on this day',
          severity: 'error'
        });
      }
    }

    // Check for existing bookings
    if (existingBookings.length > 0) {
      conflicts.push({
        type: 'time',
        message: `There are ${existingBookings.length} existing booking(s) that may conflict`,
        severity: 'error'
      });
    }

    // Car size compatibility check
    if (user?.carSize && !driveway.carSizeCompatibility.includes(user.carSize)) {
      conflicts.push({
        type: 'size',
        message: `Your car size (${user.carSize}) may not be compatible with this driveway`,
        severity: 'warning'
      });
    }

    // Price validation
    if (formData.totalPrice <= 0) {
      errors.push('Invalid price calculation');
    }

    return {
      isValid: errors.length === 0 && conflicts.filter(c => c.severity === 'error').length === 0,
      errors,
      warnings,
      conflicts
    };
  }, [formData, existingBookings, driveway, user]);

  // Calculate total price
  const calculatePrice = useCallback(() => {
    if (!formData.startTime || !formData.endTime) {
      return 0;
    }

    const startTime = new Date(`2000-01-01T${formData.startTime}`);
    const endTime = new Date(`2000-01-01T${formData.endTime}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    return Math.round(duration * driveway.pricePerHour * 100) / 100;
  }, [formData.startTime, formData.endTime, driveway.pricePerHour]);

  // Update validation when form data changes
  useEffect(() => {
    const newValidation = validateBooking();
    setValidation(newValidation);
  }, [formData, existingBookings, validateBooking]);

  // Update price when times change
  useEffect(() => {
    const newPrice = calculatePrice();
    setFormData(prev => ({
      ...prev,
      totalPrice: newPrice
    }));
  }, [calculatePrice]);

  // Check availability when date/time changes
  useEffect(() => {
    if (formData.selectedDate && formData.startTime && formData.endTime) {
      const timeoutId = setTimeout(() => {
        checkAvailability();
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    }
  }, [formData.selectedDate, formData.startTime, formData.endTime, checkAvailability]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.isValid) {
      notificationService.showError('Please fix the errors before proceeding');
      return;
    }

    if (!user) {
      notificationService.showError('You must be logged in to make a booking');
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingData = {
        driveway: driveway.id,
        startTime: `${formData.selectedDate}T${formData.startTime}:00.000Z`,
        endTime: `${formData.selectedDate}T${formData.endTime}:00.000Z`,
        totalAmount: formData.totalPrice,
        driverLocation: isLocationEnabled ? formData.driverLocation : null,
        specialRequests: formData.specialRequests.trim() || null
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const result = await response.json();
      notificationService.showSuccess('Booking created successfully!');
      
      if (onBookingSuccess) {
        onBookingSuccess(result.id);
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      notificationService.showError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <ResponsiveForm
      title="Book This Driveway"
      subtitle={`${driveway.address} • $${driveway.pricePerHour}/hour`}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      maxWidth="md"
    >
      <div className="enhanced-booking-system">
        {/* Driveway Info */}
        <div className="driveway-info">
          <div className="driveway-header">
            <h3 className="driveway-title">{driveway.address}</h3>
            <div className="driveway-meta">
              <span className="driveway-size">{driveway.drivewaySize}</span>
              <span className="driveway-price">${driveway.pricePerHour}/hour</span>
            </div>
          </div>
          
          {driveway.description && (
            <p className="driveway-description">{driveway.description}</p>
          )}

          {driveway.amenities.length > 0 && (
            <div className="driveway-amenities">
              <h4>Amenities:</h4>
              <div className="amenities-list">
                {driveway.amenities.map(amenity => (
                  <span key={amenity} className="amenity-tag">
                    {amenity.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Booking Form */}
        <div className="booking-form">
          <div className="form-row">
            <FormField
              label="Date"
              name="selectedDate"
              type="date"
              value={formData.selectedDate}
              onChange={handleInputChange}
              error={validation.errors.find(e => e.includes('date'))}
              min={getMinDate()}
              max={getMaxDate()}
              required
            />
          </div>

          <div className="form-row">
            <FormField
              label="Start Time"
              name="startTime"
              type="time"
              value={formData.startTime}
              onChange={handleInputChange}
              error={validation.errors.find(e => e.includes('start time'))}
              required
            />
            <FormField
              label="End Time"
              name="endTime"
              type="time"
              value={formData.endTime}
              onChange={handleInputChange}
              error={validation.errors.find(e => e.includes('end time'))}
              required
            />
          </div>

          {/* Price Display */}
          <div className="price-display">
            <div className="price-breakdown">
              <div className="price-item">
                <span>Duration:</span>
                <span>
                  {formData.startTime && formData.endTime ? (
                    (() => {
                      const start = new Date(`2000-01-01T${formData.startTime}`);
                      const end = new Date(`2000-01-01T${formData.endTime}`);
                      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      return `${hours.toFixed(1)} hours`;
                    })()
                  ) : '0 hours'}
                </span>
              </div>
              <div className="price-item">
                <span>Rate:</span>
                <span>${driveway.pricePerHour}/hour</span>
              </div>
              <div className="price-total">
                <span>Total:</span>
                <span>${formData.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="location-section">
            <div className="location-header">
              <h4>Your Location (Optional)</h4>
              <button
                type="button"
                onClick={getUserLocation}
                className="location-button"
                disabled={isLocationEnabled}
              >
                {isLocationEnabled ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Location Set
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Get My Location
                  </>
                )}
              </button>
            </div>
            {isLocationEnabled && formData.driverLocation.address && (
              <p className="location-address">{formData.driverLocation.address}</p>
            )}
          </div>

          {/* Special Requests */}
          <FormField
            label="Special Requests (Optional)"
            name="specialRequests"
            type="textarea"
            value={formData.specialRequests}
            onChange={handleInputChange}
            placeholder="Any special instructions or requests..."
            rows={3}
          />

          {/* Validation Messages */}
          {validation.errors.length > 0 && (
            <div className="validation-errors">
              <h4>Please fix these errors:</h4>
              <ul>
                {validation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validation.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.conflicts.length > 0 && (
            <div className="validation-conflicts">
              <h4>Conflicts:</h4>
              <ul>
                {validation.conflicts.map((conflict, index) => (
                  <li key={index} className={`conflict-${conflict.severity}`}>
                    {conflict.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Availability Status */}
          {isCheckingAvailability && (
            <div className="availability-checking">
              <div className="loading-spinner"></div>
              <span>Checking availability...</span>
            </div>
          )}

          {existingBookings.length > 0 && (
            <div className="existing-bookings">
              <h4>Existing Bookings:</h4>
              <div className="bookings-list">
                {existingBookings.map((booking, index) => (
                  <div key={index} className="booking-item">
                    <span>{booking.startTime} - {booking.endTime}</span>
                    <span className="booking-status">{booking.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <FormButton
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!validation.isValid || isSubmitting}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
              <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
              <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
              <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3"/>
            </svg>
            Confirm Booking
          </FormButton>

          {onCancel && (
            <FormButton
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </FormButton>
          )}
        </div>
      </div>
    </ResponsiveForm>
  );
};

export default EnhancedBookingSystem;
