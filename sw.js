// Nom du cache dynamique (changer le numéro pour forcer une mise à jour globale)
const CACHE_NAME = 'dynamic-cache-v6';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installé');
  self.skipWaiting(); // Active immédiatement le SW
});

// Activation du Service Worker (supprime les anciens caches)
self.addEventListener('activate', (event) => {
  console.log('Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression de l'ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend immédiatement le contrôle des clients
});

// Gestion des requêtes réseau avec vérification explicite
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, { cache: 'no-cache' }) // Toujours essayer de récupérer la ressource depuis le réseau sans utiliser le cache du navigateur
      .then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic'
        ) {
          // Si la réponse est valide, mettre à jour le cache
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            console.log('Mise à jour forcée du cache pour :', event.request.url);
          });
        }
        return networkResponse; // Retourne toujours la réponse réseau
      })
      .catch(() => {
        // Si le réseau est indisponible, retourner la ressource en cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Retour depuis le cache pour :', event.request.url);
            return cachedResponse;
          }
        });
      })
  );
});
