import React from 'react';
import { motion } from 'framer-motion';
import './ResponsiveLayout.css';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'lg',
  padding = 'md',
  className = '',
  animate = true
}) => {
  const maxWidthClasses = {
    sm: 'responsive-layout--max-width-sm',
    md: 'responsive-layout--max-width-md',
    lg: 'responsive-layout--max-width-lg',
    xl: 'responsive-layout--max-width-xl',
    '2xl': 'responsive-layout--max-width-2xl',
    full: 'responsive-layout--max-width-full',
  };

  const paddingClasses = {
    none: 'responsive-layout--padding-none',
    sm: 'responsive-layout--padding-sm',
    md: 'responsive-layout--padding-md',
    lg: 'responsive-layout--padding-lg',
    xl: 'responsive-layout--padding-xl',
  };

  const baseClasses = 'responsive-layout';
  const maxWidthClass = maxWidthClasses[maxWidth];
  const paddingClass = paddingClasses[padding];
  
  const layoutClasses = `${baseClasses} ${maxWidthClass} ${paddingClass} ${className}`.trim();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        staggerChildren: 0.1,
      },
    },
  };

  const LayoutContainer = animate ? motion.div : 'div';

  return (
    <LayoutContainer
      className={layoutClasses}
      variants={animate ? containerVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
    >
      {children}
    </LayoutContainer>
  );
};

export default ResponsiveLayout;
