// Enhanced Form Validation Hook for Parkway.com
import { useState, useCallback, useRef, useEffect } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface FieldValidation {
  value: any;
  error: string | null;
  touched: boolean;
  isValid: boolean;
}

export interface FormValidation {
  fields: Record<string, FieldValidation>;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export interface ValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  debounceMs?: number;
}

const useFormValidation = (
  initialValues: Record<string, any>,
  validationRules: Record<string, ValidationRule>,
  options: ValidationOptions = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    debounceMs = 300
  } = options;

  const [formState, setFormState] = useState<FormValidation>(() => {
    const fields: Record<string, FieldValidation> = {};
    Object.keys(initialValues).forEach(key => {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        isValid: true
      };
    });
    return {
      fields,
      isValid: true,
      errors: {},
      touched: {}
    };
  });

  const debounceTimeoutRef = useRef<Record<string, number>>({});

  // Validation function
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rule = validationRules[fieldName];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rule.message || `${fieldName} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // Min length validation
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message || `${fieldName} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || `${fieldName} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [validationRules]);

  // Update field value
  const setValue = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      const field = { ...newFields[fieldName] };
      
      field.value = value;
      field.touched = true;

      // Clear existing debounce timeout
      if (debounceTimeoutRef.current[fieldName]) {
        clearTimeout(debounceTimeoutRef.current[fieldName]);
      }

      // Debounced validation
      if (validateOnChange) {
        debounceTimeoutRef.current[fieldName] = window.setTimeout(() => {
          const error = validateField(fieldName, value);
          field.error = error;
          field.isValid = !error;

          setFormState(current => ({
            ...current,
            fields: { ...current.fields, [fieldName]: field },
            errors: { ...current.errors, [fieldName]: error || '' },
            touched: { ...current.touched, [fieldName]: true }
          }));
        }, debounceMs);
      }

      newFields[fieldName] = field;

      // Calculate overall form validity
      const isValid = Object.values(newFields).every(field => field.isValid);

      return {
        ...prev,
        fields: newFields,
        isValid,
        errors: { ...prev.errors, [fieldName]: field.error || '' },
        touched: { ...prev.touched, [fieldName]: true }
      };
    });
  }, [validateOnChange, validateField, debounceMs]);

  // Set field touched state
  const setTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFormState(prev => {
      const newFields = { ...prev.fields };
      const field = { ...newFields[fieldName] };
      
      field.touched = touched;

      // Validate on blur if enabled
      if (validateOnBlur && touched) {
        const error = validateField(fieldName, field.value);
        field.error = error;
        field.isValid = !error;
      }

      newFields[fieldName] = field;

      // Calculate overall form validity
      const isValid = Object.values(newFields).every(field => field.isValid);

      return {
        ...prev,
        fields: newFields,
        isValid,
        errors: { ...prev.errors, [fieldName]: field.error || '' },
        touched: { ...prev.touched, [fieldName]: touched }
      };
    });
  }, [validateOnBlur, validateField]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const newFields = { ...formState.fields };
    const errors: Record<string, string> = {};
    let isValid = true;

    Object.keys(newFields).forEach(fieldName => {
      const field = newFields[fieldName];
      const error = validateField(fieldName, field.value);
      
      field.error = error;
      field.isValid = !error;
      field.touched = true;

      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    setFormState(prev => ({
      ...prev,
      fields: newFields,
      isValid,
      errors,
      touched: Object.keys(newFields).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    }));

    return isValid;
  }, [formState.fields, validateField]);

  // Reset form
  const resetForm = useCallback(() => {
    const fields: Record<string, FieldValidation> = {};
    Object.keys(initialValues).forEach(key => {
      fields[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        isValid: true
      };
    });

    setFormState({
      fields,
      isValid: true,
      errors: {},
      touched: {}
    });

    // Clear all debounce timeouts
    Object.values(debounceTimeoutRef.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    debounceTimeoutRef.current = {};
  }, [initialValues]);

  // Get field value
  const getValue = useCallback((fieldName: string) => {
    return formState.fields[fieldName]?.value;
  }, [formState.fields]);

  // Get field error
  const getError = useCallback((fieldName: string) => {
    return formState.fields[fieldName]?.error;
  }, [formState.fields]);

  // Get field touched state
  const getTouched = useCallback((fieldName: string) => {
    return formState.fields[fieldName]?.touched;
  }, [formState.fields]);

  // Get all form values
  const getValues = useCallback(() => {
    const values: Record<string, any> = {};
    Object.keys(formState.fields).forEach(key => {
      values[key] = formState.fields[key].value;
    });
    return values;
  }, [formState.fields]);

  // Set multiple values
  const setValues = useCallback((values: Record<string, any>) => {
    Object.keys(values).forEach(key => {
      setValue(key, values[key]);
    });
  }, [setValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  return {
    formState,
    setValue,
    setTouched,
    validateForm,
    resetForm,
    getValue,
    getError,
    getTouched,
    getValues,
    setValues,
    isValid: formState.isValid,
    errors: formState.errors,
    touched: formState.touched
  };
};

export default useFormValidation;