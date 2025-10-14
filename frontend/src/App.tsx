// CSS imports removed - now using Tailwind CSS
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary component
import PrivateRoute from './components/PrivateRoute';
import Nav from "./components/Nav"; // Import the navigation component
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load components for code splitting
const Register = lazy(() => import('./components/Register'));
const Login = lazy(() => import('./components/Login'));
const OwnerDashboard = lazy(() => import('./components/OwnerDashboard'));
const DriverDashboardNew = lazy(() => import('./components/DriverDashboardNew'));
const ParkwayInterface = lazy(() => import('./components/ParkwayInterface'));
const Home = lazy(() => import('./components/Home'));
const Profile = lazy(() => import('./components/Profile'));
const HelpCenter = lazy(() => import('./components/HelpCenter'));
// Debug components - only imported when needed
// import AuthDebug from "./components/dev/AuthDebug";
// import ConnectionTest from "./components/dev/ConnectionTest";
import PWAInstallPrompt from './components/PWAInstallPrompt'; // Import PWA install prompt
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import ProfessionalNotificationSystem from './components/ProfessionalNotificationSystem';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import PerformanceMonitor from './components/PerformanceMonitor';
import ResponsiveDesignTester from './components/ResponsiveDesignTester';
import ResponsiveTestPage from './components/ResponsiveTestPage';
// ToastContainer removed - using ProfessionalNotificationSystem instead

const App: React.FC = () => {
  const [showResponsiveTester, setShowResponsiveTester] = useState(false);

  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
        <Router>
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
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/help" element={<HelpCenter />} />
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
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
};

export default App;
