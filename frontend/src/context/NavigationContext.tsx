import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationContextType {
  currentPath: string;
  previousPath: string | null;
  navigateTo: (path: string, options?: { replace?: boolean; state?: any }) => void;
  goBack: () => void;
  canGoBack: boolean;
  setNavigationHistory: (history: string[]) => void;
  getNavigationHistory: () => string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [previousPath, setPreviousPath] = useState<string | null>(null);

  const navigateTo = useCallback((path: string, options?: { replace?: boolean; state?: any }) => {
    // Update navigation history
    if (!options?.replace) {
      setPreviousPath(location.pathname);
      setNavigationHistory(prev => [...prev, location.pathname]);
    }
    
    navigate(path, options);
  }, [navigate, location.pathname]);

  const goBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const lastPath = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      navigate(lastPath);
    } else if (previousPath) {
      navigate(previousPath);
    } else {
      navigate(-1); // Browser back
    }
  }, [navigate, navigationHistory, previousPath]);

  const canGoBack = navigationHistory.length > 0 || previousPath !== null;

  const setNavigationHistoryState = useCallback((history: string[]) => {
    setNavigationHistory(history);
  }, []);

  const getNavigationHistoryState = useCallback(() => {
    return navigationHistory;
  }, [navigationHistory]);

  const contextValue: NavigationContextType = {
    currentPath: location.pathname,
    previousPath,
    navigateTo,
    goBack,
    canGoBack,
    setNavigationHistory: setNavigationHistoryState,
    getNavigationHistory: getNavigationHistoryState,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
