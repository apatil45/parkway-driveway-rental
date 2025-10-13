import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular' | 'card' | 'list' | 'grid';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className = '',
  count = 1
}) => {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1rem'
  };

  const skeletonClasses = [
    'skeleton',
    `skeleton-${variant}`,
    `skeleton-${animation}`,
    className
  ].filter(Boolean).join(' ');

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }, (_, index) => (
          <Skeleton
            key={index}
            variant={variant}
            width={width}
            height={height}
            animation={animation}
            className={className}
          />
        ))}
      </>
    );
  }

  return <div className={skeletonClasses} style={style} />;
};

// Pre-built skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton variant="rectangular" height="200px" className="skeleton-image" />
    <div className="skeleton-content">
      <Skeleton variant="text" height="24px" width="80%" className="skeleton-title" />
      <Skeleton variant="text" height="16px" width="60%" className="skeleton-subtitle" />
      <div className="skeleton-details">
        <Skeleton variant="text" height="14px" width="40%" />
        <Skeleton variant="text" height="14px" width="30%" />
      </div>
      <Skeleton variant="rectangular" height="36px" className="skeleton-button" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 5, 
  className = '' 
}) => (
  <div className={`skeleton-list ${className}`}>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="skeleton-list-item">
        <Skeleton variant="circular" width="48px" height="48px" className="skeleton-avatar" />
        <div className="skeleton-list-content">
          <Skeleton variant="text" height="18px" width="70%" className="skeleton-name" />
          <Skeleton variant="text" height="14px" width="50%" className="skeleton-description" />
        </div>
        <Skeleton variant="rectangular" height="32px" width="80px" className="skeleton-action" />
      </div>
    ))}
  </div>
);

export const SkeletonGrid: React.FC<{ 
  columns?: number; 
  count?: number; 
  className?: string 
}> = ({ 
  columns = 3, 
  count = 6, 
  className = '' 
}) => (
  <div 
    className={`skeleton-grid ${className}`}
    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
  >
    {Array.from({ length: count }, (_, index) => (
      <SkeletonCard key={index} />
    ))}
  </div>
);

export const SkeletonForm: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-form ${className}`}>
    <Skeleton variant="text" height="28px" width="40%" className="skeleton-form-title" />
    <div className="skeleton-form-fields">
      <Skeleton variant="rectangular" height="48px" className="skeleton-input" />
      <Skeleton variant="rectangular" height="48px" className="skeleton-input" />
      <Skeleton variant="rectangular" height="48px" className="skeleton-input" />
      <Skeleton variant="rectangular" height="120px" className="skeleton-textarea" />
    </div>
    <div className="skeleton-form-actions">
      <Skeleton variant="rectangular" height="44px" width="120px" className="skeleton-button" />
      <Skeleton variant="rectangular" height="44px" width="100px" className="skeleton-button" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ 
  rows?: number; 
  columns?: number; 
  className?: string 
}> = ({ 
  rows = 5, 
  columns = 4, 
  className = '' 
}) => (
  <div className={`skeleton-table ${className}`}>
    <div className="skeleton-table-header">
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton key={index} variant="text" height="20px" width="80%" />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="skeleton-table-row">
        {Array.from({ length: columns }, (_, colIndex) => (
          <Skeleton key={colIndex} variant="text" height="16px" width="70%" />
        ))}
      </div>
    ))}
  </div>
);

// Driveway-specific skeleton components
export const SkeletonDrivewayCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-driveway-card ${className}`}>
    <Skeleton variant="rectangular" height="180px" className="skeleton-driveway-image" />
    <div className="skeleton-driveway-content">
      <Skeleton variant="text" height="20px" width="85%" className="skeleton-address" />
      <Skeleton variant="text" height="16px" width="60%" className="skeleton-description" />
      <div className="skeleton-driveway-details">
        <Skeleton variant="text" height="14px" width="45%" />
        <Skeleton variant="text" height="14px" width="35%" />
      </div>
      <div className="skeleton-driveway-footer">
        <Skeleton variant="text" height="18px" width="30%" className="skeleton-price" />
        <Skeleton variant="rectangular" height="36px" width="100px" className="skeleton-book-button" />
      </div>
    </div>
  </div>
);

export const SkeletonSearchResults: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6, 
  className = '' 
}) => (
  <div className={`skeleton-search-results ${className}`}>
    <div className="skeleton-search-header">
      <Skeleton variant="text" height="24px" width="200px" />
      <Skeleton variant="text" height="16px" width="150px" />
    </div>
    <div className="skeleton-search-grid">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonDrivewayCard key={index} />
      ))}
    </div>
  </div>
);

export default Skeleton;
