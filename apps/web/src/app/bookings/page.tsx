'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api-client';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import { ReviewForm, ConfirmDialog, ImageWithPlaceholder } from '@/components/ui';

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
  const [statusFilter, setStatusFilter] = useState<string>('CONFIRMED');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const [existingReviews, setExistingReviews] = useState<Record<string, { id: string; rating: number; comment?: string }>>({});
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; bookingId: string | null }>({ open: false, bookingId: null });
  const [cancelLoading, setCancelLoading] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState<Set<string>>(new Set());
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

  const getStatusLabel = (booking: Booking) => {
    if (booking.status === 'PENDING' && booking.paymentStatus === 'PENDING') return 'Pending · Payment required';
    if (booking.status === 'PENDING' && booking.paymentStatus === 'COMPLETED') return 'Confirming';
    if (booking.status === 'CONFIRMED') return 'Confirmed · Paid';
    if (booking.status === 'COMPLETED') return 'Completed';
    if (booking.status === 'CANCELLED') return 'Cancelled';
    if (booking.status === 'EXPIRED') return 'Expired';
    return `${booking.status} · ${booking.paymentStatus}`;
  };

  const getStatusLabelClass = (booking: Booking) => {
    if (booking.status === 'CONFIRMED' || (booking.status === 'PENDING' && booking.paymentStatus === 'COMPLETED')) return 'bg-green-100 text-green-800';
    if (booking.status === 'COMPLETED') return 'bg-blue-100 text-blue-800';
    if (booking.status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const dateStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const endTime = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${dateStr}, ${startTime} – ${endTime}`;
  };

  const toggleDetails = (bookingId: string) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(bookingId)) next.delete(bookingId);
      else next.add(bookingId);
      return next;
    });
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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
        {/* Header: stacked on mobile, row on sm+ */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">My Bookings</h1>
          <label htmlFor="status-filter" className="sr-only">Filter bookings by status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-auto min-h-[44px]"
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

        {error && (
          <div className="alert-error mb-6" role="alert">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Couldn&apos;t load bookings</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-sm mt-2 text-red-700/90">Check your connection and try again, or refresh the page.</p>
            </div>
          </div>
        )}

        {bookings.length === 0 && !loading ? (
          <div className="rounded-xl border border-[color:rgb(var(--color-border))] bg-[color:rgb(var(--color-surface))] shadow-sm p-10 sm:p-12 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 text-sm mb-6 max-w-sm mx-auto">
              {statusFilter === 'all' 
                ? "You haven't made any bookings yet. Search for driveways to get started." 
                : `No bookings with status "${statusFilter.toLowerCase()}". Try another filter.`
              }
            </p>
            <Link href="/search" className="btn btn-primary inline-flex items-center justify-center min-h-[44px] px-6">
              Find Driveways
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const thumb = booking.driveway.images?.[0];
              const durationHours = Math.round((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60));
              const detailsOpen = expandedDetails.has(booking.id);

              return (
                <article key={booking.id} className="rounded-lg border border-[color:rgb(var(--color-border))] overflow-hidden bg-[color:rgb(var(--color-surface))]">
                  {/* Card: mobile = stacked; sm+ = thumbnail left, content right */}
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative w-full sm:w-40 lg:w-48 h-36 sm:h-auto sm:min-h-[140px] flex-shrink-0 bg-gray-100">
                      {thumb ? (
                        <ImageWithPlaceholder
                          src={thumb}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400" aria-hidden>
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
                      {/* Title, one-line date, price, status */}
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold truncate">{booking.driveway.title}</h3>
                          <p className="text-sm text-gray-600 mt-0.5">{formatDateRange(booking.startTime, booking.endTime)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 sm:flex-col sm:items-end">
                          <span className="text-xl font-bold text-primary-600">{formatPrice(booking.totalPrice)}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusLabelClass(booking)}`}>
                            {getStatusLabel(booking)}
                          </span>
                        </div>
                      </div>

                      {/* Address (truncated) */}
                      <p className="text-gray-600 text-sm truncate" title={booking.driveway.address}>
                        {booking.driveway.address}
                      </p>

                      {/* Host + tap-to-call */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-gray-600">Host: {booking.driveway.owner.name}</span>
                        {booking.driveway.owner.phone && (
                          <a
                            href={`tel:${booking.driveway.owner.phone.replace(/\D/g, '')}`}
                            className="inline-flex items-center gap-1.5 min-h-[44px] min-w-[44px] px-3 text-primary-600 hover:text-primary-800 font-medium rounded-md hover:bg-primary-50 transition-colors"
                            aria-label={`Call ${booking.driveway.owner.name}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Call
                          </a>
                        )}
                      </div>

                      {/* Alerts: compact */}
                      {booking.status === 'PENDING' && booking.paymentStatus === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 flex-1">Payment required — booking expires in 15 min.</p>
                          <Link
                            href={`/checkout?bookingId=${booking.id}`}
                            className="btn btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
                          >
                            Complete payment
                          </Link>
                        </div>
                      )}
                      {booking.status === 'PENDING' && booking.paymentStatus === 'COMPLETED' && (
                        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                          <svg className="w-5 h-5 shrink-0 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Payment received — confirming booking. Page will update automatically.
                        </div>
                      )}

                      {/* Collapsible details on mobile; always visible on lg */}
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleDetails(booking.id)}
                          className="lg:sr-only text-sm font-medium text-primary-600 hover:text-primary-800 py-2 min-h-[44px] flex items-center"
                          aria-expanded={detailsOpen}
                          aria-controls={`details-${booking.id}`}
                        >
                          {detailsOpen ? 'Hide details' : 'Show details'}
                        </button>
                        <div
                          id={`details-${booking.id}`}
                          className={`${detailsOpen ? 'block' : 'hidden'} lg:block mt-2 pt-3 border-t border-[color:rgb(var(--color-border))] space-y-3`}
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-gray-500">Start</span><br />{formatDate(booking.startTime)}</div>
                            <div><span className="text-gray-500">End</span><br />{formatDate(booking.endTime)}</div>
                            <div><span className="text-gray-500">Duration</span><br />{durationHours} hours</div>
                            <div><span className="text-gray-500">Booked on</span><br />{formatDate(booking.createdAt)}</div>
                          </div>
                          {booking.vehicleInfo && (
                            <div className="text-sm">
                              <span className="text-gray-500">Vehicle: </span>
                              <span>{booking.vehicleInfo.make} {booking.vehicleInfo.model}, {booking.vehicleInfo.color} · {booking.vehicleInfo.licensePlate}</span>
                            </div>
                          )}
                          {booking.specialRequests && (
                            <div className="text-sm"><span className="text-gray-500">Special requests: </span>{booking.specialRequests}</div>
                          )}
                          <p className="text-xs text-gray-500">Booking ID: {booking.id}</p>
                        </div>
                      </div>

                      {/* Review block (unchanged) */}
                      {booking.status === 'COMPLETED' && user && booking.driveway.owner.id !== user.id && (
                        <div className="mt-2 pt-4 border-t border-[color:rgb(var(--color-border))]">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900 text-sm">Leave a Review</h4>
                            {existingReviews[booking.driveway.id] && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = new Set(expandedReviews);
                                  if (next.has(booking.id)) next.delete(booking.id);
                                  else next.add(booking.id);
                                  setExpandedReviews(next);
                                }}
                                className="text-sm text-primary-600 hover:text-primary-800 min-h-[44px] min-w-[44px] flex items-center"
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
                                setExpandedReviews((prev) => { const n = new Set(prev); n.delete(booking.id); return n; });
                              }}
                            />
                          )}
                          {existingReviews[booking.driveway.id] && !expandedReviews.has(booking.id) && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-medium">{existingReviews[booking.driveway.id].rating} / 5</span>
                              </div>
                              {existingReviews[booking.driveway.id].comment && (
                                <p className="text-gray-600 text-sm">{existingReviews[booking.driveway.id].comment}</p>
                              )}
                              <button
                                type="button"
                                onClick={() => setExpandedReviews((prev) => { const n = new Set(prev); n.add(booking.id); return n; })}
                                className="mt-2 text-sm text-primary-600 hover:text-primary-800 min-h-[44px]"
                              >
                                Update Review
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions: stacked on mobile (full-width, 44px), inline on sm+ */}
                      <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 pt-4 border-t border-[color:rgb(var(--color-border))]">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {/* Primary: Pay or Get directions */}
                          {booking.status === 'PENDING' && booking.paymentStatus === 'PENDING' && (
                            <Link
                              href={`/checkout?bookingId=${booking.id}`}
                              className="btn btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
                            >
                              Pay now
                            </Link>
                          )}
                          {user && booking.driveway.owner.id !== user.id &&
                            (booking.status === 'CONFIRMED' || (booking.status === 'PENDING' && booking.paymentStatus === 'COMPLETED')) && (
                            <Link
                              href={`/bookings/${booking.id}/navigate`}
                              className="btn btn-primary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2"
                              aria-label={`Get directions to ${booking.driveway.title}`}
                            >
                              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                              Get directions
                            </Link>
                          )}
                          <Link
                            href={`/driveway/${booking.driveway.id}`}
                            className="btn btn-secondary w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center"
                          >
                            View driveway
                          </Link>
                          {booking.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(booking.id, 'CANCELLED')}
                              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors border border-red-200"
                              aria-label={`Cancel booking for ${booking.driveway.title}`}
                            >
                              {user && booking.driveway.owner.id === user.id ? 'Cancel' : 'Cancel booking'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination: large touch targets on mobile */}
        {pagination.totalPages > 1 && (
          <nav className="mt-8" aria-label="Bookings pagination">
            <p className="text-center text-sm text-gray-600 mb-2">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => fetchBookings(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to previous page"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => fetchBookings(page)}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 border rounded-md text-sm font-medium ${
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
              type="button"
              onClick={() => fetchBookings(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="min-h-[44px] min-w-[44px] px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Go to next page"
            >
              Next
            </button>
            </div>
          </nav>
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
