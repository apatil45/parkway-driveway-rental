import React from 'react';

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
  // Base classes
  const baseClasses = [
    'inline-flex items-center justify-center gap-2 font-medium border border-transparent cursor-pointer transition-all duration-fast relative overflow-hidden text-decoration-none uppercase tracking-wide min-h-[48px] shadow-lg',
    'hover:not-disabled:transform hover:not-disabled:-translate-y-0.5',
    'active:not-disabled:transform active:not-disabled:translate-y-px',
    'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
    'focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2'
  ];

  // Variant classes
  const getVariantClasses = () => {
    if (outline) {
      const outlineVariants = {
        primary: 'bg-transparent text-primary border-primary hover:not-disabled:bg-primary hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-primary/30',
        secondary: 'bg-transparent text-secondary border-secondary hover:not-disabled:bg-secondary hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-secondary/30',
        success: 'bg-transparent text-success border-success hover:not-disabled:bg-success hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-success/30',
        danger: 'bg-transparent text-error border-error hover:not-disabled:bg-error hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-error/30',
        warning: 'bg-transparent text-warning border-warning hover:not-disabled:bg-warning hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-warning/30',
        info: 'bg-transparent text-info border-info hover:not-disabled:bg-info hover:not-disabled:text-white hover:not-disabled:shadow-lg hover:not-disabled:shadow-info/30',
      };
      return outlineVariants[variant] || outlineVariants.primary;
    }

    if (ghost) {
      const ghostVariants = {
        primary: 'bg-transparent text-primary shadow-none hover:not-disabled:bg-primary/10 hover:not-disabled:text-primary-dark',
        secondary: 'bg-transparent text-text-secondary shadow-none hover:not-disabled:bg-text-secondary/10 hover:not-disabled:text-text-primary',
        success: 'bg-transparent text-success shadow-none hover:not-disabled:bg-success/10 hover:not-disabled:text-success',
        danger: 'bg-transparent text-error shadow-none hover:not-disabled:bg-error/10 hover:not-disabled:text-error',
        warning: 'bg-transparent text-warning shadow-none hover:not-disabled:bg-warning/10 hover:not-disabled:text-warning',
        info: 'bg-transparent text-info shadow-none hover:not-disabled:bg-info/10 hover:not-disabled:text-info',
      };
      return ghostVariants[variant] || ghostVariants.primary;
    }

    const solidVariants = {
      primary: 'bg-gradient-to-br from-primary to-primary-light text-white hover:not-disabled:from-primary-light hover:not-disabled:to-primary hover:not-disabled:shadow-xl hover:not-disabled:shadow-primary/40',
      secondary: 'bg-gradient-to-br from-secondary to-secondary-dark text-white hover:not-disabled:from-secondary-dark hover:not-disabled:to-secondary hover:not-disabled:shadow-xl hover:not-disabled:shadow-secondary/40',
      success: 'bg-gradient-to-br from-success to-success/80 text-white hover:not-disabled:from-success/80 hover:not-disabled:to-success hover:not-disabled:shadow-xl hover:not-disabled:shadow-success/40',
      danger: 'bg-gradient-to-br from-error to-error/80 text-white hover:not-disabled:from-error/80 hover:not-disabled:to-error hover:not-disabled:shadow-xl hover:not-disabled:shadow-error/40',
      warning: 'bg-gradient-to-br from-warning to-warning/80 text-white hover:not-disabled:from-warning/80 hover:not-disabled:to-warning hover:not-disabled:shadow-xl hover:not-disabled:shadow-warning/40',
      info: 'bg-gradient-to-br from-info to-info/80 text-white hover:not-disabled:from-info/80 hover:not-disabled:to-info hover:not-disabled:shadow-xl hover:not-disabled:shadow-info/40',
    };
    return solidVariants[variant] || solidVariants.primary;
  };

  // Size classes
  const getSizeClasses = () => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm min-h-[36px]',
      md: 'px-6 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[56px]',
      xl: 'px-10 py-5 text-xl min-h-[64px]',
    };
    return sizeClasses[size] || sizeClasses.md;
  };

  // Additional classes
  const getAdditionalClasses = () => {
    const classes = [];
    
    if (fullWidth) classes.push('w-full');
    if (icon) classes.push('p-3 rounded-full min-w-[48px] min-h-[48px]');
    if (loading) classes.push('text-transparent');
    
    return classes.join(' ');
  };

  const classes = [
    ...baseClasses,
    getVariantClasses(),
    getSizeClasses(),
    getAdditionalClasses(),
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
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
};

export default Button;
