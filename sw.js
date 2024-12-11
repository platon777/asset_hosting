// Nom du cache
const CACHE_NAME = 'dynamic-cache-v3';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  // Activation immédiate après l'installation
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Ancien cache supprimé : ', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si la ressource est dans le cache, elle est retournée
      if (cachedResponse) {
        console.log('Cache trouvé pour :', event.request.url);
        return cachedResponse;
      }

      // Sinon, on télécharge la ressource et on la met dans le cache
      return fetch(event.request)
        .then((networkResponse) => {
          if (
            !networkResponse || 
            networkResponse.status !== 200 || 
            networkResponse.type !== 'basic'
          ) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error('Erreur réseau pour :', event.request.url, error);
        });
    })
  );
});
