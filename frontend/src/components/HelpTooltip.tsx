import React, { useState, useRef, useEffect } from 'react';
import './HelpTooltip.css';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  children: React.ReactNode;
  className?: string;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  position = 'top',
  maxWidth = 300,
  children,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top + scrollTop - tooltipRect.height - 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + scrollTop + 8;
        left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scrollLeft - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scrollLeft + 8;
        break;
    }

    // Keep tooltip within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 8) left = 8;
    if (left + tooltipRect.width > viewportWidth - 8) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + tooltipRect.height > viewportHeight - 8) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    setTooltipPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  return (
    <div
      ref={triggerRef}
      className={`help-tooltip-trigger ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`help-tooltip help-tooltip-${position}`}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            maxWidth: `${maxWidth}px`
          }}
          role="tooltip"
        >
          <div className="help-tooltip-content">
            {content}
          </div>
          <div className={`help-tooltip-arrow help-tooltip-arrow-${position}`}></div>
        </div>
      )}
    </div>
  );
};

export default HelpTooltip;
