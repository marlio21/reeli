import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
    console.log('beforeinstallprompt captured globally');
  });

  // v52.5.38: Cache/service-worker recovery is no longer part of the normal
  // startup path because unregistering workers and deleting caches on every
  // page load makes Public cards feel slow. Keep it available only for manual
  // debugging via ?clearUreelCache=1.
  if (new URLSearchParams(window.location.search).get('clearUreelCache') === '1') {
    window.addEventListener('load', () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations()
          .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
          .catch((err) => console.warn('ureel service worker cleanup failed', err));
      }
      if ('caches' in window) {
        caches.keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch((err) => console.warn('ureel cache cleanup failed', err));
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
