import React from 'react';
import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  type?: 'text' | 'card' | 'list' | 'avatar' | 'button' | 'image';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'text',
  width,
  height,
  className = '',
  count = 1
}) => {
  const renderSkeleton = () => {
    const baseClasses = `skeleton skeleton-${type} ${className}`;
    const style: React.CSSProperties = {};
    
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    switch (type) {
      case 'text':
        return <div className={baseClasses} style={style}></div>;
      
      case 'card':
        return (
          <div className={`${baseClasses} skeleton-card`} style={style}>
            <div className="skeleton skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton skeleton-text skeleton-title"></div>
              <div className="skeleton skeleton-text skeleton-subtitle"></div>
              <div className="skeleton skeleton-text skeleton-description"></div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className={`${baseClasses} skeleton-list`} style={style}>
            {Array.from({ length: count }).map((_, index) => (
              <div key={index} className="skeleton-list-item">
                <div className="skeleton skeleton-avatar"></div>
                <div className="skeleton-content">
                  <div className="skeleton skeleton-text skeleton-title"></div>
                  <div className="skeleton skeleton-text skeleton-subtitle"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'avatar':
        return <div className={`${baseClasses} skeleton-avatar`} style={style}></div>;
      
      case 'button':
        return <div className={`${baseClasses} skeleton-button`} style={style}></div>;
      
      case 'image':
        return <div className={`${baseClasses} skeleton-image`} style={style}></div>;
      
      default:
        return <div className={baseClasses} style={style}></div>;
    }
  };

  if (count > 1 && type !== 'list') {
    return (
      <div className="skeleton-container">
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>
            {renderSkeleton()}
          </React.Fragment>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default SkeletonLoader;
