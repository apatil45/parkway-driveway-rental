import React from 'react';
import { motion } from 'framer-motion';
import './SmoothButton.css';

interface SmoothButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  href?: string;
  target?: string;
  rel?: string;
}

const SmoothButton: React.FC<SmoothButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  href,
  target,
  rel
}) => {
  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    disabled: {
      scale: 1,
      opacity: 0.6,
    },
  };

  const rippleVariants = {
    initial: {
      scale: 0,
      opacity: 0.6,
    },
    animate: {
      scale: 4,
      opacity: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const baseClasses = `smooth-button smooth-button--${variant} smooth-button--${size}`;
  const fullWidthClass = fullWidth ? 'smooth-button--full-width' : '';
  const disabledClass = disabled || loading ? 'smooth-button--disabled' : '';
  const loadingClass = loading ? 'smooth-button--loading' : '';
  
  const buttonClasses = `${baseClasses} ${fullWidthClass} ${disabledClass} ${loadingClass} ${className}`.trim();

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    
    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
    `;
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
    
    onClick?.();
  };

  const buttonContent = (
    <>
      {loading && (
        <motion.div
          className="smooth-button__spinner"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      <span className={`smooth-button__content ${loading ? 'smooth-button__content--loading' : ''}`}>
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        className={buttonClasses}
        variants={buttonVariants}
        whileHover={!disabled && !loading ? 'hover' : 'disabled'}
        whileTap={!disabled && !loading ? 'tap' : 'disabled'}
        onClick={handleClick}
      >
        {buttonContent}
      </motion.a>
    );
  }

  return (
    <motion.button
      type={type}
      className={buttonClasses}
      variants={buttonVariants}
      whileHover={!disabled && !loading ? 'hover' : 'disabled'}
      whileTap={!disabled && !loading ? 'tap' : 'disabled'}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {buttonContent}
    </motion.button>
  );
};

export default SmoothButton;
