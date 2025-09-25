import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

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
  const MAX_RETRY_COUNT = 3;

  // This useEffect runs once on mount to load the user if a token exists
  useEffect(() => {
    const loadInitialUser = async () => {
      const token = localStorage.getItem('token');
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      
      console.log('AuthContext - Loading initial user, token exists:', !!token);
      
      if (token) {
        axios.defaults.headers.common['x-auth-token'] = token;
        try {
          const res = await axios.get('/api/auth/user');
          console.log('AuthContext - User loaded successfully:', res.data);
          setUser(res.data);
          
          // Set up token refresh if remember me is enabled
          if (rememberMe) {
            setupTokenRefresh();
          }
        } catch (err: any) {
          console.error("AuthContext - Error loading initial user:", err);
          console.error("AuthContext - Error details:", err.response?.data || err.message);
          console.error("AuthContext - Token was:", token);
          // Only clear auth data if the token is invalid (401), not for network errors
          if (err.response?.status === 401) {
            console.log("AuthContext - Token is invalid, clearing auth data");
            clearAuthData();
          } else {
            console.log("AuthContext - Network or server error, keeping token for retry");
            // Keep the token but don't set user data
            setUser(null);
            // Retry after a delay if we haven't exceeded max retries
            if (retryCount < MAX_RETRY_COUNT) {
              console.log(`AuthContext - Scheduling retry ${retryCount + 1}/${MAX_RETRY_COUNT}`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
                loadInitialUser();
              }, 2000 * (retryCount + 1)); // Exponential backoff
            }
          }
        }
      } else {
        console.log('AuthContext - No token found, user not authenticated');
      }
      setIsLoading(false);
    };
    loadInitialUser();
  }, []);

  const setupTokenRefresh = () => {
    const refreshInterval = setInterval(async () => {
      if (user && localStorage.getItem('rememberMe') === 'true') {
        try {
          await refreshToken();
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
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('AuthContext - Attempting login for:', email);
      const res = await axios.post('/api/auth/login', { email, password });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('rememberMe', rememberMe.toString());
      axios.defaults.headers.common['x-auth-token'] = token;

      const userRes = await axios.get('/api/auth/user');
      console.log('AuthContext - Login successful, user:', userRes.data);
      setUser(userRes.data);

      // Set up token refresh if remember me is enabled
      if (rememberMe) {
        setupTokenRefresh();
      }

      setIsLoading(false);
      return userRes.data.role;
    } catch (err: any) {
      console.error("AuthContext - Login error:", err.response?.data || err.message);
      clearAuthData();
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string, roles: ('driver' | 'owner')[]): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/auth/register', { name, email, password, roles });
      const token = res.data.token;
      localStorage.setItem('token', token);
      localStorage.setItem('rememberMe', 'true'); // Auto-remember on registration
      axios.defaults.headers.common['x-auth-token'] = token;

      const userRes = await axios.get('/api/auth/user');
      setUser(userRes.data);
      
      // Set up token refresh for new registrations
      setupTokenRefresh();
      
      setIsLoading(false);
      return userRes.data.role;
    } catch (err: any) {
      console.error("AuthContext - Register error:", err.response?.data || err.message);
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
      const res = await axios.post('/api/auth/refresh');
      const token = res.data.token;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['x-auth-token'] = token;
      return true;
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAuthData();
      return false;
    }
  };

  const retryAuth = () => {
    console.log("AuthContext - Manual auth retry triggered");
    setRetryCount(0);
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      axios.get('/api/auth/user')
        .then(res => {
          console.log('AuthContext - Manual retry successful:', res.data);
          setUser(res.data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('AuthContext - Manual retry failed:', err);
          if (err.response?.status === 401) {
            clearAuthData();
          }
          setIsLoading(false);
        });
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
