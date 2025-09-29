import './App.css'
import ImprovedRegister from './components/ImprovedRegister';
import ImprovedLogin from './components/ImprovedLogin';
import OwnerDashboard from './components/OwnerDashboard';
import DriverDashboard from './components/DriverDashboard';
import ImprovedHome from './components/ImprovedHome'; // Import the improved Home component
import Profile from './components/Profile'; // Import the Profile component
import ErrorBoundary from './components/ErrorBoundary'; // Import the ErrorBoundary component
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import ImprovedNav from "./components/ImprovedNav"; // Import the improved navigation component
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
          <ImprovedNav />
          <ProfessionalNotificationSystem />
          <PerformanceMonitor />
          {/* Debug components - uncomment if needed for troubleshooting */}
          {/* process.env.NODE_ENV === 'development' && (
            <>
              <ConnectionTest />
              <AuthDebug />
            </>
          ) */}
          <div className="app-content">
            <Routes>
              <Route path="/" element={<ImprovedHome />} />
              <Route path="/register" element={<ImprovedRegister />} />
              <Route path="/login" element={<ImprovedLogin />} />
              <Route path="/owner-dashboard" element={<PrivateRoute allowedRoles={['owner']}><OwnerDashboard /></PrivateRoute>} />
              <Route path="/driver-dashboard" element={<PrivateRoute allowedRoles={['driver']}><DriverDashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute allowedRoles={['owner', 'driver']}><Profile /></PrivateRoute>} />
            </Routes>
          </div>
        </Router>
          {/* ToastContainer removed - using ProfessionalNotificationSystem instead */}
          <PWAInstallPrompt />
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
};

export default App;
