'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';
import api from '@/lib/api';

interface Driveway {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  pricePerHour: number;
  capacity: number;
  carSize: string[];
  amenities: string[];
  images: string[];
  isActive: boolean;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  owner: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

interface BookingForm {
  startTime: string;
  endTime: string;
  specialRequests: string;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
}

export default function DrivewayDetailsPage() {
  const params = useParams();
  const [driveway, setDriveway] = useState<Driveway | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    startTime: '',
    endTime: '',
    specialRequests: '',
    vehicleInfo: {
      make: '',
      model: '',
      color: '',
      licensePlate: ''
    }
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const drivewayId = params?.id as string;

  useEffect(() => {
    if (!drivewayId) return;
    
    const fetchDriveway = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/driveways/${drivewayId}`);
        setDriveway(response.data.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Driveway not found');
        } else {
          setError('Failed to load driveway details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDriveway();
  }, [drivewayId]);

  // Calculate price when times change
  useEffect(() => {
    if (bookingForm.startTime && bookingForm.endTime && driveway) {
      const start = new Date(bookingForm.startTime);
      const end = new Date(bookingForm.endTime);
      
      if (start.getTime() < end.getTime() && start.getTime() > new Date().getTime()) {
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const price = Math.round(hours * driveway.pricePerHour * 100) / 100;
        setCalculatedHours(hours);
        setCalculatedPrice(price);
      } else {
        setCalculatedPrice(null);
        setCalculatedHours(null);
      }
    } else {
      setCalculatedPrice(null);
      setCalculatedHours(null);
    }
  }, [bookingForm.startTime, bookingForm.endTime, driveway]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication first
    if (!isAuthenticated) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    setBookingLoading(true);

    try {
      // Validate required fields
      if (!bookingForm.startTime || !bookingForm.endTime) {
        showToast('Please fill in both start and end times', 'error');
        setBookingLoading(false);
        return;
      }

      if (!drivewayId) {
        showToast('Invalid driveway ID', 'error');
        setBookingLoading(false);
        return;
      }

      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      // datetime-local doesn't include timezone, so we need to create a proper Date object
      const startDate = new Date(bookingForm.startTime);
      const endDate = new Date(bookingForm.endTime);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        showToast('Invalid date format', 'error');
        setBookingLoading(false);
        return;
      }

      const startTimeISO = startDate.toISOString();
      const endTimeISO = endDate.toISOString();

      // Prepare vehicle info - only include if all fields are filled
      const vehicleInfo = bookingForm.vehicleInfo.make && 
                          bookingForm.vehicleInfo.model && 
                          bookingForm.vehicleInfo.color && 
                          bookingForm.vehicleInfo.licensePlate
        ? {
            make: bookingForm.vehicleInfo.make.trim(),
            model: bookingForm.vehicleInfo.model.trim(),
            color: bookingForm.vehicleInfo.color.trim(),
            licensePlate: bookingForm.vehicleInfo.licensePlate.trim()
          }
        : undefined;

      // Prepare request body
      const requestBody: any = {
        drivewayId: drivewayId,
        startTime: startTimeISO,
        endTime: endTimeISO
      };

      // Only include optional fields if they have values
      if (bookingForm.specialRequests && bookingForm.specialRequests.trim()) {
        requestBody.specialRequests = bookingForm.specialRequests.trim();
      }

      if (vehicleInfo) {
        requestBody.vehicleInfo = vehicleInfo;
      }

      const response = await api.post('/bookings', requestBody);

      const booking = response.data?.data;
      
      // Ensure we have a valid booking response
      if (!booking || !booking.id) {
        console.error('Invalid booking response:', response.data);
        showToast('Booking created but received invalid response. Please check your bookings.', 'error');
        setBookingLoading(false);
        // Still redirect to bookings page to let user check
        router.push('/bookings');
        return;
      }
      
      // Redirect to checkout page with booking ID
      showToast('Booking created successfully! Redirecting to checkout...', 'success');
      setBookingLoading(false); // Reset loading before redirect
      router.push(`/checkout?bookingId=${booking.id}`);
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Handle 401 (authentication) errors explicitly
      if (err.response?.status === 401) {
        // Not authenticated - redirect to login with return path
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        setBookingLoading(false);
        return;
      }
      
      // Extract detailed error message
      let errorMessage = 'Failed to create booking';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = typeof errorData.error === 'string' 
            ? errorData.error 
            : JSON.stringify(errorData.error);
        } else if (errorData.errors) {
          // Handle validation errors array
          const validationErrors = Array.isArray(errorData.errors)
            ? errorData.errors.map((e: any) => e.message || e).join(', ')
            : JSON.stringify(errorData.errors);
          errorMessage = `Validation failed: ${validationErrors}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      >
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !driveway) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Driveway not found'}</p>
            <Link href="/search" className="btn btn-primary">
              Back to Search
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Images */}
            {driveway.images.length > 0 && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {driveway.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${driveway.title} - Image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{driveway.title}</h1>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-600">
                    {formatPrice(driveway.pricePerHour)}/hr
                  </div>
                  <div className="text-sm text-gray-600">per hour</div>
                </div>
              </div>

              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {renderStars(driveway.averageRating)}
                </div>
                <span className="ml-2 text-gray-600">
                  {driveway.averageRating.toFixed(1)} ({driveway.reviewCount} reviews)
                </span>
              </div>

              <p className="text-gray-600 mb-4">{driveway.address}</p>
              
              {driveway.description && (
                <p className="text-gray-700 mb-6">{driveway.description}</p>
              )}

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {driveway.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                    >
                      {amenity.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Capacity</h4>
                  <p className="text-gray-600">{driveway.capacity} car{driveway.capacity > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Car Sizes</h4>
                  <p className="text-gray-600">{driveway.carSize.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Reviews */}
            {driveway.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                <div className="space-y-4">
                  {driveway.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {review.user.name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700 ml-11">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Book This Driveway</h3>
              
              {!showBookingForm ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Ready to book this driveway? Click below to start your reservation.
                  </p>
                  <button
                    onClick={() => setShowBookingForm(true)}
                    className="btn btn-primary w-full min-h-[48px] text-base"
                  >
                    Book Now
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.startTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="input text-base min-h-[44px]"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={bookingForm.endTime}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="input text-base min-h-[44px]"
                      style={{ fontSize: '16px' }}
                      required
                    />
                  </div>

                  {/* Price Preview */}
                  {calculatedPrice !== null && calculatedHours !== null && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {calculatedHours.toFixed(1)} {calculatedHours === 1 ? 'hour' : 'hours'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="text-2xl font-bold text-primary-600">
                            ${calculatedPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        @ ${driveway.pricePerHour.toFixed(2)}/hour
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={bookingForm.specialRequests}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, specialRequests: e.target.value }))}
                      className="input text-base min-h-[88px] resize-y"
                      style={{ fontSize: '16px' }}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Information
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Make (e.g., Toyota)"
                        value={bookingForm.vehicleInfo.make}
                        onChange={(e) => setBookingForm(prev => ({
                          ...prev,
                          vehicleInfo: { ...prev.vehicleInfo, make: e.target.value }
                        }))}
                        className="input text-base min-h-[44px]"
                        style={{ fontSize: '16px' }}
                      />
                      <input
                        type="text"
                        placeholder="Model (e.g., Camry)"
                        value={bookingForm.vehicleInfo.model}
                        onChange={(e) => setBookingForm(prev => ({
                          ...prev,
                          vehicleInfo: { ...prev.vehicleInfo, model: e.target.value }
                        }))}
                        className="input text-base min-h-[44px]"
                        style={{ fontSize: '16px' }}
                      />
                      <input
                        type="text"
                        placeholder="Color"
                        value={bookingForm.vehicleInfo.color}
                        onChange={(e) => setBookingForm(prev => ({
                          ...prev,
                          vehicleInfo: { ...prev.vehicleInfo, color: e.target.value }
                        }))}
                        className="input text-base min-h-[44px]"
                        style={{ fontSize: '16px' }}
                      />
                      <input
                        type="text"
                        placeholder="License Plate"
                        value={bookingForm.vehicleInfo.licensePlate}
                        onChange={(e) => setBookingForm(prev => ({
                          ...prev,
                          vehicleInfo: { ...prev.vehicleInfo, licensePlate: e.target.value }
                        }))}
                        className="input text-base min-h-[44px]"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="btn btn-secondary flex-1 min-h-[48px] text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading || authLoading || !isAuthenticated}
                      className="btn btn-primary flex-1 min-h-[48px] text-base"
                    >
                      {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              )}

              {/* Owner Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Owner</h4>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {driveway.owner.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{driveway.owner.name}</p>
                    {driveway.owner.phone && (
                      <p className="text-sm text-gray-600">{driveway.owner.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
