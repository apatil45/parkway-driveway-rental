import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet library to configure default icon

// Fix for default icon not showing up
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Driveway {
  _id: string;
  address: string;
  description: string;
  pricePerHour: number;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

interface MapDisplayProps {
  driveways: Driveway[];
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ driveways, center = [0, 0], zoom = 2 }) => {
  // If there are driveways, try to center the map on the first one, or calculate a centroid
  const effectiveCenter: [number, number] = driveways.length > 0
    ? [driveways[0].location.coordinates[1], driveways[0].location.coordinates[0]] // [latitude, longitude]
    : center;

  // Use a sensible default zoom if only one driveway, otherwise, adjust
  const effectiveZoom = driveways.length > 0 && zoom === 2 ? 13 : zoom;


  return (
    <MapContainer center={effectiveCenter} zoom={effectiveZoom} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {driveways.map((driveway) => (
        <Marker
          key={driveway._id}
          position={[driveway.location.coordinates[1], driveway.location.coordinates[0]]} // [latitude, longitude]
        >
          <Popup>
            <strong>{driveway.address}</strong><br />
            {driveway.description}<br />
            ${driveway.pricePerHour.toFixed(2)}/hour
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapDisplay;
