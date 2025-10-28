import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import apiService from '../services/apiService';
import { notificationService } from '../services/notificationService';

interface User {
  id: string;
  name: string;
  email: string;
  roles: ('driver' | 'owner' | 'admin')[];
  carSize?: string;
  drivewaySize?: string;
  phoneNumber?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean; // Derived property
  login: (email: string, password: string, rememberMe?: boolean) => Promise<string>;
  register: (name: string, email: string, password: string, roles: ('driver' | 'owner')[]) => Promise<string>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<boolean>;
  retryAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState(0);

  // Token refresh interval
  const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
  const USER_VALIDATION_INTERVAL = 10 * 60 * 1000; // 10 minutes (increased to reduce API calls)
  const MAX_RETRY_COUNT = 2; // Reduced retry count
  
  // Cache for user data to reduce API calls
  const [lastUserValidation, setLastUserValidation] = useState<number>(0);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Debounced user validation to prevent excessive API calls
  const validateUser = async () => {
    if (isValidating) return; // Prevent concurrent validations
    
    const now = Date.now();
    if (now - lastUserValidation < USER_VALIDATION_INTERVAL) {
      return; // Skip if recently validated
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    setIsValidating(true);
    setLastUserValidation(now);
    
    try {
      const response = await apiService.getUser();
      setUser(response.data);
    } catch (err: any) {
      if (err.statusCode === 401) {
        clearAuthData();
      }
    } finally {
      setIsValidating(false);
    }
  };

  // This useEffect runs once on mount to load the user if a token exists
  useEffect(() => {
    const loadInitialUser = async () => {
      const token = localStorage.getItem('token');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      if (token) {
        try {
          // Check if token is expired before making API call
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;
          
          if (tokenData.exp && tokenData.exp < now) {
            // Token is expired, clear it
            clearAuthData();
            return;
          }
          
          const response = await apiService.getUser();
          setUser(response.data);
          setLastUserValidation(Date.now());
          
          // Set up token refresh if remember me is enabled
          if (rememberMe) {
            setupTokenRefresh();
          }
        } catch (err: any) {
          // Only clear auth data if the token is invalid (401), not for network errors
          if (err.statusCode === 401) {
            clearAuthData();
          } else {
            // Keep the token but don't set user data for network errors
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };
    loadInitialUser();
  }, []);

  // Removed redirect logic from AuthContext to avoid initialization conflicts

  const setupTokenRefresh = () => {
    const refreshInterval = setInterval(async () => {
      if (user && localStorage.getItem('rememberMe') === 'true') {
        try {
          // Only refresh token, don't validate user unless needed
          await refreshToken();
          console.log('AuthContext - Token refreshed successfully');
        } catch (err) {
          console.error("Token refresh failed:", err);
          clearAuthData();
          clearInterval(refreshInterval);
        }
      } else {
        clearInterval(refreshInterval);
      }
    }, TOKEN_REFRESH_INTERVAL);
  };

  const clearAuthData = () => {
    console.log('AuthContext - Clearing auth data');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    setUser(null);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('AuthContext - Attempting login for:', email);
      const response = await apiService.login(email, password);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('rememberMe', rememberMe.toString());

      console.log('AuthContext - Login successful, user:', userData);
      setUser(userData);
      setLastUserValidation(Date.now()); // Set validation timestamp

      // Set up token refresh if remember me is enabled
      if (rememberMe) {
        setupTokenRefresh();
      }

      setIsLoading(false);
      return userData.roles?.[0] || 'driver'; // Return first role instead of single role
    } catch (err: any) {
      console.error("AuthContext - Login error:", err.message);
      
      // Show contextual error notification
      const errorMessage = err.message || 'Login failed. Please check your credentials.';
      notificationService.showAuthError(errorMessage);
      
      // Don't clear auth data on login failure - let other users stay logged in
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, roles: ('driver' | 'owner')[]): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await apiService.register({ name, email, password, roles });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('rememberMe', 'true'); // Auto-remember on registration
      setUser(userData);
      
      // Don't show welcome notification on registration - redirect to login is enough feedback
      
      // Set up token refresh for new registrations
      setupTokenRefresh();
      
      setIsLoading(false);
      return userData.roles?.[0] || 'driver'; // Return first role instead of single role
    } catch (err: any) {
      console.error("AuthContext - Register error:", err.response?.data || err.message);
      
      // Show contextual error notification
      const errorMessage = err.message || 'Registration failed. Please try again.';
      notificationService.showAuthError(errorMessage);
      
      clearAuthData();
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    console.log('AuthContext - Logging out user');
    clearAuthData();
    setIsLoading(false); // Ensure loading is false after logout
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await apiService.refreshToken();
      const token = response.data.token;
      localStorage.setItem('token', token);
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAuthData();
      return false;
    }
  };

  // Cached user validation to reduce API calls
  const validateUserCached = async (): Promise<boolean> => {
    const now = Date.now();
    const timeSinceLastValidation = now - lastUserValidation;
    
    // Only validate if enough time has passed
    if (timeSinceLastValidation < USER_VALIDATION_INTERVAL && user) {
      console.log('AuthContext - Using cached user data, skipping validation');
      return true;
    }

    try {
      const response = await apiService.getUser();
      setUser(response.data);
      setLastUserValidation(now);
      console.log('AuthContext - User validated and cached');
      return true;
    } catch (err: any) {
      console.error("User validation failed:", err);
      if (err.statusCode === 401) {
        clearAuthData();
      }
      return false;
    }
  };

  const retryAuth = async () => {
    console.log("AuthContext - Manual auth retry triggered");
    setRetryCount(0);
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      const success = await validateUserCached();
      if (success) {
        console.log('AuthContext - Manual retry successful');
      } else {
        console.log('AuthContext - Manual retry failed');
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const isAuthenticated = !!user && !!localStorage.getItem('token'); // More robust check

  const contextValue = React.useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    retryAuth
  }), [user, isLoading, isAuthenticated, login, register, logout, updateUser, refreshToken, retryAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
