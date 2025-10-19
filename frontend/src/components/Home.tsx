import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import QuickActions from './QuickActions';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // For users with multiple roles, show both options
      if (user?.roles?.includes('driver') && user?.roles?.includes('owner')) {
        // User has both roles - they can choose from navigation
        return;
      } else if (user?.roles?.includes('driver')) {
        navigate('/driver-dashboard');
      } else if (user?.roles?.includes('owner')) {
        navigate('/owner-dashboard');
      }
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                {isAuthenticated ? (
                  <>Welcome back, {user?.name || 'User'}!</>
                ) : (
                  <>Find & Rent Driveways<br />Instantly</>
                )}
              </h1>
              
              <p className="text-lg sm:text-xl md:text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-2xl">
                {isAuthenticated ? (
                  user?.roles?.includes('driver') && user?.roles?.includes('owner')
                    ? 'Access your driver and owner dashboards from the navigation above.'
                    : user?.roles?.includes('driver') 
                      ? 'Ready to find your next parking spot?'
                      : 'Manage your driveway listings and earnings.'
                ) : (
                  'Connect drivers with homeowners for secure, convenient parking solutions.'
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-black rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  onClick={handleGetStarted}
                >
                  {isAuthenticated ? (
                    user?.roles?.includes('driver') && user?.roles?.includes('owner')
                      ? 'Choose Dashboard'
                      : 'Go to Dashboard'
                  ) : 'Get Started'}
                </button>
                
                {!isAuthenticated && (
                  <Link 
                    to="/login" 
                    className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 bg-white/20 rounded-3xl backdrop-blur-sm border border-white/30 p-6 sm:p-8">
                <div className="relative w-full h-full">
                  {/* House */}
                  <div className="absolute bottom-8 left-8 w-16 h-20 bg-white/30 rounded-lg">
                    <div className="absolute -top-2 left-0 w-0 h-0 border-l-8 border-r-8 border-b-4 border-l-transparent border-r-transparent border-b-white/30"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-6 bg-white/40 rounded"></div>
                    <div className="absolute top-4 right-2 w-3 h-3 bg-white/40 rounded"></div>
                  </div>
                  {/* Car */}
                  <div className="absolute bottom-4 right-8 w-12 h-6 bg-white/30 rounded-lg">
                    <div className="absolute -bottom-1 left-1 w-2 h-2 bg-white/40 rounded-full"></div>
                    <div className="absolute -bottom-1 right-1 w-2 h-2 bg-white/40 rounded-full"></div>
                  </div>
                  {/* Driveway lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <QuickActions />

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Simple steps to connect drivers with homeowners for convenient parking solutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-900">For Drivers</h3>
                <p className="text-gray-600 leading-relaxed">
                  Search for available driveways near your destination and book instantly with secure payments.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-900">For Owners</h3>
                <p className="text-gray-600 leading-relaxed">
                  List your unused driveway and earn money from drivers who need parking in your area.
                </p>
              </div>
            </div>
            
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-gray-900">Secure & Easy</h3>
                <p className="text-gray-600 leading-relaxed">
                  All transactions are secure with instant payments and real-time availability updates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the best in driveway rental with our innovative platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Search</h3>
              <p className="text-gray-600 leading-relaxed">
                Find driveways by location, price, and car size compatibility with our advanced search.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Earn Money</h3>
              <p className="text-gray-600 leading-relaxed">
                Turn your unused driveway into a steady income stream with flexible pricing.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Secure Payments</h3>
              <p className="text-gray-600 leading-relaxed">
                Safe transactions with instant payment processing and fraud protection.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-6">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mobile Friendly</h3>
              <p className="text-gray-600 leading-relaxed">
                Access everything from your phone, anywhere, anytime with our responsive design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-12 sm:py-16 md:py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Ready to Start?</h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of drivers and homeowners already using our platform for convenient parking solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Account
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;