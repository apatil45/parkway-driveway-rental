import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import EnhancedMapDisplay from './EnhancedMapDisplay';
import AdvancedSearch from './AdvancedSearch';
import SearchResults from './SearchResults';
import DashboardNav from './DashboardNav';
import { SkeletonSearchResults } from './EnhancedSkeletonLoader';
import BookingDurationModal from './BookingDurationModal'; // Import new booking modal
import { notificationService } from '../services/notificationService';
import { useSocket } from '../hooks/useSocket';
import { useKeyboardShortcuts, commonShortcuts } from '../hooks/useKeyboardShortcuts';
import BreadcrumbNav from './BreadcrumbNav';
import cachedApi from '../services/cachedApi';
import { offlineService } from '../services/offlineService';
import Button from './Button';
import './DriverDashboard.css';

const stripePromise = loadStripe((import.meta as any).env?.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51SAemo2MWNtZFiP8XnJ30lVvWp7e3D0bXnZ8jE8V2xL5n3d1oY9tS7pA5jY4t4oY0w0c0j0d0j0f0');

interface Driveway {
  id: string; // Changed from _id to id to match PostgreSQL model
  owner: string;
  address: string;
  description: string;
  availability: { date: string; startTime: string; endTime: string; pricePerHour: number }[];
  isAvailable: boolean;
  location: {
    type: string;
    coordinates: [number, number];
  };
  carSizeCompatibility?: string[];
  drivewaySize?: string;
}

interface Booking {
  id: string; // Changed from _id to id to match PostgreSQL model
  driver: string;
  driveway: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  paymentIntentId?: string;
  clientSecret?: string;
}

const DriverDashboard: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  // Notification functions using the new professional notification service
  const showSuccess = useCallback((message: string, title?: string) => {
    notificationService.showNotification({
      type: 'success',
      title: title || 'Success',
      message,
      context: 'booking'
    });
  }, []);

  const showError = useCallback((message: string, title?: string) => {
    notificationService.showNotification({
      type: 'error',
      title: title || 'Error',
      message,
      context: 'booking',
      priority: 'high'
    });
  }, []);

  const showWarning = useCallback((message: string, title?: string) => {
    notificationService.showNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      context: 'booking'
    });
  }, []);

  const showInfo = useCallback((message: string, title?: string) => {
    notificationService.showNotification({
      type: 'info',
      title: title || 'Information',
      message,
      context: 'booking'
    });
  }, []);
  const { isConnected: socketConnected, notifications, joinBookingRoom, leaveBookingRoom } = useSocket();

  // Add keyboard shortcuts
  useKeyboardShortcuts([
    ...commonShortcuts,
    {
      key: 'b',
      ctrlKey: true,
      action: () => {
        if (searchResults.length > 0) {
          setCurrentSection('results');
        }
      },
      description: 'Go to search results (Ctrl+B)'
    },
    {
      key: 'm',
      ctrlKey: true,
      action: () => {
        setCurrentSection('map');
      },
      description: 'Go to map view (Ctrl+M)'
    }
  ]);
  const [searchResults, setSearchResults] = useState<Driveway[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [searchParams, setSearchParams] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5), // 2 hours from now
    radius: 5,
    carSize: 'medium', // Default car size
  });
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDriveways, setIsLoadingDriveways] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | undefined>(undefined);
  
  // Clear existing toasts to prevent duplicates
  const clearExistingToasts = useCallback(() => {
    // Clear any existing notifications
    notificationService.clearAllNotifications();
  }, []);

  // Get driver's current location
  const getDriverLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by this browser');
      return null;
    }

    return new Promise<{latitude: number, longitude: number, address: string} | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Reverse geocode to get address
            const geocodeRes = await axios.post('/api/geocoding', { 
              latitude, 
              longitude 
            });
            
            const address = geocodeRes.data.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            resolve({
              latitude,
              longitude,
              address
            });
          } catch (error) {
            // If geocoding fails, still return coordinates
            resolve({
              latitude,
              longitude,
              address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          showError('Unable to get your location. Please enable location services.');
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }, [showError]);

  // Smart warning function (handled by useSmartNotification)
  const showThrottledWarning = useCallback((message: string) => {
    showWarning(message);
  }, [showWarning]);

  // Debounced search to prevent rapid-fire searches
  const debouncedSearch = useCallback((searchFunction: () => void) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchFunction();
    }, 300); // 300ms debounce
  }, []);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [driverBookings, setDriverBookings] = useState<Booking[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingToConfirm, setBookingToConfirm] = useState<Booking | null>(null);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<any>(null);
  const [showCustomBooking, setShowCustomBooking] = useState(false);
  const [currentSection, setCurrentSection] = useState<'search' | 'results' | 'booking' | 'payment' | 'confirmation' | 'map' | 'bookings'>('search');
  
  // New streamlined booking flow state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDriveway, setSelectedDriveway] = useState<any>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDriverBookings();
    }
    
    // Cleanup function to clear timeouts
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user]);

  // Auto-search for current date/time when component loads (debounced)
  useEffect(() => {
    if (currentLocation && addressSearch && !isSearching) {
      // Debounce the auto-search to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        if (!isSearching) {
          handleSearch(new Event('submit') as any);
        }
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentLocation, addressSearch, isSearching]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError(error.message);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
    }
  }, []);

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'addressSearch') {
      setAddressSearch(e.target.value);
    } else {
      setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous searches
    if (isSearching) {
      return;
    }

    setIsSearching(true);
    setIsLoadingResults(true);

    // Clear any existing toasts before starting new search
    clearExistingToasts();

    let latitude: number | undefined;
    let longitude: number | undefined;
    let radius = searchParams.radius || 5;

    if (addressSearch === 'Current Location' && currentLocation) {
      latitude = currentLocation.latitude;
      longitude = currentLocation.longitude;
    } else if (addressSearch && addressSearch.trim() !== '') {
      try {
        const geocodeConfig = {
          headers: { 'Content-Type': 'application/json' },
        };
        const geocodeRes = await axios.post('/api/geocoding', { address: addressSearch }, geocodeConfig);
        latitude = geocodeRes.data.latitude;
        longitude = geocodeRes.data.longitude;
      } catch (err: any) {
        showError(`Failed to geocode address: ${err.response?.data?.msg || 'Server Error'}`);
        return;
      }
    } else {
      showThrottledWarning('Please enter an address or use your current location to search.');
      return;
    }

    if (latitude === undefined || longitude === undefined) {
      showError('Could not determine location for search. Please try again.');
      return;
    }

    try {
      setIsSearching(true);
      setIsLoadingDriveways(true);
      
      const queryParams = {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(), 
        date: searchParams.date,
        startTime: searchParams.startTime,
        endTime: searchParams.endTime,
      };

      // Use cached API with 2-minute TTL for search results
      const res = await cachedApi.get<Driveway[]>(`/api/driveways/search`, {
        params: queryParams,
        cache: true,
        cacheTTL: 2 * 60 * 1000 // 2 minutes cache
      });
      
      // Filter results by car size compatibility and exclude user's own driveways
      const filteredResults = res.data.filter(driveway => {
        // Exclude user's own driveways
        if (driveway.owner === user?.id) {
          return false;
        }
        
        // Filter by car size compatibility
        if (!driveway.carSizeCompatibility || driveway.carSizeCompatibility.length === 0) {
          return true; // If no compatibility specified, show all
        }
        return driveway.carSizeCompatibility.includes(searchParams.carSize);
      });
      
      setSearchResults(filteredResults);
      
      // Only show one notification per search
      if (filteredResults.length === 0) {
        showInfo('No driveways found that match your car size. Try adjusting your search criteria.');
      } else {
        showSuccess(`${filteredResults.length} compatible driveways found!`);
      }
    } catch (err: any) {
      showError(`Failed to search driveways: ${err.response?.data?.msg || 'Server Error'}`);
    } finally {
      setIsSearching(false);
      setIsLoadingResults(false);
      setIsLoadingDriveways(false);
    }
  };

  const handleAdvancedSearch = async (filters: any) => {
    if (!user) {
      showError('User not authenticated. Please log in.');
      return;
    }

    // Prevent multiple simultaneous searches
    if (isSearching) {
      return;
    }

    // Clear any existing toasts before starting new search
    clearExistingToasts();
    
    setIsSearching(true);
    
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      let radius = 5;

      if (filters.location === 'Current Location' && currentLocation) {
        latitude = currentLocation.latitude;
        longitude = currentLocation.longitude;
      } else if (filters.location) {
        try {
          const geocodeConfig = {
            headers: { 'Content-Type': 'application/json' },
          };
          const geocodeRes = await axios.post('/api/geocoding', { address: filters.location }, geocodeConfig);
          latitude = geocodeRes.data.latitude;
          longitude = geocodeRes.data.longitude;
        } catch (err: any) {
          showError(`Failed to geocode address: ${err.response?.data?.msg || 'Server Error'}`);
          return;
        }
      } else {
        showThrottledWarning('Please enter an address or use your current location to search.');
        return;
      }

      if (latitude === undefined || longitude === undefined) {
        showError('Could not determine location for search. Please try again.');
        return;
      }

      const config = {
        headers: {},
      };
      const queryParams = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: radius.toString(),
        date: filters.availability.startDate || searchParams.date,
        startTime: filters.availability.startTime || searchParams.startTime,
        endTime: filters.availability.endTime || searchParams.endTime,
      }).toString();

      const res = await axios.get<Driveway[]>(`/api/driveways/search?${queryParams}`, config);
      
      // Filter results by car size compatibility and exclude user's own driveways
      const filteredResults = res.data.filter(driveway => {
        // Exclude user's own driveways
        if (driveway.owner === user?.id) {
          return false;
        }
        
        // Filter by car size compatibility
        if (!driveway.carSizeCompatibility || driveway.carSizeCompatibility.length === 0) {
          return true; // If no compatibility specified, show all
        }
        return driveway.carSizeCompatibility.includes(filters.carSize || searchParams.carSize);
      });
      
      setSearchResults(filteredResults);
      setCurrentSection('results');
      scrollToSection('results-section');
      
      if (filteredResults.length === 0) {
        showInfo('No driveways found that match your criteria. Try adjusting your search filters.');
      } else {
        showSuccess(`${filteredResults.length} driveways found!`);
      }
    } catch (err: any) {
      console.error('Advanced search error:', err);
      showError(`Search failed: ${err.response?.data?.msg || 'Server Error'}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationChange = (location: string) => {
    setAddressSearch(location);
  };

  const handleBookDriveway = async (driveway: any) => {
    // Check if user is trying to book their own driveway
    if (driveway.owner === user?.id) {
      showError('You cannot book your own driveway. Please select a different driveway to book.');
      return;
    }

    // Get driver's current location
    const location = await getDriverLocation();
    if (!location) {
      showError('Unable to get your location. Please enable location services and try again.');
      return;
    }

    // Set up the streamlined booking flow
    setSelectedDriveway(driveway);
    setSelectedTimeSlot({
      startTime: searchParams.startTime,
      endTime: searchParams.endTime,
      pricePerHour: driveway.price
    });
    setDriverLocation(location);
    setShowBookingModal(true);
  };

  // New streamlined booking confirmation
  const handleStreamlinedBooking = async (duration: number, startTime: string, endTime: string) => {
    if (!selectedDriveway || !user) {
      showError('Missing booking information. Please try again.');
      return;
    }

    try {
      const totalPrice = selectedTimeSlot.pricePerHour * duration;
      
      const bookingData = {
        driveway: selectedDriveway.id,
        startTime: `${searchParams.date}T${startTime}:00Z`,
        endTime: `${searchParams.date}T${endTime}:00Z`,
        totalAmount: totalPrice,
        driverLocation: driverLocation
      };

      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const res = await axios.post<Booking>('/api/bookings', bookingData, config);
      const pendingBooking = res.data;

      const paymentIntentRes = await axios.post('/api/payments/create-payment-intent', { bookingId: pendingBooking.id }, config);
      setClientSecret(paymentIntentRes.data.clientSecret);
      setBookingToConfirm(pendingBooking);
      setShowPaymentForm(true);
      setShowBookingModal(false);
      setCurrentSection('payment');
      
      // Scroll to payment section after a short delay
      setTimeout(() => {
        scrollToSection('payment-section');
      }, 300);
    } catch (err: any) {
      showError(`Failed to initiate booking: ${err.response?.data?.message || 'Server Error'}`);
    }
  };

  const handleViewDetails = (driveway: any) => {
    // Show driveway details in a modal or navigate to details page
    showInfo(`Viewing details for ${driveway.title}`);
  };

  const handleMapDrivewayClick = async (driveway: any, selectedDate: string, selectedStartTime: string, selectedEndTime: string) => {
    if (!user) {
      showError('User not authenticated. Please log in.');
      return;
    }

    const matchingAvailability = driveway.availability.find((avail: any) => {
      const availDate = new Date(avail.date);
      const searchDate = new Date(selectedDate);
      return (
        availDate.toDateString() === searchDate.toDateString() &&
        selectedStartTime >= avail.startTime &&
        selectedEndTime <= avail.endTime
      );
    });

    if (!matchingAvailability) {
      showError('Selected time slot is not available or has no price defined.');
      return;
    }

    const pricePerHour = matchingAvailability.pricePerHour;

    const dateOnly = selectedDate.split('T')[0];
    const startTimeString = `${dateOnly}T${selectedStartTime}:00Z`;
    const endTimeString = `${dateOnly}T${selectedEndTime}:00Z`;

    const startDateTime = new Date(startTimeString);
    const endDateTime = new Date(endTimeString);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      showError('Invalid date or time selected. Please ensure the date and time are valid.');
      return;
    }

    const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
    const totalPrice = pricePerHour * durationHours;

    if (isNaN(totalPrice) || totalPrice <= 0) {
      showError('Calculated total price is invalid. Please check the selected times and driveway price.');
      return;
    }

    setSelectedSlotDetails({
      driveway,
      selectedDate,
      selectedStartTime,
      selectedEndTime,
      totalPrice,
      pricePerHour,
      durationHours,
    });
  };

  const fetchDriverBookings = async () => {
    try {
      const config = {
        headers: {
        },
      };
      if (!user || !user.id) {
        console.warn('fetchDriverBookings: User not loaded or user ID missing. Skipping API call.');
        return;
      }
      const res = await axios.get<Booking[]>(`/api/bookings/driver/${user.id}`, config);
      setDriverBookings(res.data);
    } catch (err) {
      // Don't show error notification for automatic data fetching
      console.error('Failed to fetch bookings:', err);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleBookNow = async () => {
    // Set current time and search immediately
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5);
    
    // Show loading notification
    showInfo('Getting your current location...', 'Location Detection');
    
    // Get driver's current location automatically
    const location = await getDriverLocation();
    
    if (location) {
      // Set the current address in the search
      setAddressSearch(location.address);
      setCurrentLocation({ latitude: location.latitude, longitude: location.longitude });
      
      showSuccess(`Location detected: ${location.address}`, 'Location Found');
    } else {
      // Fallback to manual address entry
      showWarning('Could not detect your location. Please enter your address manually.', 'Location Detection Failed');
    }
    
    setSearchParams({
      ...searchParams,
      date: now.toISOString().split('T')[0],
      startTime: currentTime,
      endTime: endTime
    });
    
    setCurrentSection('results');
    setShowCustomBooking(false);
    
    // Trigger search
    setTimeout(() => {
      handleSearch(new Event('submit') as any);
    }, 100);
  };

  const handleBookLater = () => {
    setShowCustomBooking(true);
    setCurrentSection('search');
  };

  const initiateBooking = async (driveway: Driveway, selectedDate: string, selectedStartTime: string, selectedEndTime: string, totalPrice: number) => {
    if (!user) {
      showError('User not authenticated. Please log in.');
      return;
    }

    const dateOnly = selectedDate.split('T')[0];
    const startTimeString = `${dateOnly}T${selectedStartTime}:00Z`;
    const endTimeString = `${dateOnly}T${selectedEndTime}:00Z`;

    const startDateTime = new Date(startTimeString);
    const endDateTime = new Date(endTimeString);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      showError('Invalid date or time selected. Please ensure the date and time are valid.');
      return;
    }

    if (isNaN(totalPrice) || totalPrice <= 0) {
      showError('Calculated total price is invalid. Please check the selected times and driveway price.');
      return;
    }

    try {
      const bookingRequest = {
        driveway: driveway.id,
        startTime: startTimeString,
        endTime: endTimeString,
        totalAmount: totalPrice,
        driverLocation: driverLocation
      };

      // Create booking directly
      const bookingResponse = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingRequest)
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const pendingBooking = await bookingResponse.json();

      // Create payment intent
      const paymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId: pendingBooking.id,
          amount: totalPrice * 100 // Convert to cents
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntent = await paymentResponse.json();
      
      setClientSecret(paymentIntent.clientSecret);
      setBookingToConfirm(pendingBooking);
      setShowPaymentForm(true);
      setSelectedSlotDetails(null);
      setCurrentSection('payment');
      
      // Scroll to payment section after a short delay
      setTimeout(() => {
        scrollToSection('payment-section');
      }, 300);
    } catch (err: any) {
      console.error('Booking initiation failed:', err);
      
      // Save booking data offline for retry if offline
      if (!offlineService.isOnline()) {
        const bookingData = {
          driveway: driveway.id,
          driver: user.id,
          startTime: startTimeString,
          endTime: endTimeString,
          totalPrice,
          driverLocation
        };
        offlineService.saveBookingData(bookingData);
        showError('You are offline. Your booking has been saved and will be processed when you are back online.');
      }
    }
  };


  const handlePaymentSuccess = async (paymentIntentId: string, bookingId: string) => {
    try {
      // Confirm payment
      const response = await fetch('/api/payments/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          bookingId,
          paymentIntentId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }
      
      showSuccess('Payment successful! Your booking has been confirmed.');
      setShowPaymentForm(false);
      setClientSecret(null);
      setBookingToConfirm(null);
      fetchDriverBookings();
    } catch (err: any) {
      console.error('Error confirming booking after payment:', err.response?.data || err.message);
      showError(`Failed to confirm booking: ${err.response?.data?.msg || 'Server Error'}`);
    }
  };

  const handlePaymentFailure = async (error: any) => {
    showError(`Payment failed: ${error.message || 'Unknown error'}`);
    if (bookingToConfirm && bookingToConfirm.id) {
      try {
        const config = { headers: {} };
        await axios.put(`/api/bookings/${bookingToConfirm.id}/cancel`, {}, config);
        showInfo('Pending booking cancelled due to payment failure.');
        fetchDriverBookings();
      } catch (cancelErr: any) {
        showError(`Failed to cancel pending booking: ${cancelErr.response?.data?.msg || 'Server Error'}`);
      }
    }
    setShowPaymentForm(false);
    setClientSecret(null);
    setBookingToConfirm(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const config = {
        headers: {
        },
      };
      await axios.put(`/api/bookings/${bookingId}/cancel`, {}, config);
      showSuccess('Booking cancelled successfully!');
      fetchDriverBookings();
    } catch (err: any) {
      showError(`Failed to cancel booking: ${err.response?.data?.msg || 'Server Error'}`);
    }
  };

  if (isLoading) {
    return <div className="text-center mt-8 text-lg font-medium">Loading user data...</div>;
  }

  if (!isAuthenticated || !user?.roles.includes('driver')) {
    return <div className="text-center mt-12 text-red-600 text-xl font-bold">Access Denied or Not Authenticated.</div>;
  }

  const CheckoutForm: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();

      if (!stripe || !elements || !clientSecret || !bookingToConfirm) {
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        console.error('CardElement not found.');
        return;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: user?.email,
          },
        },
      });

      if (error) {
        handlePaymentFailure(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        handlePaymentSuccess(paymentIntent.id, bookingToConfirm.id);
      } else {
        handlePaymentFailure({ message: 'Payment did not succeed.' });
      }
    };

    return (
      <div className="payment-form">
        <h4 className="payment-title">Enter Payment Details</h4>
        <form onSubmit={handleSubmit}>
          <div className="stripe-element">
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
          <div className="payment-actions">
            <Button type="submit" variant="primary" disabled={!stripe || !elements}>
          Pay Now
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowPaymentForm(false)}>
          Cancel Payment
            </Button>
          </div>
      </form>
      </div>
    );
  };

  return (
    <div className="driver-dashboard">
      {/* Minimal Connection Indicator - Only show when disconnected for more than 5 seconds */}
      {!socketConnected && (
        <div className="connection-indicator disconnected" style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          zIndex: 1000,
          background: 'rgba(255, 193, 7, 0.95)',
          color: '#000',
          padding: '6px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: '500',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          minWidth: '120px',
          textAlign: 'center'
        }}>
          <div style={{ 
            display: 'inline-block', 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            backgroundColor: '#ff6b6b', 
            marginRight: '6px',
            animation: 'pulse 2s infinite'
          }}></div>
          <span>Reconnecting...</span>
        </div>
      )}

      <h2 className="dashboard-title">Parkway.com - Driver Dashboard</h2>
      
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav 
        items={[
          { label: 'Home', onClick: () => setCurrentSection('search') },
          ...(currentSection === 'results' ? [
            { label: 'Search Results', active: true }
          ] : []),
          ...(currentSection === 'map' ? [
            { label: 'Map View', active: true }
          ] : []),
          ...(currentSection === 'bookings' ? [
            { label: 'My Bookings', active: true }
          ] : [])
        ]}
      />
      
      {/* Main Action Buttons */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem', 
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleBookNow}
        >
          📍 Book Now (Auto-Location)
        </Button>
        <Button 
          variant="secondary" 
          size="lg"
          onClick={handleBookLater}
        >
          Book Later
        </Button>
      </div>

      {/* Enhanced Section Navigation */}
      <DashboardNav
        sections={[
          {
            id: 'search',
            label: 'Search',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )
          },
          {
            id: 'results',
            label: 'Results',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            )
          },
          {
            id: 'payment',
            label: 'Payment',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            )
          },
          {
            id: 'bookings',
            label: 'My Bookings',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <rect x="9" y="11" width="6" height="11"/>
                <path d="M9 7v4"/>
                <path d="M15 7v4"/>
                <path d="M9 7a4 4 0 0 1 8 0"/>
              </svg>
            )
          }
        ]}
        currentSection={currentSection}
        onSectionChange={(sectionId) => {
          setCurrentSection(sectionId as any);
          scrollToSection(`${sectionId}-section`);
        }}
      />

      {(showCustomBooking || currentSection === 'search') && (
        <div id="search-section">
          <h3 className="section-title">Search Driveways</h3>
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            onLocationChange={handleLocationChange}
            initialFilters={{
              location: addressSearch,
              carSize: searchParams.carSize,
              availability: {
                startDate: searchParams.date,
                endDate: searchParams.date,
                startTime: searchParams.startTime,
                endTime: searchParams.endTime
              }
            }}
          />
          <form onSubmit={handleSearch} className="search-form" style={{ display: 'none' }}>
        <div className="form-group">
          <label htmlFor="addressSearch" className="form-label">Search Location</label>
        <input
          type="text"
            id="addressSearch"
          name="addressSearch"
          value={addressSearch}
          onChange={onSearchChange}
          placeholder="Enter Address or 'Current Location' (Auto-detected when using Book Now)"
          required={!currentLocation}
            className="form-input"
        />
        </div>
        
        {locationError && <div className="location-error">Error: {locationError}</div>}
        
        {currentLocation && (
          <button 
            type="button" 
            onClick={() => setAddressSearch('Current Location')} 
            className="location-button"
          >
            Use Current Location
          </button>
        )}
        
        <div className="form-group">
          <label htmlFor="radius" className="form-label">Search Radius (km)</label>
        <input
          type="number"
            id="radius"
          name="radius"
          value={searchParams.radius}
          onChange={onSearchChange}
            placeholder="5"
            min="1"
            max="50"
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="carSize" className="form-label">Your Car Size</label>
          <select
            id="carSize"
            name="carSize"
            value={searchParams.carSize}
            onChange={onSearchChange}
            className="form-input"
          >
            <option value="small">Small (Hatchback, Sedan)</option>
            <option value="medium">Medium (SUV, Crossover)</option>
            <option value="large">Large (Truck, Van)</option>
            <option value="extra-large">Extra Large (RV, Bus)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="date" className="form-label">Date</label>
        <input
          type="date"
            id="date"
          name="date"
          value={searchParams.date}
          onChange={onSearchChange}
          required
            className="form-input"
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Currently showing: {new Date(searchParams.date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="startTime" className="form-label">Start Time</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="time"
              id="startTime"
          name="startTime"
          value={searchParams.startTime}
          onChange={onSearchChange}
          required
              className="form-input"
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const now = new Date();
                const currentTime = now.toTimeString().slice(0, 5);
                setSearchParams({ ...searchParams, startTime: currentTime });
              }}
            >
              Now
            </Button>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Current time: {new Date().toTimeString().slice(0, 5)}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="endTime" className="form-label">End Time</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input
          type="time"
              id="endTime"
          name="endTime"
          value={searchParams.endTime}
          onChange={onSearchChange}
          required
              className="form-input"
              style={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                const now = new Date();
                const currentTime = now.toTimeString().slice(0, 5);
                setSearchParams({ ...searchParams, endTime: currentTime });
              }}
            >
              Now
            </Button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Button type="submit" variant="primary" size="lg">
          Search Driveways
          </Button>
        </div>
      </form>
        </div>
      )}

      {showCustomBooking && (
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.9)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          border: '2px solid #e5e7eb'
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#374151' }}>Custom Booking Options</h4>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Use the search form above to specify a different date and time for your booking. 
            The system will show available driveways for your selected time slot.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={async () => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const newParams = { 
                  ...searchParams, 
                  date: tomorrow.toISOString().split('T')[0],
                  startTime: '09:00',
                  endTime: '17:00'
                };
                setSearchParams(newParams);
                
                // Auto-trigger search with new parameters
                setTimeout(() => {
                  handleSearch(new Event('submit') as any);
                }, 100);
              }}
            >
              Tomorrow 9AM-5PM
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={async () => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const newParams = { 
                  ...searchParams, 
                  date: nextWeek.toISOString().split('T')[0],
                  startTime: '09:00',
                  endTime: '17:00'
                };
                setSearchParams(newParams);
                
                // Auto-trigger search with new parameters
                setTimeout(() => {
                  handleSearch(new Event('submit') as any);
                }, 100);
              }}
            >
              Next Week
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={async () => {
                const newParams = { 
                  ...searchParams, 
                  date: new Date().toISOString().split('T')[0],
                  startTime: new Date().toTimeString().slice(0, 5),
                  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toTimeString().slice(0, 5)
                };
                setSearchParams(newParams);
                
                // Auto-trigger search with new parameters
                setTimeout(() => {
                  handleSearch(new Event('submit') as any);
                }, 100);
              }}
            >
              Back to Now
            </Button>
          </div>
        </div>
      )}

      {(searchResults.length > 0 || currentSection === 'results') && (
        <div id="results-section">
          {isLoadingDriveways ? (
            <div className="search-results-loading">
              <h3>Finding driveways...</h3>
              <SkeletonSearchResults count={3} />
            </div>
          ) : (
            <SearchResults
            driveways={searchResults.map(driveway => ({
              id: driveway.id,
              title: driveway.address,
              description: driveway.description,
              location: driveway.address,
              price: driveway.availability[0]?.pricePerHour || 0,
              image: '/api/placeholder/300/200', // Placeholder image
              rating: 4.5, // Mock rating
              reviewCount: Math.floor(Math.random() * 50) + 10, // Mock review count
              amenities: ['Covered Parking', 'Security Cameras'], // Mock amenities
              distance: Math.random() * 5, // Mock distance
              availability: {
                startDate: searchParams.date,
                endDate: searchParams.date,
                startTime: searchParams.startTime,
                endTime: searchParams.endTime
              },
              owner: {
                name: 'Driveway Owner',
                avatar: '/api/placeholder/40/40',
                verified: true
              },
              carSizeCompatibility: driveway.carSizeCompatibility || ['small', 'medium', 'large'],
              isAvailable: driveway.isAvailable
            }))}
            isLoading={isSearching}
            onBook={handleBookDriveway}
            onViewDetails={handleViewDetails}
          />
          )}
        </div>
      )}

      {/* Booking Confirmation Section */}
      {selectedSlotDetails && !showPaymentForm && (
        <div className="booking-confirmation">
          <h4 className="confirmation-title">Confirm Your Booking</h4>
          <div className="confirmation-details">
            <div className="confirmation-detail">
              <strong>Driveway Address:</strong> {selectedSlotDetails.driveway.address}
            </div>
            <div className="confirmation-detail">
              <strong>Date:</strong> {selectedSlotDetails.selectedDate.split('T')[0]}
            </div>
            <div className="confirmation-detail">
              <strong>Start Time:</strong> {selectedSlotDetails.selectedStartTime}
            </div>
            <div className="confirmation-detail">
              <strong>End Time:</strong> {selectedSlotDetails.selectedEndTime}
            </div>
            <div className="confirmation-detail">
              <strong>Duration:</strong> {selectedSlotDetails.durationHours.toFixed(2)} hours
            </div>
            <div className="confirmation-detail">
              <strong>Price Per Hour:</strong> ${selectedSlotDetails.pricePerHour.toFixed(2)}
            </div>
          </div>
          <div className="confirmation-total">
            Total Price: ${selectedSlotDetails.totalPrice.toFixed(2)}
          </div>
          <div className="confirmation-actions">
            <Button
              variant="success"
              size="lg"
              onClick={() => initiateBooking(
                selectedSlotDetails.driveway,
                selectedSlotDetails.selectedDate,
                selectedSlotDetails.selectedStartTime,
                selectedSlotDetails.selectedEndTime,
                selectedSlotDetails.totalPrice
              )}
              fullWidth
            >
              Confirm and Pay
            </Button>
            <Button
              variant="danger"
              size="lg"
              onClick={() => setSelectedSlotDetails(null)}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Map Display */}
      {searchResults.length > 0 && (
        <div className="map-container">
          <h3 className="map-title">Interactive Map - Click Pins to Book</h3>
          <div className="map-wrapper">
            <EnhancedMapDisplay 
              driveways={searchResults} 
              currentLocation={currentLocation}
              searchParams={searchParams}
              onDrivewayClick={(driveway) => {
                // Filter available slots for the selected driveway
                const availableSlots = driveway.availability.filter(slot => {
                  const slotDate = new Date(slot.date);
                  const searchDate = new Date(searchParams.date);
                  return (
                    slotDate.toDateString() === searchDate.toDateString() &&
                    searchParams.startTime >= slot.startTime &&
                    searchParams.endTime <= slot.endTime
                  );
                });
                
                if (availableSlots.length > 0) {
                  const slot = availableSlots[0];
                  handleMapDrivewayClick(driveway, slot.date, slot.startTime, slot.endTime);
                } else {
                  showWarning('No available slots found for the selected time period.');
                }
              }}
            />
          </div>
        </div>
      )}

      {showPaymentForm && clientSecret && bookingToConfirm && (
        <div id="payment-section" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '2rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          border: '2px solid #10b981',
          boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.25)'
        }}>
          <h3 className="section-title" style={{ color: '#10b981', marginBottom: '1.5rem' }}>
            Complete Your Payment
          </h3>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
        </div>
      )}

      <div id="bookings-section">
        <h3 className="section-title">Your Bookings</h3>
      {driverBookings.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">You have no bookings yet. Search for driveways to make your first booking!</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {driverBookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <h4 className="booking-id">Booking ID: {booking.id.substring(0, 8)}...</h4>
              <div className="booking-detail">
                <strong>Driveway:</strong> {booking.driveway.substring(0, 8)}...
              </div>
              <div className="booking-detail">
                <strong>Start:</strong> {new Date(booking.startTime).toLocaleString()}
              </div>
              <div className="booking-detail">
                <strong>End:</strong> {new Date(booking.endTime).toLocaleString()}
              </div>
              <div className={`booking-status status-${booking.status}`}>
                <span>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
              </div>
              <div className="booking-price">
                Total: ${booking.totalPrice.toFixed(2)}
              </div>
              {booking.status === 'pending' && (
                <Button 
                  variant="danger"
                  onClick={() => handleCancelBooking(booking.id)}
                  fullWidth
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Streamlined Booking Duration Modal */}
      {showBookingModal && selectedDriveway && selectedTimeSlot && (
        <BookingDurationModal
          isOpen={showBookingModal}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedDriveway(null);
            setSelectedTimeSlot(null);
            setDriverLocation(null);
          }}
          onConfirm={handleStreamlinedBooking}
          driveway={{
            id: selectedDriveway.id,
            address: selectedDriveway.location,
            description: selectedDriveway.description,
            pricePerHour: selectedTimeSlot.pricePerHour,
            availability: [{
              date: searchParams.date,
              startTime: selectedTimeSlot.startTime,
              endTime: selectedTimeSlot.endTime,
              pricePerHour: selectedTimeSlot.pricePerHour
            }]
          }}
          selectedDate={searchParams.date}
          selectedTimeSlot={selectedTimeSlot}
          driverLocation={driverLocation}
        />
      )}
      </div>
    </div>
  );
};

export default DriverDashboard;
