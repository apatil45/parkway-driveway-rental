import React, { forwardRef } from 'react';

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

  // Base input classes
  const getBaseInputClasses = () => {
    const baseClasses = [
      'w-full font-primary text-base text-text-primary bg-background-primary border border-border-primary rounded-lg transition-all duration-fast',
      'focus:outline-none focus:border-border-focus focus:ring-4 focus:ring-blue-100',
      'placeholder:text-text-muted',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50'
    ];

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-5 py-4 text-lg min-h-[52px]',
    };

    // Variant classes
    const variantClasses = {
      default: 'border-border-primary',
      filled: 'bg-background-secondary border-background-secondary focus:bg-background-primary',
      outlined: 'border-2 border-border-primary focus:border-border-focus',
    };

    // Error state
    const errorClasses = hasError ? 'border-error bg-red-50 focus:border-error focus:ring-red-100' : '';

    // Icon padding adjustments
    const iconPaddingClasses = [
      leftIcon ? 'pl-10' : '',
      rightIcon ? 'pr-10' : ''
    ].filter(Boolean).join(' ');

    return [
      ...baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      errorClasses,
      iconPaddingClasses,
      className
    ].filter(Boolean).join(' ');
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {props.required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={getBaseInputClasses()}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : 
            showHelperText ? `${inputId}-helper` : 
            undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <div id={`${inputId}-error`} className="form-error" role="alert">
          <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      {showHelperText && (
        <div id={`${inputId}-helper`} className="form-help">
          {helperText}
        </div>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
