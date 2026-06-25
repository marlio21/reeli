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

  // v52.5.22 Recovery: disable the old service worker during active public-render debugging.
  // Some mobile browsers can keep a broken JS chunk after rapid ZIP deployments.
  // Removing the worker/caches forces the Public Link to use the newest Vercel build.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
        .then(() => console.log('ureel service workers cleared for recovery build'))
        .catch((err) => console.warn('ureel service worker cleanup failed', err));
    });
  }
  if ('caches' in window) {
    window.addEventListener('load', () => {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => console.log('ureel runtime caches cleared for recovery build'))
        .catch((err) => console.warn('ureel cache cleanup failed', err));
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
