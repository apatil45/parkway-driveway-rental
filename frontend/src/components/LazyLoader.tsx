import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadTime?: number;
}

const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  children, 
  fallback,
  minLoadTime = 300 
}) => {
  const [isMinTimeElapsed, setIsMinTimeElapsed] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsMinTimeElapsed(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  const defaultFallback = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '2rem'
    }}>
      <LoadingSpinner />
      <p style={{
        marginTop: '1rem',
        color: '#64748b',
        fontSize: '1rem',
        fontWeight: '500'
      }}>
        Loading component...
      </p>
    </div>
  );

  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Higher-order component for lazy loading
export const withLazyLoader = <P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Omit<LazyLoaderProps, 'children'>
) => {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader {...loadingProps}>
      <LazyComponent {...props} ref={ref} />
    </LazyLoader>
  ));
};

// Utility function to create lazy components with custom loading
export const createLazyComponent = <P extends object>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  loadingProps?: Omit<LazyLoaderProps, 'children'>
) => {
  const LazyComponent = React.lazy(importFn);
  
  return React.forwardRef<any, P>((props, ref) => (
    <LazyLoader {...loadingProps}>
      <LazyComponent {...props} ref={ref} />
    </LazyLoader>
  ));
};

export default LazyLoader;
