import React, { forwardRef } from 'react';
import './FormInput.css';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  touched?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(({
  label,
  error,
  touched,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = error && touched;
  const showHelperText = helperText && !hasError;

  const inputClasses = [
    'form-input',
    `form-input-${variant}`,
    `form-input-${size}`,
    hasError ? 'form-input-error' : '',
    leftIcon ? 'form-input-with-left-icon' : '',
    rightIcon ? 'form-input-with-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-input-container">
      {label && (
        <label htmlFor={inputId} className="form-input-label">
          {label}
          {props.required && <span className="form-input-required">*</span>}
        </label>
      )}
      
      <div className="form-input-wrapper">
        {leftIcon && (
          <div className="form-input-icon form-input-icon-left">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : 
            showHelperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="form-input-icon form-input-icon-right">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <div id={`${inputId}-error`} className="form-input-error-message" role="alert">
          {error}
        </div>
      )}
      
      {showHelperText && (
        <div id={`${inputId}-helper`} className="form-input-helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
