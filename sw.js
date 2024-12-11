// Nom du cache
const CACHE_NAME = 'dynamic-cache-v5';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Active immédiatement le SW après l'installation
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Suppression de l’ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Interception des requêtes avec stratégie "Cache First"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Retour depuis le cache pour :', event.request.url);
        return cachedResponse; // Retourne la ressource depuis le cache
      }

      // Si la ressource n'est pas dans le cache, elle est récupérée depuis le réseau
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Ajout de la ressource au cache pour les futures requêtes
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse; // Retourne la réponse réseau
        })
        .catch((error) => {
          console.error('Erreur réseau pour :', event.request.url, error);
          // Optionnel : Ajout d'un fallback (page hors ligne ou ressource de remplacement)
          if (event.request.destination === 'document') {
            return caches.match('/offline.html'); // Assurez-vous que cette page existe dans le cache
          }
        });
    })
  );
});
