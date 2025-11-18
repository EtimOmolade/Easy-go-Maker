// Register service worker for offline support
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Unregister any existing service workers first (cleanup for development)
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 1) {
        console.log('Multiple service workers found, cleaning up...');
        for (let i = 1; i < existingRegistrations.length; i++) {
          await existingRegistrations[i].unregister();
        }
      }

      const registration = await navigator.serviceWorker.register(
        '/service-worker.js',
        { scope: '/' }
      );

      console.log('Service Worker registered successfully:', registration);
      
      // Wait for the service worker to be active
      if (registration.installing) {
        console.log('Service worker installing, waiting for activation...');
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Service worker activation timeout'));
          }, 10000); // 10 second timeout
          
          registration.installing!.addEventListener('statechange', (e) => {
            const sw = e.target as ServiceWorker;
            console.log('Service worker state:', sw.state);
            
            if (sw.state === 'activated') {
              clearTimeout(timeout);
              console.log('✅ Service worker activated successfully');
              resolve();
            } else if (sw.state === 'redundant') {
              clearTimeout(timeout);
              console.error('❌ Service worker became redundant (installation failed)');
              reject(new Error('Service worker installation failed - check console for details'));
            }
          });
        });
      } else if (registration.waiting) {
        console.log('Service worker waiting, activating...');
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else if (registration.active) {
        console.log('Service worker already active');
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available. Refresh to update.');
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_PRAYERS' || event.data.type === 'SYNC_JOURNAL') {
          console.log(event.data.message);
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  } else {
    console.log('Service Workers not supported in this browser');
  }
};

// Unregister service worker (for development/testing)
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('Service Workers unregistered');
  }
};
