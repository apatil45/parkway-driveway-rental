import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from './Button';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    carSize: 'medium', // For drivers
    drivewaySize: 'medium', // For owners
  });
  const [passwordStrength, setPasswordStrength] = useState<string>('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const { name, email, password, role, carSize, drivewaySize } = formData;

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
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

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length > 5) strength++;
    if (password.length > 9) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors(prevErrors => ({ ...prevErrors, [e.target.name]: undefined }));
    }
    if (e.target.name === 'password') {
      setPasswordStrength(checkPasswordStrength(e.target.value));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsRegistering(true);
    try {
      await register(name, email, password, role as 'driver' | 'owner');
      toast.success('Registration Successful!');
      navigate('/login');
    } catch (err: any) {
      toast.error(`Registration Failed: ${err.response?.data?.msg || err.message || 'Server Error'}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const getPasswordStrengthClass = (strength: string) => {
    switch (strength) {
      case 'Weak':
        return 'weak';
      case 'Fair':
        return 'fair';
      case 'Good':
        return 'good';
      case 'Strong':
        return 'strong';
      default:
        return '';
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">Join Parkway.com</h2>
      <p className="register-subtitle">Join Parkway.com and start your journey</p>
      
      <form onSubmit={onSubmit} className="register-form">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={onChange}
            placeholder="Enter your full name"
            required
            className="form-input"
          />
          {errors.name && <p className="error-message">{errors.name}</p>}
        </div>
        
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={onChange}
            placeholder="you@example.com"
            required
            className="form-input"
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
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
            minLength={6}
            required
            className="form-input"
          />
          {errors.password && <p className="error-message">{errors.password}</p>}
          {passwordStrength && (
            <div className={`password-strength ${getPasswordStrengthClass(passwordStrength)}`}>
              Password Strength: <strong>{passwordStrength}</strong>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="role" className="form-label">Account Type</label>
          <select
            id="role"
            name="role"
            value={role}
            onChange={onChange}
            className="form-select"
          >
            <option value="driver">Driver - Find parking spaces</option>
            <option value="owner">Owner - List your driveway</option>
          </select>
        </div>
        
        {role === 'driver' && (
          <div className="form-group">
            <label htmlFor="carSize" className="form-label">Car Size</label>
            <select
              id="carSize"
              name="carSize"
              value={carSize}
              onChange={onChange}
              className="form-select"
            >
              <option value="small">Small (Hatchback, Sedan)</option>
              <option value="medium">Medium (SUV, Crossover)</option>
              <option value="large">Large (Truck, Van)</option>
              <option value="extra-large">Extra Large (RV, Bus)</option>
            </select>
          </div>
        )}
        
        {role === 'owner' && (
          <div className="form-group">
            <label htmlFor="drivewaySize" className="form-label">Driveway Size</label>
            <select
              id="drivewaySize"
              name="drivewaySize"
              value={drivewaySize}
              onChange={onChange}
              className="form-select"
            >
              <option value="small">Small (1 car)</option>
              <option value="medium">Medium (2 cars)</option>
              <option value="large">Large (3+ cars)</option>
              <option value="extra-large">Extra Large (RV/Bus friendly)</option>
            </select>
          </div>
        )}
        
        <Button 
          type="submit" 
          variant="success" 
          size="lg" 
          fullWidth
          loading={isRegistering}
          disabled={isRegistering}
        >
          {isRegistering ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>
      
      <div className="login-link">
        <p>
          Already have an account? {' '}
          <Link to="/login">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
