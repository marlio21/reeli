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

  // v52.5.30: do not clear service workers/runtime caches on every public load.
  // The v52.5.22 recovery cleanup helped a broken deployment recover, but running it
  // on each visit can delay the Public View considerably on mobile browsers.
  // Manual cache clearing should only be done outside the app when needed.
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
