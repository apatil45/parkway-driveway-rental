import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import errorService from '../services/errorService';
import ProfessionalErrorModal from '../components/ProfessionalErrorModal';

interface ErrorConfig {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  details?: {
    code?: string;
    field?: string;
    suggestion?: string;
    supportEmail?: string;
  };
  actions?: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
  showRetry?: boolean;
  onRetry?: () => void;
  showReport?: boolean;
  onReport?: () => void;
}

interface ErrorContextType {
  showError: (config: ErrorConfig) => void;
  showNetworkError: (onRetry?: () => void) => void;
  showAuthenticationError: () => void;
  showValidationError: (field: string, message: string) => void;
  showBookingError: (message: string, onRetry?: () => void) => void;
  showPaymentError: (message: string, onRetry?: () => void) => void;
  showSuccess: (message: string, autoClose?: boolean) => void;
  showInfo: (message: string, autoClose?: boolean) => void;
  showWarning: (message: string, autoClose?: boolean) => void;
  handleApiError: (error: any, context?: string) => void;
  close: () => void;
  clearAll: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<ErrorConfig | null>(null);

  useEffect(() => {
    const unsubscribe = errorService.subscribe((error) => {
      setCurrentError(error);
    });

    return unsubscribe;
  }, []);

  const contextValue: ErrorContextType = {
    showError: errorService.showError.bind(errorService),
    showNetworkError: errorService.showNetworkError.bind(errorService),
    showAuthenticationError: errorService.showAuthenticationError.bind(errorService),
    showValidationError: errorService.showValidationError.bind(errorService),
    showBookingError: errorService.showBookingError.bind(errorService),
    showPaymentError: errorService.showPaymentError.bind(errorService),
    showSuccess: errorService.showSuccess.bind(errorService),
    showInfo: errorService.showInfo.bind(errorService),
    showWarning: errorService.showWarning.bind(errorService),
    handleApiError: errorService.handleApiError.bind(errorService),
    close: errorService.close.bind(errorService),
    clearAll: errorService.clearAll.bind(errorService),
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {currentError && (
        <ProfessionalErrorModal
          isOpen={!!currentError}
          onClose={() => errorService.close()}
          title={currentError.title}
          message={currentError.message}
          type={currentError.type}
          details={currentError.details}
          actions={currentError.actions}
          showRetry={currentError.showRetry}
          onRetry={currentError.onRetry}
          showReport={currentError.showReport}
          onReport={currentError.onReport}
        />
      )}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
