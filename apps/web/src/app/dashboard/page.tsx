'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useAuth, useDashboardStats } from '@/hooks';
import api from '@/lib/api-client';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon, 
  StarIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ArrowPathIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNowStrict } from 'date-fns';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  totalBookings: number;
  activeBookings: number;
  totalEarnings: number;
  averageRating: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isRead: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError, isAuthenticated, logout } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError, fetchStats } = useDashboardStats();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [refreshingStats, setRefreshingStats] = useState(false);

  // Prevent duplicate fetches in dev StrictMode and on transient re-renders
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !fetchedRef.current) {
      fetchedRef.current = true;
      
      // Wrap fetchStats in try-catch to prevent unhandled promise rejections
      const loadStats = async () => {
        try {
          await fetchStats();
        } catch (error: any) {
          // Error is already handled by useDashboardStats hook
          // This catch prevents unhandled promise rejection
          console.error('Failed to fetch dashboard stats:', error);
        }
      };
      
      loadStats();
      
      // Fetch recent notifications for activity feed
      const fetchNotifications = async () => {
        try {
          setNotificationsError(null);
          const response = await api.get<{ notifications?: any[] }>('/notifications?limit=3&page=1');
          setNotifications(response.data.data?.notifications ?? []);
        } catch (error: any) {
          // User-friendly error handling - don't show intrusive errors
          console.error('Failed to fetch notifications:', error);
          // Only set error if it's not a 401 (auth issues are handled elsewhere)
          if (error.response?.status !== 401) {
            setNotificationsError('Unable to load recent activity. You can still access all notifications from the notification center.');
          }
        } finally {
          setNotificationsLoading(false);
        }
      };
      
      fetchNotifications();
    }
  }, [authLoading, isAuthenticated, user, fetchStats]);

  // Redirect unauthenticated users away from dashboard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);


  const loading = authLoading || statsLoading;
  const error = authError || statsError;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-5xl px-6">
          <div className="h-8 w-64 skeleton"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-28 skeleton"></div>
            <div className="h-28 skeleton"></div>
            <div className="h-28 skeleton"></div>
            <div className="h-28 skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage
          title="Error"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const isOwner = user?.roles.includes('OWNER');
  const isDriver = user?.roles.includes('DRIVER');

  const handleRefreshStats = async () => {
    setRefreshingStats(true);
    try {
      await fetchStats();
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    } finally {
      setRefreshingStats(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}`, { isRead: true });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Manage your {isOwner ? 'driveways and bookings' : 'bookings'} from your dashboard.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshStats}
            disabled={refreshingStats || statsLoading}
            className="flex items-center gap-2"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshingStats ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {statsLoading && !stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-28"></div>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/bookings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <CalendarIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link href="/bookings?status=CONFIRMED">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircleIcon className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                    <p className="text-2xl font-bold">{stats.activeBookings}</p>
                  </div>
                </div>
              </Card>
            </Link>

            {isOwner && (
              <Link href="/bookings?status=COMPLETED">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="w-6 h-6 text-yellow-700" />
                  </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            <Link href="/driveways">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <StarIcon className="w-6 h-6 text-blue-700" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ) : (
          <div className="mb-8">
            <Card className="p-8 text-center">
              <p className="text-gray-600 mb-4">No statistics available yet.</p>
              <p className="text-sm text-gray-500">
                {isOwner 
                  ? 'Start by listing your first driveway to see your stats here.'
                  : 'Make your first booking to see your statistics here.'}
              </p>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isOwner && (
            <Card>
              <div className="text-center">
                <div className="p-4 bg-primary-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <HomeIcon className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Driveways</h3>
                <p className="text-gray-600 mb-4">Add, edit, or remove your driveway listings</p>
                <Link href="/driveways">
                  <Button variant="primary" className="w-full">
                    View Driveways
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {isDriver && (
            <Card>
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MagnifyingGlassIcon className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Parking</h3>
                <p className="text-gray-600 mb-4">Search for available parking spots</p>
                <Link href="/search">
                  <Button variant="primary" className="w-full">
                    Search Now
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <div className="text-center">
                <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpenIcon className="w-8 h-8 text-blue-700" />
                </div>
              <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage your bookings</p>
              <Link href="/bookings">
                <Button variant="primary" className="w-full">
                  View Bookings
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            {notifications.length >= 3 && (
              <button
                onClick={() => {
                  // Trigger notification center to open
                  const bellButton = document.querySelector('button[aria-label*="notification" i], button[aria-label*="bell" i]') as HTMLElement;
                  if (bellButton) {
                    bellButton.click();
                  } else {
                    // Fallback: scroll to top where notification center is
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                View All
              </button>
            )}
          </div>
          {notificationsError && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">{notificationsError}</p>
              </div>
            </div>
          )}
          {notificationsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-200 animate-pulse">
                  <div className="flex items-center flex-1">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification, index) => {
                const getIcon = () => {
                  switch (notification.type) {
                    case 'success':
                      return <CheckCircleIcon className="w-5 h-5 text-green-700" />;
                    case 'error':
                      return <XCircleIcon className="w-5 h-5 text-red-700" />;
                    case 'warning':
                      return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-700" />;
                    default:
                      return <InformationCircleIcon className="w-5 h-5 text-blue-700" />;
                  }
                };
                
                const getBgColor = () => {
                  switch (notification.type) {
                    case 'success':
                      return 'bg-green-100';
                    case 'error':
                      return 'bg-red-100';
                    case 'warning':
                      return 'bg-yellow-100';
                    default:
                      return 'bg-blue-100';
                  }
                };
                
                
                return (
                  <div
                    key={notification.id}
                    className={`flex items-center justify-between py-3 ${
                      index < notifications.length - 1 ? 'border-b border-gray-200' : ''
                    } ${!notification.isRead ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`p-2 ${getBgColor()} rounded-lg mr-3`}>
                        {getIcon()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNowStrict(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                          title="Mark as read"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}