import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug: React.FC = () => {
  const { user, isLoading, isAuthenticated, retryAuth } = useAuth();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace',
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Auth Debug:</div>
      <div>isLoading: {isLoading.toString()}</div>
      <div>isAuthenticated: {isAuthenticated.toString()}</div>
      <div>user: {user ? JSON.stringify(user, null, 2) : 'null'}</div>
      <div>token: {localStorage.getItem('token') ? 'exists' : 'missing'}</div>
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={retryAuth}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          Retry Auth
        </button>
      </div>
    </div>
  );
};

export default AuthDebug;
