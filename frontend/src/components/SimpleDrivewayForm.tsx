import React, { useState } from 'react';
import { robustDrivewayService } from '../services/robustDrivewayService';

const SimpleDrivewayForm: React.FC = () => {
  const [formData, setFormData] = useState({
    address: '',
    description: '',
    drivewaySize: 'medium',
    carSizeCompatibility: ['small', 'medium']
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Address must be at least 5 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.drivewaySize) {
      newErrors.drivewaySize = 'Driveway size is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Simple form submit called');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const drivewayData = {
        ...formData,
        images: [],
        availability: [{
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          pricePerHour: 5
        }],
        amenities: [],
        isAvailable: true
      };

      console.log('Submitting driveway data:', drivewayData);
      await robustDrivewayService.createDriveway(drivewayData);
      console.log('Driveway created successfully!');
      
      // Reset form
      setFormData({
        address: '',
        description: '',
        drivewaySize: 'medium',
        carSizeCompatibility: ['small', 'medium']
      });
      setErrors({});
      
      alert('Driveway created successfully!');
    } catch (error) {
      console.error('Error creating driveway:', error);
      alert('Failed to create driveway. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #3b82f6', margin: '20px', borderRadius: '8px' }}>
      <h3 style={{ color: '#3b82f6', marginBottom: '20px' }}>Simple Driveway Form (Test)</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Address *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter full address"
            style={{
              width: '100%',
              padding: '10px',
              border: errors.address ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          {errors.address && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              {errors.address}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your driveway..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.description ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
          />
          {errors.description && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              {errors.description}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Driveway Size *
          </label>
          <select
            value={formData.drivewaySize}
            onChange={(e) => handleChange('drivewaySize', e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: errors.drivewaySize ? '2px solid red' : '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
          {errors.drivewaySize && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>
              {errors.drivewaySize}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting ? '#ccc' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Creating Driveway...' : 'Create Driveway'}
        </button>
      </form>

      <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h4>Current Form State:</h4>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({ formData, errors, isSubmitting }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimpleDrivewayForm;
