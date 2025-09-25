import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
  allowedRoles?: ('driver' | 'owner' | 'admin')[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth(); // AuthState no longer needed

  console.log('PrivateRoute - isLoading:', isLoading);
  console.log('PrivateRoute - isAuthenticated:', isAuthenticated);
  console.log('PrivateRoute - user:', user);

  if (isLoading) {
    console.log('PrivateRoute: Loading authentication...');
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  // Explicitly check for isAuthenticated and user (which implies a token presence now)
  if (!isAuthenticated || !user) {
    console.log('PrivateRoute: Not authenticated or user data missing, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !user.roles.some(role => allowedRoles.includes(role))) {
    console.log('PrivateRoute: User roles not allowed, redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('PrivateRoute: User authenticated and authorized, rendering children.');
  return children;
};

export default PrivateRoute;
