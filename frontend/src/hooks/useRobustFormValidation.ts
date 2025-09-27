/**
 * Robust Form Validation Hook with comprehensive validation rules and error handling
 */

import { useState, useCallback, useEffect } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  email?: boolean;
  url?: boolean;
  phone?: boolean;
  date?: boolean;
  time?: boolean;
  futureDate?: boolean;
  pastDate?: boolean;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormData {
  [key: string]: any;
}

export interface FormErrors {
  [key: string]: string;
}

export interface FormTouched {
  [key: string]: boolean;
}

export interface UseFormValidationReturn {
  formData: FormData;
  errors: FormErrors;
  touched: FormTouched;
  isValid: boolean;
  isSubmitting: boolean;
  handleChange: (field: string, value: any) => void;
  handleBlur: (field: string) => void;
  validateField: (field: string) => string | null;
  validateForm: () => boolean;
  setFormData: (data: FormData) => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  clearErrors: () => void;
  resetForm: () => void;
  submitForm: (onSubmit: (data: FormData) => Promise<void>) => Promise<void>;
}

export function useRobustFormValidation(
  initialData: FormData,
  validationRules: ValidationRules
): UseFormValidationReturn {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate individual field
  const validateField = useCallback((field: string): string | null => {
    const value = formData[field];
    const rule = validationRules[field];
    
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return null;

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        return `${field} must be at least ${rule.minLength} characters`;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        return `${field} must be no more than ${rule.maxLength} characters`;
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        return `${field} format is invalid`;
      }
      if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return `${field} must be a valid email address`;
      }
      if (rule.url && !/^https?:\/\/.+/.test(value)) {
        return `${field} must be a valid URL`;
      }
      if (rule.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return `${field} must be a valid phone number`;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        return `${field} must be at least ${rule.min}`;
      }
      if (rule.max !== undefined && value > rule.max) {
        return `${field} must be no more than ${rule.max}`;
      }
    }

    // Date validations
    if (rule.date || rule.futureDate || rule.pastDate) {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${field} must be a valid date`;
      }
      if (rule.futureDate && date <= new Date()) {
        return `${field} must be a future date`;
      }
      if (rule.pastDate && date >= new Date()) {
        return `${field} must be a past date`;
      }
    }

    // Time validations
    if (rule.time) {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
        return `${field} must be a valid time (HH:MM)`;
      }
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) return customError;
    }

    return null;
  }, [formData, validationRules]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField, validationRules]);

  // Handle field change
  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Handle field blur
  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate field on blur
    const error = validateField(field);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
  }, [validateField]);

  // Set field value
  const setFieldValue = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Set field error
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialData]);

  // Submit form with validation
  const submitForm = useCallback(async (onSubmit: (data: FormData) => Promise<void>) => {
    setIsSubmitting(true);
    
    try {
      // Mark all fields as touched
      const allTouched: FormTouched = {};
      Object.keys(validationRules).forEach(field => {
        allTouched[field] = true;
      });
      setTouched(allTouched);

      // Validate form
      if (!validateForm()) {
        throw new Error('Form validation failed');
      }

      // Submit form
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, validationRules]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 || Object.values(errors).every(error => !error);

  // Update form data when initial data changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  return {
    formData,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleBlur,
    validateField,
    validateForm,
    setFormData,
    setFieldValue,
    setFieldError,
    clearErrors,
    resetForm,
    submitForm
  };
}
