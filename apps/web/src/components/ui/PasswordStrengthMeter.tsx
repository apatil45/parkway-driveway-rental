'use client';

import { useMemo } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

/**
 * Password Strength Meter Component
 * 
 * Calculates and displays password strength visually
 * Pure frontend component - no API calls
 */
export default function PasswordStrengthMeter({ password, className = '' }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/\d/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z\d]/.test(password)) score += 1; // special chars
    
    // Determine strength level
    if (score <= 2) {
      return { level: 1, label: 'Weak', color: 'bg-red-500' };
    } else if (score <= 4) {
      return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    } else if (score <= 5) {
      return { level: 3, label: 'Good', color: 'bg-blue-500' };
    } else {
      return { level: 4, label: 'Strong', color: 'bg-green-500' };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Password strength:</span>
        <span className={`font-medium ${
          strength.level === 1 ? 'text-red-600' :
          strength.level === 2 ? 'text-yellow-600' :
          strength.level === 3 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${(strength.level / 4) * 100}%` }}
          role="progressbar"
          aria-valuenow={strength.level}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Password strength: ${strength.label}`}
        />
      </div>
    </div>
  );
}
