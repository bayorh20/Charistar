import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/performanceOptimizer.js'
import './index.css'
import App from './App.jsx'
import { safeStorage } from './utils/storage'

// One-time PWA cache and service worker cleanup to force-update old cached versions
const SW_VERSION = 'v61_spa_rewrite_fix';
const isPersistentStorageAvailable = () => {
  try {
    const key = '__storage_test_version__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};

const urlParams = new URLSearchParams(window.location.search);
const hasRecoveryFlag = urlParams.has('r') || window.location.hash.includes('r=1');

if (isPersistentStorageAvailable() && !hasRecoveryFlag && safeStorage.getItem('fm_sw_version') !== SW_VERSION) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      const promises = registrations.map(r => r.unregister());
      if (window.caches) {
        promises.push(
          caches.keys().then((names) => Promise.all(names.map(name => caches.delete(name))))
        );
      }
      Promise.all(promises).then(() => {
        safeStorage.setItem('fm_sw_version', SW_VERSION);
        const separator = window.location.href.indexOf('?') !== -1 ? '&' : '?';
        window.location.href = window.location.href + separator + 'r=1';
      }).catch(() => {
        safeStorage.setItem('fm_sw_version', SW_VERSION);
        const separator = window.location.href.indexOf('?') !== -1 ? '&' : '?';
        window.location.href = window.location.href + separator + 'r=1';
      });
    });
  } else {
    safeStorage.setItem('fm_sw_version', SW_VERSION);
    const separator = window.location.href.indexOf('?') !== -1 ? '&' : '?';
    window.location.href = window.location.href + separator + 'r=1';
  }
} else if (isPersistentStorageAvailable() && safeStorage.getItem('fm_sw_version') !== SW_VERSION) {
  // If we had the recovery flag, set the version key now so we don't try again
  safeStorage.setItem('fm_sw_version', SW_VERSION);
}

// Global PWA Cache Flusher utility
window.flushPWACaches = () => {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const promises = registrations.map(r => r.unregister());
        if (window.caches) {
          promises.push(
            caches.keys().then((names) => Promise.all(names.map(name => caches.delete(name))))
          );
        }
        Promise.all(promises).then(() => {
          console.log('PWA Caches flushed successfully.');
          resolve(true);
        }).catch((err) => {
          console.warn('PWA Cache flush error:', err);
          resolve(false);
        });
      });
    } else {
      resolve(false);
    }
  });
};

import { initFirebaseAnalytics, initPostHog } from './utils/analytics';

// Initialize Analytics
initFirebaseAnalytics();
initPostHog();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
