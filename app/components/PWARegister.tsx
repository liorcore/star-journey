'use client';

import { useEffect, useState } from 'react';

export default function PWARegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js', { updateViaCache: 'none' }) // Always check for updates
          .then((reg) => {
            console.log('Service Worker registered:', reg);
            setRegistration(reg);

            // Check for updates immediately
            reg.update();

            // Listen for updates
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    setUpdateAvailable(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error);
          });
      });

      // Listen for controller change (new service worker activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          // Reload page to use new service worker
          window.location.reload();
        }
      });

      // Check for updates periodically (every 5 minutes)
      const updateInterval = setInterval(() => {
        if (registration) {
          registration.update();
        }
      }, 5 * 60 * 1000);

      return () => {
        clearInterval(updateInterval);
      };

      // Handle beforeinstallprompt for custom install button
      let deferredPrompt: any;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('PWA install prompt available');
      });
    }
  }, [registration]);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setUpdateAvailable(false);
      // Page will reload automatically via controllerchange event
    }
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border-2 border-[#4D96FF] p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900">עדכון זמין!</span>
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-[#4D96FF] text-white rounded-xl font-black text-sm active:scale-95 transition-transform"
        >
          עדכן עכשיו
        </button>
      </div>
    </div>
  );
}
