import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  outline?: boolean;
  ghost?: boolean;
  icon?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  outline = false,
  ghost = false,
  icon = false,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const baseClasses = 'btn';
  
  const variantClass = outline 
    ? `btn-outline-${variant}`
    : ghost 
    ? variant === 'primary' ? 'btn-ghost-primary' : 'btn-ghost'
    : `btn-${variant}`;
  
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  const widthClass = fullWidth ? 'btn-full' : '';
  const iconClass = icon ? 'btn-icon' : '';
  const loadingClass = loading ? 'btn-loading' : '';
  
  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    widthClass,
    iconClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export default Button;
