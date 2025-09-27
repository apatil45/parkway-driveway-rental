import React, { useState, useEffect, useCallback } from 'react';
import { robustDrivewayService } from '../services/robustDrivewayService';
import { notificationService } from '../services/notificationService';
import { offlineService } from '../services/offlineService';
import Button from './Button';
import FormInput from './FormInput';
import ImageUpload from './ImageUpload';
import './RobustDrivewayCreator.css';

interface DrivewayData {
  address: string;
  description: string;
  drivewaySize: string;
  carSizeCompatibility: string[];
  images: string[];
  availability: Array<{
    date: string;
    startTime: string;
    endTime: string;
    pricePerHour: number;
  }>;
  amenities: string[];
  isAvailable: boolean;
}

interface FormErrors {
  address?: string;
  description?: string;
  drivewaySize?: string;
  availability?: string;
  general?: string;
}

const RobustDrivewayCreator: React.FC<{
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}> = ({ onSuccess, onCancel, isModal = false }) => {
  // Form state
  const [formData, setFormData] = useState<DrivewayData>({
    address: '',
    description: '',
    drivewaySize: 'medium',
    carSizeCompatibility: ['small', 'medium'],
    images: [],
    availability: [],
    amenities: [],
    isAvailable: true
  });

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [isOnline, setIsOnline] = useState(offlineService.isOnline());

  // Available options
  const drivewaySizes = ['small', 'medium', 'large', 'extra-large'];
  const carSizes = ['small', 'medium', 'large', 'extra-large'];
  const availableAmenities = [
    'Covered Parking', 'Security Cameras', 'EV Charging', 'Near Metro',
    'Well Lit', '24/7 Access', 'Valet Service', 'Car Wash', 'Tire Pressure Check'
  ];

  // Monitor online status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(offlineService.isOnline());
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Validation functions
  const validateField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'address':
        if (!value || value.trim().length === 0) {
          return 'Address is required';
        }
        if (value.trim().length < 5) {
          return 'Address must be at least 5 characters';
        }
        if (value.trim().length > 200) {
          return 'Address must be less than 200 characters';
        }
        return null;

      case 'description':
        if (!value || value.trim().length === 0) {
          return 'Description is required';
        }
        if (value.trim().length < 10) {
          return 'Description must be at least 10 characters';
        }
        if (value.trim().length > 1000) {
          return 'Description must be less than 1000 characters';
        }
        return null;

      case 'drivewaySize':
        if (!value) {
          return 'Driveway size is required';
        }
        if (!drivewaySizes.includes(value)) {
          return 'Please select a valid driveway size';
        }
        return null;

      case 'availability':
        if (!value || value.length === 0) {
          return 'At least one availability slot is required';
        }
        for (const slot of value) {
          if (!slot.date || !slot.startTime || !slot.endTime || !slot.pricePerHour) {
            return 'All availability slots must have date, time, and price';
          }
          if (slot.pricePerHour <= 0) {
            return 'Price per hour must be greater than 0';
          }
        }
        return null;

      default:
        return null;
    }
  }, [drivewaySizes]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Validate each field
    const addressError = validateField('address', formData.address);
    if (addressError) newErrors.address = addressError;

    const descriptionError = validateField('description', formData.description);
    if (descriptionError) newErrors.description = descriptionError;

    const drivewaySizeError = validateField('drivewaySize', formData.drivewaySize);
    if (drivewaySizeError) newErrors.drivewaySize = drivewaySizeError;

    const availabilityError = validateField('availability', formData.availability);
    if (availabilityError) newErrors.availability = availabilityError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validateField]);

  // Form handlers
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof DrivewayData]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [formData, validateField]);

  // Availability management
  const addAvailabilitySlot = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData(prev => ({
      ...prev,
      availability: [
        ...prev.availability,
        {
          date: tomorrow.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          pricePerHour: 5
        }
      ]
    }));
  }, []);

  const updateAvailabilitySlot = useCallback((index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  }, []);

  const removeAvailabilitySlot = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index)
    }));
  }, []);

  // Car size compatibility
  const toggleCarSize = useCallback((size: string) => {
    setFormData(prev => ({
      ...prev,
      carSizeCompatibility: prev.carSizeCompatibility.includes(size)
        ? prev.carSizeCompatibility.filter(s => s !== size)
        : [...prev.carSizeCompatibility, size]
    }));
  }, []);

  // Amenities
  const toggleAmenity = useCallback((amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  // Image handling
  const handleImagesChange = useCallback((newImages: string[]) => {
    setFormData(prev => ({ ...prev, images: newImages }));
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('RobustDrivewayCreator: Form submission started');
    console.log('Form data:', formData);
    console.log('Is online:', isOnline);

    // Validate form
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      notificationService.showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the form errors before submitting.',
        context: 'upload',
        priority: 'high'
      });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('Submitting driveway data:', formData);
      
      if (isOnline) {
        // Online submission
        await robustDrivewayService.createDriveway(formData);
        notificationService.showNotification({
          type: 'success',
          title: 'Driveway Created',
          message: 'Your driveway has been successfully created!',
          context: 'upload'
        });
      } else {
        // Offline submission
        offlineService.saveDrivewayData(formData);
        notificationService.showNotification({
          type: 'info',
          title: 'Driveway Saved Offline',
          message: 'Your driveway has been saved and will be processed when you are back online.',
          context: 'upload'
        });
      }

      // Reset form
      setFormData({
        address: '',
        description: '',
        drivewaySize: 'medium',
        carSizeCompatibility: ['small', 'medium'],
        images: [],
        availability: [],
        amenities: [],
        isAvailable: true
      });
      setTouched({});
      setCurrentStep(1);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error creating driveway:', error);
      
      const errorMessage = error.response?.data?.msg || error.message || 'Failed to create driveway';
      
      setErrors({ general: errorMessage });
      
      notificationService.showNotification({
        type: 'error',
        title: 'Creation Failed',
        message: errorMessage,
        context: 'upload',
        priority: 'high'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, errors, isOnline, onSuccess]);

  // Step navigation
  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      // Validate step 1
      const addressError = validateField('address', formData.address);
      const descriptionError = validateField('description', formData.description);
      const drivewaySizeError = validateField('drivewaySize', formData.drivewaySize);
      
      if (addressError || descriptionError || drivewaySizeError) {
        setErrors({
          address: addressError || undefined,
          description: descriptionError || undefined,
          drivewaySize: drivewaySizeError || undefined
        });
        return;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 3));
  }, [currentStep, formData, validateField]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h3 className="step-title">Basic Information</h3>
            
            <FormInput
              label="Address"
              name="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              error={errors.address}
              touched={touched.address}
              placeholder="Enter the full address of your driveway"
              helperText="Include street number, street name, city, and postal code"
              required
            />

            <div className="form-group">
              <label className="form-label">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                className={`form-textarea ${errors.description && touched.description ? 'error' : ''}`}
                placeholder="Describe your driveway, including size, surface type, access instructions, and any special features..."
                rows={4}
              />
              {errors.description && touched.description && (
                <div className="error-message">{errors.description}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Driveway Size *</label>
              <select
                value={formData.drivewaySize}
                onChange={(e) => handleInputChange('drivewaySize', e.target.value)}
                onBlur={() => handleBlur('drivewaySize')}
                className={`form-select ${errors.drivewaySize && touched.drivewaySize ? 'error' : ''}`}
              >
                {drivewaySizes.map(size => (
                  <option key={size} value={size}>
                    {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
              {errors.drivewaySize && touched.drivewaySize && (
                <div className="error-message">{errors.drivewaySize}</div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h3 className="step-title">Availability & Pricing</h3>
            
            <div className="availability-section">
              <div className="section-header">
                <h4>Availability Slots</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAvailabilitySlot}
                >
                  Add Slot
                </Button>
              </div>

              {formData.availability.map((slot, index) => (
                <div key={index} className="availability-slot">
                  <div className="slot-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={slot.date}
                        onChange={(e) => updateAvailabilitySlot(index, 'date', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price/Hour ($)</label>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        value={slot.pricePerHour}
                        onChange={(e) => updateAvailabilitySlot(index, 'pricePerHour', parseFloat(e.target.value))}
                        className="form-input"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeAvailabilitySlot(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              {errors.availability && (
                <div className="error-message">{errors.availability}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Car Size Compatibility</label>
              <div className="checkbox-group">
                {carSizes.map(size => (
                  <label key={size} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.carSizeCompatibility.includes(size)}
                      onChange={() => toggleCarSize(size)}
                    />
                    <span>{size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">Images & Amenities</h3>
            
            <div className="form-group">
              <label className="form-label">Images</label>
              <ImageUpload
                onImagesChange={handleImagesChange}
                maxImages={8}
                existingImages={formData.images}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Amenities</label>
              <div className="checkbox-group">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`robust-driveway-creator ${isModal ? 'modal' : ''}`}>
      <form onSubmit={handleSubmit} className="driveway-form">
        {/* Header */}
        <div className="form-header">
          <h2>Create New Driveway</h2>
          <div className="step-indicator">
            Step {currentStep} of 3
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>

        {/* Step content */}
        {renderStepContent()}

        {/* General error */}
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              Previous
            </Button>
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              disabled={isSubmitting}
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Driveway'}
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Online status indicator */}
        {!isOnline && (
          <div className="offline-indicator">
            <span>⚠️ You are offline. Data will be saved locally.</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default RobustDrivewayCreator;
