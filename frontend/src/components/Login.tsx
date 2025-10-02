import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResponsiveForm, { FormField, FormButton, FormCheckbox } from './ResponsiveForm';
import { notificationService } from '../services/notificationService';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LocationState {
  from?: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      const redirectTo = state?.from || '/';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, state]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value 
    }));

    // Clear error when user starts typing
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      notificationService.showAuthError('Please fix the errors below');
      return;
    }

    setIsLoading(true);

    try {
      const userRole = await login(formData.email, formData.password, formData.rememberMe);
      
      // Success notification
      notificationService.showAuthSuccess('Welcome back! Redirecting to your dashboard...');
      
      // Redirect based on user role or intended destination
      const redirectTo = state?.from || (userRole === 'driver' ? '/driver-dashboard' : '/owner-dashboard');
      
      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.msg || error.message || 'Login failed. Please try again.';
      notificationService.showAuthError(errorMessage);
      
      // Set form errors for specific fields
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: 'Invalid email address' });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ password: 'Invalid password' });
      } else if (errorMessage.toLowerCase().includes('credentials')) {
        setErrors({ 
          email: 'Invalid credentials',
          password: 'Invalid credentials'
        });
      }
      
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (formData.email) {
      notificationService.showSystemInfo('Password reset functionality coming soon!');
    } else {
      notificationService.showAuthError('Please enter your email address first');
    }
  };

  return (
    <ResponsiveForm
      title="Welcome Back"
      subtitle="Sign in to your Parkway account"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      maxWidth="sm"
    >
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

      <FormField
        label="Password"
        name="password"
              type="password"
        value={formData.password}
        onChange={handleInputChange}
        error={errors.password}
        placeholder="Enter your password"
        required
              autoComplete="current-password"
        disabled={isLoading}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <FormCheckbox
          label="Remember me"
                name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={isLoading}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            textDecoration: 'underline',
            padding: '0.25rem'
          }}
        >
          Forgot password?
        </button>
          </div>

      <FormButton
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10,17 15,12 10,7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Sign In
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
          Don't have an account?
        </p>
        
        <Link 
          to="/register"
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Create Account
            </Link>
          </div>

      {state?.from && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          marginTop: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#3b82f6', 
            fontSize: '0.875rem', 
            margin: '0',
            fontWeight: '500'
          }}>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Please sign in to continue to your requested page
          </p>
        </div>
      )}
    </ResponsiveForm>
  );
};

export default Login;