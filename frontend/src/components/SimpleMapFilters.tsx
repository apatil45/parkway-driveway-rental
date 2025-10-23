import React, { useState } from 'react';

interface SimpleMapFiltersProps {
  onFilterChange: (filter: string, maxPrice: number) => void;
  totalSpots: number;
  availableSpots: number;
}

const SimpleMapFilters: React.FC<SimpleMapFiltersProps> = ({
  onFilterChange,
  totalSpots,
  availableSpots
}) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [maxPrice, setMaxPrice] = useState(10);

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter, maxPrice);
  };

  const handlePriceChange = (price: number) => {
    setMaxPrice(price);
    onFilterChange(activeFilter, price);
  };

  const filters = [
    { id: 'all', label: 'All', count: totalSpots },
    { id: 'available', label: 'Available', count: availableSpots },
    { id: 'cheap', label: 'Under $5/hr', count: 0 }, // This would need to be calculated
    { id: 'nearby', label: 'Walking Distance', count: 0 } // This would need to be calculated
  ];

  return (
    <div className="simple-map-filters">
      <div className="filter-buttons">
        {filters.map(filter => (
          <button
            key={filter.id}
            className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
            onClick={() => handleFilterChange(filter.id)}
            aria-label={`Filter by ${filter.label}`}
          >
            <span className="filter-label">{filter.label}</span>
            {filter.count > 0 && (
              <span className="filter-count">{filter.count}</span>
            )}
          </button>
        ))}
      </div>
      
      <div className="price-filter">
        <div className="price-label">
          <span>Max Price: </span>
          <span className="price-value">${maxPrice}/hr</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={maxPrice}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="price-slider"
          aria-label="Maximum price per hour"
        />
        <div className="price-range">
          <span>$1/hr</span>
          <span>$20/hr</span>
        </div>
      </div>

      <style jsx>{`
        .simple-map-filters {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          min-height: 36px;
        }

        .filter-btn:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .filter-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .filter-label {
          white-space: nowrap;
        }

        .filter-count {
          background: rgba(255, 255, 255, 0.2);
          color: inherit;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .filter-btn:not(.active) .filter-count {
          background: #f1f5f9;
          color: #64748b;
        }

        .price-filter {
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
        }

        .price-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        .price-value {
          color: #3b82f6;
          font-weight: 600;
        }

        .price-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e2e8f0;
          outline: none;
          -webkit-appearance: none;
          margin-bottom: 8px;
        }

        .price-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .price-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .price-range {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #64748b;
        }

        @media (max-width: 768px) {
          .simple-map-filters {
            padding: 12px;
            margin-bottom: 12px;
          }

          .filter-buttons {
            gap: 6px;
            margin-bottom: 12px;
          }

          .filter-btn {
            padding: 6px 10px;
            font-size: 13px;
            min-height: 32px;
          }

          .price-filter {
            padding-top: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SimpleMapFilters;
