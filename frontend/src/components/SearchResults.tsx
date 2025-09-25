import React, { useState, useEffect } from 'react';
import './SearchResults.css';

interface Driveway {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  image: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  distance: number;
  availability: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  };
  owner: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  carSizeCompatibility: string[];
  isAvailable: boolean;
}

interface SearchResultsProps {
  driveways: Driveway[];
  isLoading: boolean;
  onBook: (driveway: Driveway) => void;
  onViewDetails: (driveway: Driveway) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  driveways,
  isLoading,
  onBook,
  onViewDetails,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDriveway, setSelectedDriveway] = useState<Driveway | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <defs>
            <linearGradient id="half-star">
              <stop offset="50%" stopColor="currentColor"/>
              <stop offset="50%" stopColor="#e5e7eb"/>
            </linearGradient>
          </defs>
          <path fill="url(#half-star)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} width="16" height="16" viewBox="0 0 24 24" fill="#e5e7eb">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      );
    }

    return stars;
  };

  const renderAmenityIcon = (amenity: string) => {
    const iconMap: { [key: string]: string } = {
      'Covered Parking': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      'Security Cameras': 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      'EV Charging': 'M13 10V3L4 14h7v7l9-11h-7z',
      'Near Metro': 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      'Well Lit': 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
      '24/7 Access': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={iconMap[amenity] || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}/>
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className={`search-results loading ${className}`}>
        <div className="loading-skeleton">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
                <div className="skeleton-footer"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (driveways.length === 0) {
    return (
      <div className={`search-results empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h3>No parking spots found</h3>
          <p>Try adjusting your search criteria or expanding your search area.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`search-results ${className}`}>
      <div className="results-header">
        <div className="results-info">
          <h2>Available Parking Spots</h2>
          <p>{driveways.length} spots found</p>
        </div>
        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={`results-grid ${viewMode}`}>
        {driveways.map((driveway) => (
          <div key={driveway.id} className="driveway-card">
            <div className="card-image">
              <img src={driveway.image} alt={driveway.title} />
              <div className="card-badge">
                {formatPrice(driveway.price)}/hr
              </div>
              {!driveway.isAvailable && (
                <div className="unavailable-overlay">
                  <span>Unavailable</span>
                </div>
              )}
            </div>

            <div className="card-content">
              <div className="card-header">
                <h3 className="card-title">{driveway.title}</h3>
                <div className="card-rating">
                  <div className="stars">
                    {renderStars(driveway.rating)}
                  </div>
                  <span className="rating-text">
                    {driveway.rating} ({driveway.reviewCount} reviews)
                  </span>
                </div>
              </div>

              <p className="card-description">{driveway.description}</p>

              <div className="card-location">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{driveway.location}</span>
                <span className="distance">{formatDistance(driveway.distance)}</span>
              </div>

              <div className="card-amenities">
                {driveway.amenities.slice(0, 3).map((amenity) => (
                  <div key={amenity} className="amenity-tag">
                    {renderAmenityIcon(amenity)}
                    <span>{amenity}</span>
                  </div>
                ))}
                {driveway.amenities.length > 3 && (
                  <div className="amenity-more">
                    +{driveway.amenities.length - 3} more
                  </div>
                )}
              </div>

              <div className="card-owner">
                <img src={driveway.owner.avatar} alt={driveway.owner.name} className="owner-avatar" />
                <div className="owner-info">
                  <span className="owner-name">{driveway.owner.name}</span>
                  {driveway.owner.verified && (
                    <span className="verified-badge">Verified</span>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="action-btn secondary"
                  onClick={() => onViewDetails(driveway)}
                >
                  View Details
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => onBook(driveway)}
                  disabled={!driveway.isAvailable}
                >
                  {driveway.isAvailable ? 'Book Now' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
