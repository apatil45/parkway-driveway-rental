'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { Card, LoadingSpinner, AddressAutocomplete } from '@/components/ui';
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

    fetchStats();
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
          {/* Personalized Hero Section */}
          <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
            <div className="container py-16">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Welcome back, {user.name?.split(' ')[0]}!
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-primary-100">
                  {isOwner && isDriver
                    ? 'Find parking or manage your driveways'
                    : isOwner
                    ? 'Manage your driveways and earnings'
                    : 'Find the perfect parking spot near you'}
                </p>
                
                {/* Quick Search */}
                <div className="max-w-2xl mx-auto mt-8">
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    <AddressAutocomplete
                      value={searchLocation}
                      onChange={handleLocationInputChange}
                      onLocationSelect={handleSearch}
                      placeholder="Search for parking near..."
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
          {stats && (
            <section className="py-12">
              <div className="container">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform at a Glance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="text-center">
                    <UserGroupIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </Card>
                  <Card className="text-center">
                    <BuildingOfficeIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.activeDriveways.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Available Spaces</div>
                  </Card>
                  <Card className="text-center">
                    <CheckCircleIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.completedBookings.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </Card>
                  <Card className="text-center">
                    <StarIcon className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </Card>
                </div>
              </div>
            </section>
          )}

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
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="container py-24">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Park Smarter, Earn Easier
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                The leading platform connecting drivers with available parking spaces. 
                Find convenient parking or turn your driveway into passive income.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 shadow-sm">
                  Get Started Free
                </Link>
                <Link href="/search" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 shadow-sm">
                  Browse Driveways
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {stats && (
          <section className="py-16 bg-white border-b">
            <div className="container">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString() : '1K+'}
                  </div>
                  <div className="text-gray-600 font-medium">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.activeDriveways > 0 ? stats.activeDriveways.toLocaleString() : '500+'}
                  </div>
                  <div className="text-gray-600 font-medium">Available Spaces</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.completedBookings > 0 ? stats.completedBookings.toLocaleString() : '10K+'}
                  </div>
                  <div className="text-gray-600 font-medium">Successful Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)}★` : '4.8★'}
                  </div>
                  <div className="text-gray-600 font-medium">Average Rating</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-24 bg-gray-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                How Parkway Works
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, secure, and profitable for everyone. Get started in minutes.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-primary-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Find Parking</h3>
                <p className="text-gray-600">
                  Search for available driveways near your destination with real-time availability. 
                  Filter by price, distance, and amenities.
                </p>
              </Card>
              
              <Card className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Earn Money</h3>
                <p className="text-gray-600">
                  List your unused driveway and earn passive income. Set your own rates, 
                  availability, and watch the bookings roll in.
                </p>
              </Card>
              
              <Card className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LockClosedIcon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
                <p className="text-gray-600">
                  All transactions are secure with instant payments and automatic refunds. 
                  We handle everything so you don't have to.
                </p>
              </Card>
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

        {/* Testimonials Section */}
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

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Parkway has completely solved my parking problem. I can always find a spot near my office, 
                  and the prices are reasonable. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary-700 font-semibold">JD</span>
                  </div>
                  <div>
                    <div className="font-semibold">John D.</div>
                    <div className="text-sm text-gray-600">Regular Driver</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "I've been listing my driveway for 6 months and made over $2,000 in passive income. 
                  The process is so simple and the platform handles everything."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-700 font-semibold">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold">Sarah M.</div>
                    <div className="text-sm text-gray-600">Property Owner</div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "The app is intuitive and the customer service is excellent. I've never had any issues, 
                  and the payment process is seamless."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-700 font-semibold">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold">Mike R.</div>
                    <div className="text-sm text-gray-600">Both Driver & Owner</div>
                  </div>
                </div>
              </Card>
            </div>
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
              <Link href="/register" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-white text-primary-600 hover:bg-gray-100 px-6 py-3 shadow-sm">
                Create Free Account
              </Link>
              <Link href="/about" className="inline-flex items-center justify-center rounded-md text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-white text-white hover:bg-white hover:text-primary-600 px-6 py-3 shadow-sm">
                Learn More
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
                  <li><Link href="/about" className="hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/about" className="hover:text-white transition-colors">Privacy Policy</Link></li>
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
