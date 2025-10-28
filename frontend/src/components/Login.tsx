import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Removed conflicting useEffect - navigation is handled in handleSubmit

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const userRoles = await login(formData.email, formData.password, formData.rememberMe);
      
      // Navigate directly to appropriate dashboard based on user roles
      if (Array.isArray(userRoles)) {
        if (userRoles.includes('driver')) {
          navigate('/driver-dashboard', { replace: true });
        } else if (userRoles.includes('owner')) {
          navigate('/owner-dashboard', { replace: true });
        } else {
          // Fallback to homepage if role is unclear
          navigate('/', { replace: true });
        }
      } else {
        // Fallback for single role string
        if (userRoles === 'driver') {
          navigate('/driver-dashboard', { replace: true });
        } else if (userRoles === 'owner') {
          navigate('/owner-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 text-blue-500">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Welcome Back</h1>
          <p className="text-lg text-gray-600">Sign in to your Parkway account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && <span className="text-red-500 text-sm">{errors.password}</span>}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200">
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;