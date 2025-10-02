import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveForm, { FormField, FormButton, FormCheckbox } from './ResponsiveForm';
import { notificationService } from '../services/notificationService';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  roles: ('driver' | 'owner')[];
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roles: ['driver'],
    agreeToTerms: false,
    subscribeNewsletter: true
  });
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Calculate password strength
    const calculateStrength = (password: string): number => {
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (/[a-z]/.test(password)) strength += 25;
      if (/[A-Z]/.test(password)) strength += 25;
      if (/[0-9]/.test(password)) strength += 25;
      if (/[^A-Za-z0-9]/.test(password)) strength += 25;
      return Math.min(strength, 100);
    };

    setPasswordStrength(calculateStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 50) {
      newErrors.password = 'Password is too weak. Include uppercase, lowercase, and numbers.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.roles.length === 0) {
      newErrors.roles = 'Please select at least one role';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'roles') {
      const role = value as 'driver' | 'owner';
      setFormData(prev => ({
        ...prev,
        roles: checked 
          ? [...prev.roles, role]
          : prev.roles.filter(r => r !== role)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      notificationService.showError('Please fix the errors below');
      return;
    }

    setIsLoading(true);

    try {
      const userRole = await register(formData.name, formData.email, formData.password, formData.roles);
      
      // Success notification
      notificationService.showSuccess('Account created successfully! Redirecting to your dashboard...');
      
      // Redirect based on user role
      const redirectTo = userRole === 'driver' ? '/driver-dashboard' : '/owner-dashboard';
      
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.msg || error.message || 'Registration failed. Please try again.';
      notificationService.showError(errorMessage);
      
      // Set form errors for specific fields
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: 'This email is already registered' });
      }
      
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#ef4444';
    if (passwordStrength < 50) return '#f59e0b';
    if (passwordStrength < 75) return '#3b82f6';
    return '#10b981';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  return (
    <ResponsiveForm
      title="Create Account"
      subtitle="Join Parkway and start your parking journey"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      maxWidth="md"
    >
      <FormField
        label="Full Name"
        name="name"
        type="text"
        value={formData.name}
        onChange={handleInputChange}
        error={errors.name}
        placeholder="Enter your full name"
        required
        autoComplete="name"
        disabled={isLoading}
      />

      <FormField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleInputChange}
        error={errors.email}
        placeholder="Enter your email"
        required
        autoComplete="email"
        disabled={isLoading}
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <FormField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          placeholder="Create a strong password"
          required
          autoComplete="new-password"
          disabled={isLoading}
        />
        
        {formData.password && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '0.25rem'
            }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Password Strength:
              </span>
              <span style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600',
                color: getPasswordStrengthColor()
              }}>
                {getPasswordStrengthText()}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${passwordStrength}%`,
                height: '100%',
                background: getPasswordStrengthColor(),
                transition: 'all 0.3s ease',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        )}
      </div>

      <FormField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        error={errors.confirmPassword}
        placeholder="Confirm your password"
        required
        autoComplete="new-password"
        disabled={isLoading}
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ 
          display: 'block',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '0.75rem',
          fontSize: '0.95rem'
        }}>
          I want to: <span style={{ color: '#ef4444' }}>*</span>
        </label>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          background: '#f8fafc',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid rgba(229, 231, 235, 0.5)'
        }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}>
            <input
              type="checkbox"
              name="roles"
              value="driver"
              checked={formData.roles.includes('driver')}
              onChange={handleInputChange}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(209, 213, 219, 0.8)',
              borderRadius: '6px',
              background: formData.roles.includes('driver') 
                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
                : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              {formData.roles.includes('driver') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>Find Parking Spots</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Search and book available driveways
              </div>
            </div>
          </label>

          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}>
            <input
              type="checkbox"
              name="roles"
              value="owner"
              checked={formData.roles.includes('owner')}
              onChange={handleInputChange}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(209, 213, 219, 0.8)',
              borderRadius: '6px',
              background: formData.roles.includes('owner') 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              {formData.roles.includes('owner') && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#1f2937' }}>List My Driveway</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Rent out your driveway space for income
              </div>
            </div>
          </label>
        </div>
        
        {errors.roles && (
          <div style={{ 
            color: '#ef4444', 
            fontSize: '0.875rem', 
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {errors.roles}
          </div>
        )}
      </div>

      <FormCheckbox
        label="I agree to the Terms of Service and Privacy Policy"
        name="agreeToTerms"
        checked={formData.agreeToTerms}
        onChange={handleInputChange}
        error={errors.agreeToTerms}
        disabled={isLoading}
      />

      <FormCheckbox
        label="Subscribe to newsletter for parking tips and updates"
        name="subscribeNewsletter"
        checked={formData.subscribeNewsletter}
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <FormButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Create Account
      </FormButton>

      <div style={{ 
        textAlign: 'center', 
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(229, 231, 235, 0.5)'
      }}>
        <p style={{ 
          color: '#64748b', 
          fontSize: '0.95rem', 
          margin: '0 0 1rem 0' 
        }}>
          Already have an account?
        </p>
        
        <Link 
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#3b82f6',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10,17 15,12 10,7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          Sign In Instead
        </Link>
      </div>
    </ResponsiveForm>
  );
};

export default Register;