import React, { useEffect, useState } from 'react';

const PerformanceMonitor: React.FC = () => {
  const [apiCalls, setApiCalls] = useState<number>(0);
  const [lastCall, setLastCall] = useState<string>('');

  useEffect(() => {
    // Monitor API calls by intercepting axios requests
    const originalRequest = window.fetch;
    let callCount = 0;

    window.fetch = async (...args) => {
      callCount++;
      setApiCalls(callCount);
      setLastCall(new Date().toLocaleTimeString());
      
      return originalRequest(...args);
    };

    // Cleanup
    return () => {
      window.fetch = originalRequest;
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '11px',
      zIndex: 9999,
      fontFamily: 'monospace',
      minWidth: '150px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>API Monitor:</div>
      <div>Calls: {apiCalls}</div>
      <div>Last: {lastCall}</div>
    </div>
  );
};

export default PerformanceMonitor;
