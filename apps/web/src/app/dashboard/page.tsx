'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, LoadingSpinner, ErrorMessage, Button } from '@/components/ui';
import { AppLayout } from '@/components/layout';
import { useAuth, useDashboardStats } from '@/hooks';

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

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError, isAuthenticated, logout } = useAuth();
  const { data: stats, loading: statsLoading, error: statsError, fetchStats } = useDashboardStats();
  const router = useRouter();

  // Prevent duplicate fetches in dev StrictMode and on transient re-renders
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchStats();
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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your {isOwner ? 'driveways and bookings' : 'bookings'} from your dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link href="/bookings">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <span className="text-2xl">📅</span>
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
                    <span className="text-lg font-semibold text-green-700">✓</span>
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
                      <span className="text-lg font-semibold text-yellow-700">$</span>
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
                    <span className="text-lg font-semibold text-blue-700">★</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {isOwner && (
            <Card>
              <div className="text-center">
                <div className="p-4 bg-primary-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-700">H</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Manage Driveways</h3>
                <p className="text-gray-600 mb-4">Add, edit, or remove your driveway listings</p>
                <Link href="/driveways" className="btn btn-primary w-full">
                  View Driveways
                </Link>
              </div>
            </Card>
          )}

          {isDriver && (
            <Card>
              <div className="text-center">
                <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-lg font-semibold text-green-700">S</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Find Parking</h3>
                <p className="text-gray-600 mb-4">Search for available parking spots</p>
                <Link href="/search" className="btn btn-primary w-full">
                  Search Now
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <div className="text-center">
              <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-700">B</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
              <p className="text-gray-600 mb-4">View and manage your bookings</p>
              <Link href="/bookings" className="btn btn-primary w-full">
                View Bookings
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <span className="text-sm font-semibold text-green-700">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Booking Confirmed</p>
                  <p className="text-sm text-gray-600">Your booking for Downtown Premium Spot has been confirmed</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <span className="text-sm font-semibold text-blue-700">$</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Payment Received</p>
                  <p className="text-sm text-gray-600">You received $40.00 for your driveway booking</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <span className="text-sm font-semibold text-yellow-700">★</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">New Review</p>
                  <p className="text-sm text-gray-600">You received a 5-star review for your driveway</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">3 days ago</span>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}