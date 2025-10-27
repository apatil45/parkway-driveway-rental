// CSS imports removed - now using Tailwind CSS
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary component
import PrivateRoute from './components/PrivateRoute';
import Nav from "./components/Nav"; // Import the navigation component
import LoadingSpinner from './components/LoadingSpinner';
import { useAuth } from './context/AuthContext';

// Lazy load components for code splitting
const Register = lazy(() => import('./components/Register'));
const Login = lazy(() => import('./components/Login'));
const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const DriverDashboardNew = lazy(() => import('./components/DriverDashboardNew'));
const ParkwayInterface = lazy(() => import('./components/ParkwayInterface'));
const HomeComponent = lazy(() => import('./components/Home'));
const Profile = lazy(() => import('./components/Profile'));
const HelpCenterComponent = lazy(() => import('./components/HelpCenter'));
// Debug components - only imported when needed
// import AuthDebug from "./components/dev/AuthDebug";
// import ConnectionTest from "./components/dev/ConnectionTest";
import PWAInstallPrompt from './components/PWAInstallPrompt'; // Import PWA install prompt
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import { BookingProvider } from './context/BookingContext';
import ProfessionalNotificationSystem from './components/ProfessionalNotificationSystem';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import PerformanceMonitor from './components/PerformanceMonitor';
import ResponsiveDesignTester from './components/ResponsiveDesignTester';
import ResponsiveTestPage from './components/ResponsiveTestPage';
// ToastContainer removed - using ProfessionalNotificationSystem instead

// Component to handle authentication-based redirects
const AuthRedirectHandler: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && user && isAuthenticated) {
      const currentPath = location.pathname;
      
      // Only redirect if user is on home page or profile page
      if (currentPath === '/' || currentPath === '/profile') {
        // Determine appropriate dashboard based on user roles
        if (user.roles?.includes('driver')) {
          window.location.replace('/driver-dashboard');
        } else if (user.roles?.includes('owner')) {
          window.location.replace('/owner-dashboard');
        }
      }
    }
  }, [isLoading, user, isAuthenticated, location.pathname]);

  return null; // This component doesn't render anything
};

const App: React.FC = () => {
  const [showResponsiveTester, setShowResponsiveTester] = useState(false);

  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <BookingProvider>
            <Router>
          <AuthRedirectHandler />
          <PerformanceOptimizer />
          <Nav />
          <ProfessionalNotificationSystem />
          <PerformanceMonitor />
          
          {/* Responsive Design Tester - Development Only */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <button
                onClick={() => setShowResponsiveTester(true)}
                className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
                title="Open Responsive Design Tester"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
              <ResponsiveDesignTester 
                isOpen={showResponsiveTester} 
                onClose={() => setShowResponsiveTester(false)} 
              />
            </>
          )}
          {/* Debug components - uncomment if needed for troubleshooting */}
          {/* process.env.NODE_ENV === 'development' && (
            <>
              <ConnectionTest />
              <AuthDebug />
            </>
          ) */}
          <main id="main-content" className="app-content" role="main" aria-label="Main content">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<HomeComponent />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/help" element={<HelpCenterComponent />} />
                <Route path="/owner-dashboard" element={<PrivateRoute allowedRoles={['owner']}><OwnerDashboard /></PrivateRoute>} />
                <Route path="/driver-dashboard" element={<PrivateRoute allowedRoles={['driver']}><ParkwayInterface /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute allowedRoles={['owner', 'driver']}><Profile /></PrivateRoute>} />
                {/* Development-only test route */}
                {process.env.NODE_ENV === 'development' && (
                  <Route path="/responsive-test" element={<ResponsiveTestPage />} />
                )}
                {/* Catch-all route for 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
            </Router>
            {/* ToastContainer removed - using ProfessionalNotificationSystem instead */}
            <PWAInstallPrompt />
          </BookingProvider>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
};

export default App;
