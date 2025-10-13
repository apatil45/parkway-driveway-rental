import React from 'react';

interface ResponsiveFormProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  subtitle,
  children,
  onSubmit,
  isLoading = false,
  maxWidth = 'md',
  className = ''
}) => {
  return (
    <div className="responsive-form-container">
      <div className="responsive-form-background">
        <div className="background-pattern"></div>
        <div className="background-gradient"></div>
      </div>
      
      <div className={`responsive-form-wrapper ${maxWidth} ${className}`}>
        <form className="responsive-form" onSubmit={onSubmit} noValidate>
          <div className="form-header">
            <h1 className="form-title">{title}</h1>
            {subtitle && <p className="form-subtitle">{subtitle}</p>}
          </div>
          
          <div className="form-content">
            {children}
          </div>
          
          {isLoading && (
            <div className="form-loading-overlay">
              <div className="loading-spinner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="60">
                    <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  autoComplete,
  disabled = false,
  helpText
}) => {
  return (
    <div className="form-field">
      <label htmlFor={name} className="form-label">
        {label}
        {required && <span className="required-indicator" aria-label="required">*</span>}
      </label>
      
      <div className="form-input-wrapper">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`form-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
        
        {type === 'password' && (
          <div className="password-strength-indicator">
            <div className="strength-bar">
              <div className="strength-fill"></div>
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div id={`${name}-error`} className="form-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={`${name}-help`} className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
};

interface FormButtonProps {
  children: React.ReactNode;
  type?: 'submit' | 'button' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
}

export const FormButton: React.FC<FormButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`form-button ${variant} ${size} ${fullWidth ? 'full-width' : ''} ${disabled || loading ? 'disabled' : ''} ${className}`}
    >
      {loading ? (
        <div className="button-loading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="60" strokeDashoffset="60">
              <animateTransform attributeName="transform" type="rotate" values="0 12 12;360 12 12" dur="1s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

interface FormCheckboxProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  helpText?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  error,
  disabled = false,
  helpText
}) => {
  return (
    <div className="form-checkbox-field">
      <label className="checkbox-label">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="checkbox-input"
          aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
        />
        <span className="checkbox-custom">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        </span>
        <span className="checkbox-text">{label}</span>
      </label>
      
      {error && (
        <div id={`${name}-error`} className="form-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}
      
      {helpText && !error && (
        <div id={`${name}-help`} className="form-help">
          {helpText}
        </div>
      )}
    </div>
  );
};

export default ResponsiveForm;
