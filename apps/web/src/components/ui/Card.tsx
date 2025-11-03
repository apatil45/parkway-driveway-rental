import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
};

const shadowClasses = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
};

export default function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  clickable = false
}: CardProps) {
  const paddingClass = paddingClasses[padding];
  const shadowClass = shadowClasses[shadow];
  
  return (
    <div className={`bg-[color:rgb(var(--color-surface))] text-[color:rgb(var(--color-surface-foreground))] rounded-lg border border-[color:rgb(var(--color-border))] ${paddingClass} ${shadowClass} ${clickable ? 'transition-colors hover:bg-gray-50 cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
