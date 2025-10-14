import React from 'react';
import { Driveway } from '../types/map';

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
      case 'small': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'large': return 'badge-success';
      case 'extra-large': return 'badge-primary';
      default: return 'badge-gray';
    }
  };

  // Helper function to get car size compatibility
  const getCarSizeText = (sizes: string[]) => {
    if (!sizes || sizes.length === 0) return 'All sizes';
    return sizes.map(size => size.charAt(0).toUpperCase() + size.slice(1)).join(', ');
  };

  // Helper function to format price safely
  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return 'N/A';
    return `$${numPrice.toFixed(2)}/hr`;
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

  // Handler for Quick Book buttons
  const handleQuickBook = (driveway: Driveway, durationMinutes: number) => {
    console.log('Quick book clicked for:', driveway, 'Duration:', durationMinutes);
    
    // Create a pre-filled booking object
    const now = new Date();
    const endTime = new Date(now.getTime() + (durationMinutes * 60 * 1000));
    
    const quickBookingData = {
      driveway,
      duration: durationMinutes,
      startTime: now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: endTime.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: now.toISOString().split('T')[0],
      totalAmount: (Number(driveway.pricePerHour) * (durationMinutes / 60)).toFixed(2)
    };
    
    console.log('Quick booking data:', quickBookingData);
    
    // Trigger the booking modal with pre-filled data
    onDrivewaySelect(driveway);
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

  // Helper function to get availability status
  const getAvailabilityStatus = (driveway: Driveway) => {
    if (!driveway.isAvailable) {
      return { status: 'closed', text: 'Unavailable', color: '#E53E3E' };
    }

    // Check day-specific availability
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[now.getDay()];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // Find today's availability
    const todayAvailability = driveway.availability?.find(day => 
      day.dayOfWeek.toLowerCase() === currentDayName
    );
    
    if (!todayAvailability || !todayAvailability.isAvailable) {
      return { status: 'closed', text: 'Closed Today', color: '#E53E3E' };
    }
    
    // Check if current time is within available hours
    if (currentTime >= todayAvailability.startTime && currentTime <= todayAvailability.endTime) {
      return { status: 'available', text: 'Available Now', color: '#00D4AA' };
    } else if (currentTime < todayAvailability.startTime) {
      return { status: 'opens-later', text: `Opens at ${todayAvailability.startTime}`, color: '#FFB800' };
    } else {
      return { status: 'closed', text: 'Closed for Today', color: '#E53E3E' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Available Driveways</h3>
        <p className="text-xs sm:text-sm text-gray-600">{driveways.length} driveways found</p>
      </div>

      {/* Driveway List */}
      <div className="max-h-96 overflow-y-auto">
        {driveways.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-500 font-medium">No driveways found</p>
            <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          driveways.map((driveway) => {
            const distance = searchLocation && driveway.coordinates 
              ? calculateDistance(searchLocation.lat, searchLocation.lng, driveway.coordinates.lat, driveway.coordinates.lng)
              : driveway.distance ? `${Math.round(driveway.distance)}m` : 'Distance unknown';
            const availability = getAvailabilityStatus(driveway);

            return (
              <div
                key={driveway.id}
                className={`p-4 sm:p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${
                  selectedDriveway?.id === driveway.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => {
                  console.log('Driveway card clicked:', driveway);
                  onDrivewaySelect(driveway);
                }}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Image Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
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
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                          {driveway.address.split(',')[0] || 'Driveway'}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">{driveway.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-bold text-green-600 mb-1">
                          {formatPrice(driveway.pricePerHour)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">{distance}</div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="flex items-center gap-1 sm:gap-2 mb-3 flex-wrap">
                      <span className={`badge ${getSizeColor(driveway.drivewaySize)}`}>
                        {driveway.drivewaySize.charAt(0).toUpperCase() + driveway.drivewaySize.slice(1)}
                      </span>
                      <span className="badge badge-primary">
                        {getCarSizeText(driveway.features || [])}
                      </span>
                      {(driveway.amenities || []).slice(0, 2).map((amenity, index) => (
                        <span
                          key={index}
                          className="badge badge-gray"
                        >
                          {amenity}
                        </span>
                      ))}
                      {(driveway.amenities || []).length > 2 && (
                        <span className="badge badge-gray">
                          +{(driveway.amenities || []).length - 2} more
                        </span>
                      )}
                    </div>

                    {/* Availability and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: availability.color }}></div>
                        <span className="text-sm text-gray-600" style={{ color: availability.color }}>
                          {availability.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {/* Quick Booking Buttons */}
                        <button 
                          className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full hover:bg-green-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickBook(driveway, 60); // 1 hour
                          }}
                        >
                          1hr - ${(Number(driveway.pricePerHour) * 1).toFixed(0)}
                        </button>
                        <button 
                          className="px-2 sm:px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickBook(driveway, 120); // 2 hours
                          }}
                        >
                          2hr - ${(Number(driveway.pricePerHour) * 2).toFixed(0)}
                        </button>
                        <button 
                          className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(driveway);
                          }}
                        >
                          More
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Parking Icon */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
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
      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
        {selectedDriveway ? (
          <button 
            className="w-full btn btn-primary"
            onClick={() => {
              console.log('Book Driveway button clicked for:', selectedDriveway);
              onDrivewaySelect(selectedDriveway);
            }}
          >
            Book {selectedDriveway.address.split(',')[0] || 'Selected Driveway'}
          </button>
        ) : (
          <button 
            className="w-full btn btn-primary opacity-50 cursor-not-allowed"
            disabled
          >
            Select a driveway to book
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDrivewayList;
