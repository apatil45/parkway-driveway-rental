'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, LoadingSpinner, AddressAutocomplete, ImageWithPlaceholder } from '@/components/ui';
import { useAuth } from '@/hooks';
import api from '@/lib/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  HomeIcon,
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface PublicStats {
  totalUsers: number;
  totalDriveways: number;
  activeDriveways: number;
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');

  const isOwner = user?.roles.includes('OWNER');
  const isDriver = user?.roles.includes('DRIVER');

  useEffect(() => {
    // Fetch public stats (non-blocking - page can render without stats)
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/public');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Don't block page rendering if stats fail
      } finally {
        setStatsLoading(false);
      }
    };

    // Fetch real reviews for testimonials
    const fetchTestimonials = async () => {
      try {
        const response = await api.get('/reviews?limit=3&page=1');
        setTestimonials(response.data.data?.reviews || []);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        // Don't block page rendering if testimonials fail
      } finally {
        setTestimonialsLoading(false);
      }
    };

    fetchStats();
    fetchTestimonials();
  }, []);

  const handleSearch = (lat: number, lon: number) => {
    router.push(`/search?latitude=${lat}&longitude=${lon}`);
  };

  const handleLocationInputChange = (value: string) => {
    setSearchLocation(value);
  };

  // Only wait for auth to load, not stats (stats can load in background)
  // Add timeout to prevent infinite loading
  const [authTimeout, setAuthTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        setAuthTimeout(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [authLoading]);

  // Show loading only if auth is still loading and hasn't timed out
  if (authLoading && !authTimeout) {
    return (
      <AppLayout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  // Logged-in user view
  if (isAuthenticated && user) {
    return (
      <AppLayout showFooter={false}>
        <main className="min-h-screen">
          {/* Personalized Hero Section - Enhanced */}
          <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>
            
            <div className="container relative py-20 md:py-24">
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4">
                    Welcome back, {user.name?.split(' ')[0]}!
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-primary-100">
                    {isOwner && isDriver
                      ? 'Find parking or manage your driveways'
                      : isOwner
                      ? 'Manage your driveways and earnings'
                      : 'Find the perfect parking spot near you'}
                  </p>
                </div>
                
                {/* Prominent Search */}
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Where do you need parking?
                    </h2>
                    <AddressAutocomplete
                      value={searchLocation}
                      onChange={handleLocationInputChange}
                      onLocationSelect={handleSearch}
                      placeholder="Enter address, city, or landmark..."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="py-12 bg-gray-50">
            <div className="container">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {isDriver && (
                  <Link href="/search">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="flex items-start">
                        <div className="p-3 bg-primary-100 rounded-lg">
                          <MagnifyingGlassIcon className="w-6 h-6 text-primary-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">Find Parking</h3>
                          <p className="text-gray-600 text-sm">
                            Search for available driveways near your destination
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                {isOwner && (
                  <Link href="/driveways/new">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="flex items-start">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <HomeIcon className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold mb-2">List Driveway</h3>
                          <p className="text-gray-600 text-sm">
                            Start earning from your unused driveway space
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )}

                <Link href="/bookings">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpenIcon className="w-6 h-6 text-blue-700" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold mb-2">My Bookings</h3>
                        <p className="text-gray-600 text-sm">
                          View and manage your current and past bookings
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>

                <Link href="/dashboard">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="flex items-start">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-purple-700" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
                        <p className="text-gray-600 text-sm">
                          View your statistics, earnings, and account overview
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            </div>
          </section>

          {/* Platform Stats */}
          <section className="py-12">
            <div className="container">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform at a Glance</h2>
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 skeleton rounded"></div>
                      <div className="h-8 w-16 mx-auto mb-2 skeleton rounded"></div>
                      <div className="h-4 w-20 mx-auto skeleton rounded"></div>
                    </Card>
                  ))}
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <UserGroupIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </Card>
                  <Card className="text-center">
                    <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-gray-900">{stats.activeDriveways.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Available Spaces</div>
                  </Card>
                  <Card className="text-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-gray-900">{stats.completedBookings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </Card>
                  <Card className="text-center">
                    <StarIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" aria-hidden="true" />
                    <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </Card>
                </div>
              ) : null}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-12 bg-gray-50">
            <div className="container">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Parkway?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <ShieldCheckIcon className="w-10 h-10 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Secure & Verified</h3>
                  <p className="text-gray-600">
                    All users and driveways are verified. Secure payment processing with instant transfers.
                  </p>
                </Card>
                <Card>
                  <ClockIcon className="w-10 h-10 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">24/7 Availability</h3>
                  <p className="text-gray-600">
                    Book parking anytime, anywhere. Real-time availability ensures you always find a spot.
                  </p>
                </Card>
                <Card>
                  <CurrencyDollarIcon className="w-10 h-10 text-primary-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Fair Pricing</h3>
                  <p className="text-gray-600">
                    Transparent pricing with no hidden fees. Set your own rates or find the best deals.
                  </p>
                </Card>
              </div>
            </div>
          </section>
        </main>
      </AppLayout>
    );
  }

  // Logged-out user view (marketing page)
  return (
    <AppLayout showFooter={false}>
      <main className="min-h-screen">
        {/* Hero Section - Enhanced with Search */}
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
          </div>
          
          <div className="container relative py-20 md:py-32">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                  Park Smarter,<br />Earn Easier
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
                  The leading platform connecting drivers with available parking spaces. 
                  Find convenient parking or turn your driveway into passive income.
                </p>
              </div>
              
              {/* Prominent Search Bar */}
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                    Find parking near your destination
                  </h2>
                  <AddressAutocomplete
                    value={searchLocation}
                    onChange={handleLocationInputChange}
                    onLocationSelect={handleSearch}
                    placeholder="Enter address, city, or landmark..."
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Get Started Free
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4">
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white border-b">
          <div className="container">
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <div className="h-16 w-24 mx-auto mb-2 skeleton rounded"></div>
                    <div className="h-4 w-20 mx-auto skeleton rounded"></div>
                  </div>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-gray-600 font-medium">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.activeDriveways.toLocaleString()}
                  </div>
                  <div className="text-gray-600 font-medium">Available Spaces</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.completedBookings.toLocaleString()}
                  </div>
                  <div className="text-gray-600 font-medium">Successful Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}★` : '—'}
                  </div>
                  <div className="text-gray-600 font-medium">Average Rating</div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* How It Works Section - Enhanced with Steps */}
        <section className="py-24 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                How Parkway Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, secure, and profitable for everyone. Get started in minutes.
              </p>
            </div>
            
            {/* For Drivers */}
            <div className="mb-20">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Drivers</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    1
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MagnifyingGlassIcon className="w-10 h-10 text-primary-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Search & Find</h3>
                    <p className="text-gray-600">
                      Search for available driveways near your destination with real-time availability. 
                      Filter by price, distance, and amenities to find the perfect spot.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    2
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ClockIcon className="w-10 h-10 text-green-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Book Instantly</h3>
                    <p className="text-gray-600">
                      Reserve your spot with a few clicks. Get instant confirmation and directions 
                      to your parking space. Cancel anytime with a full refund.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    3
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="w-10 h-10 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Park & Go</h3>
                    <p className="text-gray-600">
                      Arrive at your reserved spot, park safely, and go about your day. 
                      Secure payments are handled automatically.
                    </p>
                  </Card>
                </div>
              </div>
            </div>

            {/* For Owners */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">For Property Owners</h3>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    1
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <HomeIcon className="w-10 h-10 text-green-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">List Your Space</h3>
                    <p className="text-gray-600">
                      Create a free listing in minutes. Add photos, set your rates, 
                      and define availability. No upfront costs or commitments.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    2
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CurrencyDollarIcon className="w-10 h-10 text-primary-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Get Bookings</h3>
                    <p className="text-gray-600">
                      Receive booking requests from verified drivers. 
                      Accept or decline based on your availability.
                    </p>
                  </Card>
                </div>
                
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-lg z-10">
                    3
                  </div>
                  <Card className="text-center p-8 h-full hover:shadow-xl transition-shadow">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ChartBarIcon className="w-10 h-10 text-blue-700" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">Earn Money</h3>
                    <p className="text-gray-600">
                      Get paid instantly after each booking. Keep 85-90% of earnings 
                      with transparent pricing and automatic payouts.
                    </p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-white">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Parkway?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Trusted by thousands of drivers and property owners nationwide
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <ShieldCheckIcon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Verified Users</h3>
                <p className="text-gray-600 text-sm">
                  All users and driveways go through our verification process for your peace of mind.
                </p>
              </Card>

              <Card>
                <ClockIcon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
                <p className="text-gray-600 text-sm">
                  Our support team is available around the clock to help with any questions or issues.
                </p>
              </Card>

              <Card>
                <MapPinIcon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Smart Matching</h3>
                <p className="text-gray-600 text-sm">
                  Advanced algorithms match you with the best parking options based on location and preferences.
                </p>
              </Card>

              <Card>
                <StarIcon className="w-10 h-10 text-primary-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Top Rated</h3>
                <p className="text-gray-600 text-sm">
                  {stats?.averageRating ? `${stats.averageRating.toFixed(1)}★` : '4.8★'} average rating 
                  from thousands of satisfied users.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section - Using Real Reviews */}
        <section className="py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
              <p className="text-xl text-gray-600">
                Real feedback from real users
              </p>
            </div>

            {testimonialsLoading ? (
              <div className="grid md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-24 bg-gray-200 rounded mb-4"></div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : testimonials && testimonials.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.slice(0, 3).map((review: any) => {
                  const initials = review.user?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U';
                  return (
                    <Card key={review.id}>
                      <div className="flex items-center mb-4" role="img" aria-label={`${review.rating} out of 5 stars`}>
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="text-gray-700 mb-4 italic">
                        "{review.comment}"
                      </p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          {review.user?.avatar ? (
                            <ImageWithPlaceholder
                              src={review.user.avatar}
                              alt={`${review.user.name}'s avatar`}
                              className="w-10 h-10 rounded-full"
                              fallbackText={initials}
                            />
                          ) : (
                            <span className="text-primary-700 font-semibold text-sm" aria-label={`${review.user?.name || 'User'}'s avatar`}>
                              {initials}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {review.user?.name || 'Anonymous'}
                          </div>
                          <div className="text-sm text-gray-600">Verified User</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary-600 text-white">
          <div className="container text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using Parkway to find parking or earn money. 
              It's free to sign up and takes less than 2 minutes.
            </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-primary-600 hover:bg-gray-50 px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  Create Free Account
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-4">
                  View Pricing
                </Link>
              </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="container py-12">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Parkway</h3>
                <p className="text-gray-400">
                  The easiest way to find and rent driveways. Connecting drivers with property owners nationwide.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Drivers</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/search" className="hover:text-white transition-colors">Find Parking</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">How It Works</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">For Owners</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/register" className="hover:text-white transition-colors">List Your Driveway</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Host Guide</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">Get Started</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><Link href="/about" className="hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Parkway. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </AppLayout>
  );
}
