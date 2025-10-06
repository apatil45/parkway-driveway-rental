// Validation Rules for Parkway.com
import { ValidationRule } from '../hooks/useFormValidation';

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
  alphanumeric: /^[a-zA-Z0-9\s]+$/,
  address: /^[a-zA-Z0-9\s,.-]+$/,
  price: /^\d+(\.\d{1,2})?$/,
  time: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Common validation messages
export const messages = {
  required: (field: string) => `${field} is required`,
  minLength: (field: string, min: number) => `${field} must be at least ${min} characters`,
  maxLength: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  pattern: (field: string) => `${field} format is invalid`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  price: 'Please enter a valid price (e.g., 10.50)',
  time: 'Please enter a valid time (e.g., 14:30)',
  date: 'Please enter a valid date (YYYY-MM-DD)',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past',
  minValue: (field: string, min: number) => `${field} must be at least ${min}`,
  maxValue: (field: string, max: number) => `${field} must be no more than ${max}`
};

// User registration validation rules
export const userRegistrationRules: Record<string, ValidationRule> = {
  email: {
    required: true,
    pattern: patterns.email,
    message: messages.email
  },
  password: {
    required: true,
    minLength: 8,
    pattern: patterns.password,
    message: messages.password
  },
  confirmPassword: {
    required: true,
    custom: (value, formValues) => {
      if (value !== formValues?.password) {
        return 'Passwords do not match';
      }
      return null;
    }
  },
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.alphanumeric,
    message: messages.pattern('First name')
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.alphanumeric,
    message: messages.pattern('Last name')
  },
  phone: {
    required: true,
    pattern: patterns.phone,
    message: messages.phone
  },
  role: {
    required: true,
    custom: (value) => {
      if (!['driver', 'owner', 'admin'].includes(value)) {
        return 'Please select a valid role';
      }
      return null;
    }
  }
};

// User login validation rules
export const userLoginRules: Record<string, ValidationRule> = {
  email: {
    required: true,
    pattern: patterns.email,
    message: messages.email
  },
  password: {
    required: true,
    minLength: 1,
    message: 'Password is required'
  }
};

// Driveway creation validation rules
export const drivewayRules: Record<string, ValidationRule> = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 100,
    message: 'Title must be between 5 and 100 characters'
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 1000,
    message: 'Description must be between 10 and 1000 characters'
  },
  address: {
    required: true,
    minLength: 5,
    maxLength: 255,
    pattern: patterns.address,
    message: 'Please enter a valid address'
  },
  price: {
    required: true,
    pattern: patterns.price,
    custom: (value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        return 'Price must be a positive number';
      }
      if (numValue > 1000) {
        return 'Price cannot exceed $1000 per hour';
      }
      return null;
    }
  },
  capacity: {
    required: true,
    custom: (value) => {
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1 || numValue > 10) {
        return 'Capacity must be between 1 and 10 cars';
      }
      return null;
    }
  },
  carSize: {
    required: true,
    custom: (value) => {
      if (!['small', 'medium', 'large', 'xl'].includes(value)) {
        return 'Please select a valid car size';
      }
      return null;
    }
  },
  accessInstructions: {
    maxLength: 500,
    message: 'Access instructions cannot exceed 500 characters'
  },
  restrictions: {
    maxLength: 500,
    message: 'Restrictions cannot exceed 500 characters'
  }
};

// Booking validation rules
export const bookingRules: Record<string, ValidationRule> = {
  startTime: {
    required: true,
    custom: (value) => {
      const startDate = new Date(value);
      const now = new Date();
      
      if (isNaN(startDate.getTime())) {
        return 'Please enter a valid start time';
      }
      
      if (startDate <= now) {
        return 'Start time must be in the future';
      }
      
      return null;
    }
  },
  endTime: {
    required: true,
    custom: (value, formValues) => {
      const endDate = new Date(value);
      const startDate = formValues?.startTime ? new Date(formValues.startTime) : null;
      
      if (isNaN(endDate.getTime())) {
        return 'Please enter a valid end time';
      }
      
      if (startDate && endDate <= startDate) {
        return 'End time must be after start time';
      }
      
      // Check if booking is too long (max 24 hours)
      if (startDate) {
        const duration = endDate.getTime() - startDate.getTime();
        const maxDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (duration > maxDuration) {
          return 'Booking cannot exceed 24 hours';
        }
        
        if (duration < 30 * 60 * 1000) { // 30 minutes
          return 'Booking must be at least 30 minutes';
        }
      }
      
      return null;
    }
  },
  specialInstructions: {
    maxLength: 500,
    message: 'Special instructions cannot exceed 500 characters'
  }
};

// Search validation rules
export const searchRules: Record<string, ValidationRule> = {
  date: {
    required: true,
    pattern: patterns.date,
    custom: (value) => {
      const searchDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (searchDate < today) {
        return 'Search date cannot be in the past';
      }
      
      // Check if date is too far in the future (max 1 year)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      
      if (searchDate > maxDate) {
        return 'Search date cannot be more than 1 year in the future';
      }
      
      return null;
    }
  },
  startTime: {
    required: true,
    pattern: patterns.time,
    message: messages.time
  },
  endTime: {
    required: true,
    pattern: patterns.time,
    custom: (value, formValues) => {
      if (formValues?.startTime && value <= formValues.startTime) {
        return 'End time must be after start time';
      }
      return null;
    }
  },
  radius: {
    required: true,
    custom: (value) => {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0.1 || numValue > 50) {
        return 'Search radius must be between 0.1 and 50 miles';
      }
      return null;
    }
  },
  carSize: {
    required: true,
    custom: (value) => {
      if (!['small', 'medium', 'large', 'xl'].includes(value)) {
        return 'Please select a valid car size';
      }
      return null;
    }
  }
};

// Profile update validation rules
export const profileRules: Record<string, ValidationRule> = {
  firstName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.alphanumeric,
    message: messages.pattern('First name')
  },
  lastName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: patterns.alphanumeric,
    message: messages.pattern('Last name')
  },
  phone: {
    required: true,
    pattern: patterns.phone,
    message: messages.phone
  },
  email: {
    required: true,
    pattern: patterns.email,
    message: messages.email
  }
};

// Password change validation rules
export const passwordChangeRules: Record<string, ValidationRule> = {
  currentPassword: {
    required: true,
    message: 'Current password is required'
  },
  newPassword: {
    required: true,
    minLength: 8,
    pattern: patterns.password,
    message: messages.password
  },
  confirmNewPassword: {
    required: true,
    custom: (value, formValues) => {
      if (value !== formValues?.newPassword) {
        return 'New passwords do not match';
      }
      return null;
    }
  }
};

// Export all rules
export const validationRules = {
  userRegistration: userRegistrationRules,
  userLogin: userLoginRules,
  driveway: drivewayRules,
  booking: bookingRules,
  search: searchRules,
  profile: profileRules,
  passwordChange: passwordChangeRules
};

export default validationRules;
