import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('checking...');
  const [lastCheck, setLastCheck] = useState<string>('');

  const checkBackend = async () => {
    try {
      // Try to check if backend is running by hitting a known endpoint
      const response = await axios.get('/api/auth/user', { 
        timeout: 5000,
        headers: {
          'x-auth-token': localStorage.getItem('token') || ''
        }
      });
      setBackendStatus('✅ Connected & Authenticated');
      setLastCheck(new Date().toLocaleTimeString());
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setBackendStatus('❌ Backend not running');
      } else if (error.response?.status === 404) {
        setBackendStatus('⚠️ Backend running (404 endpoint)');
      } else if (error.response?.status === 401) {
        setBackendStatus('✅ Backend running (auth required)');
      } else if (error.response?.status >= 200 && error.response?.status < 500) {
        setBackendStatus('✅ Backend running');
      } else {
        setBackendStatus(`❌ Error: ${error.response?.status || error.message}`);
      }
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkBackend();
    const interval = setInterval(checkBackend, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Backend Status:</div>
      <div>{backendStatus}</div>
      <div style={{ fontSize: '10px', marginTop: '5px' }}>
        Last check: {lastCheck}
      </div>
      <button 
        onClick={checkBackend}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '3px 8px',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '10px',
          marginTop: '5px'
        }}
      >
        Check Now
      </button>
    </div>
  );
};

export default ConnectionTest;
