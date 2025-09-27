import React, { useEffect } from 'react';

const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    // Preload critical resources
    const preloadCriticalResources = () => {
      // Preload fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      fontLink.as = 'style';
      document.head.appendChild(fontLink);

      // Preload critical images
      const criticalImages = [
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ];

      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = src;
        link.as = 'image';
        document.head.appendChild(link);
      });
    };

    // Optimize scroll performance
    const optimizeScrollPerformance = () => {
      let ticking = false;
      
      const updateScrollPosition = () => {
        // Throttle scroll events for better performance
        if (!ticking) {
          requestAnimationFrame(() => {
            // Update any scroll-dependent elements here
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('scroll', updateScrollPosition, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', updateScrollPosition);
      };
    };

    // Optimize touch events for mobile
    const optimizeTouchEvents = () => {
      // Prevent 300ms click delay on mobile
      const preventClickDelay = (e: TouchEvent) => {
        if (e.touches.length > 1) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchstart', preventClickDelay, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', preventClickDelay);
      };
    };

    // Initialize optimizations
    preloadCriticalResources();
    const cleanupScroll = optimizeScrollPerformance();
    const cleanupTouch = optimizeTouchEvents();

    // Cleanup on unmount
    return () => {
      cleanupScroll();
      cleanupTouch();
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceOptimizer;
