import React, { useState, useEffect } from 'react';
import { useFormValidation } from '../hooks/useFormValidation';
import FormInput from './FormInput';
import Button from './Button';
import HelpTooltip from './HelpTooltip';
import ImageUpload from './ImageUpload';
import './DrivewayEditModal.css';

interface Driveway {
  id: string; // Changed from _id to id to match PostgreSQL model
  address: string;
  description: string;
  availability: { date: string; startTime: string; endTime: string; pricePerHour: number }[];
  isAvailable: boolean;
  carSizeCompatibility: string[];
  drivewaySize: string;
  images?: string[];
}

interface DrivewayEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (drivewayData: any) => Promise<void>;
  driveway?: Driveway | null;
  isLoading?: boolean;
}

const DrivewayEditModal: React.FC<DrivewayEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  driveway,
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [availabilitySlots, setAvailabilitySlots] = useState<Array<{
    date: string;
    startTime: string;
    endTime: string;
    pricePerHour: number;
  }>>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const validationRules = {
    address: { required: true, minLength: 5 },
    description: { required: true, minLength: 10 },
    drivewaySize: { required: true }
  };

  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setFormData
  } = useFormValidation({
    address: '',
    description: '',
    drivewaySize: 'medium',
    carSizeCompatibility: ['small', 'medium']
  }, validationRules);

  const availableAmenities = [
    'Covered Parking',
    'Security Cameras',
    'EV Charging',
    'Near Metro',
    'Well Lit',
    '24/7 Access',
    'Valet Service',
    'Car Wash',
    'Tire Pressure Check'
  ];

  const carSizes = ['small', 'medium', 'large', 'extra-large'];
  const drivewaySizes = ['small', 'medium', 'large', 'extra-large'];

  useEffect(() => {
    if (driveway && isOpen) {
      setFormData({
        address: driveway.address,
        description: driveway.description,
        drivewaySize: driveway.drivewaySize || 'medium',
        carSizeCompatibility: driveway.carSizeCompatibility || ['small', 'medium']
      });
      
      setImages(driveway.images || []);
      
      setAvailabilitySlots(driveway.availability.map(slot => ({
        date: slot.date.split('T')[0],
        startTime: slot.startTime.substring(0, 5),
        endTime: slot.endTime.substring(0, 5),
        pricePerHour: slot.pricePerHour || 0
      })));
      
      setSelectedAmenities([]); // Reset amenities for now
      setCurrentStep(1);
    } else if (!driveway && isOpen) {
      // Reset form for new driveway
      setFormData({
        address: '',
        description: '',
        drivewaySize: 'medium',
        carSizeCompatibility: ['small', 'medium']
      });
      setAvailabilitySlots([{
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        pricePerHour: 5
      }]);
      setSelectedAmenities([]);
      setCurrentStep(1);
    }
  }, [driveway, isOpen, setFormData]);

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleCarSizeToggle = (size: string) => {
    const currentSizes = formData.carSizeCompatibility || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    
    handleChange('carSizeCompatibility', newSizes);
  };

  const addAvailabilitySlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setAvailabilitySlots(prev => [...prev, {
      date: tomorrow.toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      pricePerHour: 5
    }]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilitySlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (index: number, field: string, value: any) => {
    setAvailabilitySlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateForm()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    if (availabilitySlots.length === 0) {
      alert('Please add at least one availability slot.');
      return;
    }

    const drivewayData = {
      ...formData,
      images: images,
      availability: availabilitySlots.map(slot => ({
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        pricePerHour: slot.pricePerHour
      })),
      amenities: selectedAmenities,
      isAvailable: true
    };

    try {
      await onSave(drivewayData);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {driveway ? 'Edit Driveway' : 'Add New Driveway'}
          </h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Progress Indicator */}
          <div className="progress-indicator">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Basic Info</span>
            </div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Availability</span>
            </div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Amenities</span>
            </div>
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="step-content">
              <h3 className="step-title">Basic Information</h3>
              
              <FormInput
                label="Address"
                name="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                error={errors.address}
                touched={touched.address}
                placeholder="Enter the full address of your driveway"
                helperText="Include street number, street name, city, and postal code"
              />

              <div className="form-group">
                <label className="form-label">
                  Description
                  <HelpTooltip content="Provide a detailed description of your driveway, including any special features or restrictions.">
                    <span className="help-icon">?</span>
                  </HelpTooltip>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
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
                <label className="form-label">Driveway Size</label>
                <select
                  name="drivewaySize"
                  value={formData.drivewaySize}
                  onChange={(e) => handleChange('drivewaySize', e.target.value)}
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

              <div className="form-group">
                <label className="form-label">
                  Car Size Compatibility
                  <HelpTooltip content="Select which car sizes can fit in your driveway. This helps drivers find compatible parking spots.">
                    <span className="help-icon">?</span>
                  </HelpTooltip>
                </label>
                <div className="checkbox-group">
                  {carSizes.map(size => (
                    <label key={size} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.carSizeCompatibility?.includes(size) || false}
                        onChange={() => handleCarSizeToggle(size)}
                      />
                      <span className="checkbox-text">
                        {size.charAt(0).toUpperCase() + size.slice(1).replace('-', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Availability */}
          {currentStep === 2 && (
            <div className="step-content">
              <h3 className="step-title">Availability & Pricing</h3>
              
              <div className="availability-header">
                <h4>Available Time Slots</h4>
                <Button variant="secondary" size="sm" onClick={addAvailabilitySlot}>
                  Add Time Slot
                </Button>
              </div>

              <div className="availability-slots">
                {availabilitySlots.map((slot, index) => (
                  <div key={index} className="availability-slot">
                    <div className="slot-header">
                      <h5>Time Slot {index + 1}</h5>
                      {availabilitySlots.length > 1 && (
                        <button
                          type="button"
                          className="remove-slot"
                          onClick={() => removeAvailabilitySlot(index)}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="slot-fields">
                      <div className="field-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={slot.date}
                          onChange={(e) => updateAvailabilitySlot(index, 'date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="field-group">
                        <label>Start Time</label>
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateAvailabilitySlot(index, 'startTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="field-group">
                        <label>End Time</label>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateAvailabilitySlot(index, 'endTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="field-group">
                        <label>Price per Hour ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.50"
                          value={slot.pricePerHour}
                          onChange={(e) => updateAvailabilitySlot(index, 'pricePerHour', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Image Upload Section */}
              <div className="image-upload-section">
                <ImageUpload
                  onImagesChange={setImages}
                  existingImages={images}
                  maxImages={8}
                />
              </div>
            </div>
          )}

          {/* Step 3: Amenities */}
          {currentStep === 3 && (
            <div className="step-content">
              <h3 className="step-title">Amenities & Features</h3>
              <p className="step-description">
                Select the amenities and features available at your driveway location.
              </p>
              
              <div className="amenities-grid">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="amenity-item">
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span className="amenity-text">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="footer-actions">
            {currentStep > 1 && (
              <Button variant="secondary" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            
            <div className="footer-right">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  loading={isLoading}
                >
                  {driveway ? 'Update Driveway' : 'Add Driveway'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrivewayEditModal;
