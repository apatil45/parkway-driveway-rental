import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index-tailwind.css'
import App from './App.tsx'

// Register service worker with error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ PWA: Service worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.warn('⚠️ PWA: Service worker registration failed:', error);
        // Don't throw error, just log it
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
