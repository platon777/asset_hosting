// Nom du cache
const CACHE_NAME = 'dynamic-cache-v1';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Active immédiatement le SW
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

// Interception des requêtes réseau et mise en cache dynamique
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Retourne la réponse depuis le cache si elle existe
        return response;
      }

      // Sinon, récupère la ressource depuis le réseau
      return fetch(event.request)
        .then((networkResponse) => {
          // Met en cache la nouvelle ressource
          return caches.open(CACHE_NAME).then((cache) => {
            // Évitez de mettre en cache les requêtes autres que GET
            if (event.request.method === 'GET') {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
        .catch(() => {
          // Gestion des erreurs (par exemple : afficher une page hors ligne)
          if (event.request.destination === 'document') {
            return caches.match('/offline.html'); // Ajouter une page d'erreur au cache si nécessaire
          }
        });
    })
  );
});
