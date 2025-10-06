// Enhanced Form Input Component for Parkway.com
import React, { forwardRef } from 'react';
import './EnhancedFormInput.css';

export interface EnhancedFormInputProps {
  name: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  label?: string;
  placeholder?: string;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string | null;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  helpText?: string;
  className?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

const EnhancedFormInput = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, EnhancedFormInputProps>(
  ({
    name,
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    onBlur,
    error,
    touched,
    required = false,
    disabled = false,
    options = [],
    rows = 3,
    min,
    max,
    step,
    prefix,
    suffix,
    helpText,
    className = '',
    autoComplete,
    autoFocus = false
  }, ref) => {
    const hasError = touched && error;
    const inputId = `input-${name}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      onChange(newValue);
    };

    const renderInput = () => {
      const inputProps = {
        id: inputId,
        name,
        value: value || '',
        onChange: handleChange,
        onBlur,
        disabled,
        required,
        autoComplete,
        autoFocus,
        className: `enhanced-input ${hasError ? 'error' : ''} ${disabled ? 'disabled' : ''}`,
        placeholder: placeholder || label
      };

      switch (type) {
        case 'textarea':
          return (
            <textarea
              {...inputProps}
              rows={rows}
              ref={ref as React.Ref<HTMLTextAreaElement>}
            />
          );

        case 'select':
          return (
            <select
              {...inputProps}
              ref={ref as React.Ref<HTMLSelectElement>}
            >
              <option value="">Select {label?.toLowerCase() || name}</option>
              {options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        default:
          return (
            <input
              {...inputProps}
              type={type}
              min={min}
              max={max}
              step={step}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          );
      }
    };

    return (
      <div className={`enhanced-form-input ${className} ${hasError ? 'has-error' : ''}`}>
        {label && (
          <label htmlFor={inputId} className="enhanced-label">
            {label}
            {required && <span className="required-asterisk">*</span>}
          </label>
        )}
        
        <div className="input-container">
          {prefix && <span className="input-prefix">{prefix}</span>}
          {renderInput()}
          {suffix && <span className="input-suffix">{suffix}</span>}
        </div>
        
        {helpText && !hasError && (
          <div className="help-text">{helpText}</div>
        )}
        
        {hasError && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>
    );
  }
);

EnhancedFormInput.displayName = 'EnhancedFormInput';

export default EnhancedFormInput;
