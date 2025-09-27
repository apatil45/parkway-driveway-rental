import React from 'react';
import { motion } from 'framer-motion';
import './ResponsiveGrid.css';

interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;
  className?: string;
  animate?: boolean;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = '1.5rem',
  className = '',
  animate = true
}) => {
  const gridStyle = {
    '--grid-gap': gap,
    '--mobile-cols': columns.mobile,
    '--tablet-cols': columns.tablet,
    '--desktop-cols': columns.desktop,
  } as React.CSSProperties;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const GridContainer = animate ? motion.div : 'div';
  const GridItem = animate ? motion.div : 'div';

  return (
    <GridContainer
      className={`responsive-grid ${className}`}
      style={gridStyle}
      variants={animate ? containerVariants : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
    >
      {React.Children.map(children, (child, index) => (
        <GridItem
          key={index}
          variants={animate ? itemVariants : undefined}
          className="grid-item"
        >
          {child}
        </GridItem>
      ))}
    </GridContainer>
  );
};

export default ResponsiveGrid;
