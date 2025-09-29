import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import ResponsiveForm, { FormField, FormButton, FormCheckbox } from './ResponsiveForm';
import './EnhancedDrivewayCreator.css';

interface DrivewayFormData {
  address: string;
  description: string;
  drivewaySize: string;
  carSizeCompatibility: string[];
  pricePerHour: number;
  availability: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const EnhancedDrivewayCreator: React.FC<{
  onSuccess?: () => void;
  onCancel?: () => void;
}> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<DrivewayFormData>({
    address: '',
    description: '',
    drivewaySize: 'medium',
    carSizeCompatibility: ['small', 'medium'],
    pricePerHour: 5,
    availability: [
      { dayOfWeek: 'monday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'tuesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'wednesday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'thursday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'friday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'saturday', startTime: '08:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 'sunday', startTime: '08:00', endTime: '18:00', isAvailable: true }
    ],
    amenities: [],
    images: [],
    isAvailable: true
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const drivewaySizes = [
    { value: 'small', label: 'Small (1 car)', description: 'Compact cars only' },
    { value: 'medium', label: 'Medium (1-2 cars)', description: 'Standard cars and small SUVs' },
    { value: 'large', label: 'Large (2-3 cars)', description: 'SUVs and pickup trucks' },
    { value: 'extra-large', label: 'Extra Large (3+ cars)', description: 'Multiple vehicles or large trucks' }
  ];

  const carSizes = [
    { value: 'small', label: 'Small Cars', description: 'Honda Civic, Toyota Corolla' },
    { value: 'medium', label: 'Medium Cars', description: 'Honda Accord, Toyota Camry' },
    { value: 'large', label: 'Large Cars', description: 'SUVs, Pickup Trucks' },
    { value: 'extra-large', label: 'Extra Large', description: 'Large SUVs, Commercial Vehicles' }
  ];

  const availableAmenities = [
    { value: 'covered', label: 'Covered Parking', description: 'Protection from weather' },
    { value: 'security', label: 'Security Cameras', description: '24/7 surveillance' },
    { value: 'ev_charging', label: 'EV Charging', description: 'Electric vehicle charging station' },
    { value: 'near_metro', label: 'Near Metro', description: 'Close to public transportation' },
    { value: 'well_lit', label: 'Well Lit', description: 'Good lighting for safety' },
    { value: 'access_24_7', label: '24/7 Access', description: 'Available around the clock' },
    { value: 'valet', label: 'Valet Service', description: 'Professional parking assistance' },
    { value: 'car_wash', label: 'Car Wash', description: 'On-site car washing' }
  ];

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Real-time validation
  const validateField = useCallback((field: string, value: any): string | null => {
    switch (field) {
      case 'address':
        if (!value || value.trim().length === 0) {
          return 'Address is required';
        }
        if (value.trim().length < 10) {
          return 'Please provide a complete address (at least 10 characters)';
        }
        if (value.trim().length > 200) {
          return 'Address is too long (maximum 200 characters)';
        }
        return null;

      case 'description':
        if (!value || value.trim().length === 0) {
          return 'Description is required';
        }
        if (value.trim().length < 20) {
          return 'Please provide a detailed description (at least 20 characters)';
        }
        if (value.trim().length > 500) {
          return 'Description is too long (maximum 500 characters)';
        }
        return null;

      case 'pricePerHour':
        if (!value || value <= 0) {
          return 'Price per hour must be greater than $0';
        }
        if (value > 100) {
          return 'Price seems too high (maximum $100/hour)';
        }
        return null;

      case 'carSizeCompatibility':
        if (!value || value.length === 0) {
          return 'Please select at least one car size compatibility';
        }
        return null;

      case 'availability':
        const hasAvailableDay = value.some((day: any) => day.isAvailable);
        if (!hasAvailableDay) {
          return 'Please set availability for at least one day';
        }
        return null;

      default:
        return null;
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'carSizeCompatibility') {
        const carSize = value;
        newValue = checked 
          ? [...formData.carSizeCompatibility, carSize]
          : formData.carSizeCompatibility.filter(size => size !== carSize);
      } else if (name === 'amenities') {
        const amenity = value;
        newValue = checked 
          ? [...formData.amenities, amenity]
          : formData.amenities.filter(a => a !== amenity);
      } else {
        newValue = checked;
      }
    } else if (name === 'pricePerHour') {
      newValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Real-time validation
    const error = validateField(name, newValue);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleAvailabilityChange = (dayIndex: number, field: string, value: any) => {
    const newAvailability = [...formData.availability];
    newAvailability[dayIndex] = {
      ...newAvailability[dayIndex],
      [field]: value
    };

    setFormData(prev => ({
      ...prev,
      availability: newAvailability
    }));

    // Validate availability
    const error = validateField('availability', newAvailability);
    if (error) {
      setErrors(prev => ({
        ...prev,
        availability: error
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        availability: ''
      }));
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/upload/single', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        return result.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      notificationService.showSuccess(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error('Image upload error:', error);
      notificationService.showError('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate all fields
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof DrivewayFormData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notificationService.showError('Please fix the errors below');
      return;
    }

    if (!user) {
      notificationService.showError('You must be logged in to create a driveway');
      return;
    }

    setIsSubmitting(true);

    try {
      const drivewayData = {
        address: formData.address.trim(),
        description: formData.description.trim(),
        drivewaySize: formData.drivewaySize,
        carSizeCompatibility: formData.carSizeCompatibility,
        images: formData.images,
        availability: formData.availability,
        amenities: formData.amenities,
        isAvailable: formData.isAvailable,
        pricePerHour: formData.pricePerHour
      };

      const response = await fetch('/api/driveways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(drivewayData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create driveway');
      }

      const result = await response.json();
      notificationService.showSuccess('Driveway created successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Driveway creation error:', error);
      notificationService.showError(error.message || 'Failed to create driveway. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <h3 className="step-title">Basic Information</h3>
      
      <FormField
        label="Address"
        name="address"
        type="text"
        value={formData.address}
        onChange={handleInputChange}
        error={errors.address}
        placeholder="Enter the complete address of your driveway"
        required
        helpText="Include street number, street name, city, and state"
      />

      <div className="form-field">
        <label className="form-label">
          Description <span className="required-indicator">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your driveway, including any special features, access instructions, or important details..."
          className={`form-input ${errors.description ? 'error' : ''}`}
          rows={4}
          required
        />
        {errors.description && (
          <div className="form-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.description}
          </div>
        )}
        <div className="form-help">
          Help drivers understand what to expect (access instructions, size, restrictions, etc.)
        </div>
      </div>

      <FormField
        label="Price per Hour ($)"
        name="pricePerHour"
        type="number"
        value={formData.pricePerHour.toString()}
        onChange={handleInputChange}
        error={errors.pricePerHour}
        placeholder="5.00"
        required
        helpText="Set a competitive price based on your location and amenities"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3 className="step-title">Size & Compatibility</h3>
      
      <div className="form-field">
        <label className="form-label">
          Driveway Size <span className="required-indicator">*</span>
        </label>
        <div className="size-options">
          {drivewaySizes.map(size => (
            <label key={size.value} className="size-option">
              <input
                type="radio"
                name="drivewaySize"
                value={size.value}
                checked={formData.drivewaySize === size.value}
                onChange={handleInputChange}
              />
              <div className="size-option-content">
                <div className="size-option-title">{size.label}</div>
                <div className="size-option-description">{size.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">
          Car Size Compatibility <span className="required-indicator">*</span>
        </label>
        <div className="compatibility-grid">
          {carSizes.map(carSize => (
            <label key={carSize.value} className="compatibility-option">
              <input
                type="checkbox"
                name="carSizeCompatibility"
                value={carSize.value}
                checked={formData.carSizeCompatibility.includes(carSize.value)}
                onChange={handleInputChange}
              />
              <div className="compatibility-content">
                <div className="compatibility-title">{carSize.label}</div>
                <div className="compatibility-description">{carSize.description}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.carSizeCompatibility && (
          <div className="form-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.carSizeCompatibility}
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">Amenities</label>
        <div className="amenities-grid">
          {availableAmenities.map(amenity => (
            <label key={amenity.value} className="amenity-option">
              <input
                type="checkbox"
                name="amenities"
                value={amenity.value}
                checked={formData.amenities.includes(amenity.value)}
                onChange={handleInputChange}
              />
              <div className="amenity-content">
                <div className="amenity-title">{amenity.label}</div>
                <div className="amenity-description">{amenity.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3 className="step-title">Availability & Images</h3>
      
      <div className="form-field">
        <label className="form-label">
          Weekly Availability <span className="required-indicator">*</span>
        </label>
        <div className="availability-schedule">
          {daysOfWeek.map((day, index) => (
            <div key={day.value} className="day-schedule">
              <div className="day-header">
                <FormCheckbox
                  label={day.label}
                  name={`day-${day.value}`}
                  checked={formData.availability[index].isAvailable}
                  onChange={(e) => handleAvailabilityChange(index, 'isAvailable', e.target.checked)}
                />
              </div>
              {formData.availability[index].isAvailable && (
                <div className="day-times">
                  <div className="time-input">
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={formData.availability[index].startTime}
                      onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="time-input">
                    <label>End Time</label>
                    <input
                      type="time"
                      value={formData.availability[index].endTime}
                      onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {errors.availability && (
          <div className="form-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.availability}
          </div>
        )}
      </div>

      <div className="form-field">
        <label className="form-label">Photos (Optional)</label>
        <div className="image-upload-section">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="file-input"
            disabled={isUploading}
          />
          <div className="upload-area">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Click to upload photos or drag and drop</p>
            <p className="upload-hint">Up to 5 images, max 5MB each</p>
          </div>
        </div>
        
        {formData.images.length > 0 && (
          <div className="uploaded-images">
            {formData.images.map((url, index) => (
              <div key={index} className="uploaded-image">
                <img src={url} alt={`Driveway ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="remove-image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="enhanced-driveway-creator">
      <div className="creator-header">
        <h2 className="creator-title">List Your Driveway</h2>
        <p className="creator-subtitle">Share your parking space and start earning</p>
      </div>
      
      <form onSubmit={handleSubmit} className="creator-form">
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Basic Info</span>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Size & Features</span>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Schedule & Photos</span>
          </div>
        </div>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="form-actions">
          {currentStep > 1 && (
            <FormButton
              type="button"
              variant="secondary"
              onClick={prevStep}
              disabled={isSubmitting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Previous
            </FormButton>
          )}

          {currentStep < 3 ? (
            <FormButton
              type="button"
              variant="primary"
              onClick={nextStep}
              disabled={isSubmitting}
            >
              Next
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </FormButton>
          ) : (
            <FormButton
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17,21 17,13 7,13 7,21"/>
                <polyline points="7,3 7,8 15,8"/>
              </svg>
              Create Driveway
            </FormButton>
          )}

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
      </form>
    </div>
  );
};

export default EnhancedDrivewayCreator;
