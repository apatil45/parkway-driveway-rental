'use client';

import { useState } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageWithPlaceholderProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  fallbackText?: string;
}

/**
 * Image Component with Placeholder
 * 
 * Shows a placeholder when image fails to load or is loading
 * Improves UX by preventing broken image displays
 */
export default function ImageWithPlaceholder({
  src,
  alt,
  className = '',
  placeholderClassName = '',
  fallbackText,
}: ImageWithPlaceholderProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (imageError || !src) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className} ${placeholderClassName}`}
        role="img"
        aria-label={alt || 'Image placeholder'}
      >
        {fallbackText ? (
          <span className="text-sm font-medium text-gray-500">{fallbackText}</span>
        ) : (
          <PhotoIcon className="w-8 h-8 text-gray-400" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${placeholderClassName}`}
          aria-hidden="true"
        >
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true);
          setImageLoading(false);
        }}
        loading="lazy"
      />
    </div>
  );
}
