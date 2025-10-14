import React, { useState, useRef, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  quality = 80,
  format = 'webp'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'lazy' && imgRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin: '50px' // Start loading 50px before the image comes into view
        }
      );

      observer.observe(imgRef.current);

      return () => observer.disconnect();
    } else {
      setIsInView(true);
    }
  }, [loading]);

  // Generate optimized image URL (if using Cloudinary or similar service)
  const getOptimizedSrc = (originalSrc: string) => {
    // If it's already a Cloudinary URL, optimize it
    if (originalSrc.includes('cloudinary.com')) {
      const baseUrl = originalSrc.split('/upload/')[0];
      const publicId = originalSrc.split('/upload/')[1];
      
      const transformations = [
        `q_${quality}`,
        `f_${format}`,
        width ? `w_${width}` : '',
        height ? `h_${height}` : '',
        'c_fill'
      ].filter(Boolean).join(',');

      return `${baseUrl}/upload/${transformations}/${publicId}`;
    }

    // For local images, return as-is
    return originalSrc;
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageSrc = isInView ? getOptimizedSrc(src) : placeholder;
  const displaySrc = hasError ? fallbackSrc : imageSrc;

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main image */}
      <img
        src={displaySrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width, height }}
        onLoad={handleLoad}
        onError={handleError}
        loading={loading}
        decoding="async"
      />

      {/* Error state */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400"
          style={{ width, height }}
        >
          <div className="text-center">
            <svg 
              className="w-8 h-8 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-xs">Image unavailable</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;