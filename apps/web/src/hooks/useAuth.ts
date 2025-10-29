import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: '',
    isAuthenticated: false
  });
  
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthState({
          user: null,
          loading: false,
          error: '',
          isAuthenticated: false
        });
        return;
      }

      const response = await api.get('/auth/me');
      setAuthState({
        user: response.data.data,
        loading: false,
        error: '',
        isAuthenticated: true
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthState({
          user: null,
          loading: false,
          error: '',
          isAuthenticated: false
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to verify authentication'
        }));
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        loading: false,
        error: '',
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await api.post('/auth/register', userData);
      const { user, token } = response.data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        loading: false,
        error: '',
        isAuthenticated: true
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuthState({
      user: null,
      loading: false,
      error: '',
      isAuthenticated: false
    });
    router.push('/');
  };

  const requireAuth = () => {
    if (!authState.isAuthenticated && !authState.loading) {
      router.push('/login');
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    requireAuth,
    checkAuth
  };
}
