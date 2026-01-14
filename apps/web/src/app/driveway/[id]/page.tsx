'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';
import api from '@/lib/api';
import { PricingService } from '@/services/PricingService';
import { createAppError } from '@/lib/errors';

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
  const [pricingBreakdown, setPricingBreakdown] = useState<any>(null);
  const [durationError, setDurationError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const isMountedRef = useRef(true);

  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const drivewayId = params?.id as string;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clean up sessionStorage if component unmounts without booking
      try {
        const savedData = sessionStorage.getItem('bookingFormData');
        if (savedData) {
          const formData = JSON.parse(savedData);
          // Only clear if it's for this driveway and user navigated away
          if (formData.drivewayId === drivewayId) {
            sessionStorage.removeItem('bookingFormData');
          }
        }
      } catch (err) {
        // Ignore cleanup errors
      }
    };
  }, [drivewayId]);

  useEffect(() => {
    if (!drivewayId) return;
    
    const fetchDriveway = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/driveways/${drivewayId}`);
        if (isMountedRef.current) {
          setDriveway(response.data.data);
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        if (err.response?.status === 404) {
          setError('This parking space is no longer available.');
        } else {
          setError('Unable to load parking space details. Please try again.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchDriveway();
  }, [drivewayId]);

  // Restore form data after login return
  useEffect(() => {
    if (isAuthenticated && drivewayId && showBookingForm) {
      try {
        const savedFormData = sessionStorage.getItem('bookingFormData');
        if (savedFormData) {
          const formData = JSON.parse(savedFormData);
          // Only restore if it's for the same driveway
          if (formData.drivewayId === drivewayId) {
            setBookingForm({
              startTime: formData.startTime || '',
              endTime: formData.endTime || '',
              specialRequests: formData.specialRequests || '',
              vehicleInfo: formData.vehicleInfo || {
                make: '',
                model: '',
                color: '',
                licensePlate: ''
              }
            });
            if (formData.calculatedPrice !== undefined) {
              setCalculatedPrice(formData.calculatedPrice);
            }
            if (formData.calculatedHours !== undefined) {
              setCalculatedHours(formData.calculatedHours);
            }
            // Clear saved data after restoring
            sessionStorage.removeItem('bookingFormData');
            showToast('Welcome back! Your booking details have been restored.', 'success');
          } else {
            // Clear data for different driveway
            sessionStorage.removeItem('bookingFormData');
          }
        }
      } catch (err) {
        console.error('Failed to restore form data:', err);
        sessionStorage.removeItem('bookingFormData');
      }
    }
  }, [isAuthenticated, drivewayId, showBookingForm]);

  // Calculate price when times change with dynamic pricing
  useEffect(() => {
    if (bookingForm.startTime && bookingForm.endTime && driveway) {
      const start = new Date(bookingForm.startTime);
      const end = new Date(bookingForm.endTime);
      
      // Validate duration first
      const durationValidation = PricingService.validateDuration(start, end);
      
      if (!durationValidation.valid) {
        setDurationError(durationValidation.error || null);
        setCalculatedPrice(null);
        setCalculatedHours(null);
        setPricingBreakdown(null);
        return;
      }
      
      setDurationError(null);
      
      if (start.getTime() < end.getTime() && start.getTime() > new Date().getTime()) {
        // Calculate dynamic pricing
        // For frontend, we'll use a simplified version (without demand multiplier)
        // The backend will calculate the actual demand-based pricing
        const breakdown = PricingService.calculatePrice({
          basePricePerHour: driveway.pricePerHour,
          startTime: start,
          endTime: end,
          demandMultiplier: 1.0, // Frontend doesn't know demand, backend will adjust
        });
        
        setCalculatedHours(breakdown.hours);
        setCalculatedPrice(breakdown.finalPrice);
        setPricingBreakdown(breakdown);
      } else {
        setCalculatedPrice(null);
        setCalculatedHours(null);
        setPricingBreakdown(null);
        setDurationError(null);
      }
    } else {
      setCalculatedPrice(null);
      setCalculatedHours(null);
      setPricingBreakdown(null);
      setDurationError(null);
    }
  }, [bookingForm.startTime, bookingForm.endTime, driveway]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      showToast('Please wait, your booking is being processed...', 'info');
      return;
    }
    
    // Check authentication with friendly message and form data persistence
    if (!isAuthenticated) {
      // Save form data to sessionStorage before redirect
      try {
        sessionStorage.setItem('bookingFormData', JSON.stringify({
          ...bookingForm,
          drivewayId,
          calculatedPrice,
          calculatedHours
        }));
      } catch (err) {
        console.error('Failed to save form data:', err);
      }
      
      showToast('Please log in to complete your booking', 'info');
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }
    
    isSubmittingRef.current = true;
    setBookingLoading(true);

    try {
      // Validate required fields
      if (!bookingForm.startTime || !bookingForm.endTime) {
        showToast('Please fill in both start and end times', 'error');
        setBookingLoading(false);
        return;
      }

      if (!drivewayId) {
        showToast('Invalid parking space. Please try selecting a different one.', 'error');
        setBookingLoading(false);
        return;
      }

      // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
      // datetime-local doesn't include timezone, so we need to create a proper Date object
      const startDate = new Date(bookingForm.startTime);
      const endDate = new Date(bookingForm.endTime);
      
      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        showToast('Please select valid dates for your booking.', 'error');
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
      
      // Clear sessionStorage on successful booking
      try {
        sessionStorage.removeItem('bookingFormData');
      } catch (err) {
        // Ignore cleanup errors
      }
      
      // Reset ref before redirect
      isSubmittingRef.current = false;
      
      // Redirect to checkout page with booking ID
      showToast('Booking created successfully! Redirecting to checkout...', 'success');
      setBookingLoading(false); // Reset loading before redirect
      router.push(`/checkout?bookingId=${booking.id}`);
    } catch (err: any) {
      console.error('Booking error:', err);
      
      // Handle network errors (no response)
      if (!err.response) {
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          showToast('Request timed out. Please check your connection and try again.', 'error');
          isSubmittingRef.current = false;
          setBookingLoading(false);
          return;
        } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
          showToast('Network error. Please check your internet connection and try again.', 'error');
          isSubmittingRef.current = false;
          setBookingLoading(false);
          return;
        }
      }
      
      // Handle 401 (authentication) errors explicitly
      if (err.response?.status === 401) {
        // Save form data before redirect
        try {
          sessionStorage.setItem('bookingFormData', JSON.stringify({
            ...bookingForm,
            drivewayId,
            calculatedPrice,
            calculatedHours
          }));
        } catch (storageErr) {
          console.error('Failed to save form data:', storageErr);
        }
        
        showToast('Your session expired. Please log in again.', 'warning');
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        isSubmittingRef.current = false;
        setBookingLoading(false);
        return;
      }
      
      // Handle specific error types
      if (err.response?.status === 409) {
        // Capacity exceeded
        showToast('This time slot is no longer available. Please select a different time.', 'error');
        isSubmittingRef.current = false;
        setBookingLoading(false);
        return;
      } else if (err.response?.status >= 500) {
        showToast('Server error. Please try again in a moment.', 'error');
        isSubmittingRef.current = false;
        setBookingLoading(false);
        return;
      }
      
      // Extract user-friendly error message
      // Use the error handler to get proper user-friendly message
      const appError = createAppError(err);
      
      // Always use userMessage from AppError (it's guaranteed to be user-friendly)
      showToast(appError.userMessage, 'error');
    } finally {
      isSubmittingRef.current = false;
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
                  {/* Login reminder for unauthenticated users */}
                  {!isAuthenticated && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">Log in to complete your booking</p>
                          <p className="text-sm text-blue-700 mt-1">You can fill out the form now and log in when you're ready to confirm.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
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

                  {/* Duration Error */}
                  {durationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">{durationError}</p>
                      <p className="text-xs text-red-600 mt-1">
                        Minimum booking duration is 10 minutes. Please select a longer time period.
                      </p>
                    </div>
                  )}

                  {/* Price Preview with Dynamic Pricing Breakdown */}
                  {calculatedPrice !== null && calculatedHours !== null && pricingBreakdown && !durationError && (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">Duration</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {calculatedHours < 1 
                              ? `${Math.round(calculatedHours * 60)} minutes (minimum 10 minutes)`
                              : `${calculatedHours.toFixed(2)} ${calculatedHours === 1 ? 'hour' : 'hours'}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Price</p>
                          <p className="text-2xl font-bold text-primary-600">
                            ${calculatedPrice.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Pricing Breakdown */}
                      <div className="pt-3 border-t border-primary-200 space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base rate:</span>
                          <span className="text-gray-900">${pricingBreakdown.basePrice.toFixed(2)}/hr</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base total:</span>
                          <span className="text-gray-900">${pricingBreakdown.baseTotal.toFixed(2)}</span>
                        </div>
                        {pricingBreakdown.timeMultiplier !== 1.0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {pricingBreakdown.timeMultiplier > 1 ? 'Peak hours' : 'Off-peak'}:
                            </span>
                            <span className={pricingBreakdown.timeMultiplier > 1 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                              {pricingBreakdown.timeMultiplier > 1 ? '+' : ''}{((pricingBreakdown.timeMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        {pricingBreakdown.dayMultiplier !== 1.0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Weekend:</span>
                            <span className="text-orange-600 font-medium">+{((pricingBreakdown.dayMultiplier - 1) * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        {!pricingBreakdown.meetsMinimum && (
                          <div className="flex justify-between text-sm text-amber-600 font-medium">
                            <span>Minimum price applied:</span>
                            <span>${PricingService.MIN_PRICE_DOLLARS.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      
                      {calculatedPrice < PricingService.MIN_PRICE_DOLLARS && (
                        <div className="pt-2 border-t border-primary-200">
                          <p className="text-xs text-amber-600">
                            ⚠️ Minimum payment is ${PricingService.MIN_PRICE_DOLLARS.toFixed(2)}. Price adjusted to meet minimum.
                          </p>
                        </div>
                      )}
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
                      disabled={bookingLoading || authLoading}
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
