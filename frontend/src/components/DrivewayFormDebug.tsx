import React, { useState } from 'react';
import { useRobustFormValidation } from '../hooks/useRobustFormValidation';

const DrivewayFormDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const validationRules = {
    address: { required: true, minLength: 5 },
    description: { required: true, minLength: 10 },
    drivewaySize: { required: true }
  };

  const {
    formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    setFormData,
    submitForm
  } = useRobustFormValidation({
    address: '',
    description: '',
    drivewaySize: 'medium',
    carSizeCompatibility: ['small', 'medium']
  }, validationRules);

  const updateDebugInfo = () => {
    setDebugInfo({
      formData,
      errors,
      touched,
      isValid,
      isSubmitting,
      validationRules
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Driveway Form Debug</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <label>Address:</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => {
            handleChange('address', e.target.value);
            updateDebugInfo();
          }}
          onBlur={() => {
            handleBlur('address');
            updateDebugInfo();
          }}
          placeholder="Enter address"
          style={{ 
            width: '100%', 
            padding: '8px', 
            margin: '5px 0',
            border: errors.address && touched.address ? '2px solid red' : '1px solid #ccc'
          }}
        />
        {errors.address && touched.address && (
          <div style={{ color: 'red', fontSize: '12px' }}>{errors.address}</div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Description:</label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            handleChange('description', e.target.value);
            updateDebugInfo();
          }}
          onBlur={() => {
            handleBlur('description');
            updateDebugInfo();
          }}
          placeholder="Enter description"
          rows={3}
          style={{ 
            width: '100%', 
            padding: '8px', 
            margin: '5px 0',
            border: errors.description && touched.description ? '2px solid red' : '1px solid #ccc'
          }}
        />
        {errors.description && touched.description && (
          <div style={{ color: 'red', fontSize: '12px' }}>{errors.description}</div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>Driveway Size:</label>
        <select
          value={formData.drivewaySize}
          onChange={(e) => {
            handleChange('drivewaySize', e.target.value);
            updateDebugInfo();
          }}
          style={{ 
            width: '100%', 
            padding: '8px', 
            margin: '5px 0',
            border: errors.drivewaySize && touched.drivewaySize ? '2px solid red' : '1px solid #ccc'
          }}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="extra-large">Extra Large</option>
        </select>
        {errors.drivewaySize && touched.drivewaySize && (
          <div style={{ color: 'red', fontSize: '12px' }}>{errors.drivewaySize}</div>
        )}
      </div>

      <button
        onClick={() => {
          const isValid = validateForm();
          updateDebugInfo();
          console.log('Form validation result:', isValid);
        }}
        style={{ padding: '10px 20px', margin: '10px 5px' }}
      >
        Validate Form
      </button>

      <button
        onClick={updateDebugInfo}
        style={{ padding: '10px 20px', margin: '10px 5px' }}
      >
        Update Debug Info
      </button>

      {debugInfo && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f5f5f5', 
          border: '1px solid #ddd',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          <h4>Debug Info:</h4>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DrivewayFormDebug;
