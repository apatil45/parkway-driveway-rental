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
    let timeoutId: NodeJS.Timeout;
    let isMounted = true;
    
    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[AUTH] Auth check timed out, assuming unauthenticated');
        setAuthState(prev => {
          // Only update if still loading
          if (prev.loading) {
            return {
              ...prev,
              loading: false,
              isAuthenticated: false,
              user: null
            };
          }
          return prev;
        });
      }
    }, 10000); // 10 second timeout
    
    checkAuth();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data;
      
      // If user is null, user is not authenticated (this is now a valid response)
      if (user) {
        setAuthState({
          user,
          loading: false,
          error: '',
          isAuthenticated: true
        });
      } else {
        // No user - not authenticated
        setAuthState({ user: null, loading: false, error: '', isAuthenticated: false });
      }
    } catch (error: any) {
      // Try refresh once on 401 (for expired tokens)
      if (error.response?.status === 401) {
        try {
          await api.post('/auth/refresh');
          const me = await api.get('/auth/me');
          const user = me.data.data;
          if (user) {
            setAuthState({
              user,
              loading: false,
              error: '',
              isAuthenticated: true
            });
          } else {
            setAuthState({ user: null, loading: false, error: '', isAuthenticated: false });
          }
        } catch {
          // Silently handle expected auth failures (no token or refresh failed)
          setAuthState({ user: null, loading: false, error: '', isAuthenticated: false });
        }
      } else {
        // Only set error for unexpected failures
        const errorMessage = error.response?.status >= 500 
          ? 'Failed to verify authentication'
          : '';
        setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: '' }));
      
      const response = await api.post('/auth/login', { email, password });
      const user = response.data.data.user;

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
      const user = response.data.data.user;

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

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    setAuthState({
      user: null,
      loading: false,
      error: '',
      isAuthenticated: false
    });
    router.push('/');
  };

  const requireAuth = () => {
    // Avoid redirect loops: do not redirect if we're already on /login
    if (typeof window !== 'undefined') {
      const onLoginPage = window.location.pathname === '/login';
      if (!authState.isAuthenticated && !authState.loading && !onLoginPage) {
        router.push('/login');
      }
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
