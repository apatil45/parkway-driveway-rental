import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import './ContextualHelp.css';

interface HelpTip {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click' | 'focus' | 'auto';
  delay?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ContextualHelpProps {
  tips: HelpTip[];
  enabled?: boolean;
  onTipShown?: (tipId: string) => void;
  onTipDismissed?: (tipId: string) => void;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  tips,
  enabled = true,
  onTipShown,
  onTipDismissed
}) => {
  const [activeTip, setActiveTip] = useState<HelpTip | null>(null);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    // Load dismissed tips from localStorage
    const savedDismissed = localStorage.getItem('dismissed-help-tips');
    if (savedDismissed) {
      try {
        setDismissedTips(new Set(JSON.parse(savedDismissed)));
      } catch {
        // Ignore parsing errors
      }
    }

    // Set up event listeners for different trigger types
    const handleMouseEnter = (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      const tip = findTipForElement(element);
      
      if (tip && tip.trigger === 'hover' && !dismissedTips.has(tip.id)) {
        setHoveredElement(element);
        showTip(tip, element);
      }
    };

    const handleMouseLeave = (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      const tip = findTipForElement(element);
      
      if (tip && tip.trigger === 'hover') {
        setHoveredElement(null);
        hideTip();
      }
    };

    const handleClick = (event: MouseEvent) => {
      const element = event.target as HTMLElement;
      const tip = findTipForElement(element);
      
      if (tip && tip.trigger === 'click' && !dismissedTips.has(tip.id)) {
        showTip(tip, element);
      }
    };

    const handleFocus = (event: FocusEvent) => {
      const element = event.target as HTMLElement;
      const tip = findTipForElement(element);
      
      if (tip && tip.trigger === 'focus' && !dismissedTips.has(tip.id)) {
        showTip(tip, element);
      }
    };

    const handleBlur = (event: FocusEvent) => {
      const element = event.target as HTMLElement;
      const tip = findTipForElement(element);
      
      if (tip && tip.trigger === 'focus') {
        hideTip();
      }
    };

    // Add event listeners
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('focusin', handleFocus, true);
    document.addEventListener('focusout', handleBlur, true);

    // Show auto-triggered tips
    showAutoTips();

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('focusin', handleFocus, true);
      document.removeEventListener('focusout', handleBlur, true);
    };
  }, [enabled, dismissedTips]);

  const findTipForElement = (element: HTMLElement): HelpTip | null => {
    // Check if element matches any tip target
    for (const tip of tips) {
      if (element.matches(tip.target)) {
        return tip;
      }
    }
    
    // Check parent elements
    let parent = element.parentElement;
    while (parent) {
      for (const tip of tips) {
        if (parent.matches(tip.target)) {
          return tip;
        }
      }
      parent = parent.parentElement;
    }
    
    return null;
  };

  const showTip = (tip: HelpTip, element: HTMLElement) => {
    if (dismissedTips.has(tip.id)) return;

    setActiveTip(tip);
    onTipShown?.(tip.id);

    // Auto-hide after delay if specified
    if (tip.delay && !tip.persistent) {
      setTimeout(() => {
        if (activeTip?.id === tip.id) {
          hideTip();
        }
      }, tip.delay);
    }
  };

  const hideTip = () => {
    setActiveTip(null);
  };

  const dismissTip = (tipId: string) => {
    const newDismissed = new Set(dismissedTips);
    newDismissed.add(tipId);
    setDismissedTips(newDismissed);
    
    // Save to localStorage
    localStorage.setItem('dismissed-help-tips', JSON.stringify(Array.from(newDismissed)));
    
    hideTip();
    onTipDismissed?.(tipId);
  };

  const showAutoTips = () => {
    const autoTips = tips.filter(tip => tip.trigger === 'auto' && !dismissedTips.has(tip.id));
    
    autoTips.forEach((tip, index) => {
      setTimeout(() => {
        const element = document.querySelector(tip.target) as HTMLElement;
        if (element) {
          showTip(tip, element);
        }
      }, index * 2000); // Stagger auto tips
    });
  };

  const getTooltipPosition = (tip: HelpTip, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 300;
    const tooltipHeight = 150;
    const padding = 20;

    let top = rect.top + window.scrollY;
    let left = rect.left + window.scrollX;

    switch (tip.position) {
      case 'top':
        top = rect.top + window.scrollY - tooltipHeight - padding;
        left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = rect.bottom + window.scrollY + padding;
        left = rect.left + window.scrollX + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left + window.scrollX - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + window.scrollY + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + window.scrollX + padding;
        break;
    }

    // Ensure tooltip stays within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipWidth > viewportWidth - padding) {
      left = viewportWidth - tooltipWidth - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipHeight > viewportHeight - padding) {
      top = viewportHeight - tooltipHeight - padding;
    }

    return { top, left };
  };

  if (!enabled || !activeTip) return null;

  const targetElement = document.querySelector(activeTip.target) as HTMLElement;
  if (!targetElement) return null;

  const position = getTooltipPosition(activeTip, targetElement);

  return (
    <>
      {/* Highlight overlay */}
      <div
        className="help-highlight"
        style={{
          top: targetElement.getBoundingClientRect().top + window.scrollY - 4,
          left: targetElement.getBoundingClientRect().left + window.scrollX - 4,
          width: targetElement.getBoundingClientRect().width + 8,
          height: targetElement.getBoundingClientRect().height + 8
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="help-tooltip"
        style={{
          top: position.top,
          left: position.left
        }}
      >
        <div className="help-tooltip-content">
          <div className="help-tooltip-header">
            <h4 className="help-tooltip-title">{activeTip.title}</h4>
            <button
              className="help-tooltip-close"
              onClick={() => dismissTip(activeTip.id)}
              aria-label="Dismiss help tip"
            >
              ×
            </button>
          </div>
          
          <p className="help-tooltip-text">{activeTip.content}</p>
          
          {activeTip.action && (
            <button
              className="help-tooltip-action"
              onClick={activeTip.action.onClick}
            >
              {activeTip.action.label}
            </button>
          )}
          
          <div className="help-tooltip-footer">
            <button
              className="help-tooltip-dismiss"
              onClick={() => dismissTip(activeTip.id)}
            >
              Don't show again
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Pre-defined help tip sets for common scenarios
export const getDriverHelpTips = (): HelpTip[] => [
  {
    id: 'search-intro',
    title: '🔍 Smart Search',
    content: 'Use our smart search to find driveways by location, price, or availability. Try searching for "near me" or specific areas.',
    target: '.search-section',
    position: 'bottom',
    trigger: 'auto',
    delay: 5000
  },
  {
    id: 'filters-help',
    title: '🎯 Smart Filters',
    content: 'Filter results by car size, price range, and availability to find the perfect parking spot for your needs.',
    target: '.filter-section',
    position: 'bottom',
    trigger: 'hover'
  },
  {
    id: 'booking-help',
    title: '📅 Easy Booking',
    content: 'Click "Book Now" to reserve your spot. We\'ll automatically capture your location and show you the best options.',
    target: '.booking-section',
    position: 'top',
    trigger: 'hover'
  },
  {
    id: 'map-help',
    title: '🗺️ Interactive Map',
    content: 'Use the map to see driveway locations visually. Click on markers to view details and book directly.',
    target: '.map-section',
    position: 'left',
    trigger: 'hover'
  }
];

export const getOwnerHelpTips = (): HelpTip[] => [
  {
    id: 'list-intro',
    title: '🏠 List Your Driveway',
    content: 'Add your driveway to start earning money. Set your availability, pricing, and car size restrictions.',
    target: '.list-section',
    position: 'bottom',
    trigger: 'auto',
    delay: 3000
  },
  {
    id: 'manage-help',
    title: '📊 Manage Listings',
    content: 'View and edit your driveway listings, check booking status, and update availability in real-time.',
    target: '.manage-section',
    position: 'bottom',
    trigger: 'hover'
  },
  {
    id: 'earnings-help',
    title: '💰 Track Earnings',
    content: 'Monitor your bookings, earnings, and performance analytics to optimize your driveway rental business.',
    target: '.earnings-section',
    position: 'top',
    trigger: 'hover'
  }
];

export default ContextualHelp;
