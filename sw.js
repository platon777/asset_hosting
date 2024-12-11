// Nom du cache
const CACHE_NAME = 'dynamic-cache-v4';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Activer immédiatement le SW
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

// Interception des requêtes réseau avec stratégie "Network First"
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Si le réseau répond, mettez à jour le cache
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse; // Retourne la réponse réseau
      })
      .catch(() => {
        // Si le réseau échoue, retourne le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Retour du cache pour :', event.request.url);
            return cachedResponse;
          }
          console.error('Ressource non trouvée dans le cache et réseau indisponible :', event.request.url);
        });
      })
  );
});
