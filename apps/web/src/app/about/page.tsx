'use client';

import { useEffect, useState } from 'react';
import { Card, LoadingSpinner } from '@/components/ui';
import api from '@/lib/api-client';

interface PublicStats {
  totalUsers: number;
  totalDriveways: number;
  activeDriveways: number;
  totalBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
}

export default function AboutPage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<PublicStats>('/stats/public');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-primary-600">
                Parkway
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-gray-500 hover:text-gray-900">
                Sign In
              </a>
              <a href="/register" className="btn btn-primary">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About Parkway
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The easiest way to find parking or earn money from your driveway. 
            We're revolutionizing how people think about parking spaces.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-600 max-w-4xl mx-auto">
              To create a seamless marketplace where driveway owners can monetize their unused space 
              and drivers can find convenient, affordable parking. We believe that every parking space 
              has value, and we're here to unlock that potential.
            </p>
          </div>
        </Card>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How Parkway Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <div className="p-4 bg-primary-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-700">S</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Drivers</h3>
              <p className="text-gray-600">
                Search for available driveways near your destination with real-time availability. 
                Book instantly and pay securely through our platform.
              </p>
            </Card>

            <Card className="text-center">
              <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-lg font-semibold text-green-700">$</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">For Owners</h3>
              <p className="text-gray-600">
                List your unused driveway and earn passive income from parking rentals. 
                Set your own prices and availability schedule.
              </p>
            </Card>

            <Card className="text-center">
              <div className="p-4 bg-blue-100 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-700">L</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure & Safe</h3>
              <p className="text-gray-600">
                All transactions are secure with instant payments and automatic refunds. 
                We handle all the technical details so you don't have to.
              </p>
            </Card>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Parkway?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Easy to Use</h3>
              <p className="text-gray-600">
                Our intuitive platform makes it simple to find parking or list your driveway. 
                No complicated setup or technical knowledge required.
              </p>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Payments</h3>
              <p className="text-gray-600">
                All payments are processed securely through our platform. 
                Owners get paid instantly, and drivers are protected with automatic refunds.
              </p>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Mobile Friendly</h3>
              <p className="text-gray-600">
                Access Parkway from any device. Our responsive design works perfectly 
                on smartphones, tablets, and desktop computers.
              </p>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Trusted & Reliable</h3>
              <p className="text-gray-600">
                We verify all users and provide 24/7 customer support. 
                Your safety and satisfaction are our top priorities.
              </p>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <Card className="mb-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Platform Statistics</h2>
            {loading ? (
              <div className="py-8">
                <LoadingSpinner />
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Active Users</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats.activeDriveways.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Listed Driveways</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    {stats.completedBookings.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Successful Bookings</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary-600 mb-2">
                    ${stats.totalEarnings > 0 ? stats.totalEarnings.toLocaleString() : '0'}
                  </div>
                  <div className="text-gray-600">Earned by Owners</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-gray-500">
                Statistics coming soon
              </div>
            )}
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of users who are already using Parkway to find parking or earn money.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/register" className="btn btn-primary">
              Start Now - It's Free
            </a>
            <a href="/search" className="btn btn-outline">
              Browse Driveways
            </a>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Parkway</h3>
              <p className="text-gray-400">
                The easiest way to find and rent driveways.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">For Drivers</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/search" className="hover:text-white">Find Parking</a></li>
                <li><a href="/about" className="hover:text-white">How It Works</a></li>
                <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">For Owners</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/register" className="hover:text-white">List Your Driveway</a></li>
                <li><a href="/earnings" className="hover:text-white">Earnings</a></li>
                <li><a href="/host-guide" className="hover:text-white">Host Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Parkway. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
