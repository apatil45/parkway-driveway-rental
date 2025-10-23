import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface EnhancedMapControlsProps {
  userLocation: { lat: number; lng: number } | null;
  onThemeChange?: (theme: string) => void;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

const EnhancedMapControls: React.FC<EnhancedMapControlsProps> = ({
  userLocation,
  onThemeChange,
  onFullscreenToggle,
  isFullscreen = false
}) => {
  const map = useMap();
  const [currentTheme, setCurrentTheme] = useState('light');
  const [showControls, setShowControls] = useState(true);

  const themes = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'satellite', name: 'Satellite', icon: '🛰️' }
  ];

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme);
    onThemeChange?.(theme);
    
    // Change map tiles based on theme
    const tileLayers = {
      light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    };

    // Remove existing tile layer and add new one
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer(tileLayers[theme as keyof typeof tileLayers] || tileLayers.light, {
      attribution: theme === 'satellite' 
        ? '&copy; <a href="https://www.esri.com/">Esri</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  };

  const resetToUserLocation = () => {
    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 16, { animate: true });
    }
  };

  const zoomIn = () => {
    map.zoomIn();
  };

  const zoomOut = () => {
    map.zoomOut();
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <div className="enhanced-map-controls">
      {/* Toggle Controls Button */}
      <button
        onClick={toggleControls}
        className="control-toggle-btn"
        aria-label="Toggle map controls"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {/* Main Controls Panel */}
      {showControls && (
        <div className="controls-panel">
          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button
              onClick={zoomIn}
              className="control-btn zoom-in"
              aria-label="Zoom in"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button
              onClick={zoomOut}
              className="control-btn zoom-out"
              aria-label="Zoom out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Theme Controls */}
          <div className="theme-controls">
            <div className="theme-selector">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`theme-btn ${currentTheme === theme.id ? 'active' : ''}`}
                  aria-label={`Switch to ${theme.name} theme`}
                  title={theme.name}
                >
                  <span className="theme-icon">{theme.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location Controls */}
          <div className="location-controls">
            <button
              onClick={resetToUserLocation}
              className="control-btn location-btn"
              aria-label="Reset to my location"
              disabled={!userLocation}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="fullscreen-controls">
            <button
              onClick={onFullscreenToggle}
              className="control-btn fullscreen-btn"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isFullscreen ? (
                  <>
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                  </>
                ) : (
                  <>
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-map-controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-toggle-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-toggle-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }

        .controls-panel {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .zoom-controls {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .control-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          min-height: 36px;
        }

        .control-btn:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #3b82f6;
          color: #3b82f6;
          transform: translateY(-1px);
        }

        .control-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .theme-controls {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }

        .theme-selector {
          display: flex;
          gap: 4px;
        }

        .theme-btn {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 32px;
          min-height: 32px;
        }

        .theme-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .theme-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .theme-icon {
          font-size: 14px;
        }

        .location-controls {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }

        .fullscreen-controls {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
        }

        @media (max-width: 768px) {
          .enhanced-map-controls {
            top: 5px;
            right: 5px;
          }
          
          .controls-panel {
            min-width: 160px;
            padding: 6px;
          }
          
          .control-btn {
            min-width: 32px;
            min-height: 32px;
            padding: 6px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedMapControls;
