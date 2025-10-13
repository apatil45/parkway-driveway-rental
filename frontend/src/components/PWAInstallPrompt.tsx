import React from 'react';
import { usePWA } from '../hooks/usePWA';

const PWAInstallPrompt: React.FC = () => {
  const { 
    showInstallPrompt, 
    showUpdatePrompt, 
    installApp, 
    dismissInstallPrompt, 
    updateApp, 
    dismissUpdatePrompt,
    pwaInfo 
  } = usePWA();

  if (!showInstallPrompt && !showUpdatePrompt) {
    return null;
  }

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="pwa-prompt-overlay">
          <div className="pwa-prompt">
            <div className="pwa-prompt-header">
              <div className="pwa-prompt-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3>Install Parkway.com</h3>
              <p>Get quick access to find and list driveways on your device</p>
            </div>
            
            <div className="pwa-prompt-features">
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                <span>Quick access from home screen</span>
              </div>
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <span>Works offline</span>
              </div>
              <div className="feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Push notifications</span>
              </div>
            </div>
            
            <div className="pwa-prompt-actions">
              <button 
                className="pwa-prompt-button secondary" 
                onClick={dismissInstallPrompt}
              >
                Not Now
              </button>
              <button 
                className="pwa-prompt-button primary" 
                onClick={installApp}
              >
                Install App
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="pwa-prompt-overlay">
          <div className="pwa-prompt update-prompt">
            <div className="pwa-prompt-header">
              <div className="pwa-prompt-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </div>
              <h3>Update Available</h3>
              <p>A new version of Parkway.com is available with improvements and new features</p>
            </div>
            
            <div className="pwa-prompt-actions">
              <button 
                className="pwa-prompt-button secondary" 
                onClick={dismissUpdatePrompt}
              >
                Later
              </button>
              <button 
                className="pwa-prompt-button primary" 
                onClick={updateApp}
              >
                Update Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallPrompt;
