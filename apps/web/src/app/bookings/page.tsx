'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import { ReviewForm, ConfirmDialog } from '@/components/ui';

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  specialRequests?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  createdAt: string;
  updatedAt: string;
  driveway: {
    id: string;
    title: string;
    address: string;
    images: string[];
    owner: {
      id: string;
      name: string;
      phone?: string;
    };
  };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [existingReviews, setExistingReviews] = useState<Record<string, { id: string; rating: number; comment?: string }>>({});
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [cancelLoading, setCancelLoading] = useState(false);
  const isMountedRef = useRef(true);

  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]); // Only depend on statusFilter, not router

  // Auto-refresh bookings if there are any PENDING bookings with COMPLETED payment
  // This handles the case where payment is completed but webhook hasn't processed yet
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    const hasPendingWithCompletedPayment = bookings.some(
      b => b.status === 'PENDING' && b.paymentStatus === 'COMPLETED'
    );
    
    if (hasPendingWithCompletedPayment) {
      // Poll every 3 seconds until booking is confirmed
      const interval = setInterval(() => {
        if (isMountedRef.current) {
          fetchBookings(pagination.page);
        }
      }, 3000);
      
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]); // Removed pagination.page to avoid unnecessary restarts

  // Fetch existing reviews for completed bookings
  useEffect(() => {
    if (bookings.length > 0 && user) {
      const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
      
      // Use Promise.allSettled to handle all requests safely
      const fetchReviews = async () => {
        const reviewPromises = completedBookings.map(async (booking) => {
          try {
            const response = await api.get<{ reviews?: any[] }>(`/reviews?drivewayId=${booking.driveway.id}&userId=${user.id}`);
            const reviews = response.data.data?.reviews ?? [];
            if (reviews.length > 0) {
              const review = reviews[0];
              return {
                drivewayId: booking.driveway.id,
                review: {
                  id: review.id,
                  rating: review.rating,
                  comment: review.comment
                }
              };
            }
          } catch (err) {
            // No review exists yet, that's fine - don't log or throw
            return null;
          }
          return null;
        });

        const results = await Promise.allSettled(reviewPromises);
        
        // Update state with successful results
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value !== null) {
            const value = result.value;
            setExistingReviews(prev => ({
              ...prev,
              [value.drivewayId]: value.review
            }));
          }
        });
      };

      fetchReviews().catch((err) => {
        // Silently handle - reviews are optional
        console.error('Error fetching reviews:', err);
      });
    }
  }, [bookings, user]);

  const fetchBookings = async (page = 1) => {
    if (!isMountedRef.current) return; // Don't update if unmounted
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get<{ bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/bookings?${params}`);

      if (!isMountedRef.current) return; // Check again after async operation

      const { bookings: data, pagination: paginationData } = response.data.data;
      
      setBookings(data);
      setPagination(paginationData);
    } catch (err: any) {
      if (!isMountedRef.current) return; // Don't update if unmounted
      
      if (err.response?.status === 401) {
        // Auth is handled by cookies and useAuth hook
        // The API interceptor will handle token refresh or redirect
        router.push('/login');
      } else {
        setError('Unable to load your bookings. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    // Show confirmation dialog for cancellations
    if (newStatus === 'CANCELLED') {
      setCancelDialog({ open: true, bookingId });
      return;
    }

    try {
      setLoading(true);
      await api.patch(`/bookings/${bookingId}`, { status: newStatus });
      await fetchBookings(pagination.page);
      showToast(`Booking ${newStatus.toLowerCase()} successfully`, 'success');
    } catch (err: any) {
      // Use error handler for user-friendly messages
      const { createAppError } = await import('@/lib/errors');
      const appError = createAppError(err);
      setError(appError.userMessage);
      showToast(appError.userMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelDialog.bookingId) return;

    try {
      setCancelLoading(true);
      await api.patch(`/bookings/${cancelDialog.bookingId}`, { status: 'CANCELLED' });
      await fetchBookings(pagination.page);
      showToast('Booking cancelled successfully', 'success');
      setCancelDialog({ open: false, bookingId: null });
    } catch (err: any) {
      const { createAppError } = await import('@/lib/errors');
      const appError = createAppError(err);
      setError(appError.userMessage);
      showToast(appError.userMessage, 'error');
    } finally {
      setCancelLoading(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-6 w-full max-w-5xl px-6">
          <div className="h-8 w-64 skeleton"></div>
          <div className="space-y-4">
            <div className="h-28 skeleton"></div>
            <div className="h-28 skeleton"></div>
            <div className="h-28 skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          
          {/* Status Filter */}
          <div className="flex space-x-2">
            <label htmlFor="status-filter" className="sr-only">
              Filter bookings by status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              aria-label="Filter bookings by status"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all' 
                ? "You haven't made any bookings yet." 
                : `No bookings with status "${statusFilter.toLowerCase()}".`
              }
            </p>
            <Link href="/search" className="btn btn-primary">
              Find Driveways
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="rounded-lg border border-[color:rgb(var(--color-border))] p-6 bg-[color:rgb(var(--color-surface))]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {booking.driveway.title}
                    </h3>
                    <p className="text-gray-600 mb-2">{booking.driveway.address}</p>
                    <p className="text-sm text-gray-500">
                      Owner: {booking.driveway.owner.name}
                      {booking.driveway.owner.phone && (
                        <span> • {booking.driveway.owner.phone}</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600 mb-2">
                      {formatPrice(booking.totalPrice)}
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div>
                      <h4 className="font-medium text-gray-900">Start Time</h4>
                      <p className="text-gray-600">{formatDate(booking.startTime)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">End Time</h4>
                      <p className="text-gray-600">{formatDate(booking.endTime)}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Duration</h4>
                      <p className="text-gray-600">
                        {Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60))} hours
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Booked On</h4>
                      <p className="text-gray-600">{formatDate(booking.createdAt)}</p>
                    </div>
                  </div>

                  {/* Booking Expiry Warning for PENDING bookings - Only show if payment is actually pending */}
                  {booking.status === 'PENDING' && booking.paymentStatus === 'PENDING' && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Payment Required
                          </p>
                          <p className="text-sm text-yellow-700">
                            This booking will expire in 15 minutes if payment is not completed. Please complete payment to confirm your booking.
                          </p>
                          <Link
                            href={`/checkout?bookingId=${booking.id}`}
                            className="mt-2 inline-block text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                          >
                            Complete Payment Now →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Processing Message - Show if payment completed but webhook hasn't processed yet */}
                  {booking.status === 'PENDING' && booking.paymentStatus === 'COMPLETED' && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            Payment Received - Confirming Booking
                          </p>
                          <p className="text-sm text-blue-700">
                            Your payment has been processed. We're confirming your booking. This page will update automatically.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Information */}
                {booking.vehicleInfo && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Vehicle Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Make:</span>
                        <span className="ml-2 font-medium">{booking.vehicleInfo.make}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="ml-2 font-medium">{booking.vehicleInfo.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <span className="ml-2 font-medium">{booking.vehicleInfo.color}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">License:</span>
                        <span className="ml-2 font-medium">{booking.vehicleInfo.licensePlate}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {booking.specialRequests && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Special Requests</h4>
                    <p className="text-gray-600">{booking.specialRequests}</p>
                  </div>
                )}

                {/* Review Form for Completed Bookings (Driver only) */}
                {booking.status === 'COMPLETED' && user && booking.driveway.owner.id !== user.id && (
                  <div className="mt-6 pt-6 border-t border-[color:rgb(var(--color-border))]">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Leave a Review</h4>
                      {existingReviews[booking.driveway.id] && (
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedReviews);
                            if (newExpanded.has(booking.id)) {
                              newExpanded.delete(booking.id);
                            } else {
                              newExpanded.add(booking.id);
                            }
                            setExpandedReviews(newExpanded);
                          }}
                          className="text-sm text-primary-600 hover:text-primary-800"
                          aria-label={expandedReviews.has(booking.id) ? 'Hide review form' : 'Show review form'}
                        >
                          {expandedReviews.has(booking.id) ? 'Hide Review' : 'Update Review'}
                        </button>
                      )}
                    </div>
                    {(expandedReviews.has(booking.id) || !existingReviews[booking.driveway.id]) && (
                      <ReviewForm
                        drivewayId={booking.driveway.id}
                        bookingId={booking.id}
                        existingReview={existingReviews[booking.driveway.id]}
                        onSuccess={() => {
                          fetchBookings(pagination.page);
                          const newExpanded = new Set(expandedReviews);
                          newExpanded.delete(booking.id);
                          setExpandedReviews(newExpanded);
                        }}
                      />
                    )}
                    {existingReviews[booking.driveway.id] && !expandedReviews.has(booking.id) && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-yellow-400 text-lg">★</span>
                          <span className="font-medium">{existingReviews[booking.driveway.id].rating} / 5</span>
                        </div>
                        {existingReviews[booking.driveway.id].comment && (
                          <p className="text-gray-600 text-sm">{existingReviews[booking.driveway.id].comment}</p>
                        )}
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedReviews);
                            newExpanded.add(booking.id);
                            setExpandedReviews(newExpanded);
                          }}
                          className="mt-2 text-sm text-primary-600 hover:text-primary-800"
                        >
                          Update Review
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-[color:rgb(var(--color-border))]">
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <Link
                      href={`/driveway/${booking.driveway.id}`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-primary-50 transition-colors"
                    >
                      View Driveway
                    </Link>
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Cancel booking for ${booking.driveway.title}`}
                      >
                        Cancel Booking
                      </button>
                    )}
                    {/* Owner controls */}
                    {user && booking.driveway.owner.id === user.id && booking.status === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded-md hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`Cancel booking for ${booking.driveway.title}`}
                      >
                        Cancel
                      </button>
                    )}
                    {/* Note: Bookings are automatically confirmed after payment is completed via Stripe webhook */}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Booking ID: {booking.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => fetchBookings(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to previous page"
              >
                Previous
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchBookings(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    page === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={page === pagination.page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => fetchBookings(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to next page"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Confirmation Dialog for Cancellation */}
        <ConfirmDialog
          open={cancelDialog.open}
          onClose={() => setCancelDialog({ open: false, bookingId: null })}
          onConfirm={handleConfirmCancel}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? This action cannot be undone. If payment was completed, refunds will be processed according to our cancellation policy."
          confirmText="Cancel Booking"
          cancelText="Keep Booking"
          variant="warning"
          loading={cancelLoading}
        />
      </div>
    </AppLayout>
  );
}
