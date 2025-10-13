import React from 'react';

interface Driveway {
  id: string;
  owner: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images: string[];
  availability: any[];
  isAvailable: boolean;
  carSizeCompatibility: string[];
  drivewaySize: 'small' | 'medium' | 'large' | 'extra-large';
  amenities: string[];
  pricePerHour: number;
  specificSlots: any[];
  created_at: string;
  updated_at: string;
  // Additional computed fields
  distance?: string;
  rating?: number;
}

interface ProfessionalDrivewayListProps {
  driveways: Driveway[];
  onDrivewaySelect: (driveway: Driveway) => void;
  searchLocation?: { lat: number; lng: number };
  selectedDriveway?: Driveway | null;
}

const ProfessionalDrivewayList: React.FC<ProfessionalDrivewayListProps> = ({
  driveways,
  onDrivewaySelect,
  searchLocation,
  selectedDriveway
}) => {
  // Helper function to get driveway size color
  const getSizeColor = (size: string) => {
    switch (size) {
      case 'small': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'large': return 'bg-green-100 text-green-700';
      case 'extra-large': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Helper function to get car size compatibility
  const getCarSizeText = (sizes: string[]) => {
    return sizes.map(size => size.charAt(0).toUpperCase() + size.slice(1)).join(', ');
  };

  // Handler for View Details button
  const handleViewDetails = (driveway: Driveway) => {
    // For now, we'll just select the driveway which will show more details
    // In the future, this could open a detailed modal or navigate to a details page
    onDrivewaySelect(driveway);
  };

  // Handler for Book Driveway button
  const handleBookDriveway = () => {
    if (selectedDriveway) {
      onDrivewaySelect(selectedDriveway);
    }
  };

  // Helper function to calculate distance (simplified)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 'Distance unknown';
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Available Driveways</h3>
        <p className="text-sm text-gray-600">{driveways.length} driveways found</p>
      </div>

      {/* Driveway List */}
      <div className="max-h-96 overflow-y-auto">
        {driveways.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500 font-medium">No driveways found</p>
            <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          driveways.map((driveway) => {
            const distance = searchLocation && driveway.latitude && driveway.longitude 
              ? calculateDistance(searchLocation.lat, searchLocation.lng, driveway.latitude, driveway.longitude)
              : 'Distance unknown';

            return (
              <div
                key={driveway.id}
                className="p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {driveway.images && driveway.images.length > 0 ? (
                      <img
                        src={driveway.images[0]}
                        alt="Driveway"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-1">
                          {driveway.address.split(',')[0] || 'Driveway'}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{driveway.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600 mb-1">
                          ${driveway.pricePerHour}/hr
                        </div>
                        <div className="text-sm text-gray-500">{distance}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSizeColor(driveway.drivewaySize)}`}>
                        {driveway.drivewaySize.charAt(0).toUpperCase() + driveway.drivewaySize.slice(1)}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {getCarSizeText(driveway.carSizeCompatibility)}
                      </span>
                      {driveway.amenities.slice(0, 2).map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {amenity}
                        </span>
                      ))}
                      {driveway.amenities.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                          +{driveway.amenities.length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Availability and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${driveway.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {driveway.isAvailable ? 'Available now' : 'Currently occupied'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(driveway);
                          }}
                        >
                          View Details
                        </button>
                        <button 
                          className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Book Now clicked for driveway:', driveway);
                            onDrivewaySelect(driveway);
                          }}
                          disabled={!driveway.isAvailable}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parking Icon */}
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <button 
          className="w-full btn btn-primary"
          onClick={handleBookDriveway}
          disabled={!selectedDriveway}
        >
          Book Driveway
        </button>
      </div>
    </div>
  );
};

export default ProfessionalDrivewayList;
