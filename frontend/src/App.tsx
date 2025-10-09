import './App.css'
import './styles/enhanced-responsive.css'
import Register from './components/Register';
import Login from './components/Login';
import OwnerDashboard from './components/OwnerDashboard';
import DriverDashboardNew from './components/DriverDashboardNew';
import ParkwayInterface from './components/ParkwayInterface';
import Home from './components/Home'; // Import the Home component
import Profile from './components/Profile'; // Import the Profile component
import HelpCenter from './components/HelpCenter'; // Import the HelpCenter component
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary component
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Nav from "./components/Nav"; // Import the navigation component
// Debug components - only imported when needed
// import AuthDebug from "./components/dev/AuthDebug";
// import ConnectionTest from "./components/dev/ConnectionTest";
import PWAInstallPrompt from './components/PWAInstallPrompt'; // Import PWA install prompt
import { AuthProvider } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import ProfessionalNotificationSystem from './components/ProfessionalNotificationSystem';
import PerformanceOptimizer from './components/PerformanceOptimizer';
import PerformanceMonitor from './components/PerformanceMonitor';
// ToastContainer removed - using ProfessionalNotificationSystem instead

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
        <Router>
          <PerformanceOptimizer />
          <Nav />
          <ProfessionalNotificationSystem />
          <PerformanceMonitor />
          {/* Debug components - uncomment if needed for troubleshooting */}
          {/* process.env.NODE_ENV === 'development' && (
            <>
              <ConnectionTest />
              <AuthDebug />
            </>
          ) */}
          <main id="main-content" className="app-content" role="main" aria-label="Main content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/owner-dashboard" element={<PrivateRoute allowedRoles={['owner']}><OwnerDashboard /></PrivateRoute>} />
                       <Route path="/driver-dashboard" element={<PrivateRoute allowedRoles={['driver']}><ParkwayInterface /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute allowedRoles={['owner', 'driver']}><Profile /></PrivateRoute>} />
              {/* Catch-all route for 404 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
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
