import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="map-legend">
      <div className="legend-item">
        <div className="legend-marker available">
          <div className="marker-dot" style={{ backgroundColor: '#00D4AA' }}></div>
        </div>
        <span>Available Now</span>
      </div>
      <div className="legend-item">
        <div className="legend-marker">
          <div className="marker-dot" style={{ backgroundColor: '#FFB800' }}></div>
        </div>
        <span>Opens Later</span>
      </div>
      <div className="legend-item">
        <div className="legend-marker">
          <div className="marker-dot" style={{ backgroundColor: '#E53E3E' }}></div>
        </div>
        <span>Closed</span>
      </div>
    </div>
  );
};

export default MapLegend;
