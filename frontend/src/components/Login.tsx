import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password, rememberMe } = formData;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
    if (errors[name as keyof typeof errors]) {
      setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    try {
      const userRole = await login(email, password, rememberMe);
      toast.success('Login Successful!');

      if (userRole === 'owner') {
        navigate('/owner-dashboard');
      } else if (userRole === 'driver') {
        navigate('/driver-dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      toast.error(`Login Failed: ${err.response?.data?.msg || err.message || 'Server Error'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome to Parkway.com</h2>
        <p className="login-subtitle">Sign in to your account to continue</p>
        <form onSubmit={onSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`form-input ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <p id="email-error" className="error-message">{errors.email}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Minimum 6 characters"
              autoComplete="current-password"
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`form-input ${errors.password ? 'error' : ''}`}
            />
            {errors.password && <p id="password-error" className="error-message">{errors.password}</p>}
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={onChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">Remember me</span>
            </label>
          </div>
          <div className="forgot-password">
            <Link to="/forgot-password">
              Forgot your password?
            </Link>
          </div>
          <button
            type="submit"
            className="login-button"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        <div className="signup-link">
          <p>
            Don't have an account? {' '}
            <Link to="/register">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
